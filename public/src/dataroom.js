// dataroom.js
// by LNSY


export default class DataroomElement extends HTMLElement {
  verbose = false
  /**
   * Creates a new HTML element of the specified type and appends it to the current element or a specified target element.
   * @param {string} type - The type of element to create.
   * @param {Object} attributes - An object of key-value pairs representing attribute names and values.
   * @param {HTMLElement|null} [target_el=null] - The target element to append the new element to. Defaults to the current element.
   * @return {HTMLElement} - The newly created element.
   */
  create(type, attributes = {}, target_el = null) {
    this.log(`Creating a new Element of ${type}`);
    const el = document.createElement(type);
    Object.keys(attributes).forEach((attribute) => {
      if (attribute === "content") {
        el.innerHTML = attributes[attribute];
      } else {
        el.setAttribute(attribute, attributes[attribute]);
      }
    });
    if (target_el === null) {
      this.appendChild(el);
    } else {
      target_el.appendChild(el);
    }
    return el;
  }

  /**
   * Emits a custom event from the element.
   * @param {string} name - The name of the event to emit.
   * @param {Object} [detail={}] - Additional data to include with the event.
   * @returns {void}
   */
  event(name, detail = {}) {
    const dtrmEvent = new CustomEvent(name, {
      detail,
    });
    this.dispatchEvent(dtrmEvent);
  }

  /**
   * Adds an event listener for a specified event name and executes a callback when the event is triggered.
   * @param {string} name - The name of the event to listen for.
   * @param {Function} cb - The callback function to execute when the event is triggered, receiving the event detail as a parameter.
   * @returns {void}
   */

  on(name, cb){
    return this.addEventListener(name, (e)=>{
      cb(e.detail)
    });
  }

  /**
   * Registers an event listener that will be triggered only once.
   * @param {string} name - The name of the event to listen for.
   * @param {Function} cb - The callback function to execute when the event is triggered.
   * @returns {void}
   */

  once(name, cb) {
    const listener = (e) => {
      cb(e.detail);
      this.removeEventListener(name, listener);
    };
    this.addEventListener(name, listener);
  }

  /**
   * A fetch helper that handles most of the complexity of 
   * talking to the server.
   * @param  {string} endpoint - The endpoint we want to talk to.
   * @param  {object} body - The content of the server call.
   * @param  {string} method - The HTTP method to use, defaults to 'post'.
   * @return {object} - The response from the server as an object.
   */
async call(endpoint, body = {}, method = 'post') {
  const username = 'lnsy';
  const password = '83a5ce62';

  const encodedCredentials = btoa(`${username}:${password}`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${encodedCredentials}`
  };

  const options = {
    method: method.toUpperCase(),
    headers,
  };
  if (method.toLowerCase() !== 'get') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);

  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return await response.json();
  } else {
    throw new Error(response.statusText);
  }
}

  /**
   * Logs a message if the verbose flag is set.
   * @param {string} message - The message to log.
   */
  log(message) {
    if (this.verbose) {
      // console.log(this.id, "says:", message);
    } else {
      this.event("status-update", message);
      return;
    }
  }

  /**
   * Called when the element is added to the DOM.
   * Sets the element's ID and attributes, and initializes the element.
   * @private
   */
  connectedCallback() {
    this.preInit();
  }

  /**
   * Runs before the Initializeation 
  */
  async preInit(){
    this.content = this.innerText; 
    this.attrs = this.getAttributeNames().reduce((acc, name) => {
      return { ...acc, [name]: this.getAttribute(name) };
    }, {});
    this.classList.add('dataroom-element');
    this.observeAttributeChanges();
    this.initialize();
  }


  /**
   * Sets multiple attributes on the element.
   * @param {Object} data - An object of key-value pairs representing attribute names and values.
   * @return {Promise<void>} - A promise that resolves when all attributes are set.
   */
  async setAttrs(data) {
    this.log("setting attrs:", data);
    for (const [key, value] of Object.entries(data)) {
      await this.setAttribute(key, value);
    }
    this.render();
  }


  /**
   * Observes changes to element attributes and emits events when they change.
   * @private
   */
  observeAttributeChanges() {
    this.log("observing attribute changes");
    this.attributeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          this.attrs[mutation.attributeName] = this.getAttribute(
            mutation.attributeName,
          );
          this.event("NODE-CHANGED", {
            attribute: mutation.attributeName,
            oldValue: mutation.oldValue,
            newValue: this.getAttribute(mutation.attributeName),
          });
        }
      });
    });
    const config = { attributes: true, attributeOldValue: true };
    this.attributeObserver.observe(this, config);
  }

  /**
   * Initializes the element. This function should be overridden in the child class.
   * @returns {void}
   */
  async initialize() {
    // override this class to run initialization code here
  }

  /**
   * Called when the element is removed from the DOM.
   * Disconnects the element.
   * @private
   */
  disconnectedCallback() {
    this.log("disconnecting...");
    this.disconnect();
  }

  /**
   * Handles disconnection logic. This function should be overridden in the child class.
   * @returns {void}
   */
  async disconnect() {
    // override this function to run disconnect code
  }

}