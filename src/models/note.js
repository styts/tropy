'use strict'

const { json, stringify } = require('../common/util')

module.exports = {

  async create(db, { content, text, photo }) {

    // Note: last_insert_rowid() not reliable because of FTS triggers,
    // so we determine the next id ourselves. This should be always
    // be called in a transaction!
    const { max } = await db.get('SELECT max(note_id) AS max FROM notes')
    const id = Number(max) + 1

    await db.run(`
      INSERT INTO notes (note_id, id, content, text) VALUES (?,?,?,?)`,
      id, photo, stringify(content), text
    )

    return module.exports.load(db, [id])
  },

  async load(db, ids) {
    const notes = {}

    if (ids.length) {
      await db.each(`
        SELECT note_id AS note, photos.id AS photo,
            content, text, language, modified
          FROM notes
            LEFT OUTER JOIN photos USING (id)
          WHERE note_id IN (${ids.join(',')})
            AND deleted IS NULL
          ORDER BY created ASC`,

        ({ note, content, ...data }) => {
          notes[note] = {
            ...data, id: note, content: json(content), deleted: false
          }
        }
      )
    }

    return notes
  },

  async save(db, { id, content, text }) {
    return db.run(`
      UPDATE notes
        SET content = ?, text = ?, modified = datetime("now")
        WHERE note_id = ?`, stringify(content), text, id
    )
  },

  async delete(db, ids) {
    return db.run(`
      UPDATE notes
        SET deleted = datetime("now")
        WHERE note_id IN (${ids.join(',')})`
    )
  },

  async restore(db, ids) {
    return db.run(`
      UPDATE notes
        SET deleted = NULL
        WHERE note_id IN (${ids.join(',')})`
    )
  },

  async prune(db) {
    return db.run(`
      DELETE FROM notes WHERE deleted IS NOT NULL`
    )
  }
}
