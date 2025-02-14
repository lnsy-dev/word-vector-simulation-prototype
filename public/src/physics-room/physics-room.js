import DataroomElement from '../dataroom.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { commonWords } from './word-list.js'

class PhysicsRoom extends DataroomElement {
  async initialize() {
    // Basic setup
    this.nodes = []
    this.initialized = false
    this.animationFrameId = null
    this.currentEmbedding = null
    this.isAnimating = false
    
    // Create loading notification
    this.notification = this.create("dataroom-notification", {content: "Loading visualization..."})
    
    // Create search input
    this.searchInput = document.createElement("physics-search")
    document.body.appendChild(this.searchInput)
    this.searchInput.addEventListener('search-embedding', this.handleSearchEmbedding.bind(this))
    
    try {
      await this.setupScene()
      await this.createObjects()
      
      // Start animation
      this.initialized = true
      this.animate()
      
      this.notification.innerHTML = "Visualization running"
      this.event("initialized")
    } catch (error) {
      this.notification.innerHTML = "Error initializing: " + error.message
      console.error("Initialization error:", error)
      this.cleanup()
    }
  }

  async setupScene() {
    // Scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x000000)
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(0, 15, 30)
    this.camera.lookAt(0, 0, 0)
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.appendChild(this.renderer.domElement)
    
    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
    directionalLight.position.set(10, 10, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(ambientLight, directionalLight)
    
    // Grid and axes
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    const axisHelper = new THREE.AxesHelper(5)
    this.scene.add(gridHelper, axisHelper)
    
    // Handle resizing
    window.addEventListener('resize', this.handleResize.bind(this))
  }

  handleResize() {
    if (!this.camera || !this.renderer) return
    const width = window.innerWidth
    const height = window.innerHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  async createObjects() {
    // Get embeddings for all words
    const embeddings = await Promise.all(
      commonWords.map(async word => {
        const response = await this.call('/api/embed', { text: word })
        if (response.error) throw new Error(`Error embedding word ${word}: ${response.error}`)
        return response.embedding
      })
    )
    
    // Create nodes in a grid layout
    const gridSize = Math.ceil(Math.sqrt(commonWords.length))
    const spacing = 2.0
    const offset = (gridSize - 1) * spacing / 2
    
    commonWords.forEach((word, i) => {
      const row = Math.floor(i / gridSize)
      const col = i % gridSize
      const x = col * spacing - offset
      const z = row * spacing - offset
      
      this.createNode(word, embeddings[i], new THREE.Vector3(x, 0, z))
    })
  }

  createNode(word, embedding, position) {
    // Visual representation
    const color = new THREE.Color().setHSL(word.length % 10 / 10, 0.7, 0.5)
    const geometry = new THREE.SphereGeometry(0.5, 12, 12)
    const material = new THREE.MeshPhongMaterial({
      color,
      shininess: 50,
      specular: 0x444444
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.copy(position)
    this.scene.add(mesh)
    
    // Text label
    const sprite = this.createTextSprite(word)
    mesh.add(sprite)
    
    this.nodes.push({ 
      mesh,
      sprite,
      word,
      embedding,
      position: position.clone(),
      basePosition: position.clone()
    })
  }

  createTextSprite(text) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 512
    canvas.height = 512
    
    // Remove background fill
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 72px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 4
    ctx.strokeText(text, 256, 256)
    ctx.fillText(text, 256, 256)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 0.9
    })
    
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.scale.set(3, 1.5, 1)
    sprite.position.set(0, 1, 0)
    return sprite
  }

  handleSearchEmbedding = (event) => {
    this.currentEmbedding = event.detail.embedding
    if (this.currentEmbedding) {
      this.updateNodePositions()
    }
  }

  updateNodePositions() {
    if (!this.currentEmbedding) return

    // Calculate similarities and sort nodes
    const nodesWithSimilarity = this.nodes.map(node => ({
      ...node,
      similarity: this.cosineSimilarity(node.embedding, this.currentEmbedding)
    }))
    
    // Sort by similarity
    nodesWithSimilarity.sort((a, b) => b.similarity - a.similarity)
    
    // Log top 5 similar words
    console.log("Top 5 similar words:", 
      nodesWithSimilarity.slice(0, 5).map(n => ({
        word: n.word,
        similarity: n.similarity.toFixed(3)
      }))
    )
    
    // Calculate target positions and properties for all nodes
    nodesWithSimilarity.forEach((nodeWithSim, index) => {
      const node = this.nodes.find(n => n.word === nodeWithSim.word)
      if (!node) return
      
      // Exaggerate distance differences with exponential scaling
      const similarityFactor = Math.pow(1 - nodeWithSim.similarity, 2) // Square the difference to exaggerate
      const radius = similarityFactor * 15 // Increased max radius
      
      // Calculate spherical coordinates
      const phi = Math.acos(1 - 2 * (index + 0.5) / nodesWithSimilarity.length)
      const theta = Math.PI * (1 + Math.sqrt(5)) * (index + 0.5)
      
      // Calculate target position
      const targetX = radius * Math.sin(phi) * Math.cos(theta)
      const targetY = radius * Math.sin(phi) * Math.sin(theta)
      const targetZ = radius * Math.cos(phi)
      
      // More dramatic scale difference between similar and dissimilar nodes
      const targetScale = 1.2 + Math.pow(nodeWithSim.similarity, 2) * 1.3 // Exponential scaling for size
      
      // Store current position and scale
      const startPos = node.mesh.position.clone()
      const startScale = node.mesh.scale.x
      
      // Create animation
      const duration = 2000 // 2 seconds
      const startTime = performance.now()
      
      // Store animation data
      node.animation = {
        startTime,
        duration,
        startPos,
        targetPos: new THREE.Vector3(targetX, targetY, targetZ),
        startScale,
        targetScale,
        similarity: nodeWithSim.similarity
      }
      
      // Update material color with more saturated colors for similar words
      const hue = nodeWithSim.similarity
      const saturation = 0.7 + nodeWithSim.similarity * 0.3 // More saturated for similar words
      const lightness = 0.4 + nodeWithSim.similarity * 0.2 // Brighter for similar words
      node.mesh.material.color.setHSL(hue, saturation, lightness)
    })
    
    // Start animation if not already running
    if (!this.isAnimating) {
      this.isAnimating = true
      this.animateNodes()
    }
  }

  animateNodes = () => {
    const currentTime = performance.now()
    let stillAnimating = false
    
    this.nodes.forEach(node => {
      if (node.animation) {
        const elapsed = currentTime - node.animation.startTime
        const progress = Math.min(elapsed / node.animation.duration, 1)
        
        // Smooth easing function
        const eased = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
        
        // Interpolate position
        const newPos = new THREE.Vector3()
        newPos.lerpVectors(
          node.animation.startPos,
          node.animation.targetPos,
          eased
        )
        node.mesh.position.copy(newPos)
        
        // Interpolate scale
        const scale = THREE.MathUtils.lerp(
          node.animation.startScale,
          node.animation.targetScale,
          eased
        )
        node.mesh.scale.set(scale, scale, scale)
        
        // Check if this node is still animating
        if (progress < 1) {
          stillAnimating = true
        } else {
          // Animation complete for this node
          delete node.animation
        }
      }
    })
    
    // Continue animation loop if needed
    if (stillAnimating) {
      requestAnimationFrame(this.animateNodes)
    } else {
      this.isAnimating = false
    }
  }

  animate = () => {
    if (!this.initialized) return
    
    // Update controls
    this.controls.update()
    
    // Update sprite orientations
    this.nodes.forEach(node => {
      if (node.sprite) {
        node.sprite.quaternion.copy(this.camera.quaternion)
      }
    })
    
    // Render
    this.renderer.render(this.scene, this.camera)
    
    // Next frame
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0.0
    let normA = 0.0
    let normB = 0.0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  cleanup() {
    // Stop animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize)
    
    // Clean up Three.js
    this.nodes.forEach(node => {
      if (node.mesh) {
        if (node.mesh.material) node.mesh.material.dispose()
        if (node.mesh.geometry) node.mesh.geometry.dispose()
        this.scene.remove(node.mesh)
      }
    })
    
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.domElement?.remove()
    }
    
    if (this.controls) {
      this.controls.dispose()
    }
    
    // Clear references
    this.nodes = []
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.initialized = false
  }

  disconnectedCallback() {
    this.cleanup()
    super.disconnectedCallback()
  }
}

customElements.define("physics-room", PhysicsRoom) 