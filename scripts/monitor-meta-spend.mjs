#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOG_PATH = resolve(ROOT, "data/meta-spend-log.jsonl");

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v23.0";
const ACCOUNTS = [
  { id: "act_804606367948571", label: "JP ADV" },
  { id: "act_968427244654984", label: "JF ADV" },
  { id: "act_2245266856242045", label: "[APEX] João Filho" },
];

const required = (name) => {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
};

const META_ACCESS_TOKEN = required("META_ACCESS_TOKEN");
const TELEGRAM_BOT_TOKEN = required("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = required("TELEGRAM_CHAT_ID");
const BUDGET_BRL = Number(process.env.META_BUDGET_BRL ?? "600");
const THRESHOLD_BRL = Number(process.env.META_BALANCE_THRESHOLD_BRL ?? "150");

const fmtBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const todayBR = () => {
  // Brazil is UTC-3 year-round (no DST since 2019).
  const now = new Date();
  const br = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return br.toISOString().slice(0, 10);
};

const fetchAccountSpend = async (accountId) => {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${accountId}/insights`);
  url.searchParams.set("fields", "spend,account_currency");
  url.searchParams.set("date_preset", "today");
  url.searchParams.set("level", "account");
  url.searchParams.set("access_token", META_ACCESS_TOKEN);

  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Graph API failed for ${accountId}: ${msg}`);
  }
  const row = body?.data?.[0];
  return {
    spend: row?.spend ? Number(row.spend) : 0,
    currency: row?.account_currency ?? null,
  };
};

const sendTelegram = async (text) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  });
  const body = await res.json();
  if (!res.ok || !body?.ok) {
    throw new Error(`Telegram sendMessage failed: ${body?.description ?? res.status}`);
  }
};

const appendLog = (entry) => {
  if (!existsSync(dirname(LOG_PATH))) mkdirSync(dirname(LOG_PATH), { recursive: true });
  const prev = existsSync(LOG_PATH) ? readFileSync(LOG_PATH, "utf8") : "";
  writeFileSync(LOG_PATH, prev + JSON.stringify(entry) + "\n");
};

const main = async () => {
  const date = todayBR();
  const perAccount = [];
  let totalSpend = 0;

  for (const acc of ACCOUNTS) {
    const { spend, currency } = await fetchAccountSpend(acc.id);
    perAccount.push({ id: acc.id, label: acc.label, spend, currency });
    totalSpend += spend;
  }

  const balance = BUDGET_BRL - totalSpend;
  const alertTriggered = balance < THRESHOLD_BRL;

  if (alertTriggered) {
    const msg =
      `⚠️ Alerta Meta Ads - JP ADV\n` +
      `Saldo restante: R$ ${fmtBRL(balance)}\n` +
      `Gasto hoje: R$ ${fmtBRL(totalSpend)}\n` +
      `Recarregue antes que as campanhas parem!`;
    await sendTelegram(msg);
  }

  const entry = {
    date,
    timestamp: new Date().toISOString(),
    budgetBRL: BUDGET_BRL,
    totalSpendBRL: Number(totalSpend.toFixed(2)),
    balanceBRL: Number(balance.toFixed(2)),
    thresholdBRL: THRESHOLD_BRL,
    alertTriggered,
    accounts: perAccount.map((a) => ({
      id: a.id,
      label: a.label,
      spendBRL: Number(a.spend.toFixed(2)),
      currency: a.currency,
    })),
  };
  appendLog(entry);

  console.log(JSON.stringify(entry, null, 2));
};

main().catch((err) => {
  console.error(err?.stack ?? err);
  process.exit(1);
});
