import {UniformsUtils, Vector2} from 'three'
import ShaderExtras             from '../lib/shader-extras'
import terrainShader            from '../shader/simple-terrain'
import normalShader             from '../shader/normal-map'

function _terrain(maps, textures) {
  let uniforms = UniformsUtils.clone( terrainShader.uniforms )

  // uniforms[ 'tNormal' ].value             = maps.normal.texture
  // uniforms[ 'uNormalScale' ].value        = 3.5
      
  // uniforms[ 'tDisplacement' ].value       = maps.height.texture
  // uniforms[ 'uDisplacementScale' ].value  = 375
      

  return uniforms}

function _normal(resolution, maps) {
  let uniforms      = UniformsUtils.clone( normalShader.uniforms )

  uniforms.height.value = 0.05
  uniforms.resolution.value.set( resolution.x, resolution.y )
  uniforms.heightMap.value = maps.height.texture

  return uniforms }

function uniforms(resolution, maps, textures) {
  let noise   = { time:   { value: 1.0 },
                  scale:  { value: new Vector2( 1.5, 1.5 ) },
                  offset: { value: new Vector2( 0, 0 ) }},
      normal  = _normal(resolution, maps),
      terrain = _terrain(maps, textures)
  
  return {noise, normal, terrain}}

export default uniforms