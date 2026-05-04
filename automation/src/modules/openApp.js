'use strict';

/**
 * openApp — abre o Domínio Registro e aguarda a janela principal carregar.
 * Estratégia:
 *  1. Verifica se o processo já está rodando (evita abrir duplicata)
 *  2. Lança o executável
 *  3. Aguarda o processo aparecer
 *  4. Aguarda a janela principal estabilizar
 *  5. Faz login se credenciais estiverem configuradas
 */

const { execPowerShell } = require('../helpers/powershell');
const { isProcessRunning, focusWindow, getWindowTitle, isDialogOpen } = require('../helpers/window');
const { waitForProcess, waitForWindowStable, sleep } = require('../helpers/wait');
const { sendKeys, pressTab, pressEnter, typeText } = require('../helpers/keyboard');
const { captureDebug, captureFailure } = require('../helpers/screenshot');
const { withRetry } = require('../helpers/retry');
const logger = require('../helpers/logger');
const config = require('../../config');
const fs     = require('fs');

async function openApp() {
  logger.info('=== openApp: iniciando ===');

  // Valida o executável antes de tentar abrir
  if (!fs.existsSync(config.app.exePath)) {
    throw new Error(
      `Executável não encontrado: "${config.app.exePath}"\n` +
      `Configure DOMINIO_EXE_PATH no arquivo .env`
    );
  }

  return withRetry(async (attempt) => {
    // Se já está rodando, apenas traz para frente
    if (await isProcessRunning(config.app.processName)) {
      logger.info('[openApp] processo já está em execução — trazendo para frente');
      await focusWindow(config.app.processName);
      await sleep(config.timeouts.stepDelay);
    } else {
      logger.info(`[openApp] iniciando: "${config.app.exePath}"`);
      const psPath = config.app.exePath.replace(/\\/g, '\\\\');
      await execPowerShell(`Start-Process -FilePath "${psPath}"`, 5_000);

      logger.info('[openApp] aguardando processo aparecer...');
      await waitForProcess(config.app.processName, config.timeouts.appLoad);
      await sleep(2_000); // aguarda a janela principal criar
    }

    // Aguarda a janela estabilizar (título para de mudar)
    logger.info('[openApp] aguardando janela estabilizar...');
    const windowTitle = await waitForWindowStable(
      config.app.processName,
      2_000,
      config.timeouts.appLoad,
    );
    logger.info(`[openApp] janela pronta: "${windowTitle}"`);

    await captureDebug('openApp_loaded');

    // Tenta fazer login se houver tela de login
    await handleLoginIfNeeded();

    logger.info('[openApp] aplicativo pronto ✓');
  }, 'openApp');
}

async function handleLoginIfNeeded() {
  // Detecta tela de login verificando se há diálogo com "Login" ou "Senha" no título
  const loginDialogTitles = ['Login', 'Senha', 'Autenticação', 'Acesso', 'Entrar'];

  let loginFound = false;
  for (const title of loginDialogTitles) {
    if (await isDialogOpen(config.app.processName, title)) {
      loginFound = true;
      logger.info(`[openApp] tela de login detectada: "${title}"`);
      break;
    }
  }

  if (!loginFound) {
    // Verifica pelo título da janela principal
    const title = await getWindowTitle(config.app.processName);
    if (!title.toLowerCase().includes('registro') &&
        !title.toLowerCase().includes('domínio') &&
        !title.toLowerCase().includes('dominio')) {
      logger.debug(`[openApp] título da janela: "${title}" — verificando se é tela de login`);
    }
  }

  if (!loginFound) {
    logger.debug('[openApp] nenhuma tela de login detectada — pulando login');
    return;
  }

  if (!config.credentials.user) {
    logger.warn('[openApp] tela de login detectada mas DOMINIO_USER não configurado');
    throw new Error('Login necessário mas credenciais não configuradas. Configure DOMINIO_USER e DOMINIO_PASS no .env');
  }

  await focusWindow(config.app.processName);
  await sleep(500);

  logger.info('[openApp] preenchendo credenciais...');

  // Tab para garantir que o foco está no campo de usuário
  await pressTab();
  await sleep(200);

  // Digita usuário
  await sendKeys('^a'); // Ctrl+A para selecionar tudo no campo
  await typeText(config.credentials.user);
  await sleep(200);

  // Tab para o campo de senha
  await pressTab();
  await sleep(200);

  // Digita senha
  await sendKeys('^a');
  await typeText(config.credentials.pass);
  await sleep(200);

  // Confirma login
  await pressEnter();
  logger.info('[openApp] credenciais enviadas — aguardando autenticação...');

  await sleep(config.timeouts.dialogDelay * 2);
  await captureDebug('openApp_after_login');

  // Verifica se o login foi bem sucedido (janela de login deve ter fechado)
  let stillLoggedOut = false;
  for (const title of loginDialogTitles) {
    if (await isDialogOpen(config.app.processName, title)) {
      stillLoggedOut = true;
      break;
    }
  }

  if (stillLoggedOut) {
    await captureFailure('openApp_login_failed');
    throw new Error('Login falhou — tela de login ainda está aberta. Verifique as credenciais.');
  }

  logger.info('[openApp] login realizado com sucesso ✓');
}

module.exports = { openApp };
