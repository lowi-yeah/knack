// JS Goes here - ES6 supported

import $              from 'jquery'
import TWEEN          from '@tweenjs/tween.js'
import {scaleLinear, scalePow}  from 'd3-scale'
import Detector       from './lib/detector'
import knack          from './knack'
import Ps             from 'perfect-scrollbar'
import menu           from './menu'
global.jQuery = $


let canvasWidth = (1 * window.innerWidth)

/* We're using Promises all over the place, although it isn't really necessary.
The reasoning behind it is, that promises are an excellent way to structure code.
the wee performance loss is neglected. */

function _initTarpaulin() {
  return new Promise((resolve, reject) => {
    console.log('initializing tarpaulin')
    let scroll  = $('#scroll'),
        content = $('#scroll-content'),
        options = { wheelSpeed: 2,
                    wheelPropagation: true,
                    minScrollbarLength: 20 }
    if( $('#scroll').length ) {
      content.css('height', window.innerHeight + 'px')
      content.css('width', canvasWidth + 'px')
      Ps.initialize(scroll[0], options)
      resolve() }
    else resolve() })}

function _initMenu() {
  return new Promise((resolve, reject) => {
    console.log('initializing menu')
    if( $('#sidebar').length ) {
      menu.init('#sidebar')
      resolve() }
    /* else reject() */
    // resolve anyways…
    else resolve() })}

function _loadThreeConfig() {
  return new Promise((resolve, _reject) => {
    console.log('loading three config')
    resolve(JSON.parse($('#three-config').html()))})}

function _initThree() {
  return new Promise((resolve, reject) => {
    console.log('initializing 3')

    // check that the browser is capable of handling WebGL
    if( !Detector.webgl ) {
      Detector.addGetWebGLMessage()
      console.log('no gl?')
      reject() }
    
    else {
      _loadThreeConfig()
        .then((config) => {
          console.log('three config', config)
          return knack('three', config) })

        /* this is the intro, where the scene fades in an the sun rises from black to a red dusk */
        // .then((updateFn) => {
        //   return new Promise((resove, _reject) => {
        //     // show the three scene
        //     $('#three').css('opacity', 1)
        //     let inclination       = { value: inclinationConfig.max },
        //         tween             = new TWEEN.Tween(inclination)
        //                             .to({ value: inclinationConfig.default }, 2000)
        //                             .easing(TWEEN.Easing.Exponential.In)
        //                             .onUpdate(() => { updateFn({inclination: inclination.value})})
        //                             .onComplete(() => {resove(updateFn)})
        //                             .start()})})

        .then((updateFn) => {
          let topScale  = scalePow()
                            .exponent(4)
                            .domain([0, window.innerHeight])
                            .range([0, 1])
                            .clamp(true),
              leftScale = scalePow()
                            .domain([0, canvasWidth])
                            .range([0, 1])
                            .clamp(true)
        
          document.addEventListener('ps-scroll-x', function (ev) { 
            _.defer(() => {
              let left = parseInt($('.ps__scrollbar-x-rail').css('left').replace(/px/, ''))
              updateFn({ left: leftScale(left) })})})

          document.addEventListener('ps-scroll-y', function (ev) { 
            _.defer(() => {
              let top = parseInt($('.ps__scrollbar-y-rail').css('top').replace(/px/, ''))
              updateFn({ top: topScale(top) })})})
        })}})}

document.addEventListener('DOMContentLoaded', event => { 
  console.log('hellö')
  _initMenu()
    .then(ω => { return _initTarpaulin() })
    .then(ω => { return _initThree() })
    .then(() => { console.log('ready…') })
  })

// Setup the animation loop for the TWEEN engine.
function animate(time) {
    requestAnimationFrame(animate)
    // TWEEN.update(time) 
  }
