This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Deploy Webhook

This repo includes a lightweight deploy listener for WSL2 or other self-hosted environments where GitHub Actions cannot SSH directly into the machine.

1. Set a shared secret in your shell:

```bash
export DEPLOY_WEBHOOK_TOKEN="replace-with-a-long-random-string"
```

2. Start the listener from the repo root:

```bash
npm run deploy:listen
```

3. Expose the listener through `localhost.run`:

```bash
ssh -R 80:localhost:8787 nokey@localhost.run
```

4. Save these GitHub secrets:

- `DEPLOY_WEBHOOK_URL`: your `https://*.lhr.life/deploy` URL
- `DEPLOY_WEBHOOK_TOKEN`: the same token used locally

5. On each push to `main`, GitHub Actions will call the webhook, and the listener will run:

```bash
bash scripts/deploy-local.sh
```

Optional environment variables for the listener:

- `DEPLOY_PORT` defaults to `8787`
- `DEPLOY_HOST` defaults to `127.0.0.1`
- `DEPLOY_PROJECT_DIR` defaults to the current repo directory
- `DEPLOY_COMMAND` overrides the deploy command

## Docker Compose v2 on WSL2/Ubuntu

The deployment host should use the Docker Compose v2 plugin (`docker compose`) instead of the legacy Python-based `docker-compose` v1 binary.

Run this once on the WSL2/Ubuntu deployment machine:

```bash
cd ~/project/nextjs-deployment
bash scripts/setup-docker-compose-v2.sh
```

This script:

- installs `docker-compose-plugin`
- removes the legacy `docker-compose` package when present
- prints `docker compose version` so you can verify the upgrade

The expected verification output is:

```bash
docker compose version
```

The default deploy script:

- fetches `origin/main`
- resets the working tree to `origin/main`
- runs `docker compose up -d --build --remove-orphans`
- falls back to `docker-compose` if the Compose v2 plugin is unavailable

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
