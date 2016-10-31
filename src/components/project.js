'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { noop } = require('../common/util')
const { context } = require('../actions/ui')


const sidebarWidth = { width: '250px' }

const Project = ({ showContextMenu }) => (
  <div id="project" onContextMenu={showContextMenu}>
    <div id="project-view">
      <div style={sidebarWidth}>
        <div id="sidebar">
          <div className="sidebar-body"/>
        </div>
      </div>
    </div>
    <div id="item"/>
  </div>
)


Project.propTypes = {
  showContextMenu: PropTypes.func
}

Project.defaultProps = {
  showContextMenu: noop
}

module.exports = {
  Project: connect(
    null,
    dispatch => ({
      showContextMenu(event) {
        dispatch(context.show(event))
      }
    })
  )(Project)
}
