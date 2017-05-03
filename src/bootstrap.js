'use strict'

const START = performance.now()

{
  const decode = decodeURIComponent
  const hash = window.location.hash.slice(1)

  global.ARGS = Object.freeze(JSON.parse(decode(hash)))
  process.env.NODE_ENV = ARGS.environment
}


const { info } = require('./common/log')(ARGS.home, ARGS)
const { remote } = require('electron')
const { ready } = require('./dom')
const { win } = require('./window')

ready.then(() => {
  const READY = performance.now()

  win.init()

  const DONE = performance.now()

  info('%s ready after %dms (%dms)',
      win.type, (DONE - START).toFixed(3), (DONE - READY).toFixed(3))
})


if (ARGS.dev) {
  if (process.platform !== 'linux') {
    const props = Object.defineProperties

    props(process, {
      stdout: { value: remote.process.stdout },
      stderr: { value: remote.process.stderr }
    })
  }

} else {
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {}
}
