'use strict';

/**
 * Módulo de teclado — usa PowerShell + WinAPI (user32.dll) para envio
 * de teclas confiável em aplicações Win32.
 *
 * Dois modos:
 *  - sendKeys()  → [System.Windows.Forms.SendKeys] — melhor para texto e combos de menu
 *  - pressKey()  → keybd_event via P/Invoke — melhor para teclas especiais isoladas
 */

const { execPowerShell, firePowerShell } = require('./powershell');
const { sleep } = require('./wait');
const logger = require('./logger');
const config = require('../../config');

// Definição única do C# helper (reutilizado em todos os scripts)
const WIN32_TYPE = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Win32Keyboard {
    [DllImport("user32.dll", SetLastError=true)]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);

    [DllImport("user32.dll")]
    public static extern short VkKeyScan(char ch);

    public const uint KEYEVENTF_KEYUP   = 0x0002;
    public const uint KEYEVENTF_EXTKEY  = 0x0001;

    public static void KeyDown(byte vk) { keybd_event(vk, 0, 0, 0); }
    public static void KeyUp(byte vk)   { keybd_event(vk, 0, KEYEVENTF_KEYUP, 0); }
    public static void KeyPress(byte vk, int delayMs = 50) {
        KeyDown(vk);
        System.Threading.Thread.Sleep(delayMs);
        KeyUp(vk);
    }
}
"@ -ErrorAction SilentlyContinue
`;

// Virtual key codes comuns
const VK = {
  RETURN:   0x0D,
  ESCAPE:   0x1B,
  TAB:      0x09,
  SPACE:    0x20,
  LEFT:     0x25,
  UP:       0x26,
  RIGHT:    0x27,
  DOWN:     0x28,
  HOME:     0x24,
  END:      0x23,
  PGUP:     0x21,
  PGDN:     0x22,
  F4:       0x73,
  F5:       0x74,
  DELETE:   0x2E,
  BACK:     0x08,
  ALT:      0x12,
  CTRL:     0x11,
  SHIFT:    0x10,
  MENU:     0x12, // Alt
};

/**
 * Envia uma sequência de teclas usando SendKeys.
 * Sintaxe SendKeys: {ENTER}, {TAB}, {ESC}, {F4}, %R (Alt+R), ^C (Ctrl+C), etc.
 *
 * @param {string} keys - Sequência SendKeys
 * @param {number} [delayAfterMs] - Delay após envio
 */
async function sendKeys(keys, delayAfterMs = config.timeouts.keyDelay) {
  logger.debug(`[keyboard] sendKeys: "${keys}"`);

  // Escape aspas duplas dentro da string de teclas
  const escaped = keys.replace(/"/g, '`"');

  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.SendKeys]::SendWait("${escaped}")
  `;

  await firePowerShell(script);
  await sleep(delayAfterMs);
}

/**
 * Pressiona uma tecla virtual pelo código VK.
 * Mais confiável para teclas especiais (ALT, ENTER, setas).
 *
 * @param {number} vkCode - Código VK (use objeto VK ou 0xNN)
 * @param {number} [count=1] - Quantas vezes pressionar
 * @param {number} [delayBetweenMs=80]
 */
async function pressKey(vkCode, count = 1, delayBetweenMs = 80) {
  logger.debug(`[keyboard] pressKey VK=0x${vkCode.toString(16).toUpperCase()} x${count}`);

  const script = `
    ${WIN32_TYPE}
    for ($i = 0; $i -lt ${count}; $i++) {
      [Win32Keyboard]::KeyPress(${vkCode}, ${delayBetweenMs})
      Start-Sleep -Milliseconds ${delayBetweenMs}
    }
  `;

  await execPowerShell(script);
  await sleep(config.timeouts.keyDelay);
}

/**
 * Pressiona combinação de modificador + tecla (ex: Alt+R, Ctrl+S).
 *
 * @param {number} modifierVk - VK do modificador (VK.ALT, VK.CTRL, VK.SHIFT)
 * @param {number} keyVk      - VK da tecla principal
 */
async function pressCombo(modifierVk, keyVk, delayAfterMs = config.timeouts.stepDelay) {
  logger.debug(`[keyboard] pressCombo MOD=0x${modifierVk.toString(16)} KEY=0x${keyVk.toString(16)}`);

  const script = `
    ${WIN32_TYPE}
    [Win32Keyboard]::KeyDown(${modifierVk})
    Start-Sleep -Milliseconds 80
    [Win32Keyboard]::KeyPress(${keyVk}, 80)
    Start-Sleep -Milliseconds 80
    [Win32Keyboard]::KeyUp(${modifierVk})
  `;

  await execPowerShell(script);
  await sleep(delayAfterMs);
}

/** Pressiona Alt para abrir a barra de menus. */
const pressAlt    = () => pressKey(VK.ALT, 1, 50);
const pressEnter  = (n = 1) => pressKey(VK.RETURN, n);
const pressEscape = (n = 1) => pressKey(VK.ESCAPE, n);
const pressTab    = (n = 1) => pressKey(VK.TAB, n, 80);
const pressDown   = (n = 1) => pressKey(VK.DOWN, n, 80);
const pressUp     = (n = 1) => pressKey(VK.UP, n, 80);
const pressRight  = (n = 1) => pressKey(VK.RIGHT, n, 80);

/**
 * Digite texto caractere a caractere (mais confiável que SendKeys para texto longo).
 * @param {string} text
 */
async function typeText(text, delayBetweenCharsMs = 40) {
  logger.debug(`[keyboard] typeText: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
  const escaped = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    $text = "${escaped}"
    foreach ($char in $text.ToCharArray()) {
      [System.Windows.Forms.SendKeys]::SendWait([System.Text.RegularExpressions.Regex]::Escape($char.ToString()))
      Start-Sleep -Milliseconds ${delayBetweenCharsMs}
    }
  `;
  await execPowerShell(script);
  await sleep(100);
}

module.exports = {
  sendKeys,
  pressKey,
  pressCombo,
  pressAlt,
  pressEnter,
  pressEscape,
  pressTab,
  pressDown,
  pressUp,
  pressRight,
  typeText,
  VK,
};
