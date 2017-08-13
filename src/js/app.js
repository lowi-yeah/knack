// JS Goes here - ES6 supported

import jQuery from 'jquery'
import Detector from './lib/detector'
import knack    from './knack'

global.jQuery = jQuery

document.addEventListener('DOMContentLoaded', event => { 
  console.log('hello')

  if( !Detector.webgl ) Detector.addGetWebGLMessage()
  else knack('three') })