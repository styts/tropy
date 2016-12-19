'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { Tab, Tabs } = require('../tabs')
const { Note, NoteToolbar, NoteList } = require('../note')
const { PanelGroup, Panel } = require('../panel')
const { Resizable } = require('../resizable')
const { PhotoToolbar, PhotoList, PhotoGrid } = require('../photo')
const { IconMetadata, IconTag, IconChevronLeft } = require('../icons')
const { IconButton } = require('../button')
const { Image } = require('../image')
const { Fields } = require('../metadata')
const { getSelectedItems } = require('../../selectors/items')
const { getSelectedPhoto } = require('../../selectors/photos')
const { PROJECT } = require('../../constants')
const { seq, mapcat } = require('transducers.js')
const act = require('../../actions')


class Item extends Component {

  get item() {
    const { items } = this.props
    return items.length === 1 ? items[0] : null
  }

  get isDisabled() {
    const { item } = this
    return !(item && !item.deleted)
  }

  get isItemMode() {
    return this.props.mode === PROJECT.MODE.ITEM
  }

  handleMetadataTabSelect = () => {
    if (this.props.panel.tab !== 'metadata') {
      this.props.onTabSelect('metadata')
    }
  }

  handleTagsTabSelect = () => {
    if (this.props.panel.tab !== 'tags') {
      this.props.onTabSelect('tags')
    }
  }

  handlePhotoCreate = (event) => {
    const { onPhotoCreate } = this.props
    const { item } = this

    event.stopPropagation()
    onPhotoCreate({ item: item.id })
  }

  handleNoteCreate = (event) => {
    event.stopPropagation()
  }


  renderItemTabs() {
    const { panel, selection } = this.props

    return (
      <Tabs justified>
        <Tab
          active={panel.tab === 'metadata'}
          disabled={!selection.length}
          onActivate={this.handleMetadataTabSelect}>
          <IconMetadata/>
          <FormattedMessage id="panel.metadata.tab"/>
        </Tab>
        <Tab
          active={panel.tab === 'tags'}
          disabled={!selection.length}
          onActivate={this.handleTagsTabSelect}>
          <IconTag/>
          <FormattedMessage id="panel.tags"/>
        </Tab>
      </Tabs>
    )
  }

  renderItemPanel() {
    const { selection, panel } = this.props

    switch (selection.length) {
      case 0:
        return <span>No items selected</span>

      case 1:
        switch (panel.tab) {
          case 'metadata':
            return this.renderMetadataPanel()
          case 'tags':
            return this.renderTagsPanel()
          default:
            return null
        }

      default:
        return <span>{selection.length} items selected</span>
    }
  }

  renderMetadataPanel() {
    const { photo } = this.props
    const { item, isDisabled } = this

    return (
      <div>
        {photo &&
          <section>
            <h5 className="metadata-heading">
              <FormattedMessage id="panel.metadata.photo"/>
            </h5>
            <Fields
              id={photo.id}
              disabled={isDisabled}
              template="photo"/>
          </section>}
        {item &&
          <section>
            <h5 className="metadata-heading">
              <FormattedMessage id="panel.metadata.item"/>
            </h5>
            <Fields
              id={item.id}
              disabled={isDisabled}
              template="core"/>
          </section>}
      </div>
    )
  }

  renderTagsPanel() {
    const { item } = this

    return (
      <ul>
        {item && item.tags.map(tag => <li key={tag}>{tag}</li>)}
      </ul>
    )
  }

  renderPhotoToolbar() {
    const { panel, onPhotoZoomChange } = this.props

    return (
      <PhotoToolbar
        zoom={panel.photoZoom}
        onZoomChange={onPhotoZoomChange}
        hasCreateButton={!this.isDisabled}
        onCreate={this.handlePhotoCreate}/>
    )
  }

  renderPhotoPanel() {
    const { items, photo, panel } = this.props
    const photos = seq(items, mapcat(i => i && i.photos || []))

    if (panel.photoZoom) {
      return (
        <PhotoGrid
          photos={photos}
          selected={photo && photo.id}
          isDisabled={this.isDisabled}/>
      )
    }

    return (
      <PhotoList
        photos={photos}
        selected={photo && photo.id}
        isDisabled={this.isDisabled}/>
    )
  }

  renderNoteToolbar() {
    return (
      <NoteToolbar
        hasCreateButton={false}
        onCreate={this.handleNoteCreate}/>
    )
  }

  renderNotePanel() {
    const { note } = this.props
    const { item } = this

    return item && (
      <NoteList
        notes={item.notes || []}
        selected={note}
        isDisabled={this.isDisabled}/>
    )
  }

  renderToolbar() {
    const { onModeChange } = this.props

    return (
      <Toolbar draggable={ARGS.frameless}>
        <div className="toolbar-left">
          <ToolGroup>
            <IconButton icon={<IconChevronLeft/>} onClick={onModeChange}/>
          </ToolGroup>
        </div>
      </Toolbar>
    )
  }

  render() {
    const { photo } = this.props

    return (
      <section id="item">
        <Resizable edge={'left'} value={320}>
          <PanelGroup header={this.renderToolbar()} height={[50, 30, 20]}>
            <Panel header={this.renderItemTabs()}>
              {this.renderItemPanel()}
            </Panel>

            <Panel header={this.renderPhotoToolbar()}>
              {this.renderPhotoPanel()}
            </Panel>

            <Panel header={this.renderNoteToolbar()}>
              {this.renderNotePanel()}
            </Panel>
          </PanelGroup>
        </Resizable>

        <div className="item-container">
          <Image isVisible={this.isItemMode} photo={photo}/>
          <Note/>
        </div>
      </section>
    )
  }

  static propTypes = {
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        tags: PropTypes.arrayOf(PropTypes.number).isRequired,
        deleted: PropTypes.bool
      })
    ),

    photo: PropTypes.shape({
      id: PropTypes.number.isRequired
    }),

    panel: PropTypes.shape({
      tab: PropTypes.oneOf(['metadata', 'tags']).isRequired,
      photoZoom: PropTypes.number.isRequired
    }).isRequired,

    mode: PropTypes.string,
    note: PropTypes.number,
    selection: PropTypes.arrayOf(PropTypes.number),

    onModeChange: PropTypes.func,
    onTabSelect: PropTypes.func,
    onPhotoCreate: PropTypes.func,
    onPhotoZoomChange: PropTypes.func
  }
}


module.exports = {
  Item: connect(
    (state) => ({
      items: getSelectedItems(state),
      photo: getSelectedPhoto(state),
      note: state.nav.note,
      selection: state.nav.items,
      panel: state.nav.panel
    }),

    (dispatch) => ({
      onTabSelect(tab) {
        dispatch(act.nav.panel.update({ tab }))
      },

      onPhotoCreate(...args) {
        dispatch(act.photo.create(...args))
      },

      onPhotoZoomChange(photoZoom) {
        dispatch(act.nav.panel.update({ photoZoom }))
      }
    })
  )(Item)
}
