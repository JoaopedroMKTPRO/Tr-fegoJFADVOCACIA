import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient({ url, authToken });

  await client.execute(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name TEXT PRIMARY KEY,
       applied_at INTEGER NOT NULL DEFAULT (unixepoch())
     )`,
  );

  const dir = join(process.cwd(), "drizzle");
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (await client.execute("SELECT name FROM _migrations")).rows.map((r) => String(r.name)),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= já aplicada: ${file}`);
      continue;
    }
    console.log(`> aplicando ${file}`);
    const sql = await readFile(join(dir, file), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: "INSERT INTO _migrations (name) VALUES (?)",
      args: [file],
    });
  }
  console.log("Migrações concluídas.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Falha ao migrar:", err);
  process.exit(1);
});
