import {AmbientLight,
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
        RenderPass,
        SavePass,
        ShaderPass,
        TexturePass}          from 'postprocessing'

import fontLoader             from './lib/font-loader'
import ShaderExtras           from './lib/shader-extras'
import OrbitControls          from './lib/orbit-controls'
import GPUComputationRenderer from './lib/gpu-computation-renderer'
import SkyΣ                   from './shader/sky'
import BirdΣ                  from './shader/birds'
import BirdGeometry           from './lib/bird-geometry' 
import initGui                from './drei/gui' 

let config  = { wireframe:    false,
                useControls:  true,
                lookAtSun:    false,
                cameraRadius: 400,
                sky: {turbidity:        [10, 1, 20, 0.1],
                      rayleigh:         [1, 0, 4, 0.001],
                      mieCoefficient:   [0.02, 0, 0.1, 0.001],
                      mieDirectionalG:  [0.8, 0, 1, 0.001],
                      luminance:        [1, 0, 2, 0.001],
                      inclination:      [0.50, 0.0001, 0.6, 0.0001],   // elevation / inclination
                      azimuth:          [0.25, 0, 1, 0.0001, false],  // Facing front,
                      distance:         [4000, false],
                      sun:              [true, false] },

                birds: {seperation: [20.0, 0, 100, 1],
                        alignment:  [20.0, 0, 100, 0.001],
                        cohesion:   [20.0, 0, 100, 0.025],
                        freedom:    [0.75, false] }}


// todo: put these somewhere sensible
let DEBUG                   = true,
    dimensions              = { width: window.innerWidth, height: window.innerHeight},
    resolution              = { width: 1024,  height: 1024},
    renderTargetParameters  = { minFilter: LinearFilter, 
                                magFilter: LinearFilter, 
                                format: RGBAFormat, 
                                stencilBufer: true },
    lightIntensity          = 1.0,
    mouseX                  = 0, 
    mouseY                  = 0,
    windowHalfX             = dimensions.width / 2,
    windowHalfY             = dimensions.height / 2,
    BOUNDS                  = 800, 
    BOUNDS_HALF             = BOUNDS / 2,
    computeTextureSize      = 8

function _degrees(δ) {return ThreeMath.DEG2RAD * δ}

function _sphericalToCartesian(spherical) {
  let x = spherical.radius * Math.sin(spherical.theta) * Math.cos(-spherical.phi),
      y = spherical.radius * Math.sin(spherical.theta) * Math.sin(-spherical.phi),
      z = spherical.radius * Math.cos(spherical.theta)
  return new Vector3(x, y, z) }

function _fillPositionTexture( texture ) {
  var theArray = texture.image.data;
  for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {
    var x = Math.random() * BOUNDS - BOUNDS_HALF
    var y = Math.random() * BOUNDS - BOUNDS_HALF
    var z = Math.random() * BOUNDS - BOUNDS_HALF
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

function _initComputeRenderer(renderer) {
  let gpuCompute  = new GPUComputationRenderer( 
                          computeTextureSize, 
                          computeTextureSize, 
                          renderer ),
      dtPosition  = gpuCompute.createTexture(),
      dtVelocity  = gpuCompute.createTexture()

  _fillPositionTexture( dtPosition )
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
  velocityVariable.material.defines.BOUNDS  = BOUNDS.toFixed( 2 )

  velocityVariable.wrapS = RepeatWrapping
  velocityVariable.wrapT = RepeatWrapping
  positionVariable.wrapS = RepeatWrapping
  positionVariable.wrapT = RepeatWrapping

  var error = gpuCompute.init()
  if ( !_.isNil(error) ) { console.error( error ) }
  return {gpuCompute, positionUniforms, velocityUniforms, positionVariable, velocityVariable} }

function _intitBirds() {
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
  state.camera.spherical.theta = theta }

function _updateBirdConfig(state, velocityUniforms) {
  velocityUniforms.seperationDistance.value = state.birds.seperation
  velocityUniforms.alignmentDistance.value  = state.birds.alignment
  velocityUniforms.cohesionDistance.value   = state.birds.cohesion
  velocityUniforms.freedomFactor.value      = state.birds.freedom }

function drei(domId) {
  fontLoader('/fonts/HelveticaNeue-Medium.otf', {reverseTypeface: true})
  .then((font) => {// State
      // ————————————————————————————
      // gets inititalized by gui
      let state

      console.log('font', font)
    
      // Scene
      // ————————————————————————————
      let ratio     = dimensions.width / dimensions.height,
          scene     = new Scene(),
          camera    = new PerspectiveCamera(75, ratio, 2, 2000000),
          helper    = new GridHelper( 10000, 2, 0x000000, 0x000000 ),
          controls
          
      scene.fog = new Fog( 0xffffff, 100, 1000 )
      camera.position.set(0, 0, config.cameraRadius)
      // scene.add( helper )
    
      // Renderer
      // ————————————————————————————
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      renderer.setClearColor( scene.fog.color )
    
      if(config.useControls) {
        controls  = new OrbitControls( camera )
        controls.target.set( 0, 0, 0 )
        controls.rotateSpeed  = 1.0
        controls.zoomSpeed    = 1.2
        controls.panSpeed     = 0.8
        controls.keys         = [ 65, 83, 68 ] }
      
      // Sky
      // ————————————————————————————
      let sunLight  = new DirectionalLight(0xffffff),
          skyShader = new SkyΣ(),
          skyMesh   = new Mesh( skyShader.geometry, skyShader.material )
      scene.add( sunLight )
      scene.add(skyMesh)
    
      // Icosahedron
      // ————————————————————————————
      let icoMaterial = new MeshPhongMaterial({ color:      0xE8873B, 
                                                shading:    FlatShading,
                                                shininess:  8,
                                                wireframe:  false}),
          icoGeometry = new IcosahedronGeometry( 64, 1 ),
          icosahedron = new Mesh(icoGeometry , icoMaterial)
      // scene.add(icosahedron)

      // Type
      // ————————————————————————————
      let typeMaterial = new MeshPhongMaterial({color:      0xE8873B, 
                                                shading:    FlatShading,
                                                shininess:  8,
                                                wireframe:  false}),
          typeGeom        = new TextGeometry( 'KNACK', {font: font,
                                                        size: 80,
                                                        height: 0,
                                                        curveSegments: 12,
                                                        bevelEnabled: false}),
          typeMesh        = new Mesh( typeGeom, typeMaterial )
      scene.add(typeMesh)

      // Birds
      // ————————————————————————————
      let { gpuCompute, 
            positionUniforms, 
            velocityUniforms, 
            velocityVariable, 
            positionVariable} = _initComputeRenderer(renderer),
          bird                = _intitBirds()
      scene.add(bird.mesh)
    
      // GUI
      // ————————————————————————————
      let guiConfig = { 
        sky:  { items: config.sky,
                onChange: () => {_updateSky(state, skyShader, sunLight)},
                open: false},
        birds: { items: config.birds,
                onChange: () => {_updateBirdConfig(state, velocityUniforms)},
                open: false}}
    
      state = initGui( guiConfig )
      state.camera = {spherical: new Spherical(config.cameraRadius, 0, 0),
                      hasChanged: true }
      _updateBirdConfig(state, velocityUniforms)
      _updateSky(state, skyShader, sunLight)
    
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
    
      // Compose
      // ————————————————————————————————
      let renderTarget  = new WebGLRenderTarget( dimensions.width, dimensions.height ),
          composition   = new EffectComposer( renderer, renderTarget ),
          scenePass     = new RenderPass( scene, camera )
      
      composition.addPass( scenePass )
      scenePass.renderToScreen = true
      
      let clock = new Clock(), δ,
          last  = performance.now(),
          now
    
      console.log('here we go —→')
    
      // Render
      // ————————————————————————————————
      function _render() {
        // reschedule
        requestAnimationFrame(_render) 
        
        // update controls
        if( controls ) controls.update()
    
        // timing
        now = performance.now();
        δ = (now - last) / 1000
        if (δ > 1) δ = 1 // safety cap on large deltas
        last = now
    
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
        bird.shader.uniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture
    
        if(config.lookAtSun)    
          camera.lookAt(sunLight.position)
    
        if(state.camera.hasChanged) {
          let v = _sphericalToCartesian(state.camera.spherical)
          camera.position.set(v.x, v.y, v.z)
          state.camera.hasChanged = false }    
        
        composition.render(δ)}
    
      _render() })}

export default drei