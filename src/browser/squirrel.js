'use strict'

const { basename, dirname, resolve, join } = require('path')
const { app, shell } = require('electron')
const { sync: rm } = require('rimraf')
const ChildProcess = require('child_process')
const { existsSync: exists } = require('fs')
const { sync: mkdir } = require('mkdirp')
const { product, qualified } = require('../common/release')

const START_MENU = resolve(
  app.getPath('appData'),
  '..',
  'Roaming',
  'Microsoft',
  'Windows',
  'Start Menu',
  'Programs',
  product,
  `${qualified.product}.lnk`
)

const DESKTOP = resolve(
  app.getPath('home'),
  'Desktop',
  `${qualified.product}.lnk`
)

const root = resolve(process.execPath, '..', '..')
const update = join(root, 'Update.exe')
const exe = basename(process.execPath)

function link(path, force = false) {
  if (!exists(path) && !force) return

  mkdir(dirname(path))
  shell.writeShortcutLink(path, exists(path) ? 'update' : 'create', {
    target: update,
    args: `--processStart "${exe}"`,
    icon: process.execPath,
    iconIndex: 0,
    appUserModelId: 'org.tropy.app'
  })
}

// eslint-disable-next-line no-unused-vars
function spawn(cmd, ...args) {
  try {
    return ChildProcess.spawn(cmd, args, { detached: true })

  } catch (error) {
    app.quit(1)
  }
}

function handleSquirrelEvent() {
  if (process.platform !== 'win32') return false
  if (global.ARGS.environment === 'development') return false
  if (process.argv.length === 1) return false

  for (let arg of process.argv) {
    switch (arg) {
      case '--squirrel-install':
        link(DESKTOP, true)
        link(START_MENU, true)
        app.quit()
        return true
      case '--squirrel-updated':
        link(DESKTOP)
        link(START_MENU)
        app.quit()
        return true
      case '--squirrel-uninstall':
        try {
          rm(DESKTOP)
          rm(START_MENU)
          rm(app.getPath('userData'))

        } finally {
          app.quit()
        }
        return true
      case '--squirrel-obsolete':
        app.quit()
        return true
    }
  }

  return false
}

module.exports = handleSquirrelEvent
