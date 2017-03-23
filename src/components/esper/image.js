'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Toolbar } = require('../toolbar')
const { EsperStage } = require('./stage')


class EsperImage extends PureComponent {

  get src() {
    const { photo } = this.props
    return photo && `${photo.protocol}://${photo.path}`
  }

  render() {
    return (
      <section className="esper">
        <header className="esper-header">
          <Toolbar draggable={ARGS.frameless}/>
        </header>

        <EsperStage
          isDisabled={!this.props.isVisible}
          image={this.src}/>
      </section>
    )
  }

  static propTypes = {
    photo: PropTypes.object,
    isVisible: PropTypes.bool
  }

  static defaultProps = {
    isVisible: false
  }
}

module.exports = {
  EsperImage
}
