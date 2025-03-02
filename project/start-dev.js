import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function startProcess(command, args, name) {
  const process = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  process.on('error', (error) => {
    console.error(`${name} failed to start:`, error);
  });

  return process;
}

// Start the server first
console.log('Starting server...');
const server = startProcess('ts-node-dev', ['--respawn', '--transpile-only', 'server.ts'], 'Server');

// Wait a bit for the server to start
setTimeout(() => {
  console.log('Starting client...');
  const client = startProcess('vite', [], 'Client');

  // Handle process termination
  process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit();
  });
}, 2000); 