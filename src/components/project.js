'use strict'

const React = require('react')

const sidebarWidth = { width: '250px' }

const Project = () => (
  <div id="project">
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

module.exports = { Project }
