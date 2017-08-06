import {LinearFilter,
        LinearMipmapLinearFilter,
        LoadingManager,
        Mesh,
        MeshBasicMaterial,
        NearestFilter,
        OrthographicCamera,
        PlaneBufferGeometry,
        PlaneGeometry,
        RepeatWrapping,
        RGBAFormat,
        RGBFormat,
        Scene,
        ShaderMaterial,
        TextureLoader,
        UniformsUtils,
        Vector2,
        WebGLRenderTarget} from 'three'

import {EffectComposer, 
        RenderPass,
        ShaderPass} from 'postprocessing'

import ShaderExtras from '../lib/shader-extras'
import sςene        from './scene'

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


function _noiseMaterial() {
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

// generate a sahder texture, by setting up a scene that is not rendered onto the frame,
// but into a WebGLRenderTarget, from which the texture can be retrieved
function _shader(renderer, dimensions, material, debug) {

  console.log('renderer', renderer)
  let { scene,
        camera }    = sςene.buffer(dimensions),
      plane         = new PlaneBufferGeometry( dimensions.width, dimensions.height ),
      quad          = new Mesh( plane, new MeshBasicMaterial( { color: 0xFC9A5B } ) ),
      renderTarget  = new WebGLRenderTarget(dimensions.width, dimensions.height, 
                                            { minFilter: LinearFilter, 
                                              magFilter: NearestFilter, 
                                              format: RGBFormat,
                                              stencilBufer: false }),
      composer      = new EffectComposer( renderer, renderTarget ),
      renderPass    = new RenderPass( scene, camera )

  quad.position.z = -500
  scene.add( quad )
  quad.material = material
  
  // if the id of a dom element is passed, 
  // we're in debug mode and render the shader scene to the screen
  if(debug) composer.renderToScreen = true

  // ————————————————————————————————————————————————————————————————
  // this is where it's at. here we render the scene into the texture
  // ————————————————————————————————————————————————————————————————
  composer.addPass( renderPass )
  composer.render( 0.1 )

  console.log('composer', composer)

  return composer}


function textures(renderer, dimensions, debug) {
  let loadingManager  = new LoadingManager( function(){/* terrain.visible = true */}),
      textureLoader   = new TextureLoader( loadingManager ),

      diffuse1        = textureLoader.load( 'textures/terrain/grasslight-big.jpg'),
      // diffuse1 = textureLoader.load( 'textures/terrain/grasslight-big.jpg', null, 
      //                     function() { _applyShader( ShaderExtras[ 'luminosity' ], diffuseTexture1, specularMap, renderer, dimensions ) }),
      diffuse2        = textureLoader.load( '/textures/terrain/backgrounddetailed.jpg'),
      detail          = textureLoader.load( '/textures/terrain/grasslight-big-nm.jpg'),
      alps            = textureLoader.load( '/textures/alpenvorland.jpg')
      // noise           = _shader(renderer, dimensions, _noiseMaterial(), debug)

  diffuse1.wrapS      = RepeatWrapping
  diffuse1.wrapT      = RepeatWrapping

  diffuse2.wrapS      = RepeatWrapping
  diffuse2.wrapT      = RepeatWrapping
  
  detail.wrapS        = RepeatWrapping
  detail.wrapT        = RepeatWrapping
  
  return {detail, diffuse1, diffuse2, alps}}

export default textures