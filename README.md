# JF Advocacia · Studio Instagram

Plataforma para organizar, criar rascunhos, agendar e publicar conteúdo no Instagram da JF Advocacia (fotos, carrosséis, reels e stories) — acessível de qualquer dispositivo via web.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind
- **Drizzle ORM + libSQL** (Turso em produção, arquivo local em dev)
- **Cloudinary** para storage de mídia (a API do Instagram exige URL pública)
- **Vercel Cron** para disparar publicações agendadas
- Auth simples por senha (single-user, JWT em cookie)

## Funcionalidades

- Conectar uma conta Instagram Business via token de acesso (Meta App)
- Criar conteúdo de 4 tipos: Foto, Carrossel (2-10), Reel, Story
- **Rascunhos**: salve para finalizar depois, acessíveis de qualquer lugar
- **Agendamento**: defina data/hora e deixe a plataforma publicar sozinha
- **Publicar agora**: dispara imediatamente
- Histórico de publicações, com link direto para o post no Instagram
- Renovação automática de tokens de longa duração (cron diário)

> **Nota importante**: rascunhos do app oficial do Instagram ficam apenas no celular e não são expostos pela API. Os rascunhos desta plataforma vivem aqui — sincronizados na nuvem e acessíveis em qualquer dispositivo.

## Setup local

1. Pré-requisitos: Node.js 20+ e uma conta no Cloudinary.

2. Instale as dependências:

```bash
npm install
```

3. Copie o `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Variáveis essenciais:

| Variável | Descrição |
|---|---|
| `APP_PASSWORD` | Senha que você usa para entrar na plataforma |
| `SESSION_SECRET` | Segredo aleatório (gere com `openssl rand -base64 32`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Credenciais Cloudinary |
| `DATABASE_URL` | Em dev: `file:./local.db`. Em prod (Turso): `libsql://<...>.turso.io` |
| `DATABASE_AUTH_TOKEN` | Token Turso (apenas em produção) |
| `CRON_SECRET` | Segredo para proteger os endpoints de cron |

4. Crie o banco e rode a migração:

```bash
npm run db:migrate
```

5. Suba o servidor:

```bash
npm run dev
```

Acesse <http://localhost:3000>, faça login com `APP_PASSWORD`, e em **Configurações** cole o token Instagram do seu app Meta.

## Obter o token do Instagram

1. Em <https://developers.facebook.com/apps>, abra seu app.
2. Vá em **Instagram → API setup with Instagram Login**.
3. Conecte sua conta Instagram Business e clique em **Generate token**.
4. Use o **token de longa duração** (válido ~60 dias). A plataforma renova automaticamente.

Permissões necessárias no app Meta:
- `instagram_business_basic`
- `instagram_business_content_publish`

## Deploy no Vercel

1. Crie um projeto no [Turso](https://turso.tech) (free tier) e gere o `DATABASE_URL` + `DATABASE_AUTH_TOKEN`.
2. Em <https://vercel.com>, importe este repositório.
3. Configure todas as variáveis de ambiente do `.env.example`.
4. Após o primeiro deploy, rode a migração apontando para o banco Turso:

```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:migrate
```

O `vercel.json` já configura:
- `/api/cron/publish-due` rodando **a cada minuto** (publica posts agendados)
- `/api/cron/refresh-tokens` rodando diariamente às 4h UTC (renova tokens)

> O plano gratuito do Vercel permite cron a cada minuto — perfeito para esse caso.

## Como usar

1. **Login** com a senha definida em `APP_PASSWORD`.
2. Em **Configurações**, cole o token do Instagram. A plataforma valida e detecta o usuário.
3. Em **Novo conteúdo**, escolha o tipo, faça upload de mídia (vai para o Cloudinary), escreva a legenda e:
   - **Salvar rascunho** (sem data) — fica em `/drafts`
   - **Agendar** (com data/hora) — o cron publica no horário
   - **Publicar agora** — dispara imediatamente
4. Acompanhe pelo **Painel** ou em **Publicados**.

## Estrutura

```
src/
├── app/
│   ├── (app)/             # Rotas autenticadas (layout com sidebar)
│   │   ├── page.tsx       # Painel
│   │   ├── drafts/
│   │   ├── published/
│   │   ├── posts/new/
│   │   ├── posts/[id]/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/{login,logout}/
│   │   ├── posts/
│   │   ├── accounts/
│   │   ├── uploads/sign/
│   │   └── cron/{publish-due,refresh-tokens}/
│   └── login/
├── components/
├── lib/
│   ├── db/                # Drizzle schema + cliente
│   ├── auth.ts
│   ├── instagram.ts       # Wrapper da Graph API
│   ├── cloudinary.ts
│   └── publish.ts
└── middleware.ts          # Protege as rotas
```

## Limitações conhecidas

- Stories só funcionam com contas **Instagram Business** (não Creator).
- A API publica até 50 posts em 24h por conta IG (limite do Meta).
- O processamento de Reels pode demorar alguns minutos no lado do Instagram; a plataforma faz polling até o container ficar `FINISHED`.
- Após publicar, o post não pode mais ser editado/excluído pela plataforma (a API não permite).
