import DataroomElement from '../dataroom.js'

/**
 * PhysicsControls provides a UI for adjusting physics simulation parameters.
 */
class PhysicsControls extends DataroomElement {
  async initialize() {
    this.notification = this.create("dataroom-notification", {content: "Initializing controls..."})
    
    // Default physics parameters
    this.params = {
      linearDamping: 8.0,
      angularDamping: 8.0,
      mass: 3.0,
      friction: 0.8,
      forceMagnitude: 0.4,
      orbitalForce: 0.02
    }
    
    // Create control elements
    this.setupControls()
    
    this.notification.innerHTML = "Controls ready"
    this.event("initialized")
  }

  /**
   * Sets up the control UI elements
   */
  setupControls() {
    this.innerHTML = `
      <div class="physics-controls">
        <div class="control-group">
          <label for="linear-damping">Linear Damping</label>
          <input type="range" id="linear-damping" 
                 min="0" max="20" step="0.1" 
                 value="${this.params.linearDamping}">
          <span class="value">${this.params.linearDamping}</span>
        </div>
        
        <div class="control-group">
          <label for="angular-damping">Angular Damping</label>
          <input type="range" id="angular-damping" 
                 min="0" max="20" step="0.1" 
                 value="${this.params.angularDamping}">
          <span class="value">${this.params.angularDamping}</span>
        </div>
        
        <div class="control-group">
          <label for="mass">Mass</label>
          <input type="range" id="mass" 
                 min="0.1" max="10" step="0.1" 
                 value="${this.params.mass}">
          <span class="value">${this.params.mass}</span>
        </div>
        
        <div class="control-group">
          <label for="friction">Friction</label>
          <input type="range" id="friction" 
                 min="0" max="1" step="0.05" 
                 value="${this.params.friction}">
          <span class="value">${this.params.friction}</span>
        </div>
        
        <div class="control-group">
          <label for="force-magnitude">Force Magnitude</label>
          <input type="range" id="force-magnitude" 
                 min="0" max="2" step="0.05" 
                 value="${this.params.forceMagnitude}">
          <span class="value">${this.params.forceMagnitude}</span>
        </div>
        
        <div class="control-group">
          <label for="orbital-force">Orbital Force</label>
          <input type="range" id="orbital-force" 
                 min="0" max="0.1" step="0.001" 
                 value="${this.params.orbitalForce}">
          <span class="value">${this.params.orbitalForce}</span>
        </div>
      </div>
    `
    
    // Add event listeners
    this.setupEventListeners()
  }

  /**
   * Sets up event listeners for the control inputs
   */
  setupEventListeners() {
    const controls = this.querySelectorAll('input[type="range"]')
    controls.forEach(control => {
      control.addEventListener('input', (e) => {
        const param = control.id.replace(/-/g, '')
        const value = parseFloat(e.target.value)
        this.params[param] = value
        
        // Update display value
        control.nextElementSibling.textContent = value
        
        // Emit parameter change event
        this.event('parameter-changed', {
          parameter: param,
          value: value
        })
      })
    })
  }

  /**
   * Gets the current physics parameters
   * @returns {Object} The current parameter values
   */
  getParameters() {
    return { ...this.params }
  }

  /**
   * Updates a specific parameter value
   * @param {string} param - The parameter name
   * @param {number} value - The new parameter value
   */
  updateParameter(param, value) {
    if (param in this.params) {
      this.params[param] = value
      const control = this.querySelector(`#${param.replace(/([A-Z])/g, '-$1').toLowerCase()}`)
      if (control) {
        control.value = value
        control.nextElementSibling.textContent = value
      }
    }
  }
}

customElements.define("physics-controls", PhysicsControls) 