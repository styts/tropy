'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, number, oneOf, oneOfType, string } = require('prop-types')
const { noop } = require('../common/util')
const { AutoResizer } = require('./auto-resizer')


class BufferedInput extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      value: props.value
    }
  }

  componentWillReceiveProps({ value }) {
    this.hasBeenCommitted = false
    this.hasBeenCancelled = false
    this.setState({ value })
  }

  componentWillUnmount() {
    this.clearResetTimeout()
  }

  get isBlank() {
    return this.state.value == null || this.state.value === ''
  }

  get isValid() {
    return !this.props.isRequired || !this.isBlank
  }

  get hasChanged() {
    return this.state.value !== this.props.value
  }

  setInput = (input) => {
    if (input && this.props.autofocus) {
      input.focus()
      input.select()
    }

    this.input = input
  }

  focus = () => {
    if (this.input) this.input.focus()
  }

  reset = () => {
    this.hasBeenCommitted = false
    this.hasBeenCancelled = false
    this.setState({ value: this.props.value })
    this.clearResetTimeout()
  }

  commit(force) {
    if (force || this.isValid) {
      if (!this.hasBeenCommitted) {
        this.hasBeenCommitted = true
        this.props.onCommit(this.state.value, this.hasChanged, force)

        if (this.hasChanged && this.props.delay > 0) {
          this.clearResetTimeout()
          this.tm = setTimeout(this.reset, this.props.delay)
        }
      }

    } else {
      this.cancel()
    }
  }

  cancel(force) {
    this.reset()
    this.hasBeenCancelled = true
    this.props.onCancel(false, force)
  }

  clearResetTimeout() {
    if (this.tm != null) {
      clearTimeout(this.tm)
      this.tm = null
    }
  }

  handleChange = (event) => {
    this.setState({ value: event.target.value })
    this.props.onChange(event.target.value)
  }

  handleBlur = (event) => {
    const cancel = this.props.onBlur(event)
    if (this.hasBeenCancelled || this.hasBeenCommitted) return

    if (cancel) {
      this.cancel()
    } else {
      this.commit()
    }
  }

  handleFocus = (event) => {
    this.hasBeenCancelled = false
    this.hasBeenCommitted = false
    this.props.onFocus(event)
  }

  handleKeyDown = (event) => {
    if (this.props.onKeyDown != null) {
      const { value } = this.state
      const { hasChanged } = this

      if (this.props.onKeyDown(event, value, hasChanged)) {
        return
      }
    }

    switch (event.key) {
      case 'Escape':
        this.cancel(true)
        break
      case 'Enter':
        this.commit(true)
        break
    }

    event.stopPropagation()
  }


  render() {
    const input = (
      <input
        id={this.props.id}
        className={this.props.className}
        disabled={this.props.isDisabled}
        placeholder={this.props.placeholder}
        ref={this.setInput}
        readOnly={this.props.isReadOnly}
        required={this.props.isRequired}
        tabIndex={this.props.tabIndex}
        type={this.props.type}
        value={this.state.value}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}/>
    )

    return (this.props.resize) ?
      <AutoResizer content={this.state.value}>{input}</AutoResizer> :
      input
  }

  static propTypes = {
    autofocus: bool,
    className: string,
    delay: number.isRequired,
    id: string,
    isDisabled: bool,
    isReadOnly: bool,
    isRequired: bool,
    placeholder: string,
    resize: bool,
    tabIndex: number,
    type: oneOf(['text', 'number']).isRequired,
    value: oneOfType([string, number]).isRequired,
    onBlur: func.isRequired,
    onCancel: func.isRequired,
    onChange: func.isRequired,
    onCommit: func.isRequired,
    onFocus: func.isRequired,
    onKeyDown: func,
  }

  static defaultProps = {
    delay: 100,
    tabIndex: -1,
    type: 'text',
    onBlur: noop,
    onCancel: noop,
    onChange: noop,
    onCommit: noop,
    onFocus: noop
  }
}

module.exports = {
  BufferedInput
}
