import DataroomElement from '../dataroom.js'
import * as THREE from 'three'

/**
 * PhysicsNode represents a single node in the physics simulation.
 * It manages both the physics body and visual representation of a node.
 */
class PhysicsNode extends DataroomElement {
  async initialize() {
    this.notification = this.create("dataroom-notification", {content: "Initializing node..."})
    
    // Initialize properties from attributes
    this.vector = JSON.parse(this.attrs.vector || '[0,0,0,255]')
    this.position = JSON.parse(this.attrs.position || '[0,0,0]')
    this.connections = JSON.parse(this.attrs.connections || '[]')
    
    // Create visual representation
    this.setupVisuals()
    
    // Create physics body when RAPIER is available
    if (window.RAPIER) {
      this.setupPhysics()
    }
    
    this.notification.innerHTML = "Node ready"
    this.event("initialized")
  }

  /**
   * Sets up the Three.js visual representation of the node
   */
  setupVisuals() {
    const geometry = new THREE.SphereGeometry(0.8, 32, 32)
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(
        this.vector[0] / 255,
        this.vector[1] / 255,
        this.vector[2] / 255
      ),
      transparent: true,
      opacity: this.vector[3] / 255
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(...this.position)
    
    this.event("mesh-created", { mesh: this.mesh })
  }

  /**
   * Sets up the Rapier physics body for the node
   */
  setupPhysics() {
    const rigidBodyDesc = window.RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(...this.position)
      .setLinearDamping(8.0)
      .setAngularDamping(8.0)
      .setAdditionalMass(3.0)
      .setCcdEnabled(true)
    
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc)
    
    const colliderDesc = window.RAPIER.ColliderDesc.ball(0.8)
      .setDensity(5.0)
      .setFriction(0.8)
      .setRestitution(0.1)
      .setSensor(false)
      .setCollisionGroups(0xffffffff)
    
    this.world.createCollider(colliderDesc, this.rigidBody)
    
    this.event("physics-created", { rigidBody: this.rigidBody })
  }

  /**
   * Updates the node's position based on physics simulation
   */
  updatePosition() {
    if (this.rigidBody && this.mesh) {
      const position = this.rigidBody.translation()
      this.mesh.position.set(position.x, position.y, position.z)
    }
  }

  /**
   * Calculates similarity with another vector
   * @param {Array<number>} otherVector - The vector to compare with
   * @returns {number} Cosine similarity value
   */
  calculateSimilarity(otherVector) {
    const dotProduct = this.vector.reduce((acc, val, i) => acc + val * otherVector[i], 0)
    const normA = Math.sqrt(this.vector.reduce((acc, val) => acc + val * val, 0))
    const normB = Math.sqrt(otherVector.reduce((acc, val) => acc + val * val, 0))
    return dotProduct / (normA * normB)
  }

  /**
   * Applies a force to the node based on similarity and direction
   * @param {Array<number>} force - The force vector to apply
   * @param {number} similarity - The similarity factor
   */
  applyForce(force, similarity) {
    if (this.rigidBody) {
      this.rigidBody.applyImpulse(
        { x: force[0] * similarity, y: force[1] * similarity, z: force[2] * similarity },
        true
      )
    }
  }
}

customElements.define("physics-node", PhysicsNode) 