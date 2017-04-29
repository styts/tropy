'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { bool, string } = require('prop-types')
const { TitleBar } = require('../titlebar')
const { TemplateEditor } = require('../template/editor')
const { PrefPane, PrefPaneToggle } = require('./pane')


class PrefsContainer extends PureComponent {
  isActive(pane) {
    return this.props.pane === pane
  }

  renderTitleBar() {
    return (!this.props.isFrameless) ? null : (
      <TitleBar title="preferences.title"/>
    )
  }

  toggle = () => {
  }

  render() {
    return (
      <div className="preferences">
        {this.renderTitleBar()}
        <nav>
          <PrefPaneToggle
            name="app"
            isActive={this.isActive('app')}
            isDisabled
            onClick={this.toggle}/>
          <PrefPaneToggle
            name="project"
            isActive={this.isActive('project')}
            isDisabled
            onClick={this.toggle}/>
          <PrefPaneToggle
            name="template"
            isActive={this.isActive('template')}
            onClick={this.toggle}/>
          <PrefPaneToggle
            name="vocab"
            isActive={this.isActive('vocab')}
            isDisabled
            onClick={this.toggle}/>
        </nav>

        <PrefPane
          name="app"
          isActive={this.isActive('app')}/>

        <PrefPane
          name="project"
          isActive={this.isActive('project')}/>

        <PrefPane
          name="template"
          isActive={this.isActive('template')}>
          <TemplateEditor/>
        </PrefPane>

        <PrefPane
          name="vocab"
          isActive={this.isActive('vocab')}/>
      </div>
    )
  }

  static propTypes = {
    isFrameless: bool,
    pane: string.isRequired
  }

  static defaultProps = {
    pane: 'templates',
    isFrameless: ARGS.frameless
  }
}

module.exports = {
  PrefsContainer: connect(
    state => ({
      project: state.project,
      keymap: state.keymap,
      properties: state.properties,
      templates: state.templates
    })
  )(PrefsContainer)
}
