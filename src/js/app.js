// JS Goes here - ES6 supported

// import jQuery from 'jquery'
import Detector from './lib/detector'
import knack    from './knack'

// assets is a collection of all external assets used throughout the site
// it exists because webpack (the bundler used for gathering and packaging all web files)
// needs static assest referenced somewhere (to include them in the build) and I haven't
// found a better way yo make those references
// import assets from './assets'

// global.jQuery = jQuery

document.addEventListener('DOMContentLoaded', event => { 
  console.log('hello')

  if( !Detector.webgl ) Detector.addGetWebGLMessage()
  else knack('three') })