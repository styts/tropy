'use strict'

const { ITEM } = require('../constants')

module.exports = {
  create(payload, meta) {
    return {
      type: ITEM.CREATE,
      payload,
      meta: {
        async: true,
        record: true,
        ...meta
      }
    }
  },

  delete(payload, meta) {
    return {
      type: ITEM.DELETE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  destroy(payload, meta) {
    return {
      type: ITEM.DESTROY,
      payload,
      meta: { async: true, prompt: true, ...meta }
    }
  },

  insert(payload, meta) {
    return {
      type: ITEM.INSERT,
      payload,
      meta: { search: true, ...meta }
    }
  },

  load(payload, meta) {
    return {
      type: ITEM.LOAD,
      payload,
      meta: { async: true, ...meta }
    }
  },

  remove(payload, meta) {
    return {
      type: ITEM.REMOVE,
      payload,
      meta: { search: true, ...meta }
    }
  },

  restore(payload, meta) {
    return {
      type: ITEM.RESTORE,
      payload,
      meta: { async: true, record: true, ...meta }
    }
  },

  save(payload, meta) {
    return {
      type: ITEM.SAVE,
      payload,
      meta: { async: true, ...meta }
    }
  },

  update(payload, meta) {
    return {
      type: ITEM.UPDATE,
      payload,
      meta: meta
    }
  },

  select(payload, meta = {}) {
    return { type: ITEM.SELECT, payload, meta }
  },

  tags: {
    add(payload, meta = {}) {
      return {
        type: ITEM.ADD_TAG,
        payload,
        meta: { async: true, record: true, ...meta }
      }
    },

    remove(payload, meta = {}) {
      return {
        type: ITEM.REMOVE_TAG,
        payload,
        meta: { async: true, record: true, ...meta }
      }
    }
  }
}