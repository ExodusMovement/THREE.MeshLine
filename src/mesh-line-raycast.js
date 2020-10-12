import { Matrix4 } from '@exodus/three/src/math/Matrix4'
import { Ray } from '@exodus/three/src/math/Ray'
import { Sphere } from '@exodus/three/src/math/Sphere'
import { Vector3 } from '@exodus/three/src/math/Vector3'
import { LineSegments } from '@exodus/three/src/objects/LineSegments'

function MeshLineRaycast (raycaster, intersects) {
  let inverseMatrix = new Matrix4()
  let ray = new Ray()
  let sphere = new Sphere()
  let interRay = new Vector3()
  let geometry = this.geometry
  // Checking boundingSphere distance to ray
  
  sphere.copy(geometry.boundingSphere)
  sphere.applyMatrix4(this.matrixWorld)
  
  if (raycaster.ray.intersectSphere(sphere, interRay) === false) {
    return
  }
  
  inverseMatrix.getInverse(this.matrixWorld)
  ray.copy(raycaster.ray).applyMatrix4(inverseMatrix)
  
  let vStart = new Vector3()
  let vEnd = new Vector3()
  let interSegment = new Vector3()
  let step = this instanceof LineSegments ? 2 : 1
  let index = geometry.index
  let attributes = geometry.attributes
  
  if (index !== null) {
    let indices = index.array
    let positions = attributes.position.array
    let widths = attributes.width.array
    
    for (let i = 0, l = indices.length - 1; i < l; i += step) {
      let a = indices[i]
      let b = indices[i + 1]
      
      vStart.fromArray(positions, a * 3)
      vEnd.fromArray(positions, b * 3)
      let width =
        widths[Math.floor(i / 3)] != undefined ? widths[Math.floor(i / 3)] : 1
      let precision =
        raycaster.params.Line.threshold + (this.material.lineWidth * width) / 2
      let precisionSq = precision * precision
      
      let distSq = ray.distanceSqToSegment(
        vStart,
        vEnd,
        interRay,
        interSegment
      )
      
      if (distSq > precisionSq) continue
      
      interRay.applyMatrix4(this.matrixWorld) //Move back to world space for distance calculation
      
      let distance = raycaster.ray.origin.distanceTo(interRay)
      
      if (distance < raycaster.near || distance > raycaster.far) continue
      
      intersects.push({
        distance: distance,
        // What do we want? intersection point on the ray or on the segment??
        // point: raycaster.ray.at( distance ),
        point: interSegment.clone().applyMatrix4(this.matrixWorld),
        index: i,
        face: null,
        faceIndex: null,
        object: this,
      })
      // make event only fire once
      i = l
    }
  }
}

export default MeshLineRaycast
