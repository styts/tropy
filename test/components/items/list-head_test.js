'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('ListHead', () => {
  const { ListHead } = __require('components/items/list-head')

  it('has class item-list-head', () => {
    expect(shallow(<ListHead columns={[]}/>))
      .to.have.className('item-list-head')
  })

  it('renders head columns', () => {
    const columns = [
      { width: '40%', field: { name: 'x', type: 'string' } },
      { width: '60%', field: { name: 'y', type: 'number' } },
    ]

    expect(shallow(<ListHead columns={columns}/>))
      .to.have.exactly(2).descendants('.metadata-head')
  })
})