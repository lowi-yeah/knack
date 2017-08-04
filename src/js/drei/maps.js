import {LinearFilter,
        LinearMipmapLinearFilter,
        RepeatWrapping,
        RGBAFormat,
        WebGLRenderTarget} from 'three'

function maps(resolution) {
  let params    = { minFilter: LinearMipmapLinearFilter, 
                    magFilter: LinearFilter, 
                    format: RGBAFormat },
      height    = new WebGLRenderTarget( 1024, 1024, params ),
      normal    = new WebGLRenderTarget( 1024, 1024, params ),
      specular  = new WebGLRenderTarget( 2048, 2048, params )
  
  height.texture.generateMipmaps    = false
  normal.texture.generateMipmaps    = false
  specular.texture.generateMipmaps  = false

  specular.wrapS = RepeatWrapping 
  specular.wrapT = RepeatWrapping 

  return {height, normal, specular}}

export default maps