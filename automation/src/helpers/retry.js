'use strict';

const logger  = require('./logger');
const config  = require('../../config');
const { sleep } = require('./wait');

/**
 * Executa fn com retry automático em caso de erro.
 * @param {Function} fn          - Função async a executar
 * @param {string}   label       - Nome da operação para log
 * @param {object}   [opts]
 * @param {number}   [opts.max]      - Máximo de tentativas (default: config.retry.maxRetries)
 * @param {number}   [opts.delayMs]  - Delay entre tentativas (default: config.retry.delayMs)
 */
async function withRetry(fn, label, opts = {}) {
  const max     = opts.max     ?? config.retry.maxRetries;
  const delayMs = opts.delayMs ?? config.retry.delayMs;

  let lastError;

  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      logger.debug(`[retry] ${label} — tentativa ${attempt}/${max}`);
      const result = await fn(attempt);
      if (attempt > 1) {
        logger.info(`[retry] ${label} — sucesso na tentativa ${attempt}`);
      }
      return result;
    } catch (err) {
      lastError = err;
      logger.warn(`[retry] ${label} — tentativa ${attempt} falhou: ${err.message}`);
      if (attempt < max) {
        logger.debug(`[retry] aguardando ${delayMs}ms antes da próxima tentativa...`);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(`[retry] ${label} falhou após ${max} tentativas. Último erro: ${lastError?.message}`);
}

module.exports = { withRetry };
