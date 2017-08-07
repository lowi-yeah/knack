import {AmbientLight,
        DirectionalLight,
        Fog,
        FogExp2,
        HemisphereLight,
        Math,
        OrthographicCamera,
        PerspectiveCamera, 
        PointLight,
        Scene, 
        SpotLight,
        WebGLRenderer}    from 'three'

import OrbitControls      from '../lib/orbit-controls'
import TrackballControls  from '../lib/trackball-controls'

function _controls(camera) {
  let controls = new OrbitControls( camera )
  controls.target.set( 0, 0, 0 )

  controls.rotateSpeed = 1.0
  controls.zoomSpeed = 1.2
  controls.panSpeed = 0.8

  controls.keys = [ 65, 83, 68 ]

  return controls}

function _lights(scene) {
  let ambient     = new AmbientLight( 0x111111 ),
      directional = new DirectionalLight( 0xffffff, 0.4 ),
      point       = new PointLight( 0xF4DAB4, 0.2 ),
      sky         = new HemisphereLight(0xffffff, 0x080820, 1)

  directional.position.set( 0, 1000, 0 )
  point.position.set( -800, 200, 0 );

  scene.add( directional )
  scene.add( point )
  // scene.add( sky )
  scene.add( ambient )
  
  return {directional, point, ambient}}

function final( dimensions, color, useControls ) {

  // Boiler Plate Scene Setup
  //————————————————————————————————
  let ratio     = dimensions.width / dimensions.height,
      scene     = new Scene(),
      camera    = new PerspectiveCamera(40, ratio, 2, 6000),
      lights    = _lights(scene),
      controls

  if(useControls) controls = _controls(camera)
  
  scene.fog = new Fog( 0x050505, 4000, 8000 )
  scene.fog.color = color

  camera.position.set( -1200, 800, 1200 )
  scene.add( camera )

  return {scene, camera, lights, controls}}

function buffer(dimensions) {
  let scene     = new Scene(),
      camera    = new OrthographicCamera( dimensions.width  / -2, 
                                          dimensions.width  /  2, 
                                          dimensions.height /  2, 
                                          dimensions.height / -2, 
                                          -10000, 10000 )

  // setup camera
  camera.position.z = 100
  scene.add( camera )

  return {scene, camera}}


export default {final:  final,
                buffer: buffer}


