import {BufferAttribute, 
        BufferGeometry,
        Color,
        Vector3} from 'three'


let BirdGeometry = function(width) {

  console.log('make bird geometry')

  let birds     = width * width,
      triangles = birds * 3,
      points    = triangles * 3
  
  BufferGeometry.call( this )

  var vertices    = new BufferAttribute( new Float32Array( points * 3 ), 3 ),
      birdColors  = new BufferAttribute( new Float32Array( points * 3 ), 3 ),
      references  = new BufferAttribute( new Float32Array( points * 2 ), 2 ),
      birdVertex  = new BufferAttribute( new Float32Array( points ), 1 )

  this.addAttribute( 'position',    vertices )
  this.addAttribute( 'birdColor',   birdColors )
  this.addAttribute( 'reference',   references )
  this.addAttribute( 'birdVertex',  birdVertex )

  // helper for pushing vertices
  let v = 0
  function verts_push() {
    for (var i=0; i < arguments.length; i++) {
      vertices.array[v++] = arguments[i] } }

  // create the birds
  // three triangles (ie. 9 vertices) per bird
  var wingsSpan = 22
  for (let f = 0; f < birds; f++ ) {
    // Body
    verts_push( 0, 0, -20,
                0, 4, -20,
                0, 0, 30 )

    // Left Wing
    verts_push( 0, 0, -15,
                -wingsSpan, 0, 0,
                0, 0, 15 )

    // Right Wing
    verts_push( 0, 0, 15,
                wingsSpan, 0, 0,
                0, 0, -15 ) }

  // a bird consists of three triangles
  // each triangle has three points
  // ζ is a point
  for( let ζ = 0; ζ < points; ζ++ ) {
    // ~~ is a double NOT bitwise operator.
    // It is used as a faster substitute for Math.floor()

    let i   = ~~(ζ / 3),                    // index of the triangle
        x   = (i % width) / width,          // texture lookup coordinates
        y   = ~~(i / width) / width,  
        // c   = new Color( 0x444444 + ~~(ζ / 9) / birds * 6710886)
        c   = new Color( 0xffffff )

    // color
    birdColors.array[ ζ * 3 + 0 ] = c.r
    birdColors.array[ ζ * 3 + 1 ] = c.g
    birdColors.array[ ζ * 3 + 2 ] = c.b

    // the x and y corrdinates for the position and vertex gpu-computation texture
    references.array[ ζ * 2 ]     = x
    references.array[ ζ * 2 + 1 ] = y

    // the index of the vertex within the gemoetry
    birdVertex.array[ ζ ] = ζ % 9 }

  this.scale( 0.1, 0.1, 0.1 )}

BirdGeometry.prototype = Object.create( BufferGeometry.prototype )

export default BirdGeometry