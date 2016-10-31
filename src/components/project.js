'use strict'

const React = require('react')
const { PropTypes } = React
const { connect } = require('react-redux')
const { noop } = require('../common/util')

const sidebarWidth = { width: '250px' }
const panelWidth = { width: '320px' }

const Project = ({ }) => (
  <div id="project">
    <div id="project-view">
      <div className="resizable">
        <div id="sidebar">
          <div className="sidebar-body"></div>
        </div>
      </div>
    </div>
    <div id="item"></div>
  </div>
)

module.exports = { Project }
