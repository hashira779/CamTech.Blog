#!/usr/bin/env node
/**
 * Cross-platform script launcher for Python virtual environment tools.
 * Resolves executables (python, pytest, uvicorn) within apps/api/venv
 * on both Windows (Scripts/) and Unix (bin/), falling back to system PATH.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const [, , cmd, ...args] = process.argv;

if (!cmd) {
  console.error('Usage: node scripts/run.js <command> [args...]');
  process.exit(1);
}

const isWin = process.platform === 'win32';
const binDir = isWin ? 'Scripts' : 'bin';
const venvPath = path.resolve(__dirname, '..', 'apps', 'api', 'venv');

// Look for executable inside venv first
const candidateNames = isWin
  ? [cmd + '.exe', cmd + '.bat', cmd + '.cmd', cmd]
  : [cmd, cmd + '3'];

let execPath = null;
for (const name of candidateNames) {
  const candidate = path.join(venvPath, binDir, name);
  if (fs.existsSync(candidate)) {
    execPath = candidate;
    break;
  }
}

// Fall back to system executable if not found in venv
if (!execPath) {
  execPath = cmd;
}

// Ensure venv bin directory is prepended to PATH
const venvBinDir = path.join(venvPath, binDir);
const newPath = fs.existsSync(venvBinDir)
  ? `${venvBinDir}${path.delimiter}${process.env.PATH || ''}`
  : (process.env.PATH || '');

const env = {
  ...process.env,
  PATH: newPath,
  VIRTUAL_ENV: venvPath,
};

const useShell = isWin && (execPath.endsWith('.bat') || execPath.endsWith('.cmd'));

const child = spawn(execPath, args, {
  stdio: 'inherit',
  env,
  shell: useShell,
});

child.on('error', (err) => {
  console.error(`Failed to execute command ${cmd}:`, err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
