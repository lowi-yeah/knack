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
import ShaderExtras         from './lib/shader-extras'
import OrbitControls        from './lib/orbit-controls'
import Ocean                from './lib/ocean'
import OceanShaders         from './lib/ocean-shaders'

console.log("oceanocean", Ocean)

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
        heightmap       = tl.load( '/textures/noise.png')
    loadingManager.onLoad   = () => { resolve({heightmap})}
    loadingManager.onError  = (url) => { reject('There was an error loading ' + url)}})}

function drei(domId) {
  console.log('initialzing drei')

  _loadTextures()
    .then(({textures}) => {

      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      renderer.context.getExtension('OES_texture_float')
      renderer.context.getExtension('OES_texture_float_linear')
      renderer.setClearColor( 0xacacac )

      let ratio     = dimensions.width / dimensions.height,
          scene     = new Scene(),
          camera    = new PerspectiveCamera(55, ratio, 2, 2000000),
          helper    = new GridHelper( 10000, 2, 0xffffff, 0xffffff ),
          controls  = new OrbitControls( camera )

      scene.fog = new Fog( 0x050505, 1000, 4000 )

      controls.target.set( 0, 0, 0 )
      controls.rotateSpeed  = 1.0
      controls.zoomSpeed    = 1.2
      controls.panSpeed     = 0.8
      controls.keys         = [ 65, 83, 68 ] 

      camera.position.set(450, 350, 450)
      camera.lookAt(new Vector3())

      var gsize = 512,
          res = 1024,
          gres = res / 2,
          origx = -gsize / 2,
          origz = -gsize / 2,
          ocean = new Ocean(renderer, camera, scene,
                            { USE_HALF_FLOAT : false,
                              INITIAL_SIZE : 256.0,
                              INITIAL_WIND : [10.0, 10.0],
                              INITIAL_CHOPPINESS : 1.5,
                              CLEAR_COLOR : [1.0, 1.0, 1.0, 0.0],
                              GEOMETRY_ORIGIN : [origx, origz],
                              SUN_DIRECTION : [-1.0, 1.0, 1.0],
                              OCEAN_COLOR: new Vector3(0.004, 0.016, 0.047),
                              SKY_COLOR: new Vector3(3.2, 9.6, 12.8),
                              EXPOSURE : 0.35,
                              GEOMETRY_RESOLUTION: gres,
                              GEOMETRY_SIZE : gsize,
                              RESOLUTION : res })

      ocean.materialOcean.uniforms.u_projectionMatrix = { value: camera.projectionMatrix }
      ocean.materialOcean.uniforms.u_viewMatrix       = { value: camera.matrixWorldInverse }
      ocean.materialOcean.uniforms.u_cameraPosition   = { value: camera.position }
      scene.add(ocean.oceanMesh)
      // console.log('ocean', ocean)

      let phongMaterial     = new MeshPhongMaterial({ color: 0xE8873B, 
                                                      shading: FlatShading,
                                                      shininess: 8}),
          light           = new PointLight(0xff0000, 1),
          icoGeometry     = new IcosahedronBufferGeometry( 128, 2 ),
          icosahedron     = new Mesh(icoGeometry, phongMaterial)

      light.position.set( 20, 20, 20 )
      scene.add( light )
      scene.add( helper )
      scene.add(icosahedron)

      var gui = new dat.GUI(),
          c1 = gui.add(ocean, 'size',100, 5000),
          c2 = gui.add(ocean, 'choppiness', 0.1, 4),
          c3 = gui.add(ocean, 'windX',-15, 15),
          c4 = gui.add(ocean, 'windY', -15, 15),
          c5 = gui.add(ocean, 'sunDirectionX', -1.0, 1.0),
          c6 = gui.add(ocean, 'sunDirectionY', -1.0, 1.0),
          c7 = gui.add(ocean, 'sunDirectionZ', -1.0, 1.0),
          c8 = gui.add(ocean, 'exposure', 0.0, 0.5)

      c1.onChange(function(v) { this.object.size = v
                                this.object.changed = true })
      
      c2.onChange(function (v) {this.object.choppiness = v
                                this.object.changed = true })

      c3.onChange(function (v) {this.object.windX = v
                                this.object.changed = true })

      c4.onChange(function (v) {this.object.windY = v
                                this.object.changed = true })

      c5.onChange(function (v) {this.object.sunDirectionX = v
                                this.object.changed = true })

      c6.onChange(function (v) {this.object.sunDirectionY = v
                                this.object.changed = true })

      c7.onChange(function (v) {this.object.sunDirectionZ = v
                                this.object.changed = true })

      c8.onChange(function (v) { this.object.exposure = v
                                  this.object.changed = true })

      // Compose
      // ————————————————————————————————
      // let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height ),
      //     composition   = new EffectComposer( renderer, renderTarget ),
      //     scenePass     = new RenderPass( scene, camera )
    
      // composition.addPass( scenePass )
      // scenePass.renderToScreen = true
     
      let clock = new Clock(), δ, τ
      console.log('here we go —→')

      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule
        if( config.useControls ) controls.update()
        δ = clock.getDelta()

        ocean.render(δ)
        ocean.overrideMaterial = ocean.materialOcean
        if (ocean.changed) {
          ocean.materialOcean.uniforms.u_size.value = ocean.size
          ocean.materialOcean.uniforms.u_sunDirection.value.set(ocean.sunDirectionX, 
                                                                ocean.sunDirectionY, 
                                                                ocean.sunDirectionZ )
          ocean.materialOcean.uniforms.u_exposure.value = ocean.exposure
          ocean.changed = false
        }
        ocean.materialOcean.uniforms.u_normalMap.value        = ocean.normalMapFramebuffer.texture
        ocean.materialOcean.uniforms.u_displacementMap.value  = ocean.displacementMapFramebuffer.texture
        ocean.materialOcean.uniforms.u_projectionMatrix.value = camera.projectionMatrix
        ocean.materialOcean.uniforms.u_viewMatrix.value       = camera.matrixWorldInverse
        ocean.materialOcean.uniforms.u_cameraPosition.value   = camera.position
        ocean.materialOcean.depthTest                         = true

        controls.update()

        renderer.render(scene, camera)
         }

      _render() // here we go…
  })}

export default drei