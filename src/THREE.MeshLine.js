import { BufferGeometry } from '@exodus/three/src/core/BufferGeometry'
import { BufferAttribute } from '@exodus/three/src/core/BufferAttribute'
import { Vector3 } from '@exodus/three/src/math/Vector3'
import { ShaderMaterial } from '@exodus/three/src/materials/ShaderMaterial'
import { UniformsLib } from '@exodus/three/src/renderers/shaders/UniformsLib'
import { Geometry } from '@exodus/three/src/core/Geometry'
import { Color } from '@exodus/three/src/math/Color'
import { Vector2 } from '@exodus/three/src/math/Vector2'

// raycast
// import { Matrix4 } from '@exodus/three/src/math/Matrix4'
// import MeshLineRaycast from './mesh-line-raycast'

function MeshLine () {
  BufferGeometry.call(this)
  this.type = 'MeshLine'
  
  this.positions = []
  
  this.previous = []
  this.next = []
  this.side = []
  this.width = []
  this.indices_array = []
  this.uvs = []
  this.counters = []
  this._points = []
  this._geom = null
  
  this.widthCallback = null
  
  // Used to raycast
  // this.matrixWorld = new Matrix4()
  
  Object.defineProperties(this, {
    // this is now a bufferGeometry
    // add getter to support previous api
    geometry: {
      enumerable: true,
      get: function () {
        return this
      },
    },
    geom: {
      enumerable: true,
      get: function () {
        return this._geom
      },
      set: function (value) {
        this.setGeometry(value, this.widthCallback)
      },
    },
    // for declaritive architectures
    // to return the same value that sets the points
    // eg. this.points = points
    // console.log(this.points) -> points
    points: {
      enumerable: true,
      get: function () {
        return this._points
      },
      set: function (value) {
        this.setPoints(value, this.widthCallback)
      },
    },
  })
}

MeshLine.prototype = Object.create(BufferGeometry.prototype)
MeshLine.prototype.constructor = MeshLine
MeshLine.prototype.isMeshLine = true

// MeshLine.prototype.setMatrixWorld = function (matrixWorld) {
//   this.matrixWorld = matrixWorld
// }

// setting via a geometry is rather superfluous
// as you're creating a unecessary geometry just to throw away
// but exists to support previous api
MeshLine.prototype.setGeometry = function (g, c) {
  // as the input geometry are mutated we store them
  // for later retreival when necessary (declaritive architectures)
  this._geometry = g
  if (g instanceof Geometry) {
    this.setPoints(g.vertices, c)
  } else if (g instanceof BufferGeometry) {
    this.setPoints(g.getAttribute('position').array, c)
  } else {
    this.setPoints(g, c)
  }
}

MeshLine.prototype.setPoints = function (points, wcb) {
  if (!(points instanceof Float32Array) && !(points instanceof Array)) {
    console.error(
      'ERROR: The BufferArray of points is not instancied correctly.'
    )
    return
  }
  // as the points are mutated we store them
  // for later retreival when necessary (declaritive architectures)
  this._points = points
  this.widthCallback = wcb
  this.positions = []
  this.counters = []
  if (points.length && points[0] instanceof Vector3) {
    // could transform Vector3 array into the array used below
    // but this approach will only loop through the array once
    // and is more performant
    for (let j = 0; j < points.length; j++) {
      let p = points[j]
      let c = j / points.length
      this.positions.push(p.x, p.y, p.z)
      this.positions.push(p.x, p.y, p.z)
      this.counters.push(c)
      this.counters.push(c)
    }
  } else {
    for (let j = 0; j < points.length; j += 3) {
      let c = j / points.length
      this.positions.push(points[j], points[j + 1], points[j + 2])
      this.positions.push(points[j], points[j + 1], points[j + 2])
      this.counters.push(c)
      this.counters.push(c)
    }
  }
  this.process()
}

// MeshLine.prototype.raycast = MeshLineRaycast
MeshLine.prototype.compareV3 = function (a, b) {
  let aa = a * 6
  let ab = b * 6
  return (
    this.positions[aa] === this.positions[ab] &&
    this.positions[aa + 1] === this.positions[ab + 1] &&
    this.positions[aa + 2] === this.positions[ab + 2]
  )
}

MeshLine.prototype.copyV3 = function (a) {
  let aa = a * 6
  return [this.positions[aa], this.positions[aa + 1], this.positions[aa + 2]]
}

MeshLine.prototype.process = function () {
  let l = this.positions.length / 6
  
  this.previous = []
  this.next = []
  this.side = []
  this.width = []
  this.indices_array = []
  this.uvs = []
  
  let w
  
  let v
  // initial previous points
  if (this.compareV3(0, l - 1)) {
    v = this.copyV3(l - 2)
  } else {
    v = this.copyV3(0)
  }
  this.previous.push(v[0], v[1], v[2])
  this.previous.push(v[0], v[1], v[2])
  
  for (let j = 0; j < l; j++) {
    // sides
    this.side.push(1)
    this.side.push(-1)
    
    // widths
    if (this.widthCallback) w = this.widthCallback(j / (l - 1))
    else w = 1
    this.width.push(w)
    this.width.push(w)
    
    // uvs
    this.uvs.push(j / (l - 1), 0)
    this.uvs.push(j / (l - 1), 1)
    
    if (j < l - 1) {
      // points previous to poisitions
      v = this.copyV3(j)
      this.previous.push(v[0], v[1], v[2])
      this.previous.push(v[0], v[1], v[2])
      
      // indices
      let n = j * 2
      this.indices_array.push(n, n + 1, n + 2)
      this.indices_array.push(n + 2, n + 1, n + 3)
    }
    if (j > 0) {
      // points after poisitions
      v = this.copyV3(j)
      this.next.push(v[0], v[1], v[2])
      this.next.push(v[0], v[1], v[2])
    }
  }
  
  // last next point
  if (this.compareV3(l - 1, 0)) {
    v = this.copyV3(1)
  } else {
    v = this.copyV3(l - 1)
  }
  this.next.push(v[0], v[1], v[2])
  this.next.push(v[0], v[1], v[2])
  
  // redefining the attribute seems to prevent range errors
  // if the user sets a differing number of vertices
  if (
    !this._attributes ||
    this._attributes.position.count !== this.positions.length
  ) {
    this._attributes = {
      position: new BufferAttribute(new Float32Array(this.positions), 3),
      previous: new BufferAttribute(new Float32Array(this.previous), 3),
      next: new BufferAttribute(new Float32Array(this.next), 3),
      side: new BufferAttribute(new Float32Array(this.side), 1),
      width: new BufferAttribute(new Float32Array(this.width), 1),
      uv: new BufferAttribute(new Float32Array(this.uvs), 2),
      index: new BufferAttribute(new Uint16Array(this.indices_array), 1),
      counters: new BufferAttribute(new Float32Array(this.counters), 1),
    }
  } else {
    this._attributes.position.copyArray(new Float32Array(this.positions))
    this._attributes.position.needsUpdate = true
    this._attributes.previous.copyArray(new Float32Array(this.previous))
    this._attributes.previous.needsUpdate = true
    this._attributes.next.copyArray(new Float32Array(this.next))
    this._attributes.next.needsUpdate = true
    this._attributes.side.copyArray(new Float32Array(this.side))
    this._attributes.side.needsUpdate = true
    this._attributes.width.copyArray(new Float32Array(this.width))
    this._attributes.width.needsUpdate = true
    this._attributes.uv.copyArray(new Float32Array(this.uvs))
    this._attributes.uv.needsUpdate = true
    this._attributes.index.copyArray(new Uint16Array(this.indices_array))
    this._attributes.index.needsUpdate = true
  }
  
  this.setAttribute('position', this._attributes.position)
  this.setAttribute('previous', this._attributes.previous)
  this.setAttribute('next', this._attributes.next)
  this.setAttribute('side', this._attributes.side)
  this.setAttribute('width', this._attributes.width)
  this.setAttribute('uv', this._attributes.uv)
  this.setAttribute('counters', this._attributes.counters)
  
  this.setIndex(this._attributes.index)
  
  this.computeBoundingSphere()
  this.computeBoundingBox()
}

function memcpy (src, srcOffset, dst, dstOffset, length) {
  let i
  
  src = src.subarray || src.slice ? src : src.buffer
  dst = dst.subarray || dst.slice ? dst : dst.buffer
  
  src = srcOffset
    ? src.subarray
      ? src.subarray(srcOffset, length && srcOffset + length)
      : src.slice(srcOffset, length && srcOffset + length)
    : src
  
  if (dst.set) {
    dst.set(src, dstOffset)
  } else {
    for (i = 0; i < src.length; i++) {
      dst[i + dstOffset] = src[i]
    }
  }
  
  return dst
}

/**
 * Fast method to advance the line by one position.  The oldest position is removed.
 * @param position
 */
MeshLine.prototype.advance = function (position) {
  let positions = this._attributes.position.array
  let previous = this._attributes.previous.array
  let next = this._attributes.next.array
  let l = positions.length
  
  // PREVIOUS
  memcpy(positions, 0, previous, 0, l)
  
  // POSITIONS
  memcpy(positions, 6, positions, 0, l - 6)
  
  positions[l - 6] = position.x
  positions[l - 5] = position.y
  positions[l - 4] = position.z
  positions[l - 3] = position.x
  positions[l - 2] = position.y
  positions[l - 1] = position.z
  
  // NEXT
  memcpy(positions, 6, next, 0, l - 6)
  
  next[l - 6] = position.x
  next[l - 5] = position.y
  next[l - 4] = position.z
  next[l - 3] = position.x
  next[l - 2] = position.y
  next[l - 1] = position.z
  
  this._attributes.position.needsUpdate = true
  this._attributes.previous.needsUpdate = true
  this._attributes.next.needsUpdate = true
}

const ShaderChunk = {}

ShaderChunk['meshline_vert'] = `
#version 300 es
#define attribute in
#define varying out
precision mediump float;
precision mediump int;
#define MEDIUM_PRECISION
#define SHADER_NAME MeshLineMaterial
#define VERTEX_TEXTURES
#define GAMMA_FACTOR 2
#define MAX_BONES 0
#define BONE_TEXTURE
#define USE_SIZEATTENUATION
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

attribute vec3 previous;
attribute vec3 next;
attribute float side;
attribute float width;
attribute float counters;

uniform vec2 resolution;
uniform float lineWidth;
uniform vec3 color;
uniform float opacity;
uniform float sizeAttenuation;

varying vec2 vUV;
varying vec4 vColor;
varying float vCounters;

vec2 fix( vec4 i, float aspect ) {
    vec2 res = i.xy / i.w;
    res.x *= aspect;
    vCounters = counters;
    return res;
}

void main() {
    float aspect = resolution.x / resolution.y;

    vColor = vec4( color, opacity );
    vUV = uv;

    mat4 m = projectionMatrix * modelViewMatrix;
    vec4 finalPosition = m * vec4( position, 1.0 );
    vec4 prevPos = m * vec4( previous, 1.0 );
    vec4 nextPos = m * vec4( next, 1.0 );

    vec2 currentP = fix( finalPosition, aspect );
    vec2 prevP = fix( prevPos, aspect );
    vec2 nextP = fix( nextPos, aspect );

    float w = lineWidth * width;

    vec2 dir;
    if( nextP == currentP ) dir = normalize( currentP - prevP );
    else if( prevP == currentP ) dir = normalize( nextP - currentP );
    else {
        vec2 dir1 = normalize( currentP - prevP );
        vec2 dir2 = normalize( nextP - currentP );
        dir = normalize( dir1 + dir2 );

        vec2 perp = vec2( -dir1.y, dir1.x );
        vec2 miter = vec2( -dir.y, dir.x );
        //w = clamp( w / dot( miter, perp ), 0., 4. * lineWidth * width );
    }

    //vec2 normal = ( cross( vec3( dir, 0. ), vec3( 0., 0., 1. ) ) ).xy;
    vec4 normal = vec4( -dir.y, dir.x, 0., 1. );
    normal.xy *= .5 * w;
    normal *= projectionMatrix;
    if( sizeAttenuation == 0. ) {
        normal.xy *= finalPosition.w;
        normal.xy /= ( vec4( resolution, 0., 1. ) * projectionMatrix ).xy;
    }

    finalPosition.xy += normal.xy * side;

    gl_Position = finalPosition;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
}
`.trim()

ShaderChunk['meshline_frag'] = `
#version 300 es
#define varying in
out mediump vec4 pc_fragColor;
precision mediump float;
precision mediump int;
#define MEDIUM_PRECISION
#define SHADER_NAME MeshLineMaterial
#define GAMMA_FACTOR 2
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;

uniform sampler2D map;
uniform sampler2D alphaMap;
uniform float useMap;
uniform float useAlphaMap;
uniform float useDash;
uniform float dashArray;
uniform float dashOffset;
uniform float dashRatio;
uniform float visibility;
uniform float alphaTest;
uniform vec2 repeat;

varying vec2 vUV;
varying vec4 vColor;
varying float vCounters;

void main() {
vec4 c = vColor;
    if( useMap == 1. ) c *= texture( map, vUV * repeat );
    if( useAlphaMap == 1. ) c.a *= texture( alphaMap, vUV * repeat ).a;
    if( c.a < alphaTest ) discard;
    if( useDash == 1. ){
        c.a *= ceil(mod(vCounters + dashOffset, dashArray) - (dashArray * dashRatio));
    }
    pc_fragColor = c;
    pc_fragColor.a *= step(vCounters, visibility);
}
`.trim()

function MeshLineMaterial (parameters) {
  ShaderMaterial.call(this, {
    uniforms: Object.assign({}, UniformsLib.fog, {
      lineWidth: { value: 1 },
      map: { value: null },
      useMap: { value: 0 },
      alphaMap: { value: null },
      useAlphaMap: { value: 0 },
      color: { value: new Color(0xffffff) },
      opacity: { value: 1 },
      resolution: { value: new Vector2(1, 1) },
      sizeAttenuation: { value: 1 },
      dashArray: { value: 0 },
      dashOffset: { value: 0 },
      dashRatio: { value: 0.5 },
      useDash: { value: 0 },
      visibility: { value: 1 },
      alphaTest: { value: 0 },
      repeat: { value: new Vector2(1, 1) },
    }),

    precision: 'mediump',
    
    vertexShader: ShaderChunk.meshline_vert,
    
    fragmentShader: ShaderChunk.meshline_frag,
  })
  
  this.type = 'MeshLineMaterial'
  
  Object.defineProperties(this, {
    lineWidth: {
      enumerable: true,
      get: function () {
        return this.uniforms.lineWidth.value
      },
      set: function (value) {
        this.uniforms.lineWidth.value = value
      },
    },
    map: {
      enumerable: true,
      get: function () {
        return this.uniforms.map.value
      },
      set: function (value) {
        this.uniforms.map.value = value
      },
    },
    useMap: {
      enumerable: true,
      get: function () {
        return this.uniforms.useMap.value
      },
      set: function (value) {
        this.uniforms.useMap.value = value
      },
    },
    alphaMap: {
      enumerable: true,
      get: function () {
        return this.uniforms.alphaMap.value
      },
      set: function (value) {
        this.uniforms.alphaMap.value = value
      },
    },
    useAlphaMap: {
      enumerable: true,
      get: function () {
        return this.uniforms.useAlphaMap.value
      },
      set: function (value) {
        this.uniforms.useAlphaMap.value = value
      },
    },
    color: {
      enumerable: true,
      get: function () {
        return this.uniforms.color.value
      },
      set: function (value) {
        this.uniforms.color.value = value
      },
    },
    opacity: {
      enumerable: true,
      get: function () {
        return this.uniforms.opacity.value
      },
      set: function (value) {
        this.uniforms.opacity.value = value
      },
    },
    resolution: {
      enumerable: true,
      get: function () {
        return this.uniforms.resolution.value
      },
      set: function (value) {
        this.uniforms.resolution.value.copy(value)
      },
    },
    sizeAttenuation: {
      enumerable: true,
      get: function () {
        return this.uniforms.sizeAttenuation.value
      },
      set: function (value) {
        this.uniforms.sizeAttenuation.value = value
      },
    },
    dashArray: {
      enumerable: true,
      get: function () {
        return this.uniforms.dashArray.value
      },
      set: function (value) {
        this.uniforms.dashArray.value = value
        this.useDash = value !== 0 ? 1 : 0
      },
    },
    dashOffset: {
      enumerable: true,
      get: function () {
        return this.uniforms.dashOffset.value
      },
      set: function (value) {
        this.uniforms.dashOffset.value = value
      },
    },
    dashRatio: {
      enumerable: true,
      get: function () {
        return this.uniforms.dashRatio.value
      },
      set: function (value) {
        this.uniforms.dashRatio.value = value
      },
    },
    useDash: {
      enumerable: true,
      get: function () {
        return this.uniforms.useDash.value
      },
      set: function (value) {
        this.uniforms.useDash.value = value
      },
    },
    visibility: {
      enumerable: true,
      get: function () {
        return this.uniforms.visibility.value
      },
      set: function (value) {
        this.uniforms.visibility.value = value
      },
    },
    alphaTest: {
      enumerable: true,
      get: function () {
        return this.uniforms.alphaTest.value
      },
      set: function (value) {
        this.uniforms.alphaTest.value = value
      },
    },
    repeat: {
      enumerable: true,
      get: function () {
        return this.uniforms.repeat.value
      },
      set: function (value) {
        this.uniforms.repeat.value.copy(value)
      },
    },
  })
  
  this.setValues(parameters)
}

MeshLineMaterial.prototype = Object.create(ShaderMaterial.prototype)
MeshLineMaterial.prototype.constructor = MeshLineMaterial
MeshLineMaterial.prototype.isMeshLineMaterial = true

MeshLineMaterial.prototype.copy = function (source) {
  ShaderMaterial.prototype.copy.call(this, source)
  
  this.lineWidth = source.lineWidth
  this.map = source.map
  this.useMap = source.useMap
  this.alphaMap = source.alphaMap
  this.useAlphaMap = source.useAlphaMap
  this.color.copy(source.color)
  this.opacity = source.opacity
  this.resolution.copy(source.resolution)
  this.sizeAttenuation = source.sizeAttenuation
  this.dashArray.copy(source.dashArray)
  this.dashOffset.copy(source.dashOffset)
  this.dashRatio.copy(source.dashRatio)
  this.useDash = source.useDash
  this.visibility = source.visibility
  this.alphaTest = source.alphaTest
  this.repeat.copy(source.repeat)
  
  return this
}

export {
  MeshLineMaterial,
  MeshLine,
  // MeshLineRaycast
}
