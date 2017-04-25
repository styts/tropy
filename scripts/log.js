'use strict'

/* eslint-disable no-console */

const colors = require('colors/safe')
const pad = require('string.prototype.padstart')

const COLOR = { warn: 'yellow', error: 'red' }

function colorize(level, text) {
  return colors[COLOR[level] || 'gray'](text || level)
}

function importantLevel(level) {
  level = level.toLowerCase()
  return level in COLOR
}

function prefix(options) {
  options.meta = options.meta || {}
  if (!options.meta.tag && importantLevel(options.level)) {
    // we need some text to colorize if we have a non-info
    options.meta.tag = options.level.toUpperCase()
  }
  return colorize(options.level, pad(options.meta.tag || '', 12, ' '))
}


function log(level, message, meta) {
  let options = { meta }
  options.level = level
  console.log(prefix(options), message)
}

const logger = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args)
}

module.exports = logger
