'use strict'

const React = require('react')
const { PureComponent } = React
const { TABS, SASS: { TILE } } = require('../constants')
const { adjacent, restrict } = require('../common/util')
const { win32 } = require('../common/os')
const { has, on, off } = require('../dom')
const { ceil, floor, max, min, round } = Math
const { bool, number } = require('prop-types')
const throttle = require('lodash.throttle')
const EMPTY = []


class Iterator extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      cols: 1,
      height: 0,
      maxOffset: 0,
      offset: 0,
      overscan: 0,
      rowHeight: 0,
      rows: 0,
      viewportRows: 0
    }

    this.viewport = {
      width: 0,
      height: 0
    }
  }

  componentDidMount() {
    this.ro = new ResizeObserver(([e]) => {
      this.handleResize(e.contentRect)
    })
    this.observe(this.container)
  }

  componentWillUnmount() {
    this.unobserve(this.container)
    this.ro.disconnect()
    this.ro = null
  }

  componentWillReceiveProps(props) {
    if (this.props.size !== props.size ||
      this.getIterables(props).length !== this.size) {
      this.update(props)
    }
  }

  observe(container) {
    if (container != null) {
      on(container, 'tab:focus', this.handleFocus)
      on(container, 'scroll', this.handleScroll, {
        capture: true, passive: true
      })

      this.ro.observe(container)
    }
  }

  unobserve(container) {
    if (container != null) {
      off(container, 'tab:focus', this.handleFocus)
      off(container, 'scroll', this.handleScroll, {
        capture: true, passive: true
      })

      if (this.ro != null) {
        this.ro.unobserve(container)
      }
    }
  }

  setContainer = (container) => {
    if (this.container != null) this.unobserve(this.container)
    this.container = container
    if (this.ro != null) this.observe(container)
  }

  update(props = this.props) {
    const cols = this.getColumns(props.size)
    const rowHeight = this.getRowHeight(props.size)
    const rows = this.getRows({ cols }, props)
    const viewportRows = this.getViewportRows(props.size)
    const height = rows * rowHeight
    const overscan = ceil(viewportRows * props.overscan)

    let maxOffset = height - (overscan * rowHeight)
    maxOffset = max(maxOffset - (maxOffset % rowHeight), 0)

    const offset = this.getOffset({
      overscan, maxOffset, rowHeight, viewportRows
    })

    this.setState({
      cols,
      height,
      maxOffset,
      overscan,
      offset,
      rowHeight,
      rows,
      viewportRows
    })
  }

  get bounds() {
    return {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    }
  }

  get isVertical() {
    return this.state.cols === 1
  }

  get isHorizontal() {
    return !this.isVertical
  }

  get isEmpty() {
    return this.size === 0
  }

  get isDisabled() {
    return this.props.isDisabled
  }

  get size() {
    return this.getIterables().length
  }

  get orientation() {
    return this.isVertical ? 'vertical' : 'horizontal'
  }

  get tabIndex() {
    return this.isEmpty ? null : TABS[this.constructor.name]
  }

  isLast(index) {
    return index === this.size - 1
  }

  isMapped(index) {
    if (this.mappedRange == null) return false
    if (this.mappedRange.from > index) return false
    if (this.mappedRange.to < index) return false
    return true
  }

  isIterableMapped({ id }) {
    const index = this.indexOf(id)
    return (index === -1) ? false : this.isMapped(index)
  }

  getAdjacent = (iterable) => {
    return adjacent(this.getIterables(), iterable)
  }

  getColumns(size = this.props.size) {
    return floor(this.viewport.width / this.getTileSize(size)) || 1
  }

  getIterables() {
    return EMPTY
  }

  getOffset({ overscan, maxOffset, rowHeight, viewportRows } = this.state) {
    if (this.container == null) return 0

    const top = this.container.scrollTop
    const offset = floor((overscan - viewportRows) / 2) * rowHeight

    return restrict(top - (top % rowHeight) - offset, 0, maxOffset)
  }


  getRows({ cols } = this.state, props = this.props) {
    return ceil(this.getIterables(props).length / cols)
  }

  getRowHeight(size = this.props.size) {
    return this.getTileSize(size)
  }

  getViewportRows(size = this.props.size) {
    return ceil(this.viewport.height / this.getRowHeight(size))
  }

  getTileSize(size = this.props.size) {
    return round(size * TILE.FACTOR)
  }

  getIterableRange() {
    const { cols, offset, overscan, rowHeight } = this.state

    const from = cols * floor(offset / rowHeight)
    const size = cols * overscan

    return {
      from, size, to: min(from + size, this.size)
    }
  }

  mapIterableRange(fn, range = this.getIterableRange()) {
    const items = this.getIterables()
    const { from, to } = range

    this.mappedRange = range

    return items.slice(from, to).map((item, index) => {
      return fn(this.getIterableProps(item, from + index))
    })
  }

  indexOf(id, props = this.props) {
    const items = this.getIterables(props)
    return (items.idx != null) ?
      items.idx[id] :
      items.findIndex(it => it.id === id)
  }

  next(offset = 1) {
    const items = this.getIterables()
    if (!items.length) return null

    const head = this.head()
    if (head == null) return items[0]

    const idx = this.indexOf(head) + offset
    return (idx >= 0 && idx < items.length) ? items[idx] : null
  }

  prev(offset = 1) {
    return this.next(-offset)
  }

  current() {
    return this.next(0)
  }

  head() {
    throw new Error('not implemented')
  }

  isSelected() {
    throw new Error('not implemented')
  }

  select() {
    throw new Error('not implemented')
  }

  range({ from = this.head(), to } = {}) {
    const items = this.getIterables()

    from = (from == null) ? 0 : this.indexOf(from)
    to = (to == null) ? this.size - 1 : this.indexOf(to)

    return (from > to) ?
      items.slice(to, from + 1).reverse() :
      items.slice(from, to + 1)
  }

  scroll(offset = 0) {
    this.container.scrollTop = offset
  }

  scrollBy(offset) {
    this.scroll(this.container.scrollTop + offset)
  }

  scrollPageUp() {
    this.scrollBy(-this.viewport.height)
  }

  scrollPageDown() {
    this.scrollBy(this.viewport.height)
  }

  scrollToEnd() {
    this.scroll(this.state.height - this.viewport.height)
  }

  scrollIntoView(item = this.current(), force = true) {
    const idx = this.indexOf(item.id)
    if (idx === -1) return

    const { cols, rowHeight } = this.state
    const { height } = this.viewport
    const top = this.container.scrollTop

    let offset = floor(idx / cols) * rowHeight
    const bottom = offset + rowHeight
    const isBelow = (bottom > top)

    if (!force && isBelow && bottom <= top + height) return

    if (isBelow) {
      offset += rowHeight - height
    }

    this.scroll(offset)
  }

  handleScroll = () => {
    if (!this.isScrollUpdateScheduled) {
      this.isScrollUpdateScheduled = true

      requestAnimationFrame(() => {
        this.setState({ offset: this.getOffset() })
        this.isScrollUpdateScheduled = false
      })
    }
  }

  handleResize = throttle((!win32 ?
    (rect) => this.resize(rect) :
    () => this.resize(this.bounds)
  ), 15)

  resize(viewport) {
    this.viewport = viewport
    this.update()
  }

  handleClickOutside = (event) => {
    if (has(event.target, 'click-catcher') &&
      typeof this.clearSelection === 'function') {
      this.clearSelection()
    }
  }

  handleFocus = () => {
    const item = this.current()
    if (item == null) return

    if (this.isSelected(item)) {
      this.scrollIntoView(item, false)
    } else {
      this.select(item, { scrollIntoView: true })
    }
  }

  static getPropKeys() {
    return Object.keys(this.propTypes || this.DecoratedComponent.propTypes)
  }

  static propTypes = {
    isDisabled: bool,
    overscan: number.isRequired,
    size: number.isRequired
  }

  static defaultProps = {
    overscan: 2
  }
}

module.exports = {
  Iterator
}
