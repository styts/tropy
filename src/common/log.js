'use strict'

const { join } = require('path')
const { assign } = Object
const { existsSync, mkdirSync } = require('fs')

const bunyan = require('bunyan')

const logger = bunyan.createLogger({
  name: 'tropy',
  serializers: { err: bunyan.stdSerializers.err },
  process: process.type
})

function ensureFolder(dir) {
  if (!existsSync(dir)) mkdirSync(dir)
}

function logToStdout() {
  logger.addStream({
    stream: process.stdout,
    level: 'debug'
  })
}

function logToFolder(dir) {
  if (dir) {
    let logDir = join(dir, 'log')

    ensureFolder(dir)
    ensureFolder(logDir)

    logger.addStream({
      type: 'rotating-file',
      path: join(logDir, `${process.type}.log`),
      level: 'debug',
      period: '1d',
      count: 3
    })
  }
}

function init(dir) {
  switch (ARGS.environment) {
    case 'development':
      logToStdout()
      logToFolder(dir)
      break
    case 'production':
      logToFolder(dir)
      break
    case 'test':
      if (!process.env.CI) {
        logger.addStream({
          path: join(__dirname, '..', '..', 'tmp', 'test.log'),
          level: 'debug'
        })
      }
      break
  }

  if (ARGS.debug) logger.level('debug')

  logger.debug('logger initialized at level %s',
               bunyan.nameFromLevel[logger.level()])

  return module.exports
}

// module.exports = logger
module.exports = assign(init, {
  logger,
  log: logger.info.bind(logger),      // default, info 30
  error: logger.error.bind(logger),   // 50
  warn: logger.warn.bind(logger),     // 40
  info: logger.info.bind(logger),     // 30
  verbose: logger.debug.bind(logger), // 20
  debug: logger.trace.bind(logger)    // 10
})
