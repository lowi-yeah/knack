/**
 * @author alteredq / http://alteredqualia.com/
 *
 */
import {Color,
        ShaderChunk,
        UniformsLib,
        UniformsUtils,
        Vector2 } from 'three'

/* -------------------------------------------------------------------------
//  Dynamic terrain shader
//    - Blinn-Phong
//    - height + normal + diffuse1 + diffuse2 + specular + detail maps
//    - point, directional and hemisphere lights (use with "lights: true" material option)
//    - shadow maps receiving
 ------------------------------------------------------------------------- */

let ShaderTerrain = {
  uniforms: UniformsUtils.merge( [

    UniformsLib[ "fog" ],
    UniformsLib[ "lights" ],

    {
      "tNormal": { value: null },
      "tDisplacement": { value: null },

      "uDisplacementBias": { value: 0.0 },
      "uDisplacementScale": { value: 1.0 },

      "diffuse": { value: new Color( 0xeeeeee ) },
      "specular": { value: new Color( 0x111111 ) },
      "shininess": { value: 30 },
      "opacity": { value: 1 },
    }

  ] ),

  fragmentShader: [

    "uniform vec3 diffuse;",
    "uniform vec3 specular;",
    "uniform float shininess;",
    "uniform float opacity;",

    "varying vec3 vTangent;",
    "varying vec3 vBinormal;",
    "varying vec3 vNormal;",
    "varying vec2 vUv;",

    "varying vec3 vViewPosition;",

    ShaderChunk[ "common" ],
    ShaderChunk[ "bsdfs" ],
    ShaderChunk[ "lights_pars" ],
    ShaderChunk[ "shadowmap_pars_fragment" ],
    ShaderChunk[ "fog_pars_fragment" ],

    "float calcLightAttenuation( float lightDistance, float cutoffDistance, float decayExponent ) {",
      "if ( decayExponent > 0.0 ) {",
        "return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );",
      "}",
      "return 1.0;",
    "}",

    "void main() {",

      "vec3 outgoingLight = vec3( 0.0 );",  // outgoing light does not have an alpha, the surface does
      "vec4 diffuseColor = vec4( diffuse, opacity );",

      "vec3 specularTex = vec3( 0.9 );",

      "vec3 finalNormal   = vNormal;",
      "vec3 normal        = normalize( finalNormal );",
      "vec3 viewPosition  = normalize( vViewPosition );",
      "vec3 totalDiffuseLight   = vec3( 0.0 );",
      "vec3 totalSpecularLight = vec3( 0.0 );",

      // point lights
      "#if NUM_POINT_LIGHTS > 0",
        "for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {",
          "vec3 lVector = pointLights[ i ].position + vViewPosition.xyz;",
          "float attenuation = calcLightAttenuation( length( lVector ), pointLights[ i ].distance, pointLights[ i ].decay );",
          "lVector = normalize( lVector );",
          "float pointDiffuseWeight = max( dot( normal, lVector ), 0.0 );",
          "totalDiffuseLight += attenuation * pointLights[ i ].color * pointDiffuseWeight;",

          "vec3 pointHalfVector = normalize( lVector + viewPosition );",
          "float pointDotNormalHalf = max( dot( normal, pointHalfVector ), 0.0 );",
          "float pointSpecularWeight = specularTex.r * max( pow( pointDotNormalHalf, shininess ), 0.0 );",
          "totalSpecularLight += attenuation * pointLights[ i ].color * specular * pointSpecularWeight * pointDiffuseWeight;",
        "}",
      "#endif",

      // directional lights
      "#if NUM_DIR_LIGHTS > 0",
        "vec3 dirDiffuse = vec3( 0.0 );",
        "vec3 dirSpecular = vec3( 0.0 );",
        "for( int i = 0; i < NUM_DIR_LIGHTS; i++ ) {",
          "vec3 dirVector = directionalLights[ i ].direction;",
          "float dirDiffuseWeight = max( dot( normal, dirVector ), 0.0 );",

          "vec3 dirHalfVector = normalize( dirVector + viewPosition );",
          "float dirDotNormalHalf = max( dot( normal, dirHalfVector ), 0.0 );",
          "totalDiffuseLight += directionalLights[ i ].color * dirDiffuseWeight;",
          "float dirSpecularWeight = specularTex.r * max( pow( dirDotNormalHalf, shininess ), 0.0 );",
          "totalSpecularLight += directionalLights[ i ].color * specular * dirSpecularWeight * dirDiffuseWeight;",
        "}",

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


      "outgoingLight += diffuseColor.xyz * ( totalDiffuseLight + ambientLightColor + totalSpecularLight );",
      "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",

      ShaderChunk[ "fog_fragment" ],

    "}"

  ].join( "\n" ),

  vertexShader: [

    "attribute vec4 tangent;",
    "uniform sampler2D tNormal;",

    "#ifdef VERTEX_TEXTURES",

      "uniform sampler2D tDisplacement;",
      "uniform float uDisplacementScale;",
      "uniform float uDisplacementBias;",

    "#endif",

    "varying vec3 vTangent;",
    "varying vec3 vBinormal;",
    "varying vec3 vNormal;",
    "varying vec2 vUv;",

    "varying vec3 vViewPosition;",

    ShaderChunk[ "shadowmap_pars_vertex" ],
    ShaderChunk[ "fog_pars_vertex" ],

    "void main() {",

      "vNormal = normalize( normalMatrix * normal );",

      // tangent and binormal vectors
      // "vTangent = normalize( normalMatrix * tangent.xyz );",
      // "vBinormal = cross( vNormal, vTangent ) * tangent.w;",
      // "vBinormal = normalize( vBinormal );",

      // texture coordinates
      "vUv = uv;",

      // displacement mapping
      "#ifdef VERTEX_TEXTURES",

        "vec3 dv = texture2D( tDisplacement, uv ).xyz;",
        "float df = uDisplacementScale * dv.x + uDisplacementBias;",
        "vec3 displacedPosition = normal * df + position;",

        "vec4 worldPosition = modelMatrix * vec4( displacedPosition, 1.0 );",
        "vec4 mvPosition = modelViewMatrix * vec4( displacedPosition, 1.0 );",

      "#else",

        "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
        "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

      "#endif",

      "gl_Position = projectionMatrix * mvPosition;",

      "vViewPosition = -mvPosition.xyz;",

      "vec3 normalTex = texture2D( tNormal, uv ).xyz * 2.0 - 1.0;",
      "vNormal = normalMatrix * normalTex;",

      ShaderChunk[ "shadowmap_vertex" ],
      ShaderChunk[ "fog_vertex" ],

    "}"

  ].join( "\n" )
}

export default ShaderTerrain




