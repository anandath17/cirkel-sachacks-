const { spawn } = require('child_process');
const path = require('path');

function startProcess(command, args, name) {
  console.log(`Starting ${name}...`);
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

// Start the server
console.log('Starting server...');
const server = startProcess('node', ['test-server.js'], 'Server');

// Wait for server to start before starting client
setTimeout(() => {
  console.log('Starting client...');
  const client = startProcess('npm', ['run', 'client'], 'Client');

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    server.kill();
    client.kill();
    process.exit();
  });
}, 2000); // Wait 2 seconds for server to start 