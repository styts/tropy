'use strict'

require('shelljs/make')

const { join, resolve, relative } = require('path')
const { qualified } = require('../lib/common/release')
const { arch, platform } = process
const dir = resolve(__dirname, '..')

const KITS = 'C:\\Program Files (x86)\\Windows Kits\\'

target.all = (...args) => {
  target[platform](...args)
}


target.win32 = (args = []) => {
  check(platform === 'win32', 'must be run on Windows')

  let [cert, pass] = args
  cert = cert || env.SIGN_WIN32_CERT
  pass = pass || env.SIGN_WIN32_PASS

  check(pass, 'missing password')
  check(cert, 'missing certificate')
  check(test('-f', cert), `certificate not found: ${cert}`)

  const signtool = getSignTool()
  const params = getSignToolParams(cert, pass)
  check(signtool, `missing dependency: ${signtool}`)

  const targets = ls('-d', join(dir, 'dist', '*-win32-*'))
  check(targets.length, 'no targets found')

  for (let target of targets) {
    for (let file of ls(join(target, '*.exe'))) {
      exec(`"${signtool}" sign ${params} ${file}`)
      exec(`"${signtool}" verify /pa ${file}`)
    }
  }
}


target.darwin = (args = []) => {
  check(platform === 'darwin', 'must be run on macOS')

  check(which('codesign'), 'missing dependency: codesign')
  check(which('spctl'), 'missing dependency: spctl')

  const targets = ls('-d', join(dir, 'dist', '*-darwin-*'))
  const identity = args[0] || env.SIGN_DARWIN_IDENTITY

  check(targets.length, 'no targets found')
  check(identity, 'missing identity')

  let app

  for (let target of targets) {
    app = join(target, `${qualified.product}.app`)
    check(test('-d', app), `app not found: ${app}`)

    console.log(`signing ${relative(dir, app)} with ${identity}...`)

    for (let file of find(`"${app}" -perm +111 -type f`)) {
      sign(file)
    }

    for (let file of find(`"${join(app, 'Contents')}" -name "*.framework"`)) {
      sign(file)
    }

    for (let file of find(`"${join(app, 'Contents')}" -name "*.app"`)) {
      sign(file)
    }

    sign(app)
    verify(app)
  }

  function sign(file) {
    console.log(`${relative(app, file)}`)
    exec(`codesign --sign ${identity} -fv "${file}"`, { silent: true })
  }

  function verify(file) {
    console.log(`verify ${relative(app, file)}`)
    exec(`codesign --verify --deep --display --verbose "${file}"`)
    exec(`spctl --ignore-cache --no-cache --assess -t execute --v "${file}"`)
  }
}


function check(predicate, msg) {
  if (!predicate) {
    console.error(msg)
    exit(1)
  }
}

function find(args) {
  return exec(`find ${args}`, { silent: true }).stdout.trim().split('\n')
}


function getSignTool() {
  return [
    join(KITS, '8.1', 'bin', arch, 'signtool.exe'),
    join(KITS, '10', 'bin', arch, 'signtool.exe')
  ].find(signtool => test('-f', signtool))
}

function getSignToolParams(cert, pass, ts = 'http://timestamp.comodoca.com') {
  return [
    `/t ${ts}`, '/fd SHA256', `/f ${cert}`, `/p ${pass}`
  ].join(' ')
}

module.exports = {
  getSignTool,
  getSignToolParams
}
