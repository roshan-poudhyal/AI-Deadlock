// About AI page visualization

class AIModelVisualization {
  constructor() {
    this.initializeVisualization();
  }

  initializeVisualization() {
    const width = 800;
    const height = 400;

    this.svg = d3.select('#model-diagram')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Define the layers of the neural network
    const layers = [
      { name: 'Input Layer', nodes: 4, x: 100 },
      { name: 'Hidden Layer 1', nodes: 6, x: 300 },
      { name: 'Hidden Layer 2', nodes: 6, x: 500 },
      { name: 'Output Layer', nodes: 3, x: 700 }
    ];

    // Create nodes for each layer
    const nodes = [];
    const links = [];

    layers.forEach((layer, layerIndex) => {
      const nodeSpacing = height / (layer.nodes + 1);
      
      for (let i = 0; i < layer.nodes; i++) {
        const node = {
          id: `${layer.name}-${i}`,
          x: layer.x,
          y: nodeSpacing * (i + 1),
          layer: layerIndex
        };
        nodes.push(node);

        // Create links to next layer
        if (layerIndex < layers.length - 1) {
          const nextLayer = layers[layerIndex + 1];
          const nextNodeSpacing = height / (nextLayer.nodes + 1);
          
          for (let j = 0; j < nextLayer.nodes; j++) {
            links.push({
              source: node,
              target: {
                x: nextLayer.x,
                y: nextNodeSpacing * (j + 1)
              }
            });
          }
        }
      }
    });

    // Draw the links
    this.svg.selectAll('.link')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    // Draw the nodes
    const nodeGroups = this.svg.selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeGroups.append('circle')
      .attr('r', 10)
      .attr('fill', d => {
        const colors = ['#0066cc', '#00a8e8', '#00c8ff', '#00e4ff'];
        return colors[d.layer];
      });

    // Add layer labels
    this.svg.selectAll('.layer-label')
      .data(layers)
      .join('text')
      .attr('class', 'layer-label')
      .attr('x', d => d.x)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .text(d => d.name);

    // Add animation
    this.animateNetwork();
  }

  animateNetwork() {
    // Pulse animation for nodes
    this.svg.selectAll('circle')
      .transition()
      .duration(2000)
      .attr('r', 12)
      .transition()
      .duration(2000)
      .attr('r', 10)
      .on('end', () => this.animateNetwork());

    // Flow animation for links
    this.svg.selectAll('.link')
      .transition()
      .duration(2000)
      .attr('stroke-width', 2)
      .attr('opacity', 0.8)
      .transition()
      .duration(2000)
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);
  }
}

// Initialize visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new AIModelVisualization();
});