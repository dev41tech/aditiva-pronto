'use strict';

/**
 * Motor PowerShell — ponto central de execução de scripts PS no Node.js.
 * Usa spawn com -NonInteractive -NoProfile para velocidade máxima.
 */

const { spawn } = require('child_process');
const logger = require('./logger');

/**
 * Executa um script PowerShell e retorna stdout como string.
 * @param {string} script - Script PS inline
 * @param {number} [timeoutMs=15000]
 * @returns {Promise<string>}
 */
function execPowerShell(script, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const args = [
      '-NonInteractive',
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-Command', script,
    ];

    const proc = spawn('powershell.exe', args, { windowsHide: true });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill();
      reject(new Error(`PowerShell timeout após ${timeoutMs}ms. Script: ${script.substring(0, 100)}`));
    }, timeoutMs);

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;
      if (code !== 0) {
        reject(new Error(`PowerShell saiu com código ${code}. Stderr: ${stderr.trim()}`));
      } else {
        resolve(stdout);
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * Versão "fire and forget" — não aguarda nem captura saída.
 * Útil para envio de teclas onde o timing é gerenciado externamente.
 */
function firePowerShell(script) {
  const args = ['-NonInteractive', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script];
  const proc = spawn('powershell.exe', args, { windowsHide: true, detached: false });
  proc.stdout.resume();
  proc.stderr.resume();
  return new Promise((resolve, reject) => {
    proc.on('close', resolve);
    proc.on('error', reject);
  });
}

module.exports = { execPowerShell, firePowerShell };
