import {AmbientLight,
        AxisHelper,
        DirectionalLight,
        Fog,
        FogExp2,
        GridHelper,
        HemisphereLight,
        Math,
        OrthographicCamera,
        PerspectiveCamera, 
        PointLight,
        Scene, 
        SpotLight,
        WebGLRenderer, 
        Vector3}    from 'three'

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
      directional = new DirectionalLight( 0xffffff, 1.15 ),
      point       = new PointLight( 0xF4DAB4, 1.5 )
     
  directional.position.set( 0, 1000, 1000 )
  point.position.set( -800, 200, 0 );

  // scene.add( directional )
  // scene.add( point )
  // scene.add( ambient )
  
  return {directional, point, ambient}}

function final( dimensions, color, useControls ) {

  // Boiler Plate Scene Setup
  //————————————————————————————————
  let ratio     = dimensions.width / dimensions.height,
      scene     = new Scene(),
      camera    = new PerspectiveCamera(40, ratio, 2, 2000000),
      lights    = _lights(scene),
      helper    = new GridHelper( 10000, 2, 0xffffff, 0xffffff ),
      controls

  scene.add( helper )

  if(useControls) controls = _controls(camera)
  
  scene.fog = new Fog( 0x050505, 2000, 4000 )
  scene.fog.color = color

  // camera.position.set( -1200, 800, 1200 )
  camera.position.set( -1200, 320, 2000 )
  camera.lookAt( new Vector3(0, 0, -800) )
  scene.add( camera )

  // scene.add( new AxisHelper(20) )

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


