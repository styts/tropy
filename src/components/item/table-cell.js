'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { CoverImage } = require('./cover-image')
const { Editable } = require('../editable')
const { createClickHandler } = require('../util')
const { meta } = require('../../common/os')
const cn = require('classnames')
const { bool, shape, string, number, object, arrayOf, func } = PropTypes


class ItemTableCell extends PureComponent {

  get value() {
    const { data, property } = this.props

    return data[property.uri] ?
      data[property.uri].text : null
  }

  get type() {
    const { data, property } = this.props

    return data[property.uri] ?
      data[property.uri].type : (property.type || 'text')
  }


  handleChange = (text) => {
    this.props.onChange({
      id: this.props.item.id,
      data: {
        [this.props.property.uri]: { text, type: this.type }
      }
    })
  }

  // Subtle: We want to enable click-to-edit for selected cells only;
  // since selection happens during mouse down and click-to-edit on
  // click, we record the current selection state on mouse down --
  // selections happens as the event bubbles therefore allowing us to
  // detect a click event that was associated to the item's selection.
  handleMouseDown = () => {
    this.wasSelected = this.props.isSelected
  }

  handleClick = createClickHandler({
    onClick: (event) => {
      return !this.props.isSelected || meta(event) || !this.wasSelected
    },

    onSingleClick: () => {
      if (!this.props.isEditing) {
        this.props.onEdit({
          column: { [this.props.item.id]: this.props.property.uri }
        })
      }
    }
  })

  render() {
    const {
      item,
      cache,
      photos,
      size,
      width,
      isEditing,
      isDisabled,
      hasCoverImage,
      onCancel
    } = this.props

    return (
      <td
        className={cn({ metadata: true, [this.type]: true })}
        style={{ width }}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}>

        {hasCoverImage &&
          <CoverImage
            item={item}
            cache={cache}
            photos={photos}
            size={size}/>}

        <Editable
          value={this.value}
          isEditing={isEditing}
          isDisabled={isDisabled}
          onCancel={onCancel}
          onChange={this.handleChange}/>
      </td>
    )
  }

  static propTypes = {
    isEditing: bool,
    isDisabled: bool,
    isSelected: bool,

    hasCoverImage: bool,

    property: shape({
      uri: string.isRequired,
      type: string,
    }),

    item: shape({
      id: number.isRequired,
      cover: number,
      photos: arrayOf(number)
    }).isRequired,

    data: object.isRequired,
    photos: object.isRequired,

    cache: string.isRequired,
    width: string.isRequired,
    size: number.isRequired,

    onCancel: func.isRequired,
    onChange: func.isRequired,
    onEdit: func.isRequired
  }

  static defaultProps = {
    data: {},
    size: 48
  }
}


module.exports = {
  ItemTableCell
}
