import {Clock,
        Color,
        FogExp2,
        IcosahedronGeometry,
        LinearFilter,
        LoadingManager,
        Math,
        Mesh,
        MeshBasicMaterial,
        MeshStandardMaterial,
        MeshLambertMaterial,
        OrthographicCamera,
        OctahedronBufferGeometry,
        OctahedronGeometry,
        PlaneBufferGeometry,
        RepeatWrapping,
        RGBFormat,
        RGBAFormat,
        Scene,
        ShaderMaterial,
        TextureLoader,
        UniformsUtils,
        Vector2,
        WebGLRenderer,
        WebGLRenderTarget } from 'three'

import {BloomPass,
        DotScreenPass,
        EffectComposer, 
        GlitchPass,
        RenderPass,
        SavePass,
        ShaderPass,
        TexturePass}        from 'postprocessing'

// import fontLoader     from './lib/font-loader'
import BufferGeometryUtils  from './lib/buffer-geometry-utils'
import ShaderExtras         from './lib/shader-extras'
import sςene                from './drei/scene'
import mαterials            from './drei/materials'
import mαps                 from './drei/maps'
import τextures             from './drei/textures'
import ςomposer             from './drei/composer'
import terrainΣ             from './shader/simple-terrain'
// import terrainΣ             from './shader/terrain'

let config  = { wireframe:    true,
                useControls:  true,
                glitchNoise:  false,
                updateNoise:  true
              }

// Shaders
// ————————————————
let basicΣ      = ShaderExtras.basic,
    // normalmapΣ  = ShaderExtras.normalmap,
    textureΣ    = { uniforms:     { tDiffuse: { type: 't', value: null }},
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
                        'gl_FragColor = texel;}'].join('\n') },

    noiseΣ      = { uniforms:       { time:   { value: 1.0 },
                                      scale:  { value: new Vector2( 1.5, 1.5 ) },
                                      offset: { value: new Vector2( 0, 0 ) }},
                    vertexShader:   document.getElementById( 'vertexshader' )
                                      .textContent,
                    fragmentShader: document.getElementById( 'fragmentshader-noise' )
                                      .textContent},

    normalmapΣ  = { uniforms: { tDiffuse:   { type: 't', value: null },
                                resolution: { value: new Vector2( 512, 512 ) },
                                height:     { value: 0.05 }},
                    vertexShader: [
                      'varying vec2 vUv;',
                      'void main() {',
                        'vUv = uv;',
                        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}'
                    ].join( '\n' ),
            
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
                    ].join( '\n' )}


let DEBUG                   = true,
    dimensions              = { width: window.innerWidth, height: window.innerHeight},
    bufferDimensions        = { width: window.innerWidth, height: window.innerHeight}, 
    // bufferDimensions  = { width: 1024, height: 1024}, 
    resolution              = { width: 256,  height: 256},
    renderTargetParameters  = { minFilter: LinearFilter, 
                                magFilter: LinearFilter, 
                                format: RGBAFormat, 
                                stencilBufer: false 
                              }

// exploit a glitch in the noise shader which starts to behave weird at some point


let clearColor = new Color()
clearColor.setHSL(0.102, 0.64, 0.825)

function _degrees(δ) {return Math.DEG2RAD * δ}

function _textureMaterial() {
  let shader    = { uniforms:       UniformsUtils.clone( textureΣ.uniforms ),
                    vertexShader:   textureΣ.vertexShader,
                    fragmentShader: textureΣ.fragmentShader},
      material  = new ShaderMaterial(shader)
  return {ς: shader,
          μ: material}}


function _loadTextures() {
  return new Promise((resolve, reject) => { 
    let loadingManager  = new LoadingManager(),
        tl              = new TextureLoader( loadingManager ),
        alps            = tl.load( '/textures/alpenvorland.jpg'),
        europa          = tl.load( '/textures/europa.jpg'),
        terrain         = { diffuse2: tl.load( '/textures/terrain/backgrounddetailed.jpg'),
                            diffuse1: tl.load( '/textures/terrain/grasslight-big.jpg'),
                            detail:   tl.load( '/textures/terrain/grasslight-big-nm.jpg')}

        // params          = { minFilter: LinearFilter, 
        //                     magFilter: LinearFilter, 
        //                     format: RGBFormat },
        // specularMap     = new WebGLRenderTarget( 2048, 2048, params )
        // specularMap.texture.generateMipmaps = false
    


    loadingManager.onLoad = () => { 
      terrain.diffuse1.wrapS  = RepeatWrapping
      terrain.diffuse2.wrapS  = RepeatWrapping
      terrain.detail.wrapS    = RepeatWrapping

      terrain.diffuse1.wrapT  = RepeatWrapping
      terrain.diffuse2.wrapT  = RepeatWrapping
      terrain.detail.wrapT    = RepeatWrapping

      resolve({alps, europa, terrain})}
    loadingManager.onError = (url) => { reject('There was an error loading ' + url)}})}

function _loadMaterials(textures) {
  return new Promise((resolve, reject) => { 

        // Noise
    let noiseShader       = { uniforms:       UniformsUtils.clone( noiseΣ.uniforms ),
                              vertexShader:   noiseΣ.vertexShader,
                              fragmentShader: noiseΣ.fragmentShader},
        noiseMaterial     = new ShaderMaterial(noiseShader),
    
        // Normal map
        normalMapShader   = { uniforms:       UniformsUtils.clone( normalmapΣ.uniforms ),
                              vertexShader:   normalmapΣ.vertexShader,
                              fragmentShader: normalmapΣ.fragmentShader},
        normalMapMaterial = new ShaderMaterial(normalMapShader),
  
        // alpen texture
        alpsMaterial      = new MeshLambertMaterial({map: textures.alps}),

        // plain yellow
        basicShader       = { uniforms:       UniformsUtils.clone( basicΣ.uniforms ),
                              vertexShader:   basicΣ.vertexShader,
                              fragmentShader: basicΣ.fragmentShader},
        basicMaterial     = new ShaderMaterial(basicShader),
  
        // textures
        textureShader     = { uniforms:       UniformsUtils.clone( textureΣ.uniforms ),
                              vertexShader:   textureΣ.vertexShader,
                              fragmentShader: textureΣ.fragmentShader},
        texturedMaterial  = new ShaderMaterial(textureShader),

        // result
        materials         = { alps:       { μ: alpsMaterial },
                              basic:      { ς: basicShader,
                                            μ: basicMaterial },
                              noise:      { ς: noiseShader,
                                            μ: noiseMaterial },
                              normalMap:  { ς: normalMapShader,
                                            μ: normalMapMaterial },
                              textured:   { ς: textureShader,
                                            μ: texturedMaterial }}

    // seed the noise shader
    // values above 200000 (and below 10000000) produce increasinly weird artifacts
    if(config.glitchNoise) noiseShader.uniforms.time.value = _.random(200000, 8100000) 
    else noiseShader.uniforms.time.value = _.random(64000) 

    normalMapShader.uniforms.tDiffuse.value = textures.alps
    textureShader.uniforms.tDiffuse.value = textures.alps

    resolve({textures, materials}) })}

function drei(domId) {
  console.log('initialzing drei')

  _loadTextures()
    .then((textures) => {return _loadMaterials(textures)})
    .then(({textures, materials}) => {

      // console.log('textures', textures)

      // renderer
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      renderer.setClearColor( clearColor )

      // buffer scene
      let buffer            = new WebGLRenderTarget(dimensions.width, 
                                                    dimensions.height, 
                                                    renderTargetParameters ),
          bufferComposition = new EffectComposer( renderer, buffer ),

          bufferScene       = new Scene(),
          bufferCamera      = new OrthographicCamera( dimensions.width  / -2, 
                                                      dimensions.width  /  2, 
                                                      dimensions.height /  2, 
                                                      dimensions.height / -2, 
                                                      -10000, 10000 )
      bufferScene.add( bufferCamera )
      // let octahedron = new Mesh( new OctahedronGeometry( 242 ), new MeshLambertMaterial(0xF9266B))
      // bufferScene.add( octahedron )

      // setup all them render passes
      let normalPass      = new ShaderPass( materials.normalMap.μ ),
          bufferPass      = new RenderPass( textures.alps ),
          alpsPass        = new TexturePass( textures.alps ),
          glitchPass      = new GlitchPass(),
          noisePass       = new ShaderPass( materials.noise.μ ),
          bufferScenePass = new RenderPass( bufferScene, bufferCamera ),

          heightTarget    = new WebGLRenderTarget(dimensions.width, dimensions.height, 
                                                  renderTargetParameters),
          saveHeightPass  = new SavePass( heightTarget ),

          normalTarget    = new WebGLRenderTarget(dimensions.width, dimensions.height, 
                                                  renderTargetParameters),
          saveNormalPass  = new SavePass( normalTarget )

      heightTarget.texture.generateMipmaps = false
      normalTarget.texture.generateMipmaps = false
      
      // bufferComposition.addPass( bufferScenePass )
      bufferComposition.addPass( noisePass )
      // bufferComposition.addPass( glitchPass )
      // bufferComposition.addPass( alpsPass )
      // bufferComposition.addPass( glitchPass )
      // bufferComposition.addPass( dotScreenPass )
      bufferComposition.addPass( saveHeightPass )
      bufferComposition.addPass( normalPass )
      bufferComposition.addPass( saveNormalPass )

      // bufferScenePass.renderToScreen = true
      // alpsPass.renderToScreen = true
      // noisePass.renderToScreen = true
      // savePass.renderToScreen = true
      // glitchPass.renderToScreen = true
      // normalPass.renderToScreen = true
      
      // Render
      // ————————————————————————————————
      bufferComposition.render(0)

      let renderScene = sςene.final(dimensions, clearColor, config.useControls)

      let terrainShader   = { uniforms:       UniformsUtils.clone( terrainΣ.uniforms ),
                              vertexShader:   terrainΣ.vertexShader,
                              fragmentShader: terrainΣ.fragmentShader,
                              lights:         true,
                              fog:            true},
          terrainMaterial

      if(config.wireframe) _.merge(terrainShader, {wireframe: true})
      terrainMaterial = new ShaderMaterial(terrainShader)


      // console.log('terrainShader', terrainShader)
      // console.log('terrainMaterial', terrainMaterial)

      terrainShader.uniforms.tNormal.value            = normalTarget.texture
      terrainShader.uniforms.uNormalScale.value       = 3.5
      terrainShader.uniforms.tDisplacement.value      = heightTarget.texture
      terrainShader.uniforms.tDiffuse1.value          = textures.terrain.diffuse1
      terrainShader.uniforms.tDiffuse2.value          = textures.terrain.diffuse2
      terrainShader.uniforms.tSpecular.value          = heightTarget.texture
      terrainShader.uniforms.tDetail.value            = normalTarget.texture
      terrainShader.uniforms.enableDiffuse1.value     = false
      terrainShader.uniforms.enableDiffuse2.value     = false
      terrainShader.uniforms.enableSpecular.value     = false
      terrainShader.uniforms.diffuse.value.setHex(      0xffffff )
      terrainShader.uniforms.specular.value.setHex(     0xffffff )
      terrainShader.uniforms.shininess.value          = 12
      terrainShader.uniforms.uDisplacementScale.value = 240
      terrainShader.uniforms.uRepeatOverlay.value.set(  6, 6 )


      // create a sphere and assign the material
      // let icosahedron = new Mesh( new IcosahedronGeometry( 242 ), basicMaterial)
      let heightMaterial  = _textureMaterial(),
          // icosahedron     = new Mesh( new IcosahedronGeometry( 242 ), heightMaterial.μ)
          icosahedron     = new Mesh( new IcosahedronGeometry( 320 ), new MeshLambertMaterial(0x9B0A07))
      renderScene.scene.add( icosahedron )


      // TERRAIN MESH
      let normalMaterial  = _textureMaterial(),
          // geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 256, 256 ),
          geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 64, 64 ),
          // terrain = new Mesh( geometryTerrain, new MeshLambertMaterial(0x9B0A07) )
          terrain = new Mesh( geometryTerrain, terrainMaterial )
    
      BufferGeometryUtils.computeTangents( geometryTerrain )

      terrain.rotation.x = _degrees(-90)
      terrain.position.set( 0, -125, 0 )
      terrain.visible = true
      renderScene.scene.add( terrain )

      // Compose
      // ————————————————————————————————
      let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height, renderTargetParameters ),
          composition   = new EffectComposer( renderer, renderTarget ),

          // make the passes for the composition
          renderModel   = new RenderPass( renderScene.scene, renderScene.camera )

    
      composition.addPass( renderModel )
      // composition.addPass( normalPass )

      renderModel.renderToScreen = true

      let clock         = new Clock(),
          fLow          =  0.1, 
          fHigh         =  0.8,
          animDelta     =  0, 
          animDeltaDir  = -1,
          lightVal      =  0, 
          lightDir      =  1,
          valNorm, δ

      console.log('here we go —→')
      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule

        if( config.useControls ) renderScene.controls.update()

        δ         = clock.getDelta()
        lightVal  = Math.clamp( lightVal + 0.5 * δ * lightDir, fLow, fHigh )
        valNorm   = ( lightVal - fLow ) / ( fHigh - fLow )

        renderScene.scene.fog.color.setHSL( 0.1, 0.5, lightVal )
        renderer.setClearColor( renderScene.scene.fog.color )

        terrainShader.uniforms.uNormalScale.value   = Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 )

        // renderScene.lights.directional.intensity    = Math.mapLinear( valNorm, 0, 1, 0.1, 0.1 )
        // renderScene.lights.point.intensity          = Math.mapLinear( valNorm, 0, 1, 0.9, 0.81 )
        // renderScene.lights.point.color.setHSL( 0.1, 0.5, lightVal )

        if ( config.updateNoise ) {
          materials.noise.ς.uniforms.time.value     += δ * 0.02 
          heightMaterial.ς.uniforms.tDiffuse.value  = heightTarget.texture
          normalMaterial.ς.uniforms.tDiffuse.value  = normalTarget.texture
        }
        
        bufferComposition.render(δ)
        composition.render(δ)
      }

      // here we go…
      _render()
  })
}

export default drei