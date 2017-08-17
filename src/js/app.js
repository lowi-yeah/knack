// JS Goes here - ES6 supported

import $              from 'jquery'
import TWEEN          from '@tweenjs/tween.js'
import {scaleLinear}  from 'd3-scale'
import Detector       from './lib/detector'
import knack          from './knack'
import Ps             from 'perfect-scrollbar'
global.jQuery = $


let canvasWidth = (3 * window.innerWidth)

function _initPerfectScrollbar() {
  
  return new Promise((resolve, _reject) => {
    let scroll  = $('#scroll'),
        content = $('#scroll-content'),
        options = { wheelSpeed: 2,
                    wheelPropagation: true,
                    minScrollbarLength: 20 }

    content.css('height', window.innerHeight + 'px')
    content.css('width', canvasWidth + 'px')
  
    Ps.initialize(scroll[0], options)
    resolve()
  })
}

document.addEventListener('DOMContentLoaded', event => { 
  console.log('hellö')
  let inclinationConfig = { min:      0.2, 
                            default:  0.50,
                            max:      0.515 }

  // start the TWEEN engine
  requestAnimationFrame(animate)

  if( !Detector.webgl ) Detector.addGetWebGLMessage()
  else {

    _initPerfectScrollbar()
      .then(() => { 
        if( $('#three').length )
          knack('three') 
              .then((updateSky) => {
                return new Promise((resove, _reject) => {
                  // show the three scene
                  $('#three').css('opacity', 1)
                  let inclination       = { value: inclinationConfig.max },
                      tween             = new TWEEN.Tween(inclination)
                                          .to({ value: inclinationConfig.default }, 2000)
                                          .easing(TWEEN.Easing.Exponential.In)
                                          .onUpdate(() => { updateSky({inclination: inclination.value})})
                                          .onComplete(() => {resove(updateSky)})
                                          .start()})})
              .then((updateSky) => {
        
                let sunScale  = scaleLinear()
                                  .domain([0, window.innerHeight])
                                  .range([inclinationConfig.default, inclinationConfig.min])
                                  .clamp(true),
                    topScale  = scaleLinear()
                                  .domain([0, window.innerHeight])
                                  .range([0, 1])
                                  .clamp(true),
                    leftScale = scaleLinear()
                                  .domain([0, canvasWidth])
                                  .range([0, 1])
                                  .clamp(true)
        
                // $(window).on('scroll', (e) => {
                //   let top = $(window).scrollTop()
                //   updateSky({ inclination: sunScale(top),
                //               top: topScale(top)})
                // })
        
              document.addEventListener('ps-scroll-x', function (ev) { 
                let left = parseInt($('.ps__scrollbar-x-rail').css('left').replace(/px/, ''))
                updateSky({ left: leftScale(left) })
              })
              document.addEventListener('ps-scroll-y', function (ev) { 
                let top = parseInt($('.ps__scrollbar-y-rail').css('top').replace(/px/, ''))
                updateSky({ top: topScale(top) })
              })
        
                
                // adjust the sun scale upon window resize
                $(window).on('resize', () => { sunScale.range([0, window.innerHeight])})
              })

})
    }})

// Setup the animation loop for the TWEEN engine.
function animate(time) {
    requestAnimationFrame(animate)
    TWEEN.update(time) }
