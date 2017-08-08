import { Vector3 } from 'three'

let gui = function(sky, sun) {
  let effectController  = { turbidity:        10,
                            rayleigh:         2,
                            mieCoefficient:   0.005,
                            mieDirectionalG:  0.8,
                            luminance:        1,
                            inclination:      0.2, // elevation / inclination
                            azimuth:          0.16, // Facing front,
                            sun:              true },
      distance          = 400000,
      gui               = new dat.GUI()

  function guiChanged() {
      let theta = Math.PI * ( effectController.inclination - 0.5 ),
          phi   = 2 * Math.PI * ( effectController.azimuth - 0.5 )

      sky.uniforms.turbidity.value        = effectController.turbidity
      sky.uniforms.rayleigh.value         = effectController.rayleigh
      sky.uniforms.luminance.value        = effectController.luminance
      sky.uniforms.mieCoefficient.value   = effectController.mieCoefficient
      sky.uniforms.mieDirectionalG.value  = effectController.mieDirectionalG

      sun.position.x = distance * Math.cos( phi )
      sun.position.y = distance * Math.sin( phi ) * Math.sin( theta )
      sun.position.z = distance * Math.sin( phi ) * Math.cos( theta )
      sun.lookAt(      new Vector3())
      sun.visible    = effectController.sun
      sky.uniforms.sunPosition.value.copy( sun.position ) }

    gui.add( effectController, 'turbidity', 1.0, 20.0, 0.1 ).onChange( guiChanged )
    gui.add( effectController, 'rayleigh', 0.0, 4, 0.001 ).onChange( guiChanged )
    gui.add( effectController, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( guiChanged )
    gui.add( effectController, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( guiChanged )
    gui.add( effectController, 'luminance', 0.0, 2 ).onChange( guiChanged )
    gui.add( effectController, 'inclination', 0, 1, 0.0001 ).onChange( guiChanged )
    gui.add( effectController, 'azimuth', 0, 1, 0.0001 ).onChange( guiChanged )
    gui.add( effectController, 'sun' ).onChange( guiChanged )

    guiChanged() }

export default gui