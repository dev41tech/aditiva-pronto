'use strict';

/**
 * Gerenciamento de janelas via Windows UIAutomation API + PowerShell.
 * Todas as operações não usam coordenadas — apenas handles de janela e UIAutomation tree.
 */

const { execPowerShell } = require('./powershell');
const { sleep } = require('./wait');
const logger = require('./logger');
const config = require('../../config');

const UIAUTOMATION_SETUP = `
  Add-Type -AssemblyName UIAutomationClient
  Add-Type -AssemblyName UIAutomationTypes
`;

const WIN32_SETUP = `
  Add-Type -TypeDefinition @"
  using System;
  using System.Runtime.InteropServices;
  public class Win32Window {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    public const int SW_RESTORE = 9;
    public const int SW_SHOW    = 5;
  }
  "@ -ErrorAction SilentlyContinue
`;

/**
 * Traz a janela principal do processo para frente.
 * Restaura caso esteja minimizada.
 * @param {string} processName - Nome do processo sem .exe
 */
async function focusWindow(processName) {
  logger.debug(`[window] focusando processo "${processName}"`);

  const script = `
    ${WIN32_SETUP}
    $proc = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $proc) { Write-Output "NOT_FOUND"; exit }
    $hwnd = $proc.MainWindowHandle
    if ($hwnd -eq [IntPtr]::Zero) { Write-Output "NO_WINDOW"; exit }
    if ([Win32Window]::IsIconic($hwnd)) {
      [Win32Window]::ShowWindow($hwnd, [Win32Window]::SW_RESTORE) | Out-Null
      Start-Sleep -Milliseconds 400
    }
    [Win32Window]::SetForegroundWindow($hwnd) | Out-Null
    Start-Sleep -Milliseconds 300
    Write-Output "OK"
  `;

  const result = (await execPowerShell(script)).trim();
  if (result === 'NOT_FOUND') throw new Error(`Processo "${processName}" não encontrado`);
  if (result === 'NO_WINDOW') throw new Error(`Processo "${processName}" não tem janela principal`);

  logger.debug(`[window] foco aplicado: ${result}`);
  return true;
}

/**
 * Retorna o título da janela principal do processo.
 * @param {string} processName
 */
async function getWindowTitle(processName) {
  const script = `
    $proc = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc) { $proc.MainWindowTitle } else { "" }
  `;
  return (await execPowerShell(script)).trim();
}

/**
 * Verifica se o processo está em execução.
 * @param {string} processName
 */
async function isProcessRunning(processName) {
  const script = `
    $p = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue
    ($p -ne $null).ToString()
  `;
  const result = (await execPowerShell(script)).trim();
  return result === 'True';
}

/**
 * Termina o processo caso esteja em execução (cleanup em caso de falha).
 * @param {string} processName
 */
async function killProcess(processName) {
  logger.warn(`[window] encerrando processo "${processName}"`);
  await execPowerShell(
    `Stop-Process -Name "${processName}" -Force -ErrorAction SilentlyContinue`
  );
  await sleep(1000);
}

/**
 * Usa UIAutomation para encontrar um elemento pelo nome e invoká-lo (equivalente a clicar).
 * Não usa coordenadas — navega pela árvore de acessibilidade.
 *
 * @param {string} processName
 * @param {string} elementName  - Nome exato ou parcial do elemento
 * @param {string} controlType  - 'MenuItem', 'Button', 'CheckBox', 'ComboBox', etc.
 */
async function invokeElement(processName, elementName, controlType = 'MenuItem') {
  logger.debug(`[window] invocando elemento "${elementName}" (${controlType})`);

  const script = `
    ${UIAUTOMATION_SETUP}
    $proc = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $proc) { Write-Output "PROC_NOT_FOUND"; exit }
    $root = [System.Windows.Automation.AutomationElement]::FromHandle($proc.MainWindowHandle)
    if ($null -eq $root) { Write-Output "ROOT_NOT_FOUND"; exit }

    $cond = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::NameProperty, "${elementName}",
      [System.Windows.Automation.PropertyConditionFlags]::IgnoreCase
    )
    $el = $root.FindFirst([System.Windows.Automation.TreeScope]::Subtree, $cond)

    if ($null -eq $el) { Write-Output "ELEMENT_NOT_FOUND"; exit }

    try {
      $invokePattern = $el.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
      $invokePattern.Invoke()
      Write-Output "INVOKED"
    } catch {
      try {
        $expandPattern = $el.GetCurrentPattern([System.Windows.Automation.ExpandCollapsePattern]::Pattern)
        $expandPattern.Expand()
        Write-Output "EXPANDED"
      } catch {
        Write-Output "PATTERN_NOT_SUPPORTED: $($_.Exception.Message)"
      }
    }
  `;

  const result = (await execPowerShell(script, 10_000)).trim();
  logger.debug(`[window] invokeElement resultado: "${result}"`);

  if (result.startsWith('PROC_NOT_FOUND') || result.startsWith('ROOT_NOT_FOUND')) {
    throw new Error(`Processo/janela não encontrado para "${processName}"`);
  }

  return result;
}

/**
 * Verifica se uma janela de diálogo está aberta (para detectar popups).
 * @param {string} processName
 * @param {string} dialogTitleFragment
 */
async function isDialogOpen(processName, dialogTitleFragment) {
  const script = `
    ${UIAUTOMATION_SETUP}
    $proc = Get-Process -Name "${processName}" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $proc) { Write-Output "False"; exit }

    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $windows = $root.FindAll(
      [System.Windows.Automation.TreeScope]::Children,
      [System.Windows.Automation.Condition]::TrueCondition
    )
    $found = $false
    foreach ($w in $windows) {
      if ($w.Current.Name -like "*${dialogTitleFragment}*" -and
          $w.Current.ProcessId -eq $proc.Id) {
        $found = $true
        break
      }
    }
    $found.ToString()
  `;

  const result = (await execPowerShell(script)).trim();
  return result === 'True';
}

module.exports = {
  focusWindow,
  getWindowTitle,
  isProcessRunning,
  killProcess,
  invokeElement,
  isDialogOpen,
};
