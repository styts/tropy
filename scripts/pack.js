'use strict'

require('shelljs/make')

const { join, resolve } = require('path')
const { platform } = process
const { getSignToolParams } = require('./sign')

const {
  author, channel, qualified, name, product, version
} = require('../lib/common/release')

const res = resolve(__dirname, '..', 'res')
const dist = resolve(__dirname, '..', 'dist')

const APPIMAGETOOL = 'https://github.com/probonopd/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage'

target.all = (...args) => {
  target[platform](...args)
}


target.linux = (args = ['bz2', 'AppImage']) => {
  check(platform === 'linux', 'must be run on Linux')

  const src = join(dist, `${qualified.product}-linux-x64`)
  check(test('-d', src), 'no sources found')

  for (let arg of args) {
    switch (arg) {
      case 'flatpak': {
        const installer = require('electron-installer-flatpak')
        const options = {
          src,
          dest: dist,
          productName: qualified.product,
          name: qualified.name,
          bin: qualified.name,
          icon: join(res, 'icons', channel, 'tropy', '512x512.png'),
          mimeType: ['application/vnd.tropy.tpy', 'image/jpeg'],
          categories: ['Graphics', 'Viewer', 'Science']
        }

        installer(options, error => {
          if (error) return console.log(error)
          console.log(`created flatpak at ${options.dest}`)

        })

        break
      }
      case 'bz2': {
        exec(
          `tar cjf ${join(dist, `${name}-${version}.tar.bz2`)} -C "${src}" .`
        )
        break
      }
      case 'AppImage': {
        const appdir = join(dist, `${product}-${version}.AppDir`)
        const appimagetool = join(__dirname, 'appimagetool')

        if (!test('-f', appimagetool)) {
          exec(`curl -L -o ${appimagetool} ${APPIMAGETOOL}`)
          chmod('a+x', appimagetool)
        }

        rm('-rf', appdir)
        cp('-r', src, appdir)
        cd(appdir)
        ln('-s', qualified.name, 'AppRun')
        cp(`./icons/512x512/apps/${qualified.name}.png`, '.')
        cd('-')

        const dst = join(dist, `${product}-${version}-x86_64.AppImage`)
        exec(`${appimagetool} -n -v ${appdir} ${dst}`)
        break
      }

      default:
        console.error(`unknown linux target: ${arg}`)
    }
  }

}


target.darwin = () => {
  check(platform === 'darwin', 'must be run on macOS')
  check(which('appdmg'), 'missing dependency: appdmg')

  const sources = ls('-d', join(dist, '*-darwin-*'))
  check(sources.length, 'no sources found')

  for (let src of sources) {
    let app = join(src, `${product}.app`)
    let dmg = join(dist, `${name}-${version}.dmg`)

    let config = join(res, 'dmg', channel, 'appdmg.json')

    check(test('-d', app), `missing app: ${app}`)
    check(test('-f', config), `missing config: ${config}`)

    exec(`appdmg ${config} ${dmg}`)
  }
}


target.win32 = async (args = []) => {
  check(platform === 'win32', 'must be run on Windows')

  const { createWindowsInstaller } = require('electron-winstaller')

  const sources = ls('-d', join(dist, '*-win32-*'))
  check(sources.length === 1, 'multiple sources found')

  let [cert, pass] = args
  cert = cert || env.SIGN_WIN32_CERT
  pass = pass || env.SIGN_WIN32_PASS

  check(cert, 'missing certificate')
  check(pass, 'missing password')
  check(test('-f', cert), `certificate not found: ${cert}`)

  const params = getSignToolParams(cert, pass)

  await createWindowsInstaller({
    appDirectory: sources[0],
    outputDirectory: dist,
    authors: author.name,
    signWithParams: params,
    exe: `${qualified.product}.exe`,
    setupExe: `setup-${name}-${version}.exe`,
    setupIcon: join(res, 'icons', channel, `${name}.ico`),
    noMsi: true
  })
}


function check(predicate, msg) {
  if (!predicate) {
    console.error(msg)
    exit(1)
  }
}
