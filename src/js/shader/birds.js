import { Color,
         ShaderChunk,
         UniformsLib,
         UniformsUtils,
         Vector2,
         Vector3 } from 'three'


// the bird's position
let position = [
  'uniform float time;',
  'uniform float delta;',
  'void main() {',
    'vec2 uv = gl_FragCoord.xy / resolution.xy;',
    'vec4 tmpPos = texture2D( texturePosition, uv );',
    'vec3 position = tmpPos.xyz;',
    'vec3 velocity = texture2D( textureVelocity, uv ).xyz;',
    'float phase = tmpPos.w;',
    'phase = mod( ( phase + delta +',
    'length( velocity.xz ) * delta * 3. +',
    'max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );',
    'gl_FragColor = vec4( position + velocity * delta * 15. , phase );',
  '}'].join( "\n" )

// the bird's velocity
let velocity = [
  'uniform float time;',
  'uniform float testing;',
  'uniform float delta; // about 0.016',
  'uniform float seperationDistance; // 20',
  'uniform float alignmentDistance; // 40',
  'uniform float cohesionDistance; //',
  'uniform float freedomFactor;',
  'uniform vec3 predator;',
  'const float width = resolution.x;',
  'const float height = resolution.y;',
  'const float PI = 3.141592653589793;',
  'const float PI_2 = PI * 2.0;',
  '// const float VISION = PI * 0.55;',
  'float zoneRadius = 40.0;',
  'float zoneRadiusSquared = 1600.0;',
  'float separationThresh = 0.45;',
  'float alignmentThresh = 0.65;',
  'const float UPPER_BOUNDS = BOUNDS;',
  'const float LOWER_BOUNDS = -UPPER_BOUNDS;',
  'const float SPEED_LIMIT = 9.0;',
  'float rand(vec2 co){',
  '  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);',
  '}',
  'void main() {',
  '  zoneRadius = seperationDistance + alignmentDistance + cohesionDistance;',
  '  separationThresh = seperationDistance / zoneRadius;',
  '  alignmentThresh = ( seperationDistance + alignmentDistance ) / zoneRadius;',
  '  zoneRadiusSquared = zoneRadius * zoneRadius;',
  '  vec2 uv = gl_FragCoord.xy / resolution.xy;',
  '  vec3 birdPosition, birdVelocity;',
  '  vec3 selfPosition = texture2D( texturePosition, uv ).xyz;',
  '  vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;',
  '  float dist;',
  '  vec3 dir; // direction',
  '  float distSquared;',
  '  float seperationSquared = seperationDistance * seperationDistance;',
  '  float cohesionSquared = cohesionDistance * cohesionDistance;',
  '  float f;',
  '  float percent;',
  '  vec3 velocity = selfVelocity;',
  '  float limit = SPEED_LIMIT;',
  '  dir = predator * UPPER_BOUNDS - selfPosition;',
  '  dir.z = 0.;',
  '  // dir.z *= 0.6;',
  '  dist = length( dir );',
  '  distSquared = dist * dist;',
  '  float preyRadius = 150.0;',
  '  float preyRadiusSq = preyRadius * preyRadius;',
  '  // move birds away from predator',
  '  if (dist < preyRadius) {',
  '    f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;',
  '    velocity += normalize( dir ) * f;',
  '    limit += 5.0;',
  '  }',
  '  // if (testing == 0.0) {}',
  '  // if ( rand( uv + time ) < freedomFactor ) {}',
  '  // Attract flocks to the center',
  '  vec3 central = vec3( 0., 0., 0. );',
  '  dir = selfPosition - central;',
  '  dist = length( dir );',
  '  dir.y *= 2.5;',
  '  velocity -= normalize( dir ) * delta * 5.;',
  '  for (float y=0.0;y<height;y++) {',
  '    for (float x=0.0;x<width;x++) {',
  '      vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;',
  '      birdPosition = texture2D( texturePosition, ref ).xyz;',
  '      dir = birdPosition - selfPosition;',
  '      dist = length(dir);',
  '      if (dist < 0.0001) continue;',
  '      distSquared = dist * dist;',
  '      if (distSquared > zoneRadiusSquared ) continue;',
  '      percent = distSquared / zoneRadiusSquared;',
  '      if ( percent < separationThresh ) { // low',
  '        // Separation - Move apart for comfort',
  '        f = (separationThresh / percent - 1.0) * delta;',
  '        velocity -= normalize(dir) * f;',
  '      } else if ( percent < alignmentThresh ) { // high',
  '        // Alignment - fly the same direction',
  '        float threshDelta = alignmentThresh - separationThresh;',
  '        float adjustedPercent = ( percent - separationThresh ) / threshDelta;',
  '        birdVelocity = texture2D( textureVelocity, ref ).xyz;',
  '        f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;',
  '        velocity += normalize(birdVelocity) * f;',
  '      } else {',
  '        // Attraction / Cohesion - move closer',
  '        float threshDelta = 1.0 - alignmentThresh;',
  '        float adjustedPercent = ( percent - alignmentThresh ) / threshDelta;',
  '        f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;',
  '        velocity += normalize(dir) * f;',
  '      }',
  '    }',
  '  }',
  '  // this make tends to fly around than down or up',
  '  // if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);',
  '  // Speed Limits',
  '  if ( length( velocity ) > limit ) {',
  '    velocity = normalize( velocity ) * limit;',
  '  }',
  '  gl_FragColor = vec4( velocity, 1.0 );',
  '}'].join( "\n" )

// the bird
let bird = {
  uniforms: UniformsUtils.merge( [
              UniformsLib[ 'fog' ],
              UniformsLib[ 'lights' ],
              { 'time':             { value: 0},
                'delta':            { value: 0 },
                'texturePosition':  { value: null, type: 't' },
                'textureVelocity':  { value: null, type: 't' },
                'color':            { value: new Color( 0xff2200) }}]),
  vertexShader: [
  'attribute vec2 reference;',
  'attribute float birdVertex;',
  'attribute vec3 birdColor;',
  'uniform sampler2D texturePosition;',
  'uniform sampler2D textureVelocity;',
  'uniform float time;',

  'varying vec4 vColor;',
  'varying float z;',
  'varying vec3 vViewPosition;',
  
  ShaderChunk[ 'shadowmap_pars_vertex' ],
  ShaderChunk[ 'fog_pars_vertex' ],
  
  'void main() {',
    'vec4 tmpPos = texture2D( texturePosition, reference );',
    'vec3 pos = tmpPos.xyz;',
    'vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);',
    'vec3 newPosition = position;',
    
    'if ( birdVertex == 4.0 || birdVertex == 7.0 ) {',
      '// flap wings',
      'newPosition.y = sin( tmpPos.w ) * 5.;',
    '}',
    
    'vViewPosition = -mat3( modelViewMatrix ) * newPosition;',

    'newPosition = mat3( modelMatrix ) * newPosition;',
    
    'velocity.z *= -1.;',
    'float xz = length( velocity.xz );',
    'float xyz = 1.;',
    'float x = sqrt( 1. - velocity.y * velocity.y );',
    'float cosry = velocity.x / xz;',
    'float sinry = velocity.z / xz;',
    'float cosrz = x / xyz;',
    'float sinrz = velocity.y / xyz;',
    'mat3 maty =  mat3(',
      'cosry, 0, -sinry,',
      '0    , 1, 0     ,',
      'sinry, 0, cosry',
    ');',
    'mat3 matz =  mat3(',
      'cosrz , sinrz, 0,',
      '-sinrz, cosrz, 0,',
      '0     , 0    , 1',
    ');',
    'newPosition =  maty * matz * newPosition;',
    'newPosition += pos;',
    
    'z = newPosition.z;',
    'vColor = vec4( birdColor, 1.0 );',

    // 'vViewPosition = -mvPosition.xyz;',

    'gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );',
  '}'].join( "\n" ),

  fragmentShader: [
  'varying vec4 vColor;',
  'varying float z;',
  'varying vec3 vViewPosition;',

  'uniform vec3 color;',

  ShaderChunk[ 'common' ],
  ShaderChunk[ 'bsdfs' ],
  ShaderChunk[ 'lights_pars' ],
  ShaderChunk[ 'shadowmap_pars_fragment' ],
  ShaderChunk[ 'fog_pars_fragment' ],

  "float calcLightAttenuation( float lightDistance, float cutoffDistance, float decayExponent ) {",
    "if ( decayExponent > 0.0 ) {",
      "return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );",
    "}",
    "return 1.0;",
  "}",

  'void main() {',
    // outgoing light does not have an alpha, the surface does
    'vec3 outgoingLight = vec3( 0.0 );',
    'vec4 diffuseColor  = vColor;',
    'vec3 viewPosition  = normalize( vViewPosition );',

    // "vec3 finalNormal   = vNormal;",
    // "vec3 normal        = normalize( finalNormal );",

    'vec3 totalDiffuseLight  = vec3( 0.0 );',
    'vec3 totalSpecularLight = vec3( 0.0 );',


    // point lights
    // "#if NUM_POINT_LIGHTS > 0",
    //   "for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {",
    //     "vec3 lVector = pointLights[ i ].position + vViewPosition.xyz;",
    //     "float attenuation = calcLightAttenuation( length( lVector ), pointLights[ i ].distance, pointLights[ i ].decay );",
    //     "lVector = normalize( lVector );",
    //     "float pointDiffuseWeight = max( dot( normal, lVector ), 0.0 );",
    //     "totalDiffuseLight += attenuation * pointLights[ i ].color * pointDiffuseWeight;",

    //     "vec3 pointHalfVector = normalize( lVector + viewPosition );",
    //     "float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
    //     "float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );",
    //     "totalSpecularLight += attenuation * pointLights[ i ].color * specular * pointSpecularWeight * pointDiffuseWeight;",
    //   "}",
    // "#endif",

    // directional lights
    "#if NUM_DIR_LIGHTS > 0",
      "vec3 dirDiffuse = vec3( 0.0 );",
      "vec3 dirSpecular = vec3( 0.0 );",
      // "for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {",
      //   "vec3 dirVector = directionalLights[ i ].direction;",
      //   "float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );",

      //   "vec3 dirHalfVector = normalize( dirVector + viewPosition );",
      //   "float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
      //   "totalDiffuseLight += directionalLights[ i ].color * dirDiffuseWeight;",
      //   "float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );",
      //   "totalSpecularLight += directionalLights[ i ].color * specular * dirSpecularWeight * dirDiffuseWeight;",
      // "}",

    "#endif",

    // hemisphere lights
    // "#if NUM_HEMI_LIGHTS > 1",
    //   "vec3 hemiDiffuse  = vec3( 0.0 );",
    //   "vec3 hemiSpecular = vec3( 0.0 );",
    //   "for( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {",
        
    //     "vec3 lVector = hemisphereLights[ i ].direction;",

    //     // diffuse
    //     "float dotProduct = dot( normal, lVector );",
    //     "float hemiDiffuseWeight = 0.5 * dotProduct + 0.5;",
    //     "totalDiffuseLight += mix( hemisphereLights[ i ].groundColor, hemisphereLights[ i ].skyColor, hemiDiffuseWeight );",

    //     // specular (sky light)
    //     "float hemiSpecularWeight = 0.0;",
    //     "vec3 hemiHalfVectorSky = normalize( lVector + viewPosition );",
    //     "float hemiDotNormalHalfSky = 0.5 * dot( normal, hemiHalfVectorSky ) + 0.5;",
    //     "hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfSky, shininess ), 0.0 );",

    //     // specular (ground light)
    //     "vec3 lVectorGround = -lVector;",
    //     "vec3 hemiHalfVectorGround = normalize( lVectorGround + viewPosition );",
    //     "float hemiDotNormalHalfGround = 0.5 * dot( normal, hemiHalfVectorGround ) + 0.5;",
    //     "hemiSpecularWeight += specularTex.r * max( pow( hemiDotNormalHalfGround, shininess ), 0.0 );",
    //     "totalSpecularLight += specular * mix( hemisphereLights[ i ].groundColor, hemisphereLights[ i ].skyColor, hemiDiffuseWeight ) * hemiSpecularWeight * hemiDiffuseWeight;}",
    // "#endif",

  // '  // Fake colors for now',
  // '  float z2 = 0.2 + ( 1000. - z ) / 1000. * vColor.x;',
  // '  gl_FragColor = vec4( z2, z2, z2, 1. );',    

    'gl_FragColor = diffuseColor;',   
    ShaderChunk[ 'fog_fragment' ], 

  '}'].join( "\n" )
}

export default {position, velocity, bird}







