import {AmbientLight,
        BoxGeometry,
        Clock,
        Color,
        DirectionalLight, 
        FlatShading,
        Fog,
        FogExp2,
        FontLoader,
        GridHelper,
        HemisphereLight,
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
        PCFSoftShadowMap,
        PerspectiveCamera,
        PlaneBufferGeometry,
        PlaneGeometry,
        PointLight,
        RepeatWrapping,
        RGBFormat,
        RGBAFormat,
        Scene,
        ShaderMaterial,
        SmoothShading,
        SphereBufferGeometry,
        SphereGeometry,
        SpotLight,
        TextGeometry,
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

import fontLoader           from './lib/font-loader'
import ShaderExtras         from './lib/shader-extras'
import OrbitControls        from './lib/orbit-controls'
import SkyΣ                 from './shader/sky'
import gμi                  from './drei/gui' 

let config  = { wireframe:    false,
                useControls:  true, 
                shadows:      false}

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



function _loadFont() {
  return }


function drei(domId) {
  console.log('initialzing drei')

  fontLoader('/fonts/HelveticaNeue-Medium.otf', {reverseTypeface: true})
    .then((font) => {

      console.log('font', font)

      let renderer = new WebGLRenderer({antialiasing:true})
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      // renderer.context.getExtension('OES_texture_float')
      // renderer.context.getExtension('OES_texture_float_linear')
      renderer.setClearColor( 0xacacac )

      if(config.shadows) {
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = PCFSoftShadowMap }

      let ratio     = dimensions.width / dimensions.height,
          scene     = new Scene(),
          camera    = new PerspectiveCamera(55, ratio, 2, 2000000),
          helper    = new GridHelper( 10000, 2, 0xffffff, 0xffffff )
          
      scene.fog = new Fog( 0x050505, 1000, 4000 )
      camera.position.set(0, 0, 0)
      camera.lookAt(new Vector3())

      if(config.useControls) {
        let controls  = new OrbitControls( camera )
        controls.target.set( 0, 0, 0 )
        controls.rotateSpeed  = 1.0
        controls.zoomSpeed    = 1.2
        controls.panSpeed     = 0.8
        controls.keys         = [ 65, 83, 68 ] }
      
      

      let flatMaterial    = new MeshPhongMaterial({ color: 0xffffff,
                                                    shading: FlatShading }),
          smoothMaterial  = new MeshLambertMaterial({ color: 0xffffff,
                                                      shading: SmoothShading,
                                                      wireframe:false,
                                                      light:true,
                                                      fog:true }),
          sunLight          = new SpotLight(0xffffff),
          sky             = new SkyΣ(),
          skyMesh         = new Mesh( sky.geometry, sky.material ),
          planeGeometry   = new PlaneBufferGeometry( 4000, 2000, 8, 8 ),
          planeMesh       = new Mesh(planeGeometry, smoothMaterial),
          textGeom        = new TextGeometry( 'KNACK', {font: font,
                                                        size: 80,
                                                        height: 0,
                                                        curveSegments: 12,
                                                        bevelEnabled: false}),
          textMesh        = new Mesh( textGeom, flatMaterial )

      //Set up shadow properties for the light
      sunLight.shadow.mapSize.width   = 1024 // default
      sunLight.shadow.mapSize.height  = 1024 // default
      sunLight.shadow.camera.near     = 200 
      sunLight.shadow.camera.far      = 8000
      sunLight.position.set( 400, 400, 400 )
      sunLight.lookAt( new Vector3() )
      sunLight.castShadow = true
      // scene.add( sunLight )

      // initialize the GUI
      if(!_.isNil(sky)) gμi(sky, sunLight)

      let hLight = new DirectionalLight(0xbada55)
      hLight.position.set( 0, 0, 800 )
      hLight.lookAt( new Vector3() )
      hLight.castShadow = false
      // scene.add(hLight)
     
      skyMesh.castShadow    = false
      skyMesh.receiveShadow = false
      scene.add(skyMesh)

      textMesh.position.set(-200, -20, -1000)
      textMesh.castShadow     = true
      textMesh.receiveShadow  = false
      scene.add(textMesh)
      
      planeMesh.rotation.x    = _degrees(-90)
      planeMesh.receiveShadow = true
      planeMesh.castShadow    = false
      // scene.add(planeMesh)
    
      // scene.add( helper )

      // Compose
      // ————————————————————————————————
      let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height ),
          composition   = new EffectComposer( renderer, renderTarget ),
          scenePass     = new RenderPass( scene, camera )
    
      composition.addPass( scenePass )
      scenePass.renderToScreen = true
     
      let clock = new Clock(), δ, τ
      console.log('here we go —→')

      // Render
      // ————————————————————————————————
      function _render() {
        requestAnimationFrame(_render) // reschedule
        // if( config.useControls ) controls.update()
        δ = clock.getDelta()
        renderer.render(scene, camera)
        // textMesh.rotation.y += 0.1 * δ
      }

      _render() // here we go…
  })}

export default drei