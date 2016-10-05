'use strict'

const { ROOT } = require('../constants/list')

function sort(children) {
  return children ?
    children
    .split(/,/)
    .reduce((res, nxt) => {
      const [pos, id] = nxt.split(/:/).map(Number)
      res[pos - 1] = id // TODO ensure positions are unique!
      return res
    }, []) : []

}

module.exports = {

  async all(db) {
    const lists = []

    await db.each(`
      SELECT l1.list_id AS id, l1.name, l1.parent_list_id AS parent,
        group_concat(l2.position || ':' || l2.list_id) AS children
      FROM lists l1 LEFT OUTER JOIN lists l2 ON l2.parent_list_id = l1.list_id
      GROUP BY l1.list_id;
      `,
      list => {
        lists.push({ ...list, children: sort(list.children) })
      })

    return lists
  },

  async create(db, { name, parent, position }) {
    const { id } = await db.run(
      'INSERT INTO lists (name, parent_list_id, position) VALUES (?, ?, ?)',
      name, parent, position)

    return { id, name, parent }
  },

  async remove(db, id) {
    return await db.run(
      'UPDATE lists SET parent_list_id = NULL WHERE list_id = ?', id)
  },

  async restore(db, id, parent) {
    return await db.run(
      'UPDATE lists SET parent_list_id = ? WHERE list_id = ?', parent, id)
  },

  async prune(db) {
    return await db.run(
      'DELETE FROM lists WHERE list_id <> ? AND parent_list_id IS NULL',
      ROOT)
  },

  async save(db, { id, name }) {
    return await db.run(
      'UPDATE lists SET name = ? WHERE list_id = ?', name, id)
  }

}