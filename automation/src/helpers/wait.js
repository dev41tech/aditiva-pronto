'use strict';

const { execPowerShell } = require('./powershell');
const logger = require('./logger');
const config = require('../../config');

/** Pausa simples. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Aguarda até que o processo apareça no sistema.
 * @param {string} processName - Nome do processo (sem .exe)
 * @param {number} timeoutMs
 */
async function waitForProcess(processName, timeoutMs = config.timeouts.appLoad) {
  const deadline = Date.now() + timeoutMs;
  logger.debug(`[wait] aguardando processo "${processName}" (timeout: ${timeoutMs}ms)`);

  while (Date.now() < deadline) {
    const result = await execPowerShell(
      `(Get-Process -Name "${processName}" -ErrorAction SilentlyContinue) -ne $null`
    );
    if (result.trim() === 'True') {
      logger.debug(`[wait] processo "${processName}" encontrado`);
      return true;
    }
    await sleep(500);
  }

  throw new Error(`Timeout: processo "${processName}" não apareceu em ${timeoutMs}ms`);
}

/**
 * Aguarda até que uma janela com o título especificado exista e esteja visível.
 * @param {string} titleFragment - Fragmento do título da janela
 * @param {number} timeoutMs
 */
async function waitForWindow(titleFragment, timeoutMs = config.timeouts.appLoad) {
  const deadline = Date.now() + timeoutMs;
  logger.debug(`[wait] aguardando janela contendo "${titleFragment}"`);

  const script = `
    Add-Type -AssemblyName UIAutomationClient
    $found = $false
    $windows = [System.Windows.Automation.AutomationElement]::RootElement.FindAll(
      [System.Windows.Automation.TreeScope]::Children,
      [System.Windows.Automation.Condition]::TrueCondition
    )
    foreach ($w in $windows) {
      if ($w.Current.Name -like "*${titleFragment}*" -and $w.Current.IsOffscreen -eq $false) {
        $found = $true
        break
      }
    }
    $found
  `;

  while (Date.now() < deadline) {
    try {
      const result = await execPowerShell(script);
      if (result.trim() === 'True') {
        logger.debug(`[wait] janela "${titleFragment}" encontrada`);
        return true;
      }
    } catch (_) {
      // continua tentando
    }
    await sleep(600);
  }

  throw new Error(`Timeout: janela "${titleFragment}" não apareceu em ${timeoutMs}ms`);
}

/**
 * Aguarda até que um arquivo exista e tenha tamanho > 0.
 * @param {string} filePath
 * @param {number} timeoutMs
 */
async function waitForFile(filePath, timeoutMs = config.timeouts.exportSave) {
  const deadline = Date.now() + timeoutMs;
  const fs = require('fs');
  logger.debug(`[wait] aguardando arquivo "${filePath}"`);

  while (Date.now() < deadline) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 0) {
        logger.debug(`[wait] arquivo encontrado: ${filePath} (${stat.size} bytes)`);
        return true;
      }
    } catch (_) {
      // arquivo ainda não existe
    }
    await sleep(500);
  }

  throw new Error(`Timeout: arquivo "${filePath}" não apareceu em ${timeoutMs}ms`);
}

/**
 * Aguarda estabilidade da janela (sem mudanças de título por N ms).
 * Indica que a UI parou de carregar.
 */
async function waitForWindowStable(processName, stableMs = 2000, timeoutMs = config.timeouts.appLoad) {
  const deadline = Date.now() + timeoutMs;
  let lastTitle = '';
  let stableSince = Date.now();

  logger.debug(`[wait] aguardando estabilidade da janela do processo "${processName}"`);

  while (Date.now() < deadline) {
    const title = await execPowerShell(
      `(Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1).MainWindowTitle`
    ).then(r => r.trim()).catch(() => '');

    if (title !== lastTitle) {
      lastTitle = title;
      stableSince = Date.now();
    } else if (title && Date.now() - stableSince >= stableMs) {
      logger.debug(`[wait] janela estável: "${title}"`);
      return title;
    }

    await sleep(400);
  }

  throw new Error(`Timeout: janela do processo "${processName}" não estabilizou em ${timeoutMs}ms`);
}

module.exports = { sleep, waitForProcess, waitForWindow, waitForFile, waitForWindowStable };
