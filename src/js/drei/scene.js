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
        WebGLRenderer
      } from 'three'

import OrbitControls from '../lib/orbit-controls'
import TrackballControls from '../lib/trackball-controls'

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
      directional = new DirectionalLight( 0xffffff, 0.5 ),
      point       = new PointLight( 0xff4400, 1.5 ),
      hemisphere  = new HemisphereLight( 0xffffff, 0xffffff, 1 )

  directional.position.set( 500, 2000, 0 )
  point.position.set( 0, 800, 800 )

  scene.add( directional )
  scene.add( point )
  // scene.add( ambient )
  // scene.add( hemisphere )
  
  return {directional, point, ambient}}

function final( dimensions, color ) {

  // Boiler Plate Scene Setup
  //————————————————————————————————
  let ratio     = dimensions.width / dimensions.height,
      scene     = new Scene(),
      camera    = new PerspectiveCamera(40, ratio, 2, 6000),
      lights    = _lights(scene),
      controls  = _controls(camera)
  
  scene.fog = new Fog( 0x050505, 2000, 4000 )
  scene.fog.color = color

  camera.position.set( -1200, 800, 1200 );
  // camera.position.z = 500
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


