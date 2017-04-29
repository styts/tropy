'use strict'

const START = Date.now()

if (process.env.TROPY_RUN_UNIT_TESTS === 'true') {
  require('electron-mocha')

} else {
  let READY = undefined

  const args = require('./args')
  const opts = args.parse(process.argv.slice(1))

  process.env.NODE_ENV = opts.environment
  global.ARGS = opts


  const { app }  = require('electron')
  const { extname, join } = require('path')
  const { qualified }  = require('../common/release')
  const { linux, darwin } = require('../common/os')

  let userdata = opts.dir
  if (!userdata) {
    switch (opts.environment) {
      case 'development':
        userdata = join(process.cwd(), 'tmp')
        break
      case 'production':
        userdata = join(
          app.getPath('appData'),
          qualified[linux ? 'name' : 'product'])
        break
    }
  }

  // Set app name and data location as soon as possible!
  app.setName(qualified.product)
  if (userdata) app.setPath('userData', userdata)


  if (!require('./squirrel')()) {
    const { all }  = require('bluebird')
    const { once } = require('../common/util')
    const { info } = require('../common/log')(userdata)

    if (opts.environment !== 'test') {
      if (app.makeSingleInstance(() => tropy.open(...opts._))) {
        info('other instance detected, exiting...')
        app.exit(0)
      }
    }

    if (opts.scale) {
      app.commandLine.appendSwitch('force-device-scale-factor', opts.scale)
    }

    info(`started in ${opts.e} mode`)
    info(`using ${app.getPath('userData')}`)

    const tropy = new (require('./tropy'))()

    tropy.listen()
    tropy.restore()

    if (darwin) {
      app.on('open-file', (event, file) => {
        switch (extname(file)) {
          case '.tpy':
            event.preventDefault()
            if (!READY) opts._ = [file]
            else tropy.open(file)
            break
          case '.jpg':
          case '.jpeg':
            if (READY && tropy.win) {
              event.preventDefault()
              tropy.import([file])
            }
            break
        }
      })
    }

    all([
      once(app, 'ready'),
      once(tropy, 'app:restored')

    ]).then(() => {
      READY = Date.now()
      info('ready after %sms', READY - START)
      tropy.open(...opts._)
    })

    app
      .on('quit', (_, code) => {
        info(`quit with exit code ${code}`)
      })
  }
}
