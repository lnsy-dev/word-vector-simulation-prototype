import DataroomElement from '../dataroom.js'

class PhysicsSearch extends DataroomElement {
  async initialize() {
    this.input = this.create('input', {
      type: 'text',
      placeholder: 'Enter text to attract/repel nodes...'
    })

    this.input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        const text = this.input.value
        if (text.trim()) {
          console.log("Getting embedding for:", text)
          // Get embedding from Ollama
          const response = await this.call('/api/embed', {
            text: text
          })
          
          console.log("Embedding response:", response)
          
          if (!response.error) {
            console.log("Dispatching embedding event")
            this.event('search-embedding', {
              embedding: response.embedding,
              text: text
            })
          } else {
            console.error("Embedding error:", response.error)
          }
        }
      }
    })
  }
}

customElements.define('physics-search', PhysicsSearch) 