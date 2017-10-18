'use strict'

const { EventEmitter } = require('events')
const { resolve } = require('path')

const {
  app, shell, ipcMain: ipc, BrowserWindow, systemPreferences: pref
} = require('electron')

const { verbose, warn } = require('../common/log')
const { open, hasOverlayScrollBars } = require('./window')
const { all } = require('bluebird')
const { existsSync: exists } = require('fs')
const { join } = require('path')
const { into, compose, remove, take } = require('transducers.js')
const rm = require('rimraf')
const uuid = require('uuid/v1')

const { AppMenu, ContextMenu } = require('./menu')
const { Cache } = require('../common/cache')
const { Strings } = require('../common/res')
const Storage = require('./storage')
const Updater = require('./updater')
const dialog = require('./dialog')

const release = require('../common/release')

const { defineProperty: prop } = Object
const act = require('../actions')
const { darwin } = require('../common/os')
const { version } = require('../common/release')

const {
  HISTORY, TAG, PROJECT, CONTEXT, SASS
} = require('../constants')

const WIN = SASS.WINDOW
const WIZ = SASS.WIZARD
const ABT = SASS.ABOUT
const PREFS = SASS.PREFS
const ZOOM = ARGS.zoom || 1

const H = new WeakMap()
const T = new WeakMap()


class Tropy extends EventEmitter {
  static defaults = {
    frameless: darwin,
    debug: false,
    locale: 'en', // app.getLocale() || 'en',
    theme: 'light',
    recent: [],
    win: {}
  }

  constructor() {
    super()

    if (Tropy.instance) return Tropy.instance
    Tropy.instance = this

    this.menu = new AppMenu(this)
    this.ctx = new ContextMenu(this)

    if (darwin) {
      this.updater = new Updater(this)
    }

    prop(this, 'cache', {
      value: new Cache(app.getPath('userData'), 'cache')
    })

    prop(this, 'store', { value: new Storage() })

    prop(this, 'projects', { value: new Map() })

    prop(this, 'home', {
      value: resolve(__dirname, '..', '..')
    })
  }

  open(file) {
    if (!file) {
      if (this.win) return this.win.show(), this

      while (this.state.recent.length) {
        const recent = this.state.recent.shift()

        if (exists(recent)) {
          file = recent
          break
        }
      }

      if (!file) return this.showWizard()
    }

    try {
      file = resolve(file)
      verbose(`opening ${file}...`)

      if (this.win) {
        if (file) {
          this.dispatch(act.project.open(file), this.win)
        }

        return this.win.show(), this
      }

      this.win = open('project', { file, ...this.hash }, {
        width: WIN.WIDTH,
        height: WIN.HEIGHT,
        minWidth: WIN.MIN_WIDTH * ZOOM,
        minHeight: WIN.MIN_HEIGHT * ZOOM,
        darkTheme: (this.state.theme === 'dark'),
        frame: !this.hash.frameless
      })

      this.win
        .on('unresponsive', async () => {
          warn(`win#${this.win.id} has become unresponsive`)

          const chosen = await dialog.show('message-box', this.win, {
            type: 'warning',
            ...this.strings.dict.dialogs.unresponsive
          })

          switch (chosen) {
            case 0: return this.win.destroy()
          }
        })
        .on('close', () => {
          if (!this.win.isFullScreen()) {
            this.state.win.bounds = this.win.getBounds()
          }
        })
        .on('closed', () => { this.win = undefined })

      this.win.webContents
        .on('crashed', async () => {
          warn(`win#${this.win.id} contents crashed`)

          const chosen = await dialog.show('message-box', this.win, {
            type: 'warning',
            ...this.strings.dict.dialogs.crashed
          })

          switch (chosen) {
            case 0: return this.win.close()
            case 1: return this.win.reload()
          }
        })


      if (this.state.win.bounds) {
        this.win.setBounds(this.state.win.bounds)
      }

      return this

    } finally {
      this.emit('app:reload-menu')
    }
  }

  opened({ file, name }) {
    if (this.wiz) this.wiz.close()
    if (this.prefs) this.prefs.close()

    this.state.recent = into([file],
        compose(remove(f => f === file), take(9)), this.state.recent)

    // if (darwin) this.win.setRepresentedFilename(file)
    if (name) this.win.setTitle(name)

    switch (process.platform) {
      case 'darwin':
      case 'win32':
        app.addRecentDocument(file)
        break
    }

    this.emit('app:reload-menu')
  }

  import() {
    this.dispatch(act.item.import(), this.win)
  }

  showAboutWindow() {
    if (this.about) return this.about.show(), this

    this.about = open('about', this.hash, {
      title: this.strings.dict.windows.about.title,
      width: ABT.WIDTH * ZOOM,
      height: ABT.HEIGHT * ZOOM,
      parent: darwin ? null : this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless
    })
      .once('closed', () => { this.about = undefined })

    return this
  }

  showWizard() {
    if (this.prefs) this.prefs.close()
    if (this.wiz) return this.wiz.show(), this

    this.wiz = open('wizard', this.hash, {
      title: this.strings.dict.windows.wizard.title,
      width: WIZ.WIDTH * ZOOM,
      height: WIZ.HEIGHT * ZOOM,
      parent: darwin ? null : this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless
    })
      .once('closed', () => { this.wiz = undefined })

    return this
  }

  configure() {
    if (this.prefs) return this.prefs.show(), this

    this.prefs = open('prefs', this.hash, {
      title: this.strings.dict.windows.prefs.title,
      width: PREFS.WIDTH * ZOOM,
      height: PREFS.HEIGHT * ZOOM,
      parent: darwin ? null : this.win,
      modal: !darwin && !!this.win,
      autoHideMenuBar: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      darkTheme: (this.state.theme === 'dark'),
      frame: !this.hash.frameless,
      titleBarStyle: 'hidden'
    })
      .once('closed', () => {
        this.prefs = undefined
        this.dispatch(act.ontology.load(), this.win)
        this.dispatch(act.storage.reload([['settings']]), this.win)
      })

    return this
  }

  restore() {
    return all([
      this.store.load('state.json')
    ])
      .then(([state]) => ({ ...Tropy.defaults, ...state }))
      .catch({ code: 'ENOENT' }, () => Tropy.defaults)

      .then(state => this.migrate(state))

      .tap(() => all([
        this.menu.load(),
        this.ctx.load(),
        this.cache.init(),
        Strings
          .openWithFallback(Tropy.defaults.locale, this.state.locale)
          .then(strings => this.strings = strings)
      ]))


      .tap(() => this.emit('app:restored'))
      .tap(() => verbose('app state restored'))
  }

  migrate(state) {
    if (!state.version || state.version === '1.0.0-beta.0') {
      state.recent = []
    }

    state.locale = 'en'
    state.version = this.version
    state.uuid = state.uuid || uuid()

    this.state = state
    return this
  }

  persist() {
    if (this.state != null) {
      this.store.save.sync('state.json', this.state)
    }

    return this
  }

  listen() {
    if (this.updater) this.updater.start()

    this.on('app:about', () =>
      this.showAboutWindow())
    this.on('app:create-project', () =>
      this.showWizard())
    this.on('app:close-project', () =>
      this.win && this.dispatch(act.project.close('debug')))

    this.on('app:import-photos', () =>
      this.import())

    this.on('app:rename-project', () =>
      this.dispatch(act.edit.start({ project: { name: true } })))

    this.on('app:show-in-folder', (_, { target }) =>
      shell.showItemInFolder(target.path))

    this.on('app:create-item', () =>
      this.dispatch(act.item.create()))

    this.on('app:delete-item', (_, { target }) =>
      this.dispatch(act.item.delete(target.id)))

    this.on('app:merge-item', (_, { target }) =>
      this.dispatch(act.item.merge(target.id)))

    this.on('app:explode-item', (_, { target }) =>
      this.dispatch(act.item.explode({ id: target.id })))

    this.on('app:explode-photo', (_, { target }) =>
      this.dispatch(act.item.explode({ id: target.item, photos: [target.id] })))

    this.on('app:export-item', (_, { target }) =>
      this.dispatch(act.item.export(target.id)))

    this.on('app:restore-item', (_, { target }) =>
      this.dispatch(act.item.restore(target.id)))

    this.on('app:destroy-item', (_, { target }) =>
      this.dispatch(act.item.destroy(target.id)))

    this.on('app:create-item-photo', (_, { target }) =>
      this.dispatch(act.photo.create({ item: target.id })))

    this.on('app:toggle-item-tag', (_, { id, tag }) =>
      this.dispatch(act.item.tags.toggle({ id, tags: [tag] })))

    this.on('app:clear-item-tags', (_, { id }) =>
      this.dispatch(act.item.tags.clear(id)))

    this.on('app:list-item-remove', (_, { target }) =>
      this.dispatch(act.list.items.remove({
        id: target.list,
        items: target.id
      })))

    this.on('app:rename-photo', (_, { target }) =>
      this.dispatch(act.edit.start({ photo: target.id })))

    this.on('app:delete-photo', (_, { target }) =>
      this.dispatch(act.photo.delete({
        item: target.item, photos: [target.id]
      })))
    this.on('app:delete-selection', (_, { target }) =>
      this.dispatch(act.selection.delete({
        photo: target.id, selections: [target.selection]
      })))

    this.on('app:create-list', () =>
      this.dispatch(act.list.new()))

    this.on('app:rename-list', (_, { target: id }) =>
      this.dispatch(act.edit.start({ list: { id } })))

    this.on('app:delete-list', (_, { target }) =>
      this.dispatch(act.list.delete(target)))

    this.on('app:create-tag', () =>
      this.dispatch(act.tag.new()))

    this.on('app:rename-tag', (_, { target }) =>
      this.dispatch(act.tag.edit(target)))

    this.on('app:save-tag', (_, tag) =>
      this.dispatch(act.tag.save(tag)))

    this.on('app:remove-tag', (_, { target }) =>
      this.dispatch(act.item.tags.delete({
        id: target.items, tags: [target.id]
      })))

    this.on('app:delete-tag', (_, { target }) =>
      this.dispatch(act.tag.delete(target.id)))

    this.on('app:create-note', (_, { target }) =>
      this.dispatch(act.note.create(target)))

    this.on('app:delete-note', (_, { target }) =>
      this.dispatch(act.note.delete(target)))

    this.on('app:toggle-menu-bar', win => {
      if (win.isMenuBarAutoHide()) {
        win.setAutoHideMenuBar(false)
      } else {
        win.setAutoHideMenuBar(true)
        win.setMenuBarVisibility(false)
      }
    })

    this.on('app:clear-recent-projects', () => {
      verbose('clearing recent projects...')
      this.state.recent = []
      this.emit('app:reload-menu')
    })

    this.on('app:switch-theme', (_, theme) => {
      verbose(`switching to "${theme}" theme...`)
      this.state.theme = theme
      this.broadcast('theme', theme)
      this.emit('app:reload-menu')
    })

    this.on('app:toggle-debug-flag', () => {
      verbose('toggling dev/debug mode...')
      this.state.debug = !this.state.debug
      this.broadcast('debug', this.state.debug)
      this.emit('app:reload-menu')
    })

    this.on('app:reload-menu', () => {
      // Note: there may be Electron issues when reloading
      // the main menu. But since we cannot remove items
      // dynamically (#527) this is our only option.
      this.menu.reload()
    })

    this.on('app:undo', () => {
      if (this.history.past) {
        this.dispatch({
          type: HISTORY.UNDO,
          meta: { ipc: HISTORY.CHANGED }
        })
      }
    })

    this.on('app:redo', () => {
      if (this.history.future) {
        this.dispatch({
          type: HISTORY.REDO,
          meta: { ipc: HISTORY.CHANGED }
        })
      }
    })

    this.on('app:inspect', (win, { x, y }) => {
      if (win != null) win.webContents.inspectElement(x, y)
    })

    this.on('app:open-preferences', () => {
      this.configure()
    })

    this.on('app:open-license', () => {
      shell.openExternal('https://github.com/tropy/tropy/blob/master/LICENSE')
    })

    this.on('app:search-issues', () => {
      shell.openExternal('https://github.com/tropy/tropy/issues')
    })

    this.on('app:open-docs', () => {
      shell.openExternal('https://docs.tropy.org')
    })

    this.on('app:open-forums', () => {
      shell.openExternal('https://forums.tropy.org')
    })

    this.on('app:open-logs', () => {
      shell.showItemInFolder(join(app.getPath('userData'), 'log'))
    })

    this.on('app:reset-ontology-db', () => {
      if (this.win || this.prefs) {
        this.dispatch(act.ontology.reset())
      } else {
        rm.sync(join(app.getPath('userData'), 'ontology.db'))
      }
    })

    this.on('app:open-dialog', (win, options = {}) => {
      dialog
        .show('file', win, {
          ...options,
          defaultPath: app.getPath('userData'),
          filters: [{ name: 'Tropy Projects', extensions: ['tpy'] }],
          properties: ['openFile']

        }).then(files => {
          if (files) this.open(...files)
        })
    })

    let quit = false
    let winId

    app.on('browser-window-focus', (_, win) => {
      try {
        if (winId !== win.id) this.emit('app:reload-menu')
      } finally {
        winId = win.id
      }
    })

    app.once('before-quit', () => { quit = true })

    app.on('window-all-closed', () => {
      if (quit || !darwin) app.quit()
    })

    app.on('quit', () => {
      verbose('saving app state')
      if (this.updater) this.updater.stop()
      this.persist()
    })

    if (darwin) {
      app.on('activate', () => this.open())

      const ids = [
        pref.subscribeNotification(
          'AppleShowScrollBarsSettingChanged', () =>
            this.broadcast('scrollbars', !hasOverlayScrollBars()))
      ]

      app.on('quit', () => {
        for (let id of ids) pref.unsubscribeNotification(id)
      })
    }

    ipc.on('cmd', (_, command, ...params) => this.emit(command, ...params))

    ipc.on(PROJECT.OPENED, (_, project) => this.opened(project))
    ipc.on(PROJECT.CREATE, () => this.showWizard())
    ipc.on(PROJECT.CREATED, (_, { file }) => this.open(file))

    ipc.on(PROJECT.UPDATE, (_, { name }) => {
      if (name) this.win.setTitle(name)
    })

    ipc.on(HISTORY.CHANGED, (event, history) => {
      H.set(BrowserWindow.fromWebContents(event.sender), history)
      this.emit('app:reload-menu')
    })

    ipc.on(TAG.CHANGED, (event, tags) => {
      T.set(BrowserWindow.fromWebContents(event.sender), tags)
      this.emit('app:reload-menu')
    })

    ipc.on(CONTEXT.SHOW, (_, event) => {
      this.ctx.show(event)
    })

    dialog.start()

    return this
  }

  get hash() {
    return {
      environment: ARGS.environment,
      debug: this.debug,
      dev: this.dev,
      home: app.getPath('userData'),
      documents: app.getPath('documents'),
      cache: this.cache.root,
      frameless: this.state.frameless,
      theme: this.state.theme,
      locale: this.state.locale,
      uuid: this.state.uuid,
      version
    }
  }


  dispatch(action, win = BrowserWindow.getFocusedWindow()) {
    if (win != null) {
      win.webContents.send('dispatch', action)
    }
  }

  broadcast(...args) {
    for (let win of BrowserWindow.getAllWindows()) {
      win.webContents.send(...args)
    }
  }

  get history() {
    return H.get(BrowserWindow.getFocusedWindow()) || {}
  }

  get tags() {
    return T.get(BrowserWindow.getFocusedWindow()) || []
  }

  get name() {
    return release.product
  }

  get dev() {
    return release.channel === 'dev' || ARGS.environment === 'development'
  }

  get debug() {
    return ARGS.debug || this.state.debug
  }

  get version() {
    return release.version
  }
}

module.exports = Tropy
