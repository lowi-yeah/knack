import {Clock,
        FogExp2,
        IcosahedronGeometry,
        Math,
        Mesh,
        MeshBasicMaterial,
        MeshStandardMaterial,
        PlaneBufferGeometry,
        WebGLRenderer } from 'three'

// import fontLoader     from './lib/font-loader'
import BufferGeometryUtils from './lib/buffer-geometry-utils'

import sςene          from './drei/scene'
import mαterials      from './drei/materials'
import mαps           from './drei/maps'
import τextures       from './drei/textures'
import μniforms       from './drei/uniforms'
import ςomposer       from './drei/composer'

function _degrees(δ) {
  return Math.DEG2RAD * δ
}

function drei(domId) {
  console.log('initialzing drei')

  let 
      // dimensions    = { width: 1024,
      //                   height: 1024},
      dimensions    = { width: window.innerWidth,
                        height: window.innerHeight},
      τexResolution = { x: 256, y: 256}, 
      renderer      = new WebGLRenderer(),

      {scene, camera, lights, controls} = sςene.final(dimensions),
      {sceneRenderTarget, cameraOrtho}  = sςene.renderTarget(dimensions),

      maps              = mαps(τexResolution),
      textures          = τextures(),
      uniforms          = μniforms(τexResolution, maps, textures),
      materials         = mαterials(dimensions, maps, textures, uniforms)


  // setup renderer
  // ————————————————————————————————
  renderer.setClearColor( scene.fog.color );
  renderer.setPixelRatio( window.devicePixelRatio )
  renderer.setSize( dimensions.width, dimensions.height )
  document.getElementById(domId).appendChild(renderer.domElement)

  // console.log('maps', maps)
  // console.log('textures', textures)
  // console.log('uniforms', uniforms)
  // console.log('materials', materials)

  // add a plane to the (invisible) renderTarget scene.
  let plane       = new PlaneBufferGeometry( dimensions.width, dimensions.height ),
      quadTarget  = new Mesh( plane, new MeshBasicMaterial( { color: 0xFC9A5B } ) )

  quadTarget.position.z = -500
  sceneRenderTarget.add( quadTarget )

  // render the heightmap and the normal map (which is derived from the height map)
  // into their respective buffers
  // quadTarget.material = materials[ 'displacementmap' ]
  quadTarget.material = materials[ 'heightmap' ]
  renderer.render( sceneRenderTarget, cameraOrtho, maps.height, true )
  renderer.render( sceneRenderTarget, cameraOrtho)

  quadTarget.material = materials[ 'normalmap' ]
  renderer.render( sceneRenderTarget, cameraOrtho, maps.normal, true )
  // renderer.render( sceneRenderTarget, cameraOrtho)

 
  //debug
  scene.add( quadTarget )

  // create a sphere and assign the material
  let icosahedron = new Mesh( new IcosahedronGeometry( 120, 1 ),
                              materials[ 'displacementmap' ])
  scene.add( icosahedron )

  // TERRAIN MESH
  let geometryTerrain = new PlaneBufferGeometry( 6000, 6000, 256, 256 )
  BufferGeometryUtils.computeTangents( geometryTerrain )

  // let terrain = new Mesh( geometryTerrain, materials[ 'terrain' ] )
  // let terrain = new Mesh( geometryTerrain, materials[ 'displacement' ] )
  let terrain = new Mesh( geometryTerrain, materials[ 'normal' ] )
  // let terrain = new Mesh( geometryTerrain, materials[ 'heightmap' ] )
  // let terrain = new Mesh( geometryTerrain, new MeshStandardMaterial( { color: 0x3DB0AE } ) )
  
  terrain.rotation.x = _degrees(-90)
  terrain.position.set( 0, -125, 0 )
  terrain.visible = true
  scene.add( terrain )

  

  // COMPOSER
  // ————————————————————————————————
  // let composition = ςomposer(dimensions, renderer, scene, camera)
  let clock     = new Clock(),
      animΔ     = 0, 
      animΔDir  = 1,
      lightVal  = 0, 
      lightDir  = 1

  // Event handlers
  // ————————————————————————————————
  function onWindowResize( event ) {
    dimensions.width  = window.innerWidth
    dimensions.height = window.innerHeight
    renderer.setSize( dimensions.width, dimensions.height )
    camera.aspect = dimensions.width / dimensions.height
    camera.updateProjectionMatrix()}

  function onKeyDown ( event ) {
    switch( event.keyCode ) {
      case 78: /*N*/  lightDir *= -1; break
      case 77: /*M*/  animΔDir *= -1; break} }

  onWindowResize()
  window.addEventListener( 'resize', onWindowResize, false )
  document.addEventListener( 'keydown', onKeyDown, false )


  // Render
  // ————————————————————————————————
  function _render() {
    requestAnimationFrame(_render) // reschedule

    controls.update()

    // let δ     = clock.getDelta(),
    //     time  = _.now() * 0.001,
    //     fLow  = 0.1, 
    //     fHigh = 0.8,
    //     valNorm

    // lightVal  = Math.clamp( lightVal + 0.5 * δ * lightDir, fLow, fHigh )
    // valNorm   = ( lightVal - fLow ) / ( fHigh - fLow )

    // scene.fog.color.setHSL( 0.1, 0.5, lightVal )
    // renderer.setClearColor( scene.fog.color )

    // lights.directional.intensity = Math.mapLinear( valNorm, 0, 1, 0.1, 1.15 )
    // lights.point.intensity = Math.mapLinear( valNorm, 0, 1, 0.9, 1.5 )
    
    // // update noise
    // // ————————————————————————————————
    // animΔ = Math.clamp( animΔ + 0.00075 * animΔDir, 0, 0.05 )

    // uniforms.noise[ 'time' ].value += δ * animΔ
    // uniforms.noise[ 'offset' ].value.x += δ * 0.05

    // uniforms.terrain[ 'uOffset' ].value.x = 4 * uniforms.noise[ 'offset' ].value.x
    // uniforms.terrain[ 'uNormalScale' ].value = Math.mapLinear( valNorm, 0, 1, 0.6, 3.5 )

    // quadTarget.material = materials[ 'heightmap' ];
    // renderer.render( sceneRenderTarget, cameraOrtho, maps.height, true );

    // quadTarget.material = materials[ 'normal' ];
    // renderer.render( sceneRenderTarget, cameraOrtho, maps.normal, true );
    
    renderer.render( scene, camera)
    // composition.render(δ)
  }

  // here we go…
  // _render()


  

  
}

export default drei