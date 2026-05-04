'use strict';

require('dotenv').config();
const path = require('path');

const config = {
  app: {
    exePath: process.env.DOMINIO_EXE_PATH || 'C:\\Dominio\\Registro\\DominioRegistro.exe',
    processName: 'DominioRegistro',
    windowTitle: 'Domínio Registro',
  },

  export: {
    folder: process.env.EXPORT_FOLDER || path.join(process.env.USERPROFILE, 'Documents', 'Relatorios'),
    filePrefix: 'relacao-empresas',
    format: 'xlsx',
  },

  credentials: {
    user: process.env.DOMINIO_USER || '',
    pass: process.env.DOMINIO_PASS || '',
  },

  timeouts: {
    appLoad:         parseInt(process.env.TIMEOUT_APP_LOAD)        || 30_000,
    menuOpen:        parseInt(process.env.TIMEOUT_MENU_OPEN)       ||  5_000,
    reportGenerate:  parseInt(process.env.TIMEOUT_REPORT_GENERATE) || 60_000,
    exportSave:      parseInt(process.env.TIMEOUT_EXPORT)          || 30_000,
    keyDelay:        100,   // ms entre teclas individuais
    stepDelay:       800,   // ms entre etapas de navegação
    dialogDelay:     1_500, // ms para aguardar diálogos abrirem
  },

  retry: {
    maxRetries:   parseInt(process.env.MAX_RETRIES)    || 3,
    delayMs:      parseInt(process.env.RETRY_DELAY_MS) || 2_000,
  },

  debug: process.env.DEBUG_MODE === 'true',

  logs: {
    dir: path.join(__dirname, 'logs'),
  },

  screenshots: {
    dir: path.join(__dirname, 'logs', 'screenshots'),
  },
};

module.exports = config;
