'use strict'

const { join } = require('path')
const { assign } = Object
const { sync: mkdirp } = require('mkdirp')

const bunyan = require('bunyan')

const logger = bunyan.createLogger({
  name: 'tropy',
  serializers: { err: bunyan.stdSerializers.err },
  process: process.type
})

function logToStdout() {
  logger.addStream({
    stream: process.stdout,
    level: 'debug'
  })
}

function logToFolder(dir) {
  mkdirp(dir)

  logger.addStream({
    type: 'rotating-file',
    path: join(dir, `${process.type}.log`),
    level: 'debug',
    period: '1d',
    count: 3
  })
}

function init(dir) {
  let logDir = join(dir, 'log')

  switch (ARGS.environment) {
    case 'development':
      logToStdout()
      logToFolder(logDir)
      break
    case 'production':
      logToFolder(logDir)
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

module.exports = assign(init, {
  logger,
  log: logger.info.bind(logger),      // default, info 30
  fatal: logger.fatal.bind(logger),   // 60
  error: logger.error.bind(logger),   // 50
  warn: logger.warn.bind(logger),     // 40
  info: logger.info.bind(logger),     // 30
  debug: logger.debug.bind(logger),   // 20
  trace: logger.trace.bind(logger)    // 10
})
