import {LinearFilter,
        LinearMipmapLinearFilter,
        RGBAFormat,
        WebGLRenderTarget} from 'three'

import {BloomPass,
        EffectComposer, 
        RenderPass,
        ShaderPass} from 'postprocessing'

import ShaderExtras from '../lib/shader-extras'

function composer(dimensions, renderer, scene, camera) {

  // console.log('composer')
  // console.log('dimensions', dimensions)

  let renderTargetParameters  = { minFilter:    LinearFilter, 
                                  magFilter:    LinearFilter, 
                                  format:       RGBAFormat, 
                                  stencilBufer: false },
      renderTarget            = new WebGLRenderTarget( dimensions.width, 
                                                       dimensions.height, 
                                                       renderTargetParameters),
      composer                = new EffectComposer( renderer, renderTarget ),
      renderModel             = new RenderPass( scene, camera ),
      effectBloom             = new BloomPass( 0.6 ),
      effectBleach            = new ShaderPass( ShaderExtras[ 'bleachbypass' ] ),
      hblur                   = new ShaderPass( ShaderExtras[ 'horizontalBlur' ] ),
      vblur                   = new ShaderPass( ShaderExtras[ 'verticalBlur' ] ),
      bluriness               = 6

  // hblur.uniforms[ 'r' ].value               = 0.5
  // hblur.uniforms[ 'h' ].value               = bluriness / dimensions.width
  
  // vblur.uniforms[ 'r' ].value               = 0.5
  // vblur.uniforms[ 'v' ].value               = bluriness / dimensions.height

  // effectBleach.uniforms[ 'opacity' ].value  = 0.65
  
  renderModel.renderToScreen = true
  // vblur.renderToScreen = true
  composer.addPass( renderModel )
  // composer.addPass( effectBloom )
  //composer.addPass( effectBleach )
  // composer.addPass( hblur )
  // composer.addPass( vblur )
  return composer
}

export default composer