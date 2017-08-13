// JS Goes here - ES6 supported

import $              from 'jquery'
import TWEEN          from '@tweenjs/tween.js'
import {scaleLinear}  from 'd3-scale'
import Detector       from './lib/detector'
import knack          from './knack'
global.jQuery = $

document.addEventListener('DOMContentLoaded', event => { 
  console.log('hellö')

  let inclinationConfig = { min:      0.2, 
                            default:  0.50,
                            max:      0.515 }

  // start the TWEEN engine
  requestAnimationFrame(animate)

  if( !Detector.webgl ) Detector.addGetWebGLMessage()
  else {
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

        let sunScale = scaleLinear()
                        .domain([0, window.innerHeight])
                        .range([inclinationConfig.default, inclinationConfig.min])
                        .clamp(true),
            textScale = scaleLinear()
                        .domain([0, window.innerHeight])
                        .range([0, 1])
                        .clamp(true)

        $(window).on('scroll', (e) => {
          let top = $(window).scrollTop()
          updateSky({ inclination: sunScale(top),
                      zText: textScale(top)})
        })
        
        // adjust the sun scale upon window resize
        $(window).on('resize', () => { sunScale.range([0, window.innerHeight])})
      })


    }})

// Setup the animation loop for the TWEEN engine.
function animate(time) {
    requestAnimationFrame(animate)
    TWEEN.update(time) }
