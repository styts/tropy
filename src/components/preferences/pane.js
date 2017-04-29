'use strict'

const React = require('react')
const { PureComponent, createElement: create } = React
const { FormattedMessage } = require('react-intl')
const icons = require('../icons')
const cx = require('classnames')
const { bool, element, func, object, string } = require('prop-types')

class PrefPaneToggle extends PureComponent {
  get classes() {
    return {
      'pane-toggle': true,
      'active': this.props.isActive,
      [this.props.name]: true
    }
  }

  get label() {
    return `preferences.${this.props.name}.label`
  }

  handleClick() {
    this.props.onClick(this.props.name)
  }

  render() {
    return (
      <button
        className={cx(this.classes)}
        disabled={this.props.isDisabled}
        onClick={this.handleClick}>
        {create(icons[this.props.icon])}
        <FormattedMessage id={this.label}/>
      </button>
    )
  }

  static propTypes = {
    classes: object,
    icon: string.isRequired,
    isActive: bool,
    isDisabled: bool,
    name: string.isRequired,
    onClick: func.isRequired
  }

  static defaultProps = {
    icon: 'IconMaze'
  }
}

class PrefPane extends PureComponent {
  get classes() {
    return {
      pane: true,
      active: this.props.isActive,
      [this.props.name]: true
    }
  }

  render() {
    return (
      <div className={cx(this.classes)}>
        {this.props.isActive && this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: element,
    classes: object,
    isActive: bool,
    name: string.isRequired
  }
}

module.exports = {
  PrefPane,
  PrefPaneToggle
}
