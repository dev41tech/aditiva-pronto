'use strict';

const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../../config');

fs.mkdirSync(config.logs.dir, { recursive: true });
fs.mkdirSync(config.screenshots.dir, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

const lineFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase().padEnd(5)}] ${stack || message}`;
});

const logger = createLogger({
  level: config.debug ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    lineFormat,
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        errors({ stack: true }),
        timestamp({ format: 'HH:mm:ss.SSS' }),
        lineFormat,
      ),
    }),
    new DailyRotateFile({
      dirname:       config.logs.dir,
      filename:      'automation-%DATE%.log',
      datePattern:   'YYYY-MM-DD',
      maxFiles:      '14d',
      zippedArchive: false,
    }),
  ],
});

module.exports = logger;
