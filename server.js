import { serve } from "bun"

const server = serve({
  port: 3000,
  async fetch(req) {
    // Enable CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    // Handle POST to /api/embed
    if (req.method === 'POST' && req.url.endsWith('/api/embed')) {
      try {
        const body = await req.json()
        const text = body.text

        if (!text) {
          return new Response(JSON.stringify({ error: 'No text provided' }), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          })
        }

        console.log("Getting embedding for:", text)

        // Call Ollama API
        const ollamaBody = {
          model: 'all-minilm:latest',
          prompt: text
        }
        console.log("Sending to Ollama:", ollamaBody)

        const response = await fetch('http://localhost:11434/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ollamaBody)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Ollama error response:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })
          throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        console.log("Ollama response:", data)

        if (!data.embedding) {
          console.error("No embedding in response:", data)
          throw new Error('No embedding in Ollama response')
        }

        return new Response(JSON.stringify({
          embedding: data.embedding,
          text: text
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      } catch (error) {
        console.error("Embedding error:", {
          message: error.message,
          stack: error.stack,
          error: error
        })
        return new Response(JSON.stringify({ 
          error: error.message,
          details: error.toString(),
          stack: error.stack
        }), {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          status: 500
        })
      }
    }

    // Serve static files from public directory
    const filePath = new URL(req.url).pathname
    const file = Bun.file('public' + (filePath === '/' ? '/index.html' : filePath))
    const exists = await file.exists()

    if (!exists) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(file)
  }
})

console.log(`Server running at http://localhost:${server.port}`)