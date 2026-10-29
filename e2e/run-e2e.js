/**
 * E2E orchestrator.
 *
 * Starts the backend (in-memory MongoDB demo mode), builds and serves the
 * React frontend with `vite preview`, waits for both servers, runs the
 * Selenium test, then shuts everything down.
 *
 * Usage (from the e2e/ folder): npm test
 */
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const SERVER_DIR = path.join(__dirname, '..', 'server');
const CLIENT_DIR = path.join(__dirname, '..', 'client');
const children = [];
let finished = false;

function waitForHttp(url, timeoutMs = 90000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
        } else {
          setTimeout(tick, 1000);
        }
      });
    };
    tick();
  });
}

function run(command, args, cwd, name) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  children.push(child);
  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
  return child;
}

function cleanup() {
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill();
      } catch (e) {
        // ignore
      }
    }
  }
}

async function main() {
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });

  console.log('Starting backend (in-memory MongoDB)…');
  run('npm', ['run', 'start:memory'], SERVER_DIR, 'server');

  console.log('Building frontend…');
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { cwd: CLIENT_DIR, shell: true });
    build.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Frontend build failed with code ${code}`))
    );
  });

  console.log('Starting frontend preview server…');
  run('npm', ['run', 'preview'], CLIENT_DIR, 'client');

  console.log('Waiting for servers…');
  await waitForHttp('http://localhost:5000/api/health');
  await waitForHttp('http://localhost:4173');
  console.log('Both servers are up. Running Selenium test…\n');

  await new Promise((resolve, reject) => {
    const test = run('node', ['tests/issueAndReturn.e2e.js'], __dirname, 'selenium');
    test.on('exit', (code) => {
      finished = true;
      if (code === 0) resolve();
      else reject(new Error(`Selenium test exited with code ${code}`));
    });
  });

  cleanup();
  process.exit(0);
}

main().catch((err) => {
  cleanup();
  console.error(err.message);
  process.exit(finished ? 0 : 1);
});
