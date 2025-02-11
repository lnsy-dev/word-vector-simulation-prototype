import DataroomElement from '../dataroom.js'
import * as THREE from 'three'

/**
 * PhysicsVacuum represents the central attractor in the physics simulation.
 * It manages both the physics body and visual representation of the vacuum,
 * as well as its dynamic vector properties that influence other nodes.
 */
class PhysicsVacuum extends DataroomElement {
  async initialize() {
    this.notification = this.create("dataroom-notification", {content: "Initializing vacuum..."})
    
    // Generate initial vector states
    this.setupVectors()
    
    // Create visual representation
    this.setupVisuals()
    
    // Create physics body when RAPIER is available
    if (window.RAPIER) {
      this.setupPhysics()
    }
    
    // Start vector cycling
    this.startVectorCycle()
    
    this.notification.innerHTML = "Vacuum ready"
    this.event("initialized")
  }

  /**
   * Sets up the vacuum's vector states
   */
  setupVectors() {
    // Generate random RGBA vectors for the vacuum states
    this.vectors = Array(5).fill(0).map(() => 
      Array(4).fill(0).map((_, i) => 
        // For alpha (last value), keep it between 128-255 for better visibility
        i === 3 ? Math.random() * 127 + 128 : Math.random() * 255
      )
    )
    
    this.currentIndex = 0
    this.currentVector = this.vectors[0]
  }

  /**
   * Sets up the Three.js visual representation of the vacuum
   */
  setupVisuals() {
    const geometry = new THREE.SphereGeometry(1.0, 32, 32)
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(
        this.currentVector[0] / 255,
        this.currentVector[1] / 255,
        this.currentVector[2] / 255
      ),
      transparent: true,
      opacity: this.currentVector[3] / 255,
      emissive: new THREE.Color(0.2, 0.2, 0.2)
    })
    
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(0, 0, 0)
    
    // Add a point light at the vacuum's position
    this.light = new THREE.PointLight(0xffffff, 1, 100)
    this.light.position.set(0, 0, 0)
    
    this.event("mesh-created", { mesh: this.mesh, light: this.light })
  }

  /**
   * Sets up the Rapier physics body for the vacuum
   */
  setupPhysics() {
    const rigidBodyDesc = window.RAPIER.RigidBodyDesc.fixed()
      .setTranslation(0, 0, 0)
    
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc)
    
    const colliderDesc = window.RAPIER.ColliderDesc.ball(1.0)
      .setDensity(1.0)
      .setFriction(0.8)
      .setRestitution(0.1)
      .setSensor(true)
    
    this.world.createCollider(colliderDesc, this.rigidBody)
    
    this.event("physics-created", { rigidBody: this.rigidBody })
  }

  /**
   * Starts the cycle of vector changes
   */
  startVectorCycle() {
    setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.vectors.length
      this.currentVector = this.vectors[this.currentIndex]
      
      // Update vacuum appearance
      const [r, g, b, a] = this.currentVector
      this.mesh.material.color.setRGB(r/255, g/255, b/255)
      this.mesh.material.opacity = a/255
      
      // Emit vector change event
      this.event("vector-changed", { vector: this.currentVector })
    }, 5000) // Change every 5 seconds
  }

  /**
   * Gets the current vector state
   * @returns {Array<number>} The current RGBA vector
   */
  getCurrentVector() {
    return this.currentVector
  }

  /**
   * Gets the vacuum's position
   * @returns {Object} The position vector {x, y, z}
   */
  getPosition() {
    return { x: 0, y: 0, z: 0 } // Vacuum is always at center
  }
}

customElements.define("physics-vacuum", PhysicsVacuum) 