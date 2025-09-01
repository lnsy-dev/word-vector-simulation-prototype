import DataroomElement from "../dataroom.js";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { commonWords } from "./word-list.js";

class PhysicsRoom extends DataroomElement {
  async initialize() {
    // Basic setup
    this.nodes = [];
    this.initialized = false;
    this.animationFrameId = null;
    this.currentEmbedding = null;
    this.isAnimating = false;

    // Create loading notification
    this.notification = this.create("dataroom-notification", {
      content: "Loading visualization...",
    });

    // Create search input
    this.searchInput = document.createElement("physics-search");
    document.body.appendChild(this.searchInput);
    this.searchInput.addEventListener(
      "search-embedding",
      this.handleSearchEmbedding.bind(this),
    );

    try {
      await this.setupScene();
      await this.createObjects();

      // Start animation
      this.initialized = true;
      this.animate();

      this.notification.innerHTML = "Visualization running";
      this.event("initialized");
    } catch (error) {
      this.notification.innerHTML = "Error initializing: " + error.message;
      console.error("Initialization error:", error);
      this.cleanup();
    }
  }

  async setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 25, 50);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 10, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(ambientLight, directionalLight);

    // Grid and axes
    const gridHelper = new THREE.GridHelper(60, 30, 0x444444, 0x222222);
    const axisHelper = new THREE.AxesHelper(5);
    this.scene.add(gridHelper, axisHelper);

    // Handle resizing
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleResize() {
    if (!this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  async createObjects() {
    // Get embeddings for all words
    const embeddings = await Promise.all(
      commonWords.map(async (word) => {
        const response = await this.call("/api/embed", { text: word });
        if (response.error)
          throw new Error(`Error embedding word ${word}: ${response.error}`);
        return response.embedding;
      }),
    );

    // Create nodes in a grid layout
    const gridSize = Math.ceil(Math.sqrt(commonWords.length));
    const spacing = 4.0;
    const offset = ((gridSize - 1) * spacing) / 2;

    commonWords.forEach((word, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const x = col * spacing - offset;
      const z = row * spacing - offset;

      this.createNode(word, embeddings[i], new THREE.Vector3(x, 0, z));
    });
  }

  createNode(word, embedding, position) {
    // Visual representation
    const color = new THREE.Color().setHSL((word.length % 10) / 10, 0.7, 0.5);

    // Create a triangle geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.5,
      -0.5,
      0, // bottom left
      0.5,
      -0.5,
      0, // bottom right
      0.0,
      0.5,
      0, // top
    ]);
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
      color,
      shininess: 50,
      specular: 0x444444,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.copy(position);
    this.scene.add(mesh);

    // Text label
    const sprite = this.createTextSprite(word);
    mesh.add(sprite);

    this.nodes.push({
      mesh,
      sprite,
      word,
      embedding,
      position: position.clone(),
      basePosition: position.clone(),
    });
  }

  createTextSprite(text) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 256;

    // Remove background fill
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText(text, 256, 128);
    ctx.fillText(text, 256, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 2, 1);
    sprite.position.set(0, 1, 0);
    return sprite;
  }

  handleSearchEmbedding = (event) => {
    this.currentEmbedding = event.detail.embedding;
    if (this.currentEmbedding) {
      this.updateNodePositions();
    }
  };

  updateNodePositions() {
    if (!this.currentEmbedding) return;

    // Calculate similarities and sort nodes
    const nodesWithSimilarity = this.nodes.map((node) => ({
      ...node,
      similarity: this.cosineSimilarity(node.embedding, this.currentEmbedding),
    }));

    // Sort by similarity
    nodesWithSimilarity.sort((a, b) => b.similarity - a.similarity);

    // Log top 5 similar words
    console.log(
      "Top 5 similar words:",
      nodesWithSimilarity.slice(0, 5).map((n) => ({
        word: n.word,
        similarity: n.similarity.toFixed(3),
      })),
    );

    // Calculate target positions and properties for all nodes
    nodesWithSimilarity.forEach((nodeWithSim, index) => {
      const node = this.nodes.find((n) => n.word === nodeWithSim.word);
      if (!node) return;

      // For top similar words, use a spiral distribution to prevent overlap
      let targetX, targetY, targetZ;

      if (index < 20) {
        // Top 20 most similar words get special spacing
        // Create a spiral for the most similar words
        const spiralAngle = index * 0.5; // Angle increment for spiral
        const spiralRadius = 3 + index * 1.2; // Gradually increasing radius
        const height = (index - 10) * 0.3; // Slight vertical offset

        targetX = spiralRadius * Math.cos(spiralAngle);
        targetY = height;
        targetZ = spiralRadius * Math.sin(spiralAngle);
      } else {
        // For less similar words, use spherical distribution
        const similarityFactor = Math.pow(1 - nodeWithSim.similarity, 2);
        const radius = 25 + similarityFactor * 30; // Start further out

        // Use golden angle for better distribution
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const phi = Math.acos(
          1 - (2 * (index - 19)) / (nodesWithSimilarity.length - 20),
        );
        const theta = (index - 20) * goldenAngle;

        targetX = radius * Math.sin(phi) * Math.cos(theta);
        targetY = radius * Math.sin(phi) * Math.sin(theta);
        targetZ = radius * Math.cos(phi);
      }

      // More dramatic scale difference between similar and dissimilar nodes
      const targetScale = 1.2 + Math.pow(nodeWithSim.similarity, 2) * 1.3; // Exponential scaling for size

      // Store current position and scale
      const startPos = node.mesh.position.clone();
      const startScale = node.mesh.scale.x;

      // Create animation
      const duration = 2000; // 2 seconds
      const startTime = performance.now();

      // Update material color with more saturated colors for similar words
      const hue = nodeWithSim.similarity;
      const saturation = 0.7 + nodeWithSim.similarity * 0.3; // More saturated for similar words
      const lightness = 0.4 + nodeWithSim.similarity * 0.2; // Brighter for similar words
      node.mesh.material.color.setHSL(hue, saturation, lightness);

      // Update opacity based on distance from center - closer nodes are more opaque
      // Map similarity (0 to 1) to opacity (0.1 to 1)
      const targetOpacity = 0.1 + nodeWithSim.similarity * 0.9;
      node.mesh.material.transparent = true;

      // Store animation data
      node.animation = {
        startTime,
        duration,
        startPos,
        targetPos: new THREE.Vector3(targetX, targetY, targetZ),
        startScale,
        targetScale,
        startOpacity: node.mesh.material.opacity || 1,
        targetOpacity,
        startSpriteOpacity: node.sprite.material.opacity || 0.9,
        targetSpriteOpacity: targetOpacity * 0.9, // Keep sprite slightly less opaque than mesh
        similarity: nodeWithSim.similarity,
      };
    });

    // Start animation if not already running
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animateNodes();
    }
  }

  animateNodes = () => {
    const currentTime = performance.now();
    let stillAnimating = false;

    this.nodes.forEach((node) => {
      if (node.animation) {
        const elapsed = currentTime - node.animation.startTime;
        const progress = Math.min(elapsed / node.animation.duration, 1);

        // Smooth easing function
        const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

        // Interpolate position
        const newPos = new THREE.Vector3();
        newPos.lerpVectors(
          node.animation.startPos,
          node.animation.targetPos,
          eased,
        );
        node.mesh.position.copy(newPos);

        // Interpolate scale
        const scale = THREE.MathUtils.lerp(
          node.animation.startScale,
          node.animation.targetScale,
          eased,
        );
        node.mesh.scale.set(scale, scale, scale);

        // Interpolate opacity
        const opacity = THREE.MathUtils.lerp(
          node.animation.startOpacity,
          node.animation.targetOpacity,
          eased,
        );
        node.mesh.material.opacity = opacity;

        // Interpolate sprite opacity
        if (node.sprite && node.sprite.material) {
          const spriteOpacity = THREE.MathUtils.lerp(
            node.animation.startSpriteOpacity,
            node.animation.targetSpriteOpacity,
            eased,
          );
          node.sprite.material.opacity = spriteOpacity;
        }

        // Check if this node is still animating
        if (progress < 1) {
          stillAnimating = true;
        } else {
          // Animation complete for this node
          delete node.animation;
        }
      }
    });

    // Continue animation loop if needed
    if (stillAnimating) {
      requestAnimationFrame(this.animateNodes);
    } else {
      this.isAnimating = false;
    }
  };

  animate = () => {
    if (!this.initialized) return;

    // Update controls
    this.controls.update();

    // Update sprite orientations
    this.nodes.forEach((node) => {
      if (node.sprite) {
        node.sprite.quaternion.copy(this.camera.quaternion);
      }
    });

    // Render
    this.renderer.render(this.scene, this.camera);

    // Next frame
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  cosineSimilarity(a, b) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  cleanup() {
    // Stop animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove event listeners
    window.removeEventListener("resize", this.handleResize);

    // Clean up Three.js
    this.nodes.forEach((node) => {
      if (node.mesh) {
        if (node.mesh.material) node.mesh.material.dispose();
        if (node.mesh.geometry) node.mesh.geometry.dispose();
        this.scene.remove(node.mesh);
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement?.remove();
    }

    if (this.controls) {
      this.controls.dispose();
    }

    // Clear references
    this.nodes = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.initialized = false;
  }

  disconnectedCallback() {
    this.cleanup();
    super.disconnectedCallback();
  }
}

customElements.define("physics-room", PhysicsRoom);
