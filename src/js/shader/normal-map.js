import {Vector2} from 'three'

export default {

  uniforms: {
    'tDiffuse':   { value: null, type: 't' },
    'resolution': { value: new Vector2( 512, 512 ) },
    'height':     { value: 0.05 }
  },

  vertexShader: [
    'varying vec2 vUv;',
    'void main() {',
      'vUv = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}'
      ].join( "\n" ),

  fragmentShader: [
    'uniform float height;',
    'uniform vec2 resolution;',
    'uniform sampler2D tDiffuse;',
    'varying vec2 vUv;',
    'void main() {',
      'float val = texture2D( tDiffuse, vUv ).x;',
      'float valU = texture2D( tDiffuse, vUv + vec2( 1.0 / resolution.x, 0.0 ) ).x;',
      'float valV = texture2D( tDiffuse, vUv + vec2( 0.0, 1.0 / resolution.y ) ).x;',
      'gl_FragColor = vec4( ( 0.5 * normalize( vec3( val - valU, val - valV, height  ) ) + 0.5 ), 1.0 );}'
    ].join( "\n" )
}

