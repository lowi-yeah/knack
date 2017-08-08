import {BoxGeometry,
        Clock,
        Color,
        DirectionalLight, 
        FlatShading,
        FogExp2,
        IcosahedronGeometry,
        LinearFilter,
        LoadingManager,
        Math as ThreeMath,
        Mesh,
        MeshBasicMaterial,
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
import gμi                  from './drei/gui'
import terrainΣ             from './shader/simple-terrain'
import textureΣ             from './shader/texture'
import normalΣ              from './shader/normal-map'
import SkyΣ                 from './shader/sky'


let config  = { wireframe:    false,
                useControls:  true,
                glitchNoise:  false,
                updateNoise:  false}

let DEBUG                   = true,
    dimensions              = { width: window.innerWidth, height: window.innerHeight},
    resolution              = { width: 256,  height: 256},
    renderTargetParameters  = { minFilter: LinearFilter, 
                                magFilter: LinearFilter, 
                                format: RGBAFormat, 
                                stencilBufer: false },
    lightIntensity          = 1.0

let clearColor = new Color()
clearColor.setHSL(0.102, 0.64, 0.825)

function _degrees(δ) {return ThreeMath.DEG2RAD * δ}

function _initSky(scene) {
  // Add Sky Mesh
  let sky = new SkyΣ(),
      sun = new PointLight( 0xffffff, 1)
  sun.position.y = - 700000
  sun.visible = false
  // scene.add( sky.mesh )
  // scene.add( sun )
  return {sky, sun}}

function _loadTextures() {
  return new Promise((resolve, reject) => { 
    let loadingManager  = new LoadingManager(),
        tl              = new TextureLoader( loadingManager ),
        // heightmap       = tl.load( '/textures/gradient.jpg')
        heightmap       = tl.load( '/textures/europa.jpg')
        // heightmap       = tl.load( '/textures/alpenvorland.png')
    loadingManager.onLoad   = () => { resolve({heightmap})}
    loadingManager.onError  = (url) => { reject('There was an error loading ' + url)}})}

function drei(domId) {
  console.log('initialzing drei')

  _loadTextures()
    .then((textures) => {
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )


      let normalShader      = { uniforms:       UniformsUtils.clone( normalΣ.uniforms ),
                                vertexShader:   normalΣ.vertexShader,
                                fragmentShader: normalΣ.fragmentShader},
          normalMaterial    = new ShaderMaterial(normalShader)

      // no need to set the heightmap, as it will be set within the shader pass
      // normalShader.uniforms.tDiffuse.value  = textures.heightmap

      let s = new Scene(), 
          c = new PerspectiveCamera()
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
                                shading:        FlatShading
                              },
          terrainMaterial   = new ShaderMaterial(terrainShader),
  
          phongMaterial     = new MeshPhongMaterial({ color: 0xE8873B, 
                                                      shading: FlatShading,
                                                      shininess: 8}),
          textureShader     = { uniforms:       UniformsUtils.clone( textureΣ.uniforms ),
                                vertexShader:   textureΣ.vertexShader,
                                fragmentShader: textureΣ.fragmentShader},
          ςTextureMaterial  = new ShaderMaterial(textureShader),

          textureMaterial   = new MeshPhongMaterial({ color: 0xE8873B, 
                                                      shading: FlatShading,
                                                      shininess: 8,
                                                      map: maps.height.texture})
        
      // textureShader.uniforms.tDiffuse.value = maps.normal.texture
      terrainShader.uniforms.tNormal.value            = maps.normal.texture
      terrainShader.uniforms.uNormalScale.value       = 3.5
      terrainShader.uniforms.tDisplacement.value      = maps.height.texture
      terrainShader.uniforms.diffuse.value.setHex(      0xA6C85D5 )
      terrainShader.uniforms.specular.value.setHex(     0xffffff )
      terrainShader.uniforms.shininess.value          = 30
      terrainShader.uniforms.uDisplacementScale.value = 320

      terrainShader.uniforms.tDiffuse1.value          = null
      terrainShader.uniforms.tDiffuse2.value          = null
      terrainShader.uniforms.tSpecular.value          = null
      terrainShader.uniforms.tDetail.value            = null
      terrainShader.uniforms.enableDiffuse1.value     = false
      terrainShader.uniforms.enableDiffuse2.value     = false
      terrainShader.uniforms.enableSpecular.value     = false
      terrainShader.uniforms.uRepeatOverlay.value.set(  6, 6 )

      // textureShader.uniforms.tDiffuse.value = maps.normal.texture
      textureShader.uniforms.tDiffuse.value = maps.height.texture
      // textureShader.uniforms.tDiffuse.value = textures.heightmap

      // Scene
      // ————————————————
       let {scene, 
            camera, 
            controls}     = sςene.final(dimensions, clearColor, config.useControls),
          {sky, sun}      = _initSky(scene),
          geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 256, 256 ),
          terrain         = new Mesh( geometryTerrain,  terrainMaterial),
          icoGeometry     = new IcosahedronGeometry( 1200, 2 ),
          icosahedron     = new Mesh(icoGeometry , ςTextureMaterial)

      // initialize the GUI
      gμi(sky, sun)

      BufferGeometryUtils.computeTangents( geometryTerrain )
      // BufferGeometryUtils.computeTangents( icoGeometry )

      terrain.rotation.x  = _degrees(-90)
      terrain.visible     = true
      terrain.position.set(0, -240, 0 )

      renderer.setClearColor( clearColor )
      scene.add( terrain )
      scene.add( icosahedron )

      // Compose
      // ————————————————————————————————
      let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height, renderTargetParameters ),
          composition   = new EffectComposer( renderer, renderTarget ),
          renderModel   = new RenderPass( scene, camera )
    
      composition.addPass( renderModel )
      renderModel.renderToScreen = true
      // shaderPass.renderToScreen = true

      let clock     = new Clock(),
          buffered  = false,
          fLow      = 0.1, 
          fHigh     = 0.8,
          valNorm, δ

      console.log('here we go —→')

  // let pointLight = new PointLight( 0xffffff, 1.5 )
  // point.position.set( 1600, 1600, 1600 );
  // scene.add( point )
  
      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule
        if( config.useControls ) controls.update()
        δ = clock.getDelta()

        // terrainShader.uniforms.uNormalScale.value   = ThreeMath.mapLinear( valNorm, 0, 1, 0.6, 3.5 )
        

        // lightVal  = ThreeMath.clamp( lightVal + 0.5 * δ * lightDir, fLow, fHigh )
        // valNorm   = ( lightVal - fLow ) / ( fHigh - fLow )
        // scene.fog.color.setHSL( 0.1, 0.5, lightVal )
        // renderer.setClearColor( scene.fog.color )
        
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
        
        composition.render(δ) 
      }
      
      _render() // here we go…
    })}

export default drei