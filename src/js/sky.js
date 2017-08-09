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
                useControls:  false}

let DEBUG                   = true,
    dimensions              = { width: window.innerWidth, height: window.innerHeight},
    resolution              = { width: 1024,  height: 1024},
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
  scene.add( sky.mesh )
  scene.add( sun )
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
                                shading:        FlatShading },
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
      terrainShader.uniforms.uDisplacementScale.value = 320

      terrainShader.uniforms.diffuse.value.setHex(      0x383838 )
      terrainShader.uniforms.specular.value.setHex(     0xffffff )
      terrainShader.uniforms.shininess.value          = 98

      // textureShader.uniforms.tDiffuse.value = maps.normal.texture
      textureShader.uniforms.tDiffuse.value = maps.height.texture
      // textureShader.uniforms.tDiffuse.value = textures.heightmap

      // let skyShader   = { uniforms:       UniformsUtils.clone( SkyΣ.SkyShader.uniforms ),
      //                     vertexShader:   SkyΣ.SkyShader.vertexShader,
      //                     fragmentShader: SkyΣ.SkyShader.fragmentShader},
      //     skyMaterial = new ShaderMaterial(skyShader),
      //     skyTarget   = new WebGLRenderTarget(resolution.width, resolution.height, 
      //                                               renderTargetParameters),
      //     opts        = { turbidity:        10,
      //                     rayleigh:         2,
      //                     mieCoefficient:   0.02,
      //                     mieDirectionalG:  0.8,
      //                     luminance:        1,
      //                     inclination:      0.36, // elevation / inclination
      //                     azimuth:          0.28, // Facing front,
      //                     sun:              true },
      //     theta       = Math.PI * ( opts.inclination - 0.5 ),
      //     phi         = 2 * Math.PI * ( opts.azimuth - 0.5 ),
      //     distance    = 400000,
      //     position    = new Vector3()

      // position.x = distance * Math.cos( phi )
      // position.y = distance * Math.sin( phi ) * Math.sin( theta )
      // position.z = distance * Math.sin( phi ) * Math.cos( theta )
      // skyShader.uniforms.sunPosition.value.copy(  position )
      // skyShader.uniforms.turbidity.value        = opts.turbidity
      // skyShader.uniforms.rayleigh.value         = opts.rayleigh
      // skyShader.uniforms.luminance.value        = opts.luminance
      // skyShader.uniforms.mieCoefficient.value   = opts.mieCoefficient
      // skyShader.uniforms.mieDirectionalG.value  = opts.mieDirectionalG

      // Scene
      // ————————————————
       let {scene, 
            camera, 
            controls}     = sςene.final(dimensions, clearColor, config.useControls),
          {sky, sun}      = _initSky(scene),
          geometryTerrain = new PlaneBufferGeometry( 6000, 6000, resolution.width, resolution.height ),
          terrain         = new Mesh( geometryTerrain,  terrainMaterial),
          icoGeometry     = new IcosahedronGeometry( 420, 2 ),
          icosahedron     = new Mesh(icoGeometry , phongMaterial)

      // initialize the GUI
      gμi(sky, sun)

      console.log('sky', sky)

      BufferGeometryUtils.computeTangents( geometryTerrain )
      // BufferGeometryUtils.computeTangents( icoGeometry )

      terrain.rotation.x  = _degrees(-90)
      terrain.position.set(0, -240, 0 )

      renderer.setClearColor( clearColor )
      scene.add( terrain )
      // scene.add( icosahedron )

      // create pointlight that that circles around the scene
      let pivotPoint    = new Object3D(),
          pointLight    = new PointLight( 0xffffff, lightIntensity ),
          dirLight      = new DirectionalLight( 0xffffff, lightIntensity )

      pivotPoint.rotation.y = _degrees(120)
      pointLight.position.set( 1600, 420, 0 )
      pointLight.lookAt( 0, 0, 0 )

      dirLight.position.set( -1600, 420, 0 )
      dirLight.lookAt( 0, 0, 0 )

      // scene.add(pivotPoint)
      // pivotPoint.add(pointLight)
      // pivotPoint.add(dirLight)

      // Compose
      // ————————————————————————————————
      let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height, renderTargetParameters ),
          composition   = new EffectComposer( renderer, renderTarget ),
          bgPass        = new RenderPass( scene, camera ),
          fgPass        = new RenderPass( scene, camera ),
          bgTarget      = new WebGLRenderTarget(resolution.width, resolution.height, renderTargetParameters),
          savePass      = new SavePass( bgTarget )
    
      terrain.visible = false
      composition.addPass( bgPass )
      composition.addPass( savePass )
      // terrain.visible = true
      composition.addPass( fgPass )

      bgPass.renderToScreen = true
      // fgPass.renderToScreen = true

      let clock     = new Clock(),
          buffered  = false,
          fLow      = 0.1, 
          fHigh     = 0.8,
          valNorm, δ

      console.log('here we go —→')

      let textureResolution   = {width: 128, height: 128},
          textureRenderer     = new WebGLRenderer(),
          textureTarget       = new WebGLRenderTarget(textureResolution.width, 
                                                      textureResolution.height,
                                                      renderTargetParameters ),
          textureComposition  = new EffectComposer( textureRenderer, textureTarget ),
          texturedPass        = new ShaderPass( sky.mesh.material )
          // texturedPass        = new TexturePass( textures.heightmap )
          // texturedPass        = new TexturePass( bgTarget.texture )

      document.getElementById('sky-texture').appendChild(textureRenderer.domElement)
      textureRenderer.setPixelRatio( window.devicePixelRatio )
      textureRenderer.setSize( textureResolution.width, textureResolution.height )
      textureComposition.addPass( texturedPass )
      texturedPass.renderToScreen = true

      let gl      = textureRenderer.context,
          pixels  = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight/2 * 3),
          color   = new Color()
      console.log('texturedPass', texturedPass)

      function _getPixels() {
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight/2, gl.RGB, gl.UNSIGNED_BYTE, pixels)
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

        color.r = c.r
        color.g = c.g
        color.b = c.b
        scene.fog.color = color
      }

      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule
        if( config.useControls ) controls.update()
        δ = clock.getDelta()

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

        composition.render(δ) 
        texturedPass.texture = bgTarget.texture
        // textureRenderer.setClearColor( 0x000000 )
        textureComposition.render(δ) 

        _getPixels()
      }
      
      _render() // here we go…
    })}

export default drei