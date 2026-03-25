const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const SERVER_PORT = String(process.env.REQUESTLAB_PORT || 3001);
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

let mainWindow = null;
let serverProcess = null;
let isQuitting = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
app.setName('RequestLab');

function getPaths() {
  if (app.isPackaged) {
    return {
      serverEntry: path.join(process.resourcesPath, 'server', 'app.ts'),
      tsxCli: path.join(process.resourcesPath, 'server', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      envTemplates: [
        path.join(process.resourcesPath, 'env', 'server.env.sample'),
        path.join(process.resourcesPath, 'env', '.env.sample')
      ]
    };
  }

  const repoRoot = path.resolve(__dirname, '..', '..');
  return {
    serverEntry: path.join(repoRoot, 'server', 'app.ts'),
    tsxCli: path.join(repoRoot, 'server', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    envTemplates: [
      path.join(repoRoot, 'server', '.env'),
      path.join(repoRoot, 'server', '.env.sample'),
      path.join(repoRoot, '.env'),
      path.join(repoRoot, '.env.sample')
    ]
  };
}

function defaultEnvFile() {
  return [
    'DB_PASSWORD=',
    `PORT=${SERVER_PORT}`,
    'DB_HOST=localhost',
    'DB_PORT=5432',
    'DB_USER=postgres',
    'DB_NAME=requestlab'
  ].join('\n') + '\n';
}

function ensureRuntimeEnv(envTemplates) {
  const runtimeDir = path.join(app.getPath('userData'), 'runtime');
  const runtimeEnvPath = path.join(runtimeDir, '.env');

  fs.mkdirSync(runtimeDir, { recursive: true });

  if (!fs.existsSync(runtimeEnvPath)) {
    const template = envTemplates.find((candidate) => fs.existsSync(candidate));

    if (template) {
      fs.copyFileSync(template, runtimeEnvPath);
    } else {
      fs.writeFileSync(runtimeEnvPath, defaultEnvFile(), 'utf8');
    }
  }

  return runtimeDir;
}

function pingServer(url) {
  return new Promise((resolve) => {
    const req = http.get(`${url}/api/__electron_probe__`, (res) => {
      res.resume();
      // /api/* unknown routes return JSON 404 without touching DB/auth logic.
      const contentType = String(res.headers['content-type'] || '');
      const okStatus = res.statusCode === 404;
      resolve(okStatus && contentType.includes('application/json'));
    });

    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 45000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await pingServer(url)) return;
    await sleep(500);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms at ${url}`);
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) return;

  const current = serverProcess;
  serverProcess = null;

  current.kill('SIGTERM');

  setTimeout(() => {
    if (!current.killed) current.kill('SIGKILL');
  }, 3000);
}

function startServer() {
  const paths = getPaths();

  if (!fs.existsSync(paths.serverEntry)) {
    throw new Error(`Server entry not found: ${paths.serverEntry}`);
  }

  if (!fs.existsSync(paths.tsxCli)) {
    throw new Error(`tsx runtime not found: ${paths.tsxCli}. Run npm install in server/.`);
  }

  const runtimeDir = ensureRuntimeEnv(paths.envTemplates);

  serverProcess = spawn(process.execPath, ['--run-as-node', paths.tsxCli, paths.serverEntry], {
    cwd: runtimeDir,
    env: {
      ...process.env,
      PORT: SERVER_PORT
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[requestlab-server] ${chunk}`);
  });

  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[requestlab-server] ${chunk}`);
  });

  serverProcess.on('exit', (code, signal) => {
    if (isQuitting) return;

    const reason = code !== null ? `exit code ${code}` : `signal ${signal}`;
    dialog.showErrorBox(
      'RequestLab Server Stopped',
      `The embedded server stopped unexpectedly (${reason}). The app will close.`
    );
    app.quit();
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'RequestLab',
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(SERVER_URL);
  mainWindow.setTitle('RequestLab');
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow.setTitle('RequestLab');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    startServer();
    await waitForServer(SERVER_URL);
    createMainWindow();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox('Unable to Launch RequestLab', message);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
