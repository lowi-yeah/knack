import {AmbientLight,
        Box3,
        BoxGeometry,
        Clock,
        Color,
        DirectionalLight, 
        DoubleSide,
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
        Spherical,
        SpotLight,
        TextGeometry,
        TextureLoader,
        UniformsUtils,
        Vector2,
        Vector3,
        WebGLRenderer,
        WebGLRenderTarget }   from 'three'

import {BloomPass,
        ClearPass,
        DepthPass,
        DotScreenPass,
        EffectComposer, 
        FilmPass,
        GlitchPass,
        GodRaysPass,
        PixelationPass,
        RenderPass,
        SavePass,
        ShaderPass,
        SMAAPass,
        TexturePass}          from 'postprocessing'

import {scaleLinear}          from 'd3-scale'

import fontLoader             from './lib/font-loader'
import objLoader              from './lib/obj-loader'
import ShaderExtras           from './lib/shader-extras'
import OrbitControls          from './lib/orbit-controls'
import TextSprite             from './lib/text-sprite'
import BirdGeometry           from './lib/bird-geometry' 
import GPUComputationRenderer from './lib/gpu-computation-renderer'

import SkyΣ                   from './shader/sky'
import BirdΣ                  from './shader/birds'

import initGui                from './drei/gui' 


let defaultConfig  = {particles:  { exponent: 3,
                                    bounds: 1200 }, 
                      camera:     { lookAtSun:    false,
                                    radius: 800,
                                    fov: 75 },
    
                      sky:        { turbidity:        [10, 1, 20, 0.1],
                                    rayleigh:         [1, 0, 4, 0.001],
                                    mieCoefficient:   [0.02, 0, 0.1, 0.001],
                                    mieDirectionalG:  [0.8, 0, 1, 0.001],
                                    luminance:        [1, 0, 2, 0.001],
                                    // 0.5127441406250001 is where ths sun disk appears for the first time
                                    // inclination:      [0.5127, 0.2, 0.515, 0.0001],   // elevation / inclination
                                    inclination:      [0.47, 0.2, 0.515, 0.0001],   // elevation / inclination
                                    azimuth:          [0.25, 0, 1, 0.0001, false],  // Facing front,
                                    distance:         [2000, false],
                                    sun:              [true, false] },
          
                      birds:      { seperation: [20.0, 0, 100, 1],
                                    alignment:  [20.0, 0, 100, 0.001],
                                    cohesion:   [20.0, 0, 100, 0.025],
                                    freedom:    [0.75, false] } }


// todo: put these somewhere sensible
let DEBUG                   = true,
    dimensions              = { width:  window.innerWidth, 
                                height: window.innerHeight},
    resolution              = { width:  1024,  
                                height: 1024},
    renderTargetParameters  = { minFilter:    LinearFilter, 
                                magFilter:    LinearFilter, 
                                format:       RGBAFormat, 
                                stencilBufer: true },
    lightIntensity          = 1.0,
    mouseX                  = 0, 
    mouseY                  = 0,
    windowHalfX             = dimensions.width / 2,
    windowHalfY             = dimensions.height / 2
    

function _degrees(δ) {return ThreeMath.DEG2RAD * δ}
function _rad(δ) {return ThreeMath.RAD2DEG * δ}

function _sphericalToCartesian(spherical) {
  let x = spherical.radius * Math.sin(spherical.theta) * Math.cos(-spherical.phi),
      y = spherical.radius * Math.sin(spherical.theta) * Math.sin(-spherical.phi),
      z = spherical.radius * Math.cos(spherical.theta)
  return new Vector3(x, y, z) }

function _fillPositionTexture( texture, bounds ) {

  function _random() {
    let o = (Math.random() < 0.5) ? 0 : bounds,
        p = Math.random() * bounds
    if(o === 0) return o - p
    else return o + p }

  let theArray = texture.image.data
  for ( var k = 0; k < theArray.length; k += 4 ) {
    let x = _random(),
        y = _random(),
        // birds appear from the distance
        z = -bounds - Math.random() * bounds

    theArray[ k + 0 ] = x
    theArray[ k + 1 ] = y
    theArray[ k + 2 ] = z
    theArray[ k + 3 ] = 1 }}

function _fillVelocityTexture( texture ) {
  var theArray = texture.image.data;  
  for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
    var x = Math.random() - 0.5
    var y = Math.random() - 0.5
    var z = Math.random() - 0.5
    theArray[ k + 0 ] = x * 10
    theArray[ k + 1 ] = y * 10
    theArray[ k + 2 ] = z * 10
    theArray[ k + 3 ] = 1 }}

function _initComputeRenderer(renderer, computeTextureSize, bounds) {
  let gpuCompute  = new GPUComputationRenderer( 
                          computeTextureSize, 
                          computeTextureSize, 
                          renderer ),
      dtPosition  = gpuCompute.createTexture(),
      dtVelocity  = gpuCompute.createTexture()

  _fillPositionTexture( dtPosition, bounds )
  _fillVelocityTexture( dtVelocity )

  let velocityVariable  = gpuCompute.addVariable( 'textureVelocity', 
                            BirdΣ.velocity, dtVelocity ),
      positionVariable  = gpuCompute.addVariable( 'texturePosition', 
                            BirdΣ.position, dtPosition )

  gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] )
  gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] )

  let positionUniforms = positionVariable.material.uniforms,
      velocityUniforms = velocityVariable.material.uniforms

  positionUniforms.time                     = { value: 0.0 }
  positionUniforms.delta                    = { value: 0.0 }
  velocityUniforms.time                     = { value: 1.0 }
  velocityUniforms.delta                    = { value: 0.0 }
  velocityUniforms.testing                  = { value: 1.0 }
  velocityUniforms.seperationDistance       = { value: 1.0 }
  velocityUniforms.alignmentDistance        = { value: 1.0 }
  velocityUniforms.cohesionDistance         = { value: 1.0 }
  velocityUniforms.freedomFactor            = { value: 1.0 }
  velocityUniforms.predator                 = { value: new Vector3() }
  velocityVariable.material.defines.BOUNDS  = bounds.toFixed( 2 )

  velocityVariable.wrapS = RepeatWrapping
  velocityVariable.wrapT = RepeatWrapping
  positionVariable.wrapS = RepeatWrapping
  positionVariable.wrapT = RepeatWrapping

  var error = gpuCompute.init()
  if ( !_.isNil(error) ) { console.error( error ) }
  return {gpuCompute, positionUniforms, velocityUniforms, positionVariable, velocityVariable} }

function _intitBirds(computeTextureSize) {
  var geometry  = new BirdGeometry(computeTextureSize),
      shader    = { uniforms: UniformsUtils.clone( BirdΣ.bird.uniforms ),
                    vertexShader:   BirdΣ.bird.vertexShader,
                    fragmentShader: BirdΣ.bird.fragmentShader,
                    side: DoubleSide,
                    lights: true,
                    fog: true},
      material  = new ShaderMaterial( shader ),
      mesh      = new Mesh( geometry, material )

  shader.uniforms.diffuse.value   = new Color(0xffffff)
  shader.uniforms.specular.value  = new Color(0xffffff)
  shader.uniforms.shininess.value = 100
  return {shader, mesh} }

function _updateSky(state, skyShader, sun) {
  let theta = Math.PI * ( state.sky.inclination - 0.5 ),
      phi   = 2 * Math.PI * ( state.sky.azimuth - 0.5 )
  
  skyShader.uniforms.turbidity.value        = state.sky.turbidity
  skyShader.uniforms.rayleigh.value         = state.sky.rayleigh
  skyShader.uniforms.luminance.value        = state.sky.luminance
  skyShader.uniforms.mieCoefficient.value   = state.sky.mieCoefficient
  skyShader.uniforms.mieDirectionalG.value  = state.sky.mieDirectionalG
  
  sun.position.x = state.sky.distance * Math.cos( phi )
  sun.position.y = state.sky.distance * Math.sin( phi ) * Math.sin( theta )
  sun.position.z = state.sky.distance * Math.sin( phi ) * Math.cos( theta )
  sun.lookAt(new Vector3())
  skyShader.uniforms.sunPosition.value.copy( sun.position ) 

  state.camera.hasChanged = true
  state.camera.spherical.phi = phi
  state.camera.spherical.theta = theta 
}

function _updateBirdConfig(state, velocityUniforms) {
  velocityUniforms.seperationDistance.value = state.birds.seperation
  velocityUniforms.alignmentDistance.value  = state.birds.alignment
  velocityUniforms.cohesionDistance.value   = state.birds.cohesion
  velocityUniforms.freedomFactor.value      = state.birds.freedom }

function drei(domId, customConfig) {

  console.log('initializing drei')

  let config = _.merge(defaultConfig, customConfig)

  // console.log('config', JSON.stringify(config, null, 2))

  // return fontLoader('/fonts/HelveticaNeue-Medium.otf', {reverseTypeface: true})
    // .then((font) => {

      // State
      // ————————————————————————————
      // gets inititalized by gui
      let state
    
      // Scene
      // ————————————————————————————
      let ratio         = dimensions.width / dimensions.height,
          scene         = new Scene(),
          camera        = new PerspectiveCamera(config.camera.fov, ratio, 2, 2000000),
          ambientLight  = new AmbientLight( 0xffffff),
          helper        = new GridHelper( 10000, 2, 0x000000, 0x000000 ),
          controls
          
      scene.fog = new Fog( 0xffffff, config.camera.radius * 1.1, config.camera.radius * 2 )
      camera.position.set(0, 0, config.camera.radius)
      scene.add(ambientLight)
      // scene.add( helper )
    
      // Renderer
      // ————————————————————————————
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      renderer.setClearColor( scene.fog.color )
    
      if(config.enable.controls) {
        controls  = new OrbitControls( camera )
        controls.target.set( 0, 0, 0 )
        controls.rotateSpeed    = 1.0
        controls.enableZoom     = false
        controls.enablePan      = false
        controls.enableDamping  = true
        // controls.keys         = [ 65, 83, 68 ] 
      }
      
      // Sky
      // ————————————————————————————
      let sunLight  = new DirectionalLight(0xffffff ),
          skyShader = new SkyΣ(),
          skyMesh   = new Mesh( skyShader.geometry, skyShader.material )
      if(config.enable.sky) {
        scene.add(sunLight)
        scene.add(skyMesh) }
    
      // Birds
      // ————————————————————————————
      let computeTextureSize  = Math.pow(2, config.particles.exponent),
          { gpuCompute, 
            positionUniforms, 
            velocityUniforms, 
            velocityVariable, 
            positionVariable} = _initComputeRenderer(renderer, 
                                  computeTextureSize, 
                                  config.particles.bounds),
          bird                = _intitBirds(computeTextureSize)
      if(config.enable.birds) scene.add(bird.mesh)

      // Bunny
      // ————————————————————————————
      let manager     = new LoadingManager(),
          onProgress  = function ( xhr ) {
                          if ( xhr.lengthComputable ) {
                            let percentComplete = xhr.loaded / xhr.total * 100
                            console.log( Math.round(percentComplete, 2) + '% downloaded' )}},
          onError     = function ( xhr ) { console.log('error', xhr) },
          loader      = new objLoader( manager ),
          scale       = 1024

      manager.onProgress = function ( item, loaded, total ) { console.log( item, loaded, total ) }

      loader.load( 'obj/bunny.obj', function ( bunny ) {
        console.log('bunny', bunny)
        // bunny.position.y = -100
        // bunny.position.z = 400
        bunny.scale.set( scale, scale, scale )
        // bunny.position.set( 0 )
        scene.add( bunny )

        let bbox = new Box3().setFromObject(bunny)
        console.log('bbox', bbox)

      }, onProgress, onError )

      // Event handlers
      // ————————————————————————————————
      document.addEventListener( 'mousemove', (event) => {
                                    mouseX = event.clientX - windowHalfX
                                    mouseY = event.clientY - windowHalfY }, false )
      document.addEventListener( 'touchstart', (event) => {
                                    if ( event.touches.length === 1 ) {
                                      event.preventDefault()
                                      mouseX = event.touches[ 0 ].pageX - windowHalfX
                                      mouseY = event.touches[ 0 ].pageY - windowHalfY }}, false)
    
      document.addEventListener( 'touchmove', (event) => {
                                    if ( event.touches.length === 1 ) {
                                      event.preventDefault()
                                      mouseX = event.touches[ 0 ].pageX - windowHalfX
                                      mouseY = event.touches[ 0 ].pageY - windowHalfY }}, false )
    
      document.addEventListener( 'keydown', (event) => {
                                    if(event.key === 'Alt') 
                                      document.getElementById('rotate-indicator')
                                        .classList.add('active') }, false )
    
      document.addEventListener( 'keyup', (event) => {
                                    if(event.key === 'Alt') 
                                      document.getElementById('rotate-indicator')
                                        .classList.remove('active') }, false )

      window.addEventListener( 'resize', (event) => {
                                    dimensions.width = window.innerWidth
                                    dimensions.height = window.innerHeight
                                    renderer.setSize( dimensions.width, dimensions.height )
                                    camera.aspect = dimensions.width / dimensions.height
                                    camera.updateProjectionMatrix() }, false )

      // Compose
      // ————————————————————————————————
      let renderTarget    = new WebGLRenderTarget( dimensions.width, dimensions.height ),
          composition     = new EffectComposer( renderer, renderTarget ),
          scenePass       = new RenderPass( scene, camera ),
          pixelationPass  = new PixelationPass(12),
          dotScreenPass   = new DotScreenPass({}),
          filmPass        = new FilmPass({greyscale:          false,
                                          sepia:              false,
                                          vignette:           false,
                                          eskil:              false,
                                          screenMode:         true,
                                          scanlines:          true,
                                          noise:              true,
                                          noiseIntensity:     0.5,
                                          scanlineIntensity:  0.5,
                                          scanlineDensity:    1.0,
                                          greyscaleIntensity: 1.0,
                                          sepiaIntensity:     1.0,
                                          vignetteOffset:     1.0,
                                          vignetteDarkness:   1.0 }),
          bloomPass       = new BloomPass( 0.6 ),

          bleachShader    = { uniforms:       UniformsUtils.clone( ShaderExtras[ 'bleachbypass' ].uniforms ),
                              vertexShader:   ShaderExtras[ 'bleachbypass' ].vertexShader,
                              fragmentShader: ShaderExtras[ 'bleachbypass' ].fragmentShader},
          bleachMaterial  = new ShaderMaterial(bleachShader),
          bleachPass      = new ShaderPass( bleachMaterial ),
          

          hBlurShader     = { uniforms:       UniformsUtils.clone( ShaderExtras[ 'horizontalTiltShift' ].uniforms ),
                              vertexShader:   ShaderExtras[ 'horizontalTiltShift' ].vertexShader,
                              fragmentShader: ShaderExtras[ 'horizontalTiltShift' ].fragmentShader},
          hBlurMaterial   = new ShaderMaterial(hBlurShader),
          hblurPass       = new ShaderPass( hBlurMaterial ),

          vBlurShader     = { uniforms:       UniformsUtils.clone( ShaderExtras[ 'verticalTiltShift' ].uniforms ),
                              vertexShader:   ShaderExtras[ 'verticalTiltShift' ].vertexShader,
                              fragmentShader: ShaderExtras[ 'verticalTiltShift' ].fragmentShader},
          vBlurMaterial   = new ShaderMaterial(vBlurShader),
          vblurPass       = new ShaderPass( vBlurMaterial ),


          smaaPass        = new SMAAPass(window.Image),

          bluriness       = 4

        hBlurShader.uniforms.h.value = bluriness / dimensions.width
        hBlurShader.uniforms.r.value = 0.5
        vBlurShader.uniforms.v.value = bluriness / dimensions.height
        vBlurShader.uniforms.r.value = 0.5

      composition.addPass( scenePass )
      composition.addPass( hblurPass )
      composition.addPass( vblurPass )
      // composition.addPass( smaaPass )

      // scenePass.renderToScreen = true
      vblurPass.renderToScreen = true
      
      // GUI
      // ————————————————————————————

      let guiConfig = {}
      if(config.enable.birds) 
        guiConfig.birds = { items: config.birds,
                            onChange: () => {_updateBirdConfig(state, velocityUniforms)},
                            open: false}

      if(config.enable.sky) 
        guiConfig.sky = { items: config.sky,
                          onChange: () => {_updateSky(state, skyShader, sunLight)},
                          open: false}

      state = initGui( guiConfig, config.enable.gui )
      state.camera = {spherical: new Spherical(config.cameraRadius, 0, 0),
                      hasChanged: true }

      if(config.enable.birds) _updateBirdConfig(state, velocityUniforms)
      if(config.enable.sky) _updateSky(state, skyShader, sunLight)

      
      // run…
      // ————————————————————————————
      let clock = new Clock(), δ,
          last  = performance.now(),
          now
      console.log('here we go —→')
      function _render() {
        // reschedule
        requestAnimationFrame(_render) 


        // update controls
        // if( controls ) controls.update()
    
        // timing
        now = performance.now();
        δ = (now - last) / 1000
        if (δ > 1) δ = 1 // safety cap on large deltas
        last = now

        if(config.enable.birds){
          // update uniforms  
          // position  
          positionUniforms.time.value   = now
          positionUniforms.delta.value  = δ
          // velocity
          velocityUniforms.time.value   = now
          velocityUniforms.delta.value  = δ
          // bird
          bird.shader.uniforms.time.value = now
          bird.shader.uniforms.delta.value = δ
      
          velocityUniforms.predator.value.set( 0.5 * mouseX / windowHalfX, - 0.5 * mouseY / windowHalfY, 0 )
          mouseX = 10000
          mouseY = 10000
      
          gpuCompute.compute()
      
          bird.shader.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture
          bird.shader.uniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture }
        
        composition.render(δ)

      }
      
      // composition.render(0)
      _render() 


      //                _      _
      //  _  _ _ __  __| |__ _| |_ ___
      // | || | '_ \/ _` / _` |  _/ -_)
      //  \_,_| .__/\__,_\__,_|\__\___|
      //      |_|
      let sunΣ              = scaleLinear()
                                .domain([0, 1])
                                .range([config.sky.inclination[0], config.sky.inclination[1]])
                                .clamp(true),
          rayleighΣ         = scaleLinear()
                                .domain([0, 1])
                                .range([config.sky.rayleigh[0], config.sky.inclination[2]])
                                .clamp(true),
          mieCoefficientΣ   = scaleLinear()
                              .domain([0, 1])
                              .range([config.sky.mieCoefficient[0], config.sky.mieCoefficient[2]])
                              .clamp(true),
          mieDirectionalGΣ  = scaleLinear()
                                .domain([0, 1])
                                .range([config.sky.mieDirectionalG[0], config.sky.mieDirectionalG[1]])
                                .clamp(true)
  
      function update({top, left}) {
        if(!_.isNil(top)) {
          state.sky.inclination = sunΣ(top)
          state.sky.rayleigh = rayleighΣ(top)
          state.sky.mieCoefficient = mieCoefficientΣ(top)
          state.sky.mieDirectionalG = mieDirectionalGΣ(top)
          _updateSky(state, skyShader, sunLight)
          // camera.updateProjectionMatrix() 
        }

        if(!_.isNil(left)) {
          camera.rotation.y = -2 * Math.PI * left
          camera.updateProjectionMatrix() 
          
          // state.sky.inclination = sunΣ(left)
          // state.sky.rayleigh = rayleighΣ(left)
          // state.sky.mieCoefficient = mieCoefficientΣ(left)
          // state.sky.mieDirectionalG = mieDirectionalGΣ(left)
          // _updateSky(state, skyShader, sunLight)
        }
      }
      return update }
      // )} // font loader is disabled. and so is its promise



export default drei