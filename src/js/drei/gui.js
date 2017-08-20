import { Vector3 } from 'three'

let DEFAULT = 0,
    MIN     = 1,
    MAX     = 2,
    STEP    = 3

function _data(items) {
  return _.reduce(items, (r, v, k) => {
    r[k] = v[DEFAULT]
    return r }, {})}

let makeGui = function(config, useGui) {
    let dataObjects = {},
        gui

    if(useGui) gui = new dat.GUI()

    _.each(config, (conf, section) => {
      let data = _data(conf.items)
      dataObjects[section] = data

      if(useGui) {
        let folder = gui.addFolder(section)
        _.each(conf.items, (value, key) => {
          // if the last entry of the item value array is false, 
          // the item won't get rendered
          let last = _.last(value)
          if(!_.isNumber(last) && !last) return
  
          let controller = folder.add(data, key).listen()
          if(_.isNumber(value[MIN]))  controller = controller.min(value[MIN])
          if(_.isNumber(value[MAX]))  controller = controller.max(value[MAX])
          if(_.isNumber(value[STEP])) controller = controller.step(value[STEP])
          controller.onChange( conf.onChange) })
        if(conf.open) folder.open() }})
    return dataObjects }

export default makeGui