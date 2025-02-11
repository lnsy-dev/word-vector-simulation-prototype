import DataroomElement from '../dataroom.js'

class PhysicsScene extends DataroomElement {
  async initialize() {
    this.notification = this.create("dataroom-notification", {content: "Loading physics engine..."})
    
    // Wait for RAPIER to be available
    while (!window.RAPIER) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Initialize Rapier
    await window.RAPIER.init()
    
    // Create physics world
    this.gravity = { x: 0.0, y: -9.81, z: 0.0 }
    this.world = new window.RAPIER.World(this.gravity)
    
    // Create ground
    const groundColliderDesc = window.RAPIER.ColliderDesc.cuboid(10.0, 0.1, 10.0)
    this.world.createCollider(groundColliderDesc)
    
    // Create falling cube
    const rigidBodyDesc = window.RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0.0, 5.0, 0.0)
    this.rigidBody = this.world.createRigidBody(rigidBodyDesc)
    
    const colliderDesc = window.RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
    this.world.createCollider(colliderDesc, this.rigidBody)
    
    // Start physics loop
    this.gameLoop()
    
    this.notification.innerHTML = "Physics simulation running"
    this.event("initialized")
  }

  gameLoop = () => {
    // Step the simulation
    this.world.step()
    
    // Get cube position
    const position = this.rigidBody.translation()
    this.event("position-update", {
      x: position.x,
      y: position.y,
      z: position.z
    })
    
    // Debug render
    const { vertices, colors } = this.world.debugRender()
    this.event("render-update", { vertices, colors })
    
    requestAnimationFrame(this.gameLoop)
  }
}

customElements.define("physics-scene", PhysicsScene) 