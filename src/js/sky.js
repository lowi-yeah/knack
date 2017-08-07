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

import SkyΣ from './shader/sky'



let config  = { wireframe:    false,
                useControls:  false,
                glitchNoise:  false,
                updateNoise:  false
              }



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

function _degrees(δ) {return ThreeMath.DEG2RAD * δ}

function _initSky(scene) {

  // Add Sky Mesh
  let sky = new SkyΣ();
  scene.add( sky.mesh );

  // Add Sun Helper
  let sunSphere = new Mesh( 
                    new SphereBufferGeometry( 20000, 16, 8 ),
                    new MeshBasicMaterial( { color: 0xffffff } ))
  sunSphere.position.y = - 700000;
  sunSphere.visible = false;
  scene.add( sunSphere );

  /// GUI

  var effectController  = {
    turbidity: 10,
    rayleigh: 2,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 1,
    inclination: 0.49, // elevation / inclination
    azimuth: 0.25, // Facing front,
    sun: ! true
  };

  var distance = 400000;

  function guiChanged() {

    var uniforms = sky.uniforms;
    uniforms.turbidity.value = effectController.turbidity;
    uniforms.rayleigh.value = effectController.rayleigh;
    uniforms.luminance.value = effectController.luminance;
    uniforms.mieCoefficient.value = effectController.mieCoefficient;
    uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

    var theta = Math.PI * ( effectController.inclination - 0.5 );
    var phi = 2 * Math.PI * ( effectController.azimuth - 0.5 );

    sunSphere.position.x = distance * Math.cos( phi );
    sunSphere.position.y = distance * Math.sin( phi ) * Math.sin( theta );
    sunSphere.position.z = distance * Math.sin( phi ) * Math.cos( theta );

    sunSphere.visible = effectController.sun;

    sky.uniforms.sunPosition.value.copy( sunSphere.position );

  }

  var gui = new dat.GUI();

  gui.add( effectController, "turbidity", 1.0, 20.0, 0.1 ).onChange( guiChanged );
  gui.add( effectController, "rayleigh", 0.0, 4, 0.001 ).onChange( guiChanged );
  gui.add( effectController, "mieCoefficient", 0.0, 0.1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, "mieDirectionalG", 0.0, 1, 0.001 ).onChange( guiChanged );
  gui.add( effectController, "luminance", 0.0, 2 ).onChange( guiChanged );
  gui.add( effectController, "inclination", 0, 1, 0.0001 ).onChange( guiChanged );
  gui.add( effectController, "azimuth", 0, 1, 0.0001 ).onChange( guiChanged );
  gui.add( effectController, "sun" ).onChange( guiChanged );

  guiChanged();

}

function drei(domId) {
  console.log('initialzing drei')

   // renderer
      let renderer = new WebGLRenderer()
      document.getElementById(domId).appendChild(renderer.domElement)
      renderer.setPixelRatio( window.devicePixelRatio )
      renderer.setSize( dimensions.width, dimensions.height )
      renderer.setClearColor( clearColor )

      let renderScene = sςene.final(dimensions, clearColor, config.useControls)

      _initSky(renderScene.scene)

      // create a simple sphere
      let pivotPoint    = new Object3D(),
          light0        = new DirectionalLight( 0xffffff, lightIntensity ),
          light1        = new PointLight( 0xffffff, lightIntensity )

      // add an object as pivot point to the sphere
      pivotPoint.rotation.x = 0
      renderScene.scene.add(pivotPoint)

      light0.position.set(2400, 320, 0);
      light1.position.set(-3000, 128, 0);

      pivotPoint.add(light0)
      pivotPoint.add(light1)

      let ph0ngMaterial   = new MeshPhongMaterial({ color: 0xE8873B, 
                                                    shading: FlatShading,
                                                    shininess: 8}),
          geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 256, 256 ),
          terrain         = new Mesh( geometryTerrain, ph0ngMaterial ),
          icosahedron     = new Mesh( new IcosahedronGeometry( 242, 4 ), ph0ngMaterial)


      BufferGeometryUtils.computeTangents( geometryTerrain )

      terrain.rotation.x = _degrees(-90)
      terrain.position.set( 0, -125, 0 )
      terrain.visible = true

      // renderScene.scene.add( terrain )
      renderScene.scene.add( icosahedron )

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
        lightVal  = ThreeMath.clamp( lightVal + 0.5 * δ * lightDir, fLow, fHigh )
        valNorm   = ( lightVal - fLow ) / ( fHigh - fLow )

        renderScene.scene.fog.color.setHSL( 0.1, 0.5, lightVal )
        renderer.setClearColor( renderScene.scene.fog.color )
         light0.color.setHSL( 0.1, 0.5, lightVal )
         light1.color.setHSL( 0.1, 0.5, lightVal )

        // directional
        pivotPoint.rotation.y += 0.01
        
        composition.render(δ)
      }

      // here we go…
      _render()
}

export default drei