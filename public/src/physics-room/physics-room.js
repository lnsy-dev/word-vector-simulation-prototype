import DataroomElement from '../dataroom.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

class PhysicsRoom extends DataroomElement {
  async initialize() {
    // Basic setup
    this.nodes = []
    this.joints = []
    this.initialized = false
    
    // Create loading notification
    this.notification = this.create("dataroom-notification", {content: "Loading physics engine..."})
    
    try {
      console.log("Initializing physics room...")
      
      // Initialize Three.js first
      this.initThree()
      console.log("Three.js initialized")
      
      // Wait for and initialize RAPIER
      await this.initPhysics()
      console.log("Physics initialized")
      
      // Create simulation objects
      this.createObjects()
      console.log("Objects created:", {
        nodes: this.nodes.length,
        joints: this.joints.length
      })
      
      // Start animation
      this.animate()
      console.log("Animation started")
      
      this.initialized = true
      this.notification.innerHTML = "Physics simulation running"
      this.event("initialized")
    } catch (error) {
      this.notification.innerHTML = "Error initializing physics: " + error.message
      console.error(error)
    }
  }

  initThree() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 15, 30) // Move camera further back
    this.camera.lookAt(0, 0, 0)
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.appendChild(this.renderer.domElement)
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2) // Increase ambient light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2) // Increase directional light
    directionalLight.position.set(10, 10, 10)
    this.scene.add(ambientLight, directionalLight)
    
    // Add a grid helper for reference
    const gridHelper = new THREE.GridHelper(20, 20)
    this.scene.add(gridHelper)
    
    // Handle resizing
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  async initPhysics() {
    // Wait for RAPIER to be available
    while (!window.RAPIER) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    // Initialize RAPIER
    await window.RAPIER.init()
    
    // Create world
    this.gravity = { x: 0.0, y: 0.0, z: 0.0 }
    this.world = new window.RAPIER.World(this.gravity)
    
    // Create boundaries
    this.createBoundaries()
  }

  createBoundaries() {
    const boundarySize = 10
    const thickness = 0.1
    
    const boundaries = [
      // Front and back
      [[0, 0, boundarySize], [boundarySize, boundarySize, thickness]],
      [[0, 0, -boundarySize], [boundarySize, boundarySize, thickness]],
      // Left and right
      [[-boundarySize, 0, 0], [thickness, boundarySize, boundarySize]],
      [[boundarySize, 0, 0], [thickness, boundarySize, boundarySize]],
      // Top and bottom
      [[0, boundarySize, 0], [boundarySize, thickness, boundarySize]],
      [[0, -boundarySize, 0], [boundarySize, thickness, boundarySize]]
    ]
    
    boundaries.forEach(([[x, y, z], [w, h, d]]) => {
      const desc = window.RAPIER.ColliderDesc.cuboid(w, h, d)
      desc.setTranslation(x, y, z)
      this.world.createCollider(desc)
    })
  }

  createObjects() {
    // Create central vacuum
    this.createVacuum()
    
    // Create nodes
    this.createNodes()
    
    // Create joints between nodes
    this.createJoints()
  }

  createVacuum() {
    // Physics body
    const rigidBody = this.world.createRigidBody(
      window.RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 0)
    )
    
    // Visual representation
    const geometry = new THREE.SphereGeometry(1.0, 32, 32)
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x444444,
      transparent: true,
      opacity: 0.8,
      shininess: 50
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    
    // Add point light at vacuum
    const light = new THREE.PointLight(0xffffff, 1, 20)
    light.position.set(0, 0, 0)
    this.scene.add(light)
    
    this.vacuum = { rigidBody, mesh, light }
  }

  createNodes(count = 50) {
    for (let i = 0; i < count; i++) {
      // Calculate grid position
      const gridSize = Math.ceil(Math.cbrt(count))
      const spacing = 5.0
      const offset = (gridSize - 1) * spacing / 2
      
      const x = (i % gridSize) * spacing - offset
      const y = (Math.floor(i / gridSize) % gridSize) * spacing - offset
      const z = (Math.floor(i / (gridSize * gridSize))) * spacing - offset
      
      // Create physics body
      const rigidBody = this.world.createRigidBody(
        window.RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(x, y, z)
          .setLinearDamping(8.0)
          .setAngularDamping(8.0)
      )
      
      const collider = this.world.createCollider(
        window.RAPIER.ColliderDesc.ball(0.8)
          .setDensity(5.0)
          .setFriction(0.8)
          .setRestitution(0.1),
        rigidBody // Add rigidBody reference here
      )
      
      // Create visual representation
      const color = new THREE.Color(Math.random(), Math.random(), Math.random())
      const geometry = new THREE.SphereGeometry(0.8, 16, 16)
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 50,
        specular: 0x444444
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.set(x, y, z) // Set initial position
      this.scene.add(mesh)
      
      this.nodes.push({ rigidBody, collider, mesh, color })
    }
  }

  createJoints() {
    this.nodes.forEach((node, i) => {
      // Create 1-3 random connections
      const numConnections = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < numConnections; j++) {
        // Find a target node that isn't already connected
        let targetIndex
        do {
          targetIndex = Math.floor(Math.random() * this.nodes.length)
        } while (
          targetIndex === i || 
          this.joints.some(joint => 
            (joint.body1 === node.rigidBody && joint.body2 === this.nodes[targetIndex].rigidBody) ||
            (joint.body2 === node.rigidBody && joint.body1 === this.nodes[targetIndex].rigidBody)
          )
        )
        
        // Create joint
        const params = window.RAPIER.JointData.spherical(
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0 }
        )
        
        const joint = this.world.createImpulseJoint(
          params,
          node.rigidBody,
          this.nodes[targetIndex].rigidBody,
          true
        )
        
        // Create visual connection
        const geometry = new THREE.BufferGeometry()
        const material = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3
        })
        const line = new THREE.Line(geometry, material)
        this.scene.add(line)
        
        this.joints.push({ joint, line, body1: node.rigidBody, body2: this.nodes[targetIndex].rigidBody })
      }
    })
  }

  animate = () => {
    if (!this.initialized) return
    
    // Update controls
    this.controls.update()
    
    // Step physics world
    this.world.step()
    
    // Update node positions
    this.nodes.forEach(({ rigidBody, mesh }) => {
      const position = rigidBody.translation()
      mesh.position.set(position.x, position.y, position.z)
      
      // Get and apply rotation
      const rotation = rigidBody.rotation()
      mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    })
    
    // Update joint visuals
    this.joints.forEach(({ body1, body2, line }) => {
      const pos1 = body1.translation()
      const pos2 = body2.translation()
      
      const positions = new Float32Array([
        pos1.x, pos1.y, pos1.z,
        pos2.x, pos2.y, pos2.z
      ])
      
      line.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      line.geometry.attributes.position.needsUpdate = true
    })
    
    // Render scene
    this.renderer.render(this.scene, this.camera)
    
    // Continue animation
    requestAnimationFrame(this.animate)
  }
}

customElements.define("physics-room", PhysicsRoom) 