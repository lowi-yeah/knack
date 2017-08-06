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
        PlaneBufferGeometry,
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


// Shaders
// ————————————————
let basicΣ      = ShaderExtras.basic,
    // normalmapΣ  = ShaderExtras.normalmap,
    textureΣ    = { uniforms:     { tDiffuse: { type: "t", value: null }},
                    vertexShader: [
                      "varying vec2 vUv;",
                      "void main() {",
                        "vUv = vec2( uv.x, 1.0 - uv.y );",
                        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}" 
                        ].join("\n"),
                  
                    fragmentShader: [
                      "uniform sampler2D tDiffuse;",
                      "varying vec2 vUv;",
                      "void main() {",
                        "vec4 texel = texture2D( tDiffuse, vUv );",
                        "gl_FragColor = texel;}"].join("\n") },

    noiseΣ      = { uniforms:       { time:   { value: 1.0 },
                                      scale:  { value: new Vector2( 1.5, 1.5 ) },
                                      offset: { value: new Vector2( 0, 0 ) }},
                    vertexShader:   document.getElementById( 'vertexshader' )
                                      .textContent,
                    fragmentShader: document.getElementById( 'fragmentshader-noise' )
                                      .textContent},

    normalmapΣ  = { uniforms: { heightMap:  { value: null },
                                resolution: { value: new Vector2( 512, 512 ) },
                                scale:      { value: new Vector2( 1, 1 ) },
                                height:     { value: 0.05 }},
                    vertexShader: [
                      "varying vec2 vUv;",
                      "void main() {",
                        "vUv = uv;",
                        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}"
                    ].join( "\n" ),
            
                    fragmentShader: [
                      "uniform float height;",
                      "uniform vec2 resolution;",
                      "uniform sampler2D heightMap;",
                      "varying vec2 vUv;",
                      "void main() {",
                        "float val = texture2D( heightMap, vUv ).x;",
                        "float valU = texture2D( heightMap, vUv + vec2( 1.0 / resolution.x, 0.0 ) ).x;",
                        "float valV = texture2D( heightMap, vUv + vec2( 0.0, 1.0 / resolution.y ) ).x;",
                        "gl_FragColor = vec4( ( 0.5 * normalize( vec3( val - valU, val - valV, height  ) ) + 0.5 ), 1.0 );}"
                    ].join( "\n" )}


let DEBUG                   = true,
    dimensions              = { width: window.innerWidth, height: window.innerHeight},
    bufferDimensions        = { width: window.innerWidth, height: window.innerHeight}, 
    // bufferDimensions  = { width: 1024, height: 1024}, 
    resolution              = { width: 256,  height: 256},
    renderTargetParameters  = { minFilter: LinearFilter, 
                                magFilter: LinearFilter, 
                                format: RGBAFormat, 
                                // stencilBufer: false 
                              }

// exploit a glitch in the noise shader which starts to behave weird at some point
let GLITCH_NOISE = false

let clearColor = new Color()
clearColor.setHSL(0.102, 0.64, 0.825)

function _degrees(δ) {return Math.DEG2RAD * δ}

function _loadTextures() {
  return new Promise((resolve, reject) => { 
    let loadingManager  = new LoadingManager(),
        textureLoader   = new TextureLoader( loadingManager ),
        alps            = textureLoader.load( '/textures/alpenvorland.jpg'),
        europa          = textureLoader.load( '/textures/europa.jpg')
    loadingManager.onLoad = () => { resolve({alps, europa})}
    loadingManager.onError = (url) => { reject('There was an error loading ' + url)}})}

function _loadMaterials(textures) {
  return new Promise((resolve, reject) => { 
    let noiseShader       = { uniforms:       UniformsUtils.clone( noiseΣ.uniforms ),
                                vertexShader:   noiseΣ.vertexShader,
                                fragmentShader: noiseΣ.fragmentShader},
        noiseMaterial     = new ShaderMaterial(noiseShader),
    
        normalMapShader   = { uniforms:       UniformsUtils.clone( normalmapΣ.uniforms ),
                              vertexShader:   normalmapΣ.vertexShader,
                              fragmentShader: normalmapΣ.fragmentShader},
        normalMapMaterial = new ShaderMaterial(normalMapShader),
  
        alpsMaterial      = new MeshLambertMaterial({map: textures.alps}),
        basicShader       = { uniforms:       UniformsUtils.clone( basicΣ.uniforms ),
                              vertexShader:   basicΣ.vertexShader,
                              fragmentShader: basicΣ.fragmentShader},
        basicMaterial     = new ShaderMaterial(basicShader),
  
        textureShader     = { uniforms:       UniformsUtils.clone( textureΣ.uniforms ),
                              vertexShader:   textureΣ.vertexShader,
                              fragmentShader: textureΣ.fragmentShader},
        texturedMaterial  = new ShaderMaterial(textureShader),

        materials         = { alps:       { μ: alpsMaterial },
                              basic:      { ς: basicShader,
                                            μ: basicMaterial },
                              noise:      { ς: noiseShader,
                                            μ: noiseMaterial },
                              normalMap:  { ς: normalMapShader,
                                            μ: normalMapMaterial },
                              textured:   { ς: textureShader,
                                            μ: texturedMaterial }}
    resolve({textures, materials}) })}

function drei(domId) {
  console.log('initialzing drei')

  _loadTextures()
    .then((textures) => {return _loadMaterials(textures)})
    .then(({textures, materials}) => {

      console.log('textures, materials', textures, materials)
      // renderer
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      renderer.setClearColor( clearColor )

      // seed the noise
      // values above 200000 (and below 10000000) produce increasinly weird artifacts
      if(GLITCH_NOISE) materials.noise.ς.uniforms.time.value = _.random(200000, 10000000) 
      else materials.noise.ς.uniforms.time.value = _.random(100000) 

      let buffer            = new WebGLRenderTarget(dimensions.width, 
                                                    dimensions.height, 
                                                    renderTargetParameters ),
          texturePass       = new TexturePass( textures.alps ),
          shaderPass        = new ShaderPass( materials.noise.μ ),
          // glitchPass        = new GlitchPass(),
          // normalPass        = new ShaderPass( normalMapShader ),
          bufferComposition = new EffectComposer( renderer, buffer ),
          foo = new WebGLRenderTarget(dimensions.width, 
                                      dimensions.height, 
                                      renderTargetParameters ),
          savePass  = new SavePass(foo)
      
      bufferComposition.addPass( texturePass )
      bufferComposition.addPass( shaderPass )
      // bufferComposition.addPass( dotScreenPass )
      // bufferComposition.addPass( normalPass )
      texturePass.renderToScreen = true
      // shaderPass.renderToScreen = true
      // normalPass.renderToScreen = true
      
      // Render
      // ————————————————————————————————
      bufferComposition.render(0)

      let finalScene = sςene.final(dimensions, clearColor)
     
      // create a sphere and assign the material
      // let icosahedron = new Mesh( new IcosahedronGeometry( 242 ), basicMaterial)
      let icosahedron = new Mesh( new IcosahedronGeometry( 242 ), materials.noise.μ)
      finalScene.scene.add( icosahedron )

      // TERRAIN MESH
      let geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 256, 256 )
      BufferGeometryUtils.computeTangents( geometryTerrain )

      let terrain = new Mesh( geometryTerrain, materials.textured.μ )
    
      terrain.rotation.x = _degrees(-90)
      terrain.position.set( 0, -125, 0 )
      terrain.visible = true
      finalScene.scene.add( terrain )

      // Compose
      // ————————————————————————————————
      let clock         = new Clock(),
          renderModel   = new RenderPass( finalScene.scene, finalScene.camera ),
          renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height, renderTargetParameters ),
          composition   = new EffectComposer( renderer, renderTarget )
    
      composition.addPass( renderModel )
      renderModel.renderToScreen = true

      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule
        finalScene.controls.update()

        let δ = clock.getDelta()
        // textureShader.uniforms.tDiffuse.value = textures.alps
        materials.noise.ς.uniforms.time.value += δ * 0.1 
        materials.textured.ς.uniforms.tDiffuse.value = bufferComposition.writeBuffer.texture
        bufferComposition.render(δ)
        composition.render(δ)
      }

      // here we go…
      _render()
  })
}

export default drei