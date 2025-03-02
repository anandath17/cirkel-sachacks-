const { exec } = require('child_process');

const port = 3000;

const isWindows = process.platform === 'win32';
const command = isWindows
  ? `netstat -ano | findstr :${port}`
  : `lsof -i :${port}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    if (error.code === 1) {
      console.log(`No process is using port ${port}`);
      process.exit(0);
    }
    console.error(`Error checking port ${port}:`, error);
    process.exit(1);
  }

  if (stdout) {
    const lines = stdout.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        const pid = isWindows
          ? line.split(/\s+/).pop()
          : line.split(/\s+/)[1];

        if (pid) {
          const killCommand = isWindows
            ? `taskkill /F /PID ${pid}`
            : `kill -9 ${pid}`;

          exec(killCommand, (error) => {
            if (error) {
              console.error(`Failed to kill process ${pid}:`, error);
            } else {
              console.log(`Killed process ${pid} using port ${port}`);
            }
          });
        }
      }
    });
  }
}); 