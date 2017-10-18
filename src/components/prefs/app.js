'use strict'

const React = require('react')
const { PureComponent } = React
const { array, arrayOf, bool, func, shape, string } = require('prop-types')
const { TemplateSelect } = require('../template/select')
const { ipcRenderer: ipc } = require('electron')

const {
  FormElement,
  FormSelect,
  FormToggle,
  FormToggleGroup,
  Toggle
} = require('../form')


class AppPrefs extends PureComponent {
  handleDebugChange() {
    ipc.send('cmd', 'app:toggle-debug-flag')
  }

  handleThemeChange = ({ theme }) => {
    ipc.send('cmd', 'app:switch-theme', theme, theme)
  }

  handleTemplateChange = (template) => {
    this.props.onSettingsUpdate({ template: template.id })
  }

  render() {
    return (
      <div className="scroll-container">
        <div className="form-horizontal">
          <FormElement id="prefs.app.template">
            <TemplateSelect
              templates={this.props.templates}
              selected={this.props.settings.template}
              onChange={this.handleTemplateChange}/>
          </FormElement>
          <hr/>
          <FormToggleGroup
            id="prefs.app.dup"
            name="dup"
            value={this.props.settings.dup}
            options={this.props.dupOptions}
            onChange={this.props.onSettingsUpdate}/>
          <hr/>
          <FormSelect
            id="prefs.app.style.theme"
            name="theme"
            isRequired
            value={this.props.settings.theme}
            options={this.props.themes}
            onChange={this.handleThemeChange}/>
          <hr/>
          <FormElement id="prefs.app.ui.label">
            <Toggle
              id="prefs.app.ui.option.invertScroll"
              name="invertScroll"
              value={this.props.settings.invertScroll}
              onChange={this.props.onSettingsUpdate}/>
            <Toggle
              id="prefs.app.ui.option.invertZoom"
              name="invertZoom"
              value={this.props.settings.invertZoom}
              onChange={this.props.onSettingsUpdate}/>
            <Toggle
              id="prefs.app.ui.option.overlayToolbars"
              name="overlayToolbars"
              value={this.props.settings.overlayToolbars}
              onChange={this.props.onSettingsUpdate}/>
          </FormElement>
          <hr/>
          <FormToggle
            id="prefs.app.debug"
            name="debug"
            isDisabled={ARGS.dev}
            value={this.props.settings.debug || ARGS.dev}
            onChange={this.handleDebugChange}/>
        </div>
      </div>
    )
  }

  static propTypes = {
    templates: array.isRequired,
    settings: shape({
      debug: bool.isRequired,
      theme: string.isRequired,
    }).isRequired,
    themes: arrayOf(string).isRequired,
    dupOptions: arrayOf(string).isRequired,
    onSettingsUpdate: func.isRequired
  }

  static defaultProps = {
    themes: ['light', 'dark'],
    dupOptions: ['skip', 'import', 'prompt']
  }
}


module.exports = {
  AppPrefs
}
