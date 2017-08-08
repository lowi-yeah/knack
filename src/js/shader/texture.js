import {Vector2} from 'three'

export default {

  uniforms: { 'tDiffuse':   { value: null, type: 't' } },

  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
      'vUv = vec2( uv.x, 1.0 - uv.y );',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}' 
      ].join('\n'),
  
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'varying vec2 vUv;',
    'void main() {',
      'vec4 texel = texture2D( tDiffuse, vUv );',
      'gl_FragColor = texel;}'].join('\n') }

