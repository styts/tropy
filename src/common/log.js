'use strict'

const { join } = require('path')
const { assign } = Object

const bunyan = require('bunyan')

const logger = bunyan.createLogger({
  name: 'tropy',
  serializers: { err: bunyan.stdSerializers.err },
  process: process.type
})


function init(dir) {

  switch (ARGS.environment) {
    case 'development':
      logger.addStream({
        stream: process.stdout,
        level: 'debug'
      })
      // eslint-disable-line no-fallthrough

    case 'production':
      if (dir) {
        logger.addStream({
          type: 'rotating-file',
          path: join(dir, `${process.type}.log`),
          level: 'info',
          period: '1d',
          count: 3
        })
      }

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
               bunyan.resolveLevel(logger.level()))

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
