import DataroomElement from '../dataroom.js'

/**
 * PhysicsMetrics displays real-time metrics about the physics simulation.
 */
class PhysicsMetrics extends DataroomElement {
  async initialize() {
    this.notification = this.create("dataroom-notification", {content: "Initializing metrics..."})
    
    // Initialize metrics
    this.metrics = {
      fps: 0,
      nodeCount: 0,
      jointCount: 0,
      averageSimilarity: 0,
      vacuumVector: [0, 0, 0, 255]
    }
    
    // Setup display
    this.setupDisplay()
    
    // Start FPS counter
    this.lastTime = performance.now()
    this.frameCount = 0
    this.measureFPS()
    
    this.notification.innerHTML = "Metrics ready"
    this.event("initialized")
  }

  /**
   * Sets up the metrics display
   */
  setupDisplay() {
    this.innerHTML = `
      <div class="physics-metrics">
        <div class="metric-group">
          <label>FPS</label>
          <span id="fps">${this.metrics.fps.toFixed(1)}</span>
        </div>
        
        <div class="metric-group">
          <label>Nodes</label>
          <span id="node-count">${this.metrics.nodeCount}</span>
        </div>
        
        <div class="metric-group">
          <label>Joints</label>
          <span id="joint-count">${this.metrics.jointCount}</span>
        </div>
        
        <div class="metric-group">
          <label>Avg. Similarity</label>
          <span id="avg-similarity">${this.metrics.averageSimilarity.toFixed(3)}</span>
        </div>
        
        <div class="metric-group">
          <label>Vacuum Vector</label>
          <div class="vector-preview" id="vacuum-vector"></div>
        </div>
      </div>
    `
    
    // Set initial vacuum vector color
    this.updateVacuumPreview()
  }

  /**
   * Updates the vacuum vector preview color
   */
  updateVacuumPreview() {
    const preview = this.querySelector('#vacuum-vector')
    if (preview) {
      const [r, g, b, a] = this.metrics.vacuumVector
      preview.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a/255})`
    }
  }

  /**
   * Measures and updates the FPS counter
   */
  measureFPS() {
    const updateFPS = () => {
      const now = performance.now()
      const delta = now - this.lastTime
      
      this.frameCount++
      
      if (delta >= 1000) { // Update every second
        this.metrics.fps = (this.frameCount * 1000) / delta
        this.updateMetric('fps', this.metrics.fps.toFixed(1))
        
        this.frameCount = 0
        this.lastTime = now
      }
      
      requestAnimationFrame(updateFPS)
    }
    
    updateFPS()
  }

  /**
   * Updates a specific metric value and its display
   * @param {string} metric - The metric name
   * @param {string|number} value - The new value
   */
  updateMetric(metric, value) {
    const element = this.querySelector(`#${metric.replace(/([A-Z])/g, '-$1').toLowerCase()}`)
    if (element) {
      element.textContent = value
    }
  }

  /**
   * Updates all simulation metrics
   * @param {Object} metrics - Object containing metric updates
   */
  updateMetrics(metrics) {
    Object.assign(this.metrics, metrics)
    
    // Update displays
    if ('nodeCount' in metrics) {
      this.updateMetric('node-count', metrics.nodeCount)
    }
    if ('jointCount' in metrics) {
      this.updateMetric('joint-count', metrics.jointCount)
    }
    if ('averageSimilarity' in metrics) {
      this.updateMetric('avg-similarity', metrics.averageSimilarity.toFixed(3))
    }
    if ('vacuumVector' in metrics) {
      this.updateVacuumPreview()
    }
  }
}

customElements.define("physics-metrics", PhysicsMetrics) 