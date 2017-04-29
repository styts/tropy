'use strict'

const { debug, warn, info, logger } = require('../common/log')
const ms = require('ms')

function prepareLoggingObject(type, meta, payload) {
  let evidence = {
    type,
    payload,
    seq: meta.seq
  }
  if (meta.rel) {
    evidence.rel = meta.rel
    evidence.ms = ms(meta.now - meta.was)
  }
  return evidence
}

module.exports = {
  log() {
    return next => action => {
      const { type, payload, meta, error } = action

      switch (true) {
        case !!error:
          // TODO this branch can be improved
          warn(`${prepareLoggingObject(type, meta)} failed: ${payload.message}`)
          debug(payload.stack, payload.message)
          logger.error({ err: payload }) // key needs to be called `err` for bunyan
          break
        default:
          info(prepareLoggingObject(
            type, meta, payload), type)
      }

      return next(action)
    }
  }
}
