import { createServer } from 'node:http';
import { spawn } from 'node:child_process';

const host = process.env.DEPLOY_HOST ?? '127.0.0.1';
const port = Number(process.env.DEPLOY_PORT ?? '8787');
const token = process.env.DEPLOY_WEBHOOK_TOKEN;
const projectDir = process.env.DEPLOY_PROJECT_DIR ?? process.cwd();
const deployCommand =
  process.env.DEPLOY_COMMAND ??
  'git pull origin main && docker compose up -d --build --remove-orphans';

if (!token) {
  console.error('DEPLOY_WEBHOOK_TOKEN is required');
  process.exit(1);
}

if (!Number.isInteger(port) || port <= 0) {
  console.error(`Invalid DEPLOY_PORT: ${process.env.DEPLOY_PORT ?? ''}`);
  process.exit(1);
}

let deployInProgress = false;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function runDeploy() {
  return new Promise((resolve) => {
    const child = spawn('bash', ['-lc', deployCommand], {
      cwd: projectDir,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    return sendJson(response, 200, { status: 'ok', deployInProgress });
  }

  if (request.method !== 'POST' || request.url !== '/deploy') {
    return sendJson(response, 404, { error: 'Not found' });
  }

  const authorization = request.headers.authorization;
  if (authorization !== `Bearer ${token}`) {
    return sendJson(response, 401, { error: 'Unauthorized' });
  }

  if (deployInProgress) {
    return sendJson(response, 409, { error: 'Deployment already in progress' });
  }

  try {
    const rawBody = await readBody(request);
    if (rawBody) {
      JSON.parse(rawBody);
    }
  } catch (error) {
    return sendJson(response, 400, {
      error: error instanceof Error ? error.message : 'Invalid request body',
    });
  }

  deployInProgress = true;

  try {
    const result = await runDeploy();
    const output = `${result.stdout}${result.stderr}`.trim();

    if (result.code !== 0) {
      return sendJson(response, 500, {
        error: 'Deployment failed',
        output,
      });
    }

    return sendJson(response, 200, {
      status: 'deployed',
      output,
    });
  } finally {
    deployInProgress = false;
  }
});

server.listen(port, host, () => {
  console.log(`Deploy listener running on http://${host}:${port}`);
  console.log(`Project directory: ${projectDir}`);
});
