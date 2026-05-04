'use strict';

/**
 * Captura screenshot da tela inteira usando PowerShell + .NET.
 * Zero dependências externas.
 */

const { execPowerShell } = require('./powershell');
const path = require('path');
const fs   = require('fs');
const config = require('../../config');
const logger = require('./logger');

fs.mkdirSync(config.screenshots.dir, { recursive: true });

/**
 * Captura screenshot da tela inteira e salva como PNG.
 * @param {string} [label='screenshot'] - Sufixo descritivo para o nome do arquivo
 * @returns {Promise<string>} Caminho do arquivo salvo
 */
async function capture(label = 'screenshot') {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${ts}_${label.replace(/[^a-z0-9_-]/gi, '_')}.png`;
  const filePath = path.join(config.screenshots.dir, filename);

  // Escapa barras invertidas para PowerShell
  const psPath = filePath.replace(/\\/g, '\\\\');

  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $screen  = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bitmap  = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
    $graphic = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphic.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
    $bitmap.Save("${psPath}", [System.Drawing.Imaging.ImageFormat]::Png)
    $graphic.Dispose()
    $bitmap.Dispose()
    Write-Output "${psPath}"
  `;

  try {
    await execPowerShell(script, 10_000);
    logger.debug(`[screenshot] salvo: ${filePath}`);
    return filePath;
  } catch (err) {
    logger.warn(`[screenshot] falha ao capturar: ${err.message}`);
    return null;
  }
}

/**
 * Captura screenshot de falha (sempre salva, independente do modo debug).
 * @param {string} stepName - Nome da etapa que falhou
 */
async function captureFailure(stepName) {
  logger.info(`[screenshot] capturando screenshot de falha: ${stepName}`);
  return capture(`FAILURE_${stepName}`);
}

/**
 * Captura screenshot de debug (só salva se DEBUG_MODE=true).
 * @param {string} stepName
 */
async function captureDebug(stepName) {
  if (!config.debug) return null;
  return capture(`debug_${stepName}`);
}

module.exports = { capture, captureFailure, captureDebug };
