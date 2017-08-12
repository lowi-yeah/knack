import {BufferAttribute, 
        BufferGeometry,
        Color} from 'three'


let BirdGeometry = function(width) {
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
  // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 )

  var v = 0;
  function verts_push() {
    for (var i=0; i < arguments.length; i++) {
      vertices.array[v++] = arguments[i];
    }
  }
  var wingsSpan = 20;
  for (var f = 0; f<birds; f++ ) {
    // Body
    verts_push(
      0, -0, -20,
      0, 4, -20,
      0, 0, 30
    );
    // Left Wing
    verts_push(
      0, 0, -15,
      -wingsSpan, 0, 0,
      0, 0, 15
    );
    // Right Wing
    verts_push(
      0, 0, 15,
      wingsSpan, 0, 0,
      0, 0, -15
    );
  }
  for( var v = 0; v < triangles * 3; v++ ) {
    var i = ~~(v / 3);
    var x = (i % width) / width;
    var y = ~~(i / width) / width;
    var c = new Color(
      0x444444 +
      ~~(v / 9) / birds * 0x666666
    );
    birdColors.array[ v * 3 + 0 ] = c.r;
    birdColors.array[ v * 3 + 1 ] = c.g;
    birdColors.array[ v * 3 + 2 ] = c.b;
    references.array[ v * 2     ] = x;
    references.array[ v * 2 + 1 ] = y;
    birdVertex.array[ v         ] = v % 9;
  }
  this.scale( 0.2, 0.2, 0.2 );
};

BirdGeometry.prototype = Object.create( BufferGeometry.prototype )

export default BirdGeometry