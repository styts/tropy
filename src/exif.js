'use strict'

const parse = require('exif-reader')
const { info } = require('./common/log')

module.exports = {
  exif(buffer) {
    return new Promise((resolve) => {
      let data = {}

      try {
        let offset = 0

        while (offset < buffer.length) {
          if (buffer[offset++] === 0xFF && buffer[offset++] === 0xE1) {
            const meta = parse(buffer.slice(offset + 2))

            data = ({
              ...meta.gps, ...meta.exif, ...meta.image
            })

            break
          }
        }

      } catch (error) {
        info(`EXIF extraction failed: ${error.message}`)
      } finally {
        resolve(data)
      }
    })
  }
}
