import {BoxGeometry,
        Clock,
        Color,
        DirectionalLight, 
        FlatShading,
        Fog,
        FogExp2,
        GridHelper,
        IcosahedronBufferGeometry,
        IcosahedronGeometry,
        LinearFilter,
        LoadingManager,
        Math as ThreeMath,
        Mesh,
        MeshBasicMaterial,
        MeshDepthMaterial,
        MeshLambertMaterial,
        MeshStandardMaterial,
        MeshPhongMaterial,
        Object3D,
        OrthographicCamera,
        OctahedronBufferGeometry,
        OctahedronGeometry,
        PerspectiveCamera,
        PlaneBufferGeometry,
        PointLight,
        RepeatWrapping,
        RGBFormat,
        RGBAFormat,
        Scene,
        ShaderMaterial,
        SmoothShading,
        SphereBufferGeometry,
        SphereGeometry,
        TextureLoader,
        UniformsUtils,
        Vector2,
        Vector3,
        WebGLRenderer,
        WebGLRenderTarget } from 'three'

import {BloomPass,
        ClearPass,
        DepthPass,
        DotScreenPass,
        EffectComposer, 
        FilmPass,
        GlitchPass,
        RenderPass,
        SavePass,
        ShaderPass,
        TexturePass}        from 'postprocessing'

// import fontLoader     from './lib/font-loader'
import BufferGeometryUtils  from './lib/buffer-geometry-utils'
import ShaderExtras         from './lib/shader-extras'
import OrbitControls        from './lib/orbit-controls'
import sςene                from './drei/scene'
import gμi                  from './drei/gui'
// import terrainΣ             from './shader/simple-terrain'
import terrainΣ             from './shader/toon-terrain'
import textureΣ             from './shader/texture'
import normalΣ              from './shader/normal-map'
import SkyΣ                 from './shader/sky'

let config  = { wireframe:    false,
                useControls:  true}

let DEBUG                   = true,
    dimensions              = { width: window.innerWidth, height: window.innerHeight},
    resolution              = { width: 1024,  height: 1024},
    renderTargetParameters  = { minFilter: LinearFilter, 
                                magFilter: LinearFilter, 
                                format: RGBAFormat, 
                                stencilBufer: true },
    lightIntensity          = 1.0

let clearColor = new Color()
clearColor.setHSL(0.102, 0.64, 0.825)

function _degrees(δ) {return ThreeMath.DEG2RAD * δ}

function _initSky(scene, skyScene) {
  // Add Sky Mesh
  let sky  = new SkyΣ(),
      sun  = new PointLight( 0xffffff, 1)
  sun.position.y  = -700000
  sun.visible     = true
  
  let σ = new Mesh( sky.geometry, sky.material ),
      ς = new Mesh( sky.geometry, sky.material )
  scene.add( sun )
  scene.add( σ )
  skyScene.add( ς )

  return {sky, sun}}
function _loadTextures() {
  return new Promise((resolve, reject) => { 
    let loadingManager  = new LoadingManager(),
        tl              = new TextureLoader( loadingManager ),
        // heightmap       = tl.load( '/textures/gradient.jpg')
        // heightmap       = tl.load( '/textures/europa.jpg')
        // heightmap       = tl.load( '/textures/alpenvorland.png')
        // heightmap       = tl.load( '/textures/fuji.png')
        // heightmap       = tl.load( '/textures/alpenvorland_flattened.png')
        heightmap       = tl.load( '/textures/noise.png')
        // heightmap       = tl.load( '/textures/alpenvorland-detail.png')
    loadingManager.onLoad   = () => { resolve({heightmap})}
    loadingManager.onError  = (url) => { reject('There was an error loading ' + url)}})}

function drei(domId) {
  console.log('initialzing drei')

  _loadTextures()
    .then((textures) => {
      // Render the given heightmap 
      // once as is and once with a normal-map shader apllied.
      // The results of both these render passes are written
      // into GLRenderTargets which are handed down to calculate
      // trhe displacement and normals of the terrain shader

      // we only create one renderer for all scenes
      // create it there since here is wehre we need it for the first time
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )

      // create the shader which generates a normal map from a given heightmap
      let normalShader      = { uniforms:       UniformsUtils.clone( normalΣ.uniforms ),
                                vertexShader:   normalΣ.vertexShader,
                                fragmentShader: normalΣ.fragmentShader},
          normalMaterial    = new ShaderMaterial(normalShader)

      // No need to set the heightmap, as it will be set within the shader pass
      // normalShader.uniforms.tDiffuse.value  = textures.heightmap

      // Create an aempty scene and a camera for a minimal render pass
      // I'm not even sure whether this is necessary
      let s = new Scene(),c = new PerspectiveCamera()
      s.add(c)

      // composition
      let buffer            = new WebGLRenderTarget(resolution.width, resolution.height, 
                                                    renderTargetParameters ),
          heightTarget      = new WebGLRenderTarget(resolution.width, resolution.height, 
                                                    renderTargetParameters),
          normalTarget      = new WebGLRenderTarget(resolution.width, resolution.height, 
                                                    renderTargetParameters),
          composition       = new EffectComposer( renderer, buffer ),
          bufferPass        = new RenderPass( s, c ),
          texturedPass      = new TexturePass( textures.heightmap ),
          normalPass        = new ShaderPass( normalMaterial ),
          saveHeightPass    = new SavePass( heightTarget ),
          saveNormalPass    = new SavePass( normalTarget ),
          glitchPass        = new GlitchPass()

      heightTarget.texture.generateMipmaps = false
      normalTarget.texture.generateMipmaps = false

      composition.addPass( bufferPass )
      composition.addPass( texturedPass )
      composition.addPass( saveHeightPass )
      composition.addPass( normalPass )
      composition.addPass( saveNormalPass )

      // @obacht: do NOT render on the screen
      composition.render(0)

      // save the textures fo the passes
      let maps = {height: heightTarget,
                  normal: normalTarget}
      return {renderer, textures, maps, bufferComposition: composition}})
    
    .then(({renderer, textures, maps, bufferComposition}) => {
      // Materials
      // ————————————————
      let terrainShader     = { uniforms:       UniformsUtils.clone( terrainΣ.uniforms ),
                                vertexShader:   terrainΣ.vertexShader,
                                fragmentShader: terrainΣ.fragmentShader,
                                lights:         true,
                                fog:            true,
                                // shading:        FlatShading,
                                wireframe:      false },
          terrainMaterial   = new ShaderMaterial(terrainShader),
         
          textureShader     = { uniforms:       UniformsUtils.clone( textureΣ.uniforms ),
                                vertexShader:   textureΣ.vertexShader,
                                fragmentShader: textureΣ.fragmentShader},

          ςTextureMaterial  = new ShaderMaterial(textureShader),

          textureMaterial   = new MeshPhongMaterial({ color: 0xE8873B, 
                                                      shading: FlatShading,
                                                      shininess: 8,
                                                      map: maps.height.texture}),
           phongMaterial     = new MeshPhongMaterial({ color: 0xE8873B, 
                                                      shading: FlatShading,
                                                      shininess: 8})
        
      // textureShader.uniforms.tDiffuse.value = maps.normal.texture
      terrainShader.uniforms.tNormal.value            = maps.normal.texture
      terrainShader.uniforms.tDisplacement.value      = maps.height.texture
      terrainShader.uniforms.uDisplacementScale.value = 240

      terrainShader.uniforms.uBaseColor.value.setHex(   0xffffff )
      terrainShader.uniforms.specular.value.setHex(     0xffffff )
      terrainShader.uniforms.shininess.value          = 2

      // textureShader.uniforms.tDiffuse.value = maps.normal.texture
      textureShader.uniforms.tDiffuse.value = maps.height.texture
      // textureShader.uniforms.tDiffuse.value = textures.heightmap

      


      // Scene
      // ————————————————
      let ratio           = dimensions.width / dimensions.height,
          bgScene         = new Scene(),
          fgScene         = new Scene(),
          camera          = new PerspectiveCamera(40, ratio, 2, 2000000),
          helper          = new GridHelper( 10000, 2, 0xffffff, 0xffffff ),
          controls,

          skyScene        = new Scene(),

          {sky, sun}      = _initSky(fgScene, skyScene),

          geometryTerrain = new PlaneBufferGeometry( 6000, 6000, resolution.width/4, resolution.height/4 ),
          terrain         = new Mesh( geometryTerrain,  terrainMaterial),

          icoGeometry     = new IcosahedronBufferGeometry( 1200, 4 ),
          icosahedron     = new Mesh(icoGeometry , phongMaterial)


      if(config.useControls) {
        controls = new OrbitControls( camera )
        controls.target.set( 0, 0, 0 )
        controls.rotateSpeed  = 1.0
        controls.zoomSpeed    = 1.2
        controls.panSpeed     = 0.8
        controls.keys         = [ 65, 83, 68 ] }

      
      fgScene.fog = new Fog( 0x050505, 2000, 4000 )
      // fgScene.fog.color = color
    
      camera.position.set( -1200, 1020, 2000 )
      camera.lookAt( new Vector3(0, 0, -18000) )
      

      // initialize the GUI
      gμi(sky, sun)

      BufferGeometryUtils.computeTangents( geometryTerrain )
      // BufferGeometryUtils.computeTangents( icoGeometry )

      terrain.rotation.x = _degrees(-90)
      terrain.rotation.z = _degrees(180)
      terrain.position.set(0, -240, 0 )

      // fgScene.add( camera )
      
      fgScene.add( terrain )
      // fgScene.add( helper )
      // fgScene.add( icosahedron )

      // skyScene.add( camera )

      // perpare a seperate renderer used for rendering the sky only
      let textureResolution   = {width: 64, height: 64},
          textureRenderer     = new WebGLRenderer(),
          textureTarget       = new WebGLRenderTarget(textureResolution.width, 
                                                      textureResolution.height,
                                                      renderTargetParameters ),
          textureComposition  = new EffectComposer( textureRenderer, textureTarget ),
          texturedPass        = new TexturePass( textures.heightmap )
          

      document.getElementById('sky-texture').appendChild(textureRenderer.domElement)
      textureRenderer.setPixelRatio( window.devicePixelRatio )
      textureRenderer.setSize( textureResolution.width, textureResolution.height )

      // Compose
      // ————————————————————————————————
      let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height, renderTargetParameters ),
          composition   = new EffectComposer( renderer, renderTarget ),
          skyPass       = new RenderPass( skyScene, camera ),
          bgPass        = new RenderPass( bgScene, camera ),
          fgPass        = new RenderPass( fgScene, camera ),
          depthPass     = new DepthPass(camera),
          
          bloomPass     = new BloomPass(),
          filmPass      = new FilmPass({vignette: false})
    
      textureComposition.addPass( skyPass )
      skyPass.renderToScreen = true

      // composition.addPass( bgPass )
      composition.addPass( fgPass )
      composition.addPass( depthPass )
      // composition.addPass( filmPass )

      // bgPass.renderToScreen = true
      fgPass.renderToScreen = true
      // depthPass.renderToScreen = true
      // depthPass.renderToScreen = true
      
      // filmPass.renderTo Screen = true
      
      let numRows   = 3,
          gl        = textureRenderer.context,
          // pixels    = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 3),
          pixels    = new Uint8Array(gl.drawingBufferWidth * numRows * 3),
          fogColor  = new Color

      function _getPixels() {
        // gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGB, gl.UNSIGNED_BYTE, pixels)
        // gl.readPixels(0, (gl.drawingBufferHeight/2) - 1, gl.drawingBufferWidth, 1, gl.RGB, gl.UNSIGNED_BYTE, pixels)
        gl.readPixels(0, (gl.drawingBufferHeight/2) - 1, gl.drawingBufferWidth, numRows, gl.RGB, gl.UNSIGNED_BYTE, pixels)
        let l = _.range(pixels.length/3),
            c = _.reduce(l, (ρ, i) => {
                  ρ.r += pixels[i*3]
                  ρ.g += pixels[i*3 +1]
                  ρ.b += pixels[i*3 +2]
                  return ρ }, {r: 0, g: 0, b: 0})
        
        // normalize
        c.r = ( c.r / ( pixels.length / 3 ) ) / 255
        c.g = ( c.g / ( pixels.length / 3 ) ) / 255
        c.b = ( c.b / ( pixels.length / 3 ) ) / 255

        fogColor.r = c.r
        fogColor.g = c.g
        fogColor.b = c.b
      }

      let clock       = new Clock(),
          buffered    = false,
          fLow        = 0.1, 
          fHigh       = 0.8,
          ιnclination = 0,
          distance    = 400000,
          hsl         = {h:0, s:0, l:0},
          valNorm, δ, ι, ϑ, φ

      terrainShader.uniforms.ambientLight.value = new Color(0x000000)
          

      let c0 = new Color( 0x0b0b0b ), 
          c1 = new Color( 0x333333 ), 
          c2 = new Color( 0x767676 ), 
          c3 = new Color( 0xaaaaaa ), 
          c4 = new Color( 0xfcfcfc ) 
      console.log('here we go —→')

      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule
        if( config.useControls ) controls.update()
        δ = clock.getDelta()
        ιnclination += δ * 0.24
        ι = (Math.sin(ιnclination) + 1) / 4 * 1.033

        ϑ = Math.PI * ( ι - 0.5 ),
        φ = 2 * Math.PI * ( 0.28 - 0.5 )

        sun.position.x = distance * Math.cos( φ )
        sun.position.y = distance * Math.sin( φ ) * Math.sin( ϑ )
        sun.position.z = distance * Math.sin( φ ) * Math.cos( ϑ )
        sky.uniforms.sunPosition.value.copy( sun.position ) 

        fgScene.fog.color = fogColor 
        sun.color         = fogColor 
        fogColor.getHSL(hsl)
        
        // terrainShader.uniforms.ambientLight.value = fogColor 


        terrainShader.uniforms.uBaseColor.value  = c0.setHSL(hsl.h, hsl.s, 0.91)
        // terrainShader.uniforms.uLineColor1.value = c1.setHSL(hsl.h, hsl.s, 0.33)
        // terrainShader.uniforms.uLineColor2.value = c2.setHSL(hsl.h, hsl.s, 5)
        // terrainShader.uniforms.uLineColor3.value = c3.setHSL(hsl.h, hsl.s, 0.66)
        // terrainShader.uniforms.uLineColor4.value = c4.setHSL(hsl.h, hsl.s, 0.89)

        // pivotPoint.rotation.y += 0.02

        // render the buffer composition
        // which creates the height and normal maps for our terrain shader.
        // The maps get written into the height and normal targets (via the save passes)
        // defined in a prior promise
        // do it here (and only once) —after the textures have been wired
        if(!buffered) {
          // obacht clear the buffer to black before rendering the texture
          renderer.setClearColor( 0x000000 )
          bufferComposition.render( δ )
          renderer.setClearColor( clearColor )
          buffered = true }
        
        renderer.setClearColor( 0xffffff )
        composition.render(δ) 
        textureComposition.render(δ) 
        _getPixels()
      }
      
      _render() // here we go…
    })}

export default drei