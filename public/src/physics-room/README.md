# Physics Room Component

A WebComponent-based 3D physics simulation using Rapier.js and Three.js. This component creates an interactive physics environment where objects interact based on their vector similarities.

## Architecture

The physics simulation is broken down into several components:

### Core Components
- `physics-room`: Main container component that orchestrates the simulation
- `physics-node`: Individual physics objects with vector properties
- `physics-joint`: Connections between physics nodes
- `physics-vacuum`: Central attractor that influences node behavior

### Supporting Components
- `physics-controls`: UI controls for simulation parameters
- `physics-visualization`: Three.js based visualization
- `physics-metrics`: Display of simulation metrics

## Vector Similarity System

The simulation uses a vector similarity system where:
- Each node has a 4D RGBA vector (color representation)
- The vacuum has a changing 4D vector that influences nodes
- Similarity is calculated using cosine similarity
- Forces are applied based on vector similarities

## Physics Parameters

The simulation can be tuned with the following parameters:
- `linearDamping`: Controls linear motion resistance (default: 8.0)
- `angularDamping`: Controls rotational resistance (default: 8.0)
- `mass`: Node mass (default: 3.0)
- `friction`: Surface friction (default: 0.8)
- `forceMagnitude`: Strength of attraction/repulsion (default: 0.4)
- `orbitalForce`: Strength of orbital motion (default: 0.02)

## Events

The component emits several events:
- `initialized`: When the physics engine is ready
- `node-selected`: When a node is clicked/selected
- `parameter-changed`: When physics parameters are updated
- `vector-updated`: When the vacuum vector changes

## Usage

```html
<physics-room>
  <physics-controls></physics-controls>
  <physics-metrics></physics-metrics>
</physics-room>
```

## Dependencies
- Three.js for 3D visualization
- Rapier.js for physics simulation
- DataroomElement as the base component class 