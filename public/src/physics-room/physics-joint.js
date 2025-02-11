import DataroomElement from '../dataroom.js'
import * as THREE from 'three'

/**
 * PhysicsJoint represents a connection between two physics nodes.
 * It manages both the physics joint and visual representation of the connection.
 */
class PhysicsJoint extends DataroomElement {
  async initialize() {
    this.notification = this.create("dataroom-notification", {content: "Initializing joint..."})
    
    // Initialize properties from attributes
    this.body1Index = parseInt(this.attrs.body1_index || '0')
    this.body2Index = parseInt(this.attrs.body2_index || '1')
    this.similarity = parseFloat(this.attrs.similarity || '0.5')
    
    // Create visual representation
    this.setupVisuals()
    
    // Create physics joint when RAPIER is available
    if (window.RAPIER) {
      this.setupPhysics()
    }
    
    this.notification.innerHTML = "Joint ready"
    this.event("initialized")
  }

  /**
   * Sets up the Three.js visual representation of the joint
   */
  setupVisuals() {
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: Math.max(0.1, this.similarity * 0.5)
    })
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 0,0,0], 3))
    
    this.line = new THREE.Line(geometry, material)
    
    this.event("mesh-created", { mesh: this.line })
  }

  /**
   * Sets up the Rapier physics joint between bodies
   */
  setupPhysics() {
    const axis = { x: 0.0, y: 1.0, z: 0.0 } // Rotate around Y axis
    const params = window.RAPIER.JointData.revolute(
      { x: 6.0, y: 0.0, z: 0.0 },  // Anchor point offset for body1
      { x: -6.0, y: 0.0, z: 0.0 }, // Anchor point offset for body2
      axis
    )
    
    // Set joint limits based on similarity
    params.limitsEnabled = true
    params.limits = [1, 50] // Wide range of motion
    
    this.joint = this.world.createImpulseJoint(
      params,
      this.body1,
      this.body2,
      true
    )
    
    this.event("physics-created", { joint: this.joint })
  }

  /**
   * Updates the visual representation of the joint based on body positions
   */
  updateVisuals() {
    if (this.body1 && this.body2 && this.line) {
      const pos1 = this.body1.translation()
      const pos2 = this.body2.translation()
      
      const positions = new Float32Array([
        pos1.x, pos1.y, pos1.z,
        pos2.x, pos2.y, pos2.z
      ])
      
      this.line.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      )
      this.line.geometry.attributes.position.needsUpdate = true
    }
  }

  /**
   * Sets the bodies to be connected by this joint
   * @param {RigidBody} body1 - The first physics body
   * @param {RigidBody} body2 - The second physics body
   */
  setBodies(body1, body2) {
    this.body1 = body1
    this.body2 = body2
    if (window.RAPIER) {
      this.setupPhysics()
    }
  }

  /**
   * Updates the joint's similarity value and visual appearance
   * @param {number} similarity - The new similarity value
   */
  updateSimilarity(similarity) {
    this.similarity = similarity
    if (this.line) {
      this.line.material.opacity = Math.max(0.1, similarity * 0.5)
    }
  }
}

customElements.define("physics-joint", PhysicsJoint) 