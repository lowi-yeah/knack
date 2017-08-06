import {MeshBasicMaterial,
        MeshLambertMaterial,
        MeshStandardMaterial, 
        MeshToonMaterial,
        ShaderMaterial,
        UniformsUtils,
        Vector2 }           from 'three'
import terrainShader        from '../shader/simple-terrain'
import normalShader         from '../shader/normal-map'
import noiseShader          from '../shader/noise'
import displacementShader   from '../shader/displacement'
import ShaderExtras         from '../lib/shader-extras'

let normalmapΣ = ShaderExtras.normalmap,
    screenΣ    = ShaderExtras.screen,
    basicΣ     = ShaderExtras.basic

function _terrain(shader) {
  let vertexShader    = document.getElementById( 'vertexshader' ).textContent,
      fragmentShader  = document.getElementById( 'fragmentshader-noise' ).textContent,
      uniforms        = UniformsUtils.clone( terrainShader.uniforms )
  return {vertexShader, fragmentShader, uniforms}}

function _displacement(maps, textures) {
  let vertexShader    = displacementShader.vertexShader,
      fragmentShader  = displacementShader.fragmentShader,
      uniforms        = UniformsUtils.clone(displacementShader.uniforms)

      // uniforms[ 'tNormal' ].value             = maps.normal.texture
      // uniforms[ 'uNormalScale' ].value        = 3.5
      // uniforms[ 'tDisplacement' ].value       = maps.height.texture
      // uniforms[ 'tDiffuse1' ].value           = textures.diffuse1
      // uniforms[ 'tDiffuse2' ].value           = textures.diffuse2
      // uniforms[ 'tSpecular' ].value           = maps.specular.texture
      // uniforms[ 'tDetail' ].value             = textures.detail
      // uniforms[ 'enableDiffuse1' ].value      = true
      // uniforms[ 'enableDiffuse2' ].value      = true
      // uniforms[ 'enableSpecular' ].value      = true
      // uniforms[ 'diffuse' ].value.setHex( 0xffffff )
      // uniforms[ 'specular' ].value.setHex( 0xffffff )
      // uniforms[ 'shininess' ].value           = 30
      // uniforms[ 'uDisplacementScale' ].value  = 375
      // uniforms[ 'uRepeatOverlay' ].value.set( 6, 6 )

  return new ShaderMaterial({ uniforms:       uniforms,
                              vertexShader:   vertexShader,
                              fragmentShader: fragmentShader,
                              lights:         false,
                              fog:            false })}

function _normal(maps) {
  let vertexShader    = normalmapΣ.vertexShader,
      fragmentShader  = normalmapΣ.fragmentShader,
      uniforms        = UniformsUtils.clone(normalmapΣ.uniforms)

      uniforms.height.value     = 0.05
      uniforms.heightMap.value  = maps.height.texture
      uniforms.resolution.value.set( 512, 512 )

  return new ShaderMaterial({ uniforms:       uniforms,
                              vertexShader:   vertexShader,
                              fragmentShader: fragmentShader,
                              lights:         false,
                              fog:            false })}

function _noise(textures) {
  let vertexShader    = screenΣ.vertexShader,
      fragmentShader  = screenΣ.fragmentShader,
      uniforms        = UniformsUtils.clone(screenΣ.uniforms)

      uniforms.tDiffuse = textures.noise
      uniforms.opacity  = 1

    return new ShaderMaterial({ uniforms:       uniforms,
                                vertexShader:   vertexShader,
                                fragmentShader: fragmentShader,
                                lights:         false,
                                fog:            false })}

function _noiseheight() {
  let vertexShader    = document.getElementById( 'vertexshader' ).textContent,
      fragmentShader  = document.getElementById( 'fragmentshader-noise' ).textContent,
      uniforms        = { time:   { value: 1.0 },
                          scale:  { value: new Vector2( 1.5, 1.5 ) },
                          offset: { value: new Vector2( 0, 0 ) }}
  
  uniforms.time.value = _.random(100000) // random seed

  return new ShaderMaterial({ uniforms:       uniforms,
                              vertexShader:   vertexShader,
                              fragmentShader: fragmentShader,
                              lights:         false,
                              fog:            false})}

function _imageHeight(maps, textures) {
  return new MeshBasicMaterial({ map: textures.alps })}

function _terrain() {
  return new MeshBasicMaterial({ color: 0xACECC1 })}

// basic
function materials( dimensions, maps, textures) {
  let materials = { terrain:          _terrain(),
                    heightmap:        _noiseheight(),
                    standard:         new MeshStandardMaterial(0xF9266B),
                    noise:            _noise(textures),
                    displacementmap:  _displacement(maps, textures),
                    normalmap:        _normal(maps)}
  return materials}

export default materials
