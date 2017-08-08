import {BoxGeometry,
        Clock,
        Color,
        DirectionalLight, 
        FlatShading,
        FogExp2,
        IcosahedronGeometry,
        LinearFilter,
        LoadingManager,
        Math,
        Mesh,
        MeshBasicMaterial,
        MeshLambertMaterial,
        MeshStandardMaterial,
        MeshPhongMaterial,
        Object3D,
        OrthographicCamera,
        OctahedronBufferGeometry,
        OctahedronGeometry,
        PlaneBufferGeometry,
        PointLight,
        RepeatWrapping,
        RGBFormat,
        RGBAFormat,
        Scene,
        ShaderMaterial,
        SmoothShading,
        SphereGeometry,
        TextureLoader,
        UniformsUtils,
        Vector2,
        WebGLRenderer,
        WebGLRenderTarget } from 'three'

import {BloomPass,
        ClearPass,
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
import SunLight             from './lib/sun-light'
import sςene                from './drei/scene'
import mαterials            from './drei/materials'
import mαps                 from './drei/maps'
import τextures             from './drei/textures'
import ςomposer             from './drei/composer'
import terrainΣ             from './shader/simple-terrain'
// import terrainΣ             from './shader/terrain'

let config  = { wireframe:    false,
                useControls:  true,
                glitchNoise:  false,
                updateNoise:  false
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
    resolution              = { width: 256,  height: 256},
    renderTargetParameters  = { minFilter: LinearFilter, 
                                magFilter: LinearFilter, 
                                format: RGBAFormat, 
                                stencilBufer: false 
                              },

    lightIntensity          = 1.0

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
        // europa          = tl.load( '/textures/europa.jpg'),
        europa          = tl.load( '/textures/alpenvorland.png'),
        // europa          = tl.load( '/textures/gradient.jpg'),
        // europa          = tl.load( '/textures/wien.png'),
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

      alps.generateMipmaps = false

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
        alpsShader        = { uniforms:       UniformsUtils.clone( textureΣ.uniforms ),
                              vertexShader:   textureΣ.vertexShader,
                              fragmentShader: textureΣ.fragmentShader},
        alpsMaterial      = new ShaderMaterial(alpsShader),

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
        materials         = { alps:       { ς: alpsShader,
                                            μ: alpsMaterial },
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

    console.log('Texturen:', textures)

    normalMapShader.uniforms.tDiffuse.value = textures.europa
    textureShader.uniforms.tDiffuse.value   = textures.europa
    alpsShader.uniforms.tDiffuse.value      = textures.europa

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

      // setup all them render passes
      let clearBufferPass = new ClearPass(),
          normalPass      = new ShaderPass( materials.normalMap.μ ),
          bufferPass      = new RenderPass( bufferScene, bufferCamera ),
          texturedPass    = new TexturePass( textures.europa ),
          glitchPass      = new GlitchPass(),
          noisePass       = new ShaderPass( materials.noise.μ ),
          bufferScenePass = new RenderPass( bufferScene, bufferCamera ),

          heightTarget    = new WebGLRenderTarget(resolution.width, resolution.height, 
                                                  renderTargetParameters),
          saveHeightPass  = new SavePass( heightTarget ),

          normalTarget    = new WebGLRenderTarget(resolution.width, resolution.height, 
                                                  renderTargetParameters),
          saveNormalPass  = new SavePass( normalTarget )

      heightTarget.texture.generateMipmaps = false
      normalTarget.texture.generateMipmaps = false
      
      bufferComposition.addPass( bufferPass )
      bufferComposition.addPass( texturedPass )
      // bufferComposition.addPass( noisePass )
      bufferComposition.addPass( saveHeightPass )
      bufferComposition.addPass( normalPass )
      bufferComposition.addPass( saveNormalPass )

      // bufferPass.renderToScreen = true
      // texturedPass.renderToScreen = true
      // noisePass.renderToScreen = true
      // saveHeightPass.renderToScreen = true
      // glitchPass.renderToScreen = true
      bufferPass.renderToScreen = true

      bufferComposition.render(0)


      let renderScene = sςene.final(dimensions, clearColor, config.useControls)

      let terrainShader   = { uniforms:       UniformsUtils.clone( terrainΣ.uniforms ),
                              vertexShader:   terrainΣ.vertexShader,
                              fragmentShader: terrainΣ.fragmentShader,
                              lights:         true,
                              fog:            true,
                              shading:        FlatShading
                            },
          terrainMaterial

      if(config.wireframe) _.merge(terrainShader, {wireframe: true})
      terrainMaterial = new ShaderMaterial(terrainShader)


      // console.log('terrainShader', terrainShader)
      // console.log('terrainMaterial', terrainMaterial)

      terrainShader.uniforms.tNormal.value            = normalTarget.texture
      terrainShader.uniforms.uNormalScale.value       = 3.5
      terrainShader.uniforms.tDisplacement.value      = heightTarget.texture
      terrainShader.uniforms.tDiffuse1.value          = textures.terrain.diffuse1_invalid
      terrainShader.uniforms.tDiffuse2.value          = textures.terrain.diffuse2_invalid
      terrainShader.uniforms.tSpecular.value          = heightTarget.texture
      terrainShader.uniforms.tDetail.value            = normalTarget.texture_invalid
      terrainShader.uniforms.enableDiffuse1.value     = false
      terrainShader.uniforms.enableDiffuse2.value     = false
      terrainShader.uniforms.enableSpecular.value     = false
      terrainShader.uniforms.diffuse.value.setHex(      0xffffff )
      terrainShader.uniforms.specular.value.setHex(     0xffffff )
      terrainShader.uniforms.shininess.value          = 2
      terrainShader.uniforms.uDisplacementScale.value = 240
      terrainShader.uniforms.uRepeatOverlay.value.set(  6, 6 )

      // create a sphere and assign the material
      // let icosahedron = new Mesh( new IcosahedronGeometry( 242 ), basicMaterial)
      let heightMaterial  = _textureMaterial()
      heightMaterial.ς.uniforms.tDiffuse.value = heightTarget.texture
         
      let icosahedron     = new Mesh( new IcosahedronGeometry( 242, 4 ), heightMaterial.μ)
      // let icosahedron     = new Mesh( new IcosahedronGeometry( 242, 4 ), new MeshStandardMaterial(0xF9266B))
          // icosahedron     = new Mesh( new IcosahedronGeometry( 320, 2 ), materials.textured.μ)
      // renderScene.scene.add( icosahedron )

      // create a simple sphere
      let pivotPoint    = new Object3D(),
          light0        = new DirectionalLight( 0xffffff, lightIntensity ),
          light1        = new PointLight( 0xffffff, lightIntensity )
          // light         = new DirectionalLight( 0xffffff, 0.81 )

      // add an object as pivot point to the sphere
      pivotPoint.rotation.x = 0
      renderScene.scene.add(pivotPoint)

      light0.position.set(2400, 320, 0);
      light1.position.set(-6000, 128, 0);

      pivotPoint.add(light0)
      // pivotPoint.add(light1)

      // TERRAIN MESH
      let normalMaterial  = _textureMaterial(),
          ph0ngMaterial   = new MeshPhongMaterial({ color: 0xE8873B, 
                                                    shading: FlatShading,
                                                    shininess: 8}),
          geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 256, 256 ),
          // terrain = new Mesh( geometryTerrain, ph0ngMaterial )
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

        // renderScene.scene.fog.color.setHSL( 0.1, 0.5, lightVal )
        // renderer.setClearColor( renderScene.scene.fog.color )

        terrainShader.uniforms.uNormalScale.value   = Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 )

         // light0.intensity     = Math.mapLinear( valNorm, 0, 1, 0.9, 0.81 )
         // light1.intensity     = Math.mapLinear( valNorm, 0, 1, 0.9, 0.81 )
         light0.color.setHSL( 0.1, 0.5, lightVal )
         light1.color.setHSL( 0.1, 0.5, lightVal )

        // if ( config.updateNoise ) {
        //   materials.noise.ς.uniforms.time.value     += δ * 0.02 
        //   heightMaterial.ς.uniforms.tDiffuse.value  = heightTarget.texture
        //   normalMaterial.ς.uniforms.tDiffuse.value  = normalTarget.texture
        // }
        // // materials.alps.ς.uniforms.tDiffuse.value    =  heightTarget.texture
        // materials.alps.ς.uniforms.tDiffuse.value    =  textures.alps


        // animate the directed light
        // renderScene.lights.directional.intensity    = Math.mapLinear( valNorm, 0, 1, 0.1, lightIntensity )
        // renderScene.lights.directional.position.set( 0, 512, -512 )
        // renderScene.lights.directional.position.x += 0.004
        // renderScene.lights.directional.rotation.z += 0.01


        // directional
        pivotPoint.rotation.y += 0.01

        
        // bufferComposition.render(δ)
        composition.render(δ)
      }

      // here we go…
      _render()
  })
}

export default drei