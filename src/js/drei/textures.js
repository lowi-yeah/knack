import {LinearFilter,
        LinearMipmapLinearFilter,
        LoadingManager,
        Mesh,
        OrthographicCamera,
        PlaneGeometry,
        RepeatWrapping,
        RGBAFormat,
        Scene,
        ShaderMaterial,
        TextureLoader,
        UniformsUtils,
        Vector2,
        WebGLRenderTarget} from 'three'

import ShaderExtras from '../lib/shader-extras'

function _applyShader( shader, texture, target, renderer, dimensions ) {
  var shaderMaterial  = new ShaderMaterial({ 
                              fragmentShader: shader.fragmentShader,
                              vertexShader:   shader.vertexShader,
                              uniforms:       UniformsUtils.clone( shader.uniforms )}),
      sceneTmp        = new Scene(),
      meshTmp         = new Mesh( new PlaneGeometry( dimensions.width, dimensions.height ), 
                                  shaderMaterial ),
      cameraOrtho     = new OrthographicCamera( dimensions.width / - 2, 
                                                dimensions.height / 2, 
                                                dimensions.height / 2, 
                                                dimensions.height / - 2, 
                                                -10000, 10000 )

  shaderMaterial.uniforms[ 'tDiffuse' ].texture = texture
  meshTmp.position.z = -500;
  cameraOrtho.position.z = 100
  sceneTmp.add( meshTmp );
  renderer.render( sceneTmp, cameraOrtho, target, true )}

function textures() {
  let loadingManager  = new LoadingManager( function(){/* terrain.visible = true */}),
      textureLoader   = new TextureLoader( loadingManager ),

      diffuse1        = textureLoader.load( 'textures/terrain/grasslight-big.jpg'),
      // diffuse1 = textureLoader.load( 'textures/terrain/grasslight-big.jpg', null, 
      //                     function() { _applyShader( ShaderExtras[ 'luminosity' ], diffuseTexture1, specularMap, renderer, dimensions ) }),
      diffuse2        = textureLoader.load( '/textures/terrain/backgrounddetailed.jpg'),
      detail          = textureLoader.load( '/textures/terrain/grasslight-big-nm.jpg'),
      alps            = textureLoader.load( '/textures/alpenvorland.jpg')

  diffuse1.wrapS      = RepeatWrapping
  diffuse1.wrapT      = RepeatWrapping

  diffuse2.wrapS      = RepeatWrapping
  diffuse2.wrapT      = RepeatWrapping
  
  detail.wrapS        = RepeatWrapping
  detail.wrapT        = RepeatWrapping
  
  return {detail, diffuse1, diffuse2, alps}}

export default textures