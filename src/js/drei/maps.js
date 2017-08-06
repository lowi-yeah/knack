import {LinearFilter,
        LinearMipmapLinearFilter,
        RepeatWrapping,
        RGBAFormat,
        WebGLRenderTarget}  from 'three'

function maps(resolution) {
  let params    = { minFilter: LinearMipmapLinearFilter, 
                    magFilter: LinearFilter, 
                    format: RGBAFormat },
      height    = new WebGLRenderTarget( resolution.width, resolution.height, params ),
      normal    = new WebGLRenderTarget( resolution.width, resolution.height, params )
  
  height.texture.generateMipmaps    = false
  normal.texture.generateMipmaps    = false

  return {height, normal}}

export default maps