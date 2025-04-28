// Simulation logic and visualization using D3.js

class DeadlockSimulation {
  constructor() {
    this.processes = 5;
    this.resources = 3;
    this.maxMatrix = [];
    this.allocationMatrix = [];
    this.requestMatrix = [];
    this.availableResources = [];
    this.needMatrix = [];
    this.simulationSpeed = 'medium';
    this.simulationInterval = null;
    this.graph = null;
    this.simulationStep = 0;

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document.getElementById('processes').addEventListener('change', (e) => {
      this.processes = parseInt(e.target.value);
      this.resetSimulation();
    });

    document.getElementById('resources').addEventListener('change', (e) => {
      this.resources = parseInt(e.target.value);
      this.resetSimulation();
    });

    document.getElementById('simulation-speed').addEventListener('change', (e) => {
      this.simulationSpeed = e.target.value;
      if (this.simulationInterval) {
        this.stopSimulation();
        this.startSimulation();
      }
    });

    document.getElementById('initialize-matrices').addEventListener('click', () => {
      this.initializeMatrices();
    });

    document.getElementById('start-simulation').addEventListener('click', () => {
      this.startSimulation();
    });

    document.getElementById('reset-simulation').addEventListener('click', () => {
      this.resetSimulation();
    });
  }

  initializeMatrices() {
    // Initialize matrices with zeros
    this.maxMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );
    
    this.allocationMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );
    
    this.requestMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );

    // Initialize available resources with zeros
    this.availableResources = Array(this.resources).fill(0);

    this.updateNeedMatrix();
    this.createMatrixInputs();
    this.checkSystemSafety();
  }

  updateNeedMatrix() {
    this.needMatrix = this.maxMatrix.map((process, i) => 
      process.map((max, j) => max - this.allocationMatrix[i][j])
    );
  }

  createMatrixInputs() {
    const container = document.getElementById('matrices-container');
    container.innerHTML = '';

    // Create Maximum Need Matrix
    const maxMatrixDiv = document.createElement('div');
    maxMatrixDiv.className = 'matrix-container';
    maxMatrixDiv.innerHTML = `
      <h3>Maximum Need Matrix</h3>
      <table>
        <tr>
          <th>Process</th>
          ${Array(this.resources).fill().map((_, i) => `<th>R${i}</th>`).join('')}
        </tr>
        ${this.maxMatrix.map((row, i) => `
          <tr>
            <td>P${i}</td>
            ${row.map((cell, j) => `
              <td>
                <input type="number" 
                       min="0" 
                       value="${cell}" 
                       data-matrix="max" 
                       data-row="${i}" 
                       data-col="${j}"
                       class="matrix-input">
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </table>
    `;
    container.appendChild(maxMatrixDiv);

    // Create Allocation Matrix
    const allocMatrixDiv = document.createElement('div');
    allocMatrixDiv.className = 'matrix-container';
    allocMatrixDiv.innerHTML = `
      <h3>Allocation Matrix</h3>
      <table>
        <tr>
          <th>Process</th>
          ${Array(this.resources).fill().map((_, i) => `<th>R${i}</th>`).join('')}
        </tr>
        ${this.allocationMatrix.map((row, i) => `
          <tr>
            <td>P${i}</td>
            ${row.map((cell, j) => `
              <td>
                <input type="number" 
                       min="0" 
                       value="${cell}" 
                       data-matrix="allocation" 
                       data-row="${i}" 
                       data-col="${j}"
                       class="matrix-input">
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </table>
    `;
    container.appendChild(allocMatrixDiv);

    // Create Request Matrix
    const requestMatrixDiv = document.createElement('div');
    requestMatrixDiv.className = 'matrix-container';
    requestMatrixDiv.innerHTML = `
      <h3>Request Matrix</h3>
      <table>
        <tr>
          <th>Process</th>
          ${Array(this.resources).fill().map((_, i) => `<th>R${i}</th>`).join('')}
        </tr>
        ${this.requestMatrix.map((row, i) => `
          <tr>
            <td>P${i}</td>
            ${row.map((cell, j) => `
              <td>
                <input type="number" 
                       min="0" 
                       value="${cell}" 
                       data-matrix="request" 
                       data-row="${i}" 
                       data-col="${j}"
                       class="matrix-input">
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </table>
    `;
    container.appendChild(requestMatrixDiv);

    // Create Available Resources
    const availableDiv = document.createElement('div');
    availableDiv.className = 'matrix-container';
    availableDiv.innerHTML = `
      <h3>Available Resources</h3>
      <table>
        <tr>
          ${Array(this.resources).fill().map((_, i) => `<th>R${i}</th>`).join('')}
        </tr>
        <tr>
          ${this.availableResources.map((resource, i) => `
            <td>
              <input type="number" 
                     min="0" 
                     value="${resource}" 
                     data-matrix="available" 
                     data-col="${i}"
                     class="matrix-input">
            </td>
          `).join('')}
        </tr>
      </table>
    `;
    container.appendChild(availableDiv);

    // Add event listeners to all matrix inputs
    document.querySelectorAll('.matrix-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const matrix = e.target.dataset.matrix;
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const value = parseInt(e.target.value) || 0;

        switch(matrix) {
          case 'max':
            this.maxMatrix[row][col] = value;
            break;
          case 'allocation':
            this.allocationMatrix[row][col] = value;
            break;
          case 'request':
            this.requestMatrix[row][col] = value;
            break;
          case 'available':
            this.availableResources[col] = value;
            break;
        }

        // Update need matrix
        this.updateNeedMatrix();
        
        // Only update graph if simulation is running
        if (this.simulationInterval) {
          this.updateGraph();
          this.checkSystemSafety();
        }
      });
    });
  }

  updateGraph() {
    const graphContainer = document.getElementById('resource-graph');
    graphContainer.innerHTML = '';

    const width = 800;
    const height = 600;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    // Create SVG with zoom capability and dark background
    const svg = d3.select('#resource-graph')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#1a1a1a')
      .call(d3.zoom()
        .scaleExtent([0.5, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        }))
      .append('g');

    // Create a group for all elements
    const g = svg.append('g');

    // Add defs for glow effects
    const defs = g.append('defs');

    // Add glow filter for processes
    defs.append('filter')
      .attr('id', 'process-glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    // Add glow filter for resources
    defs.append('filter')
      .attr('id', 'resource-glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    // Add glow filter for links
    defs.append('filter')
      .attr('id', 'link-glow')
      .append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');

    // Create nodes
    const nodes = [];
    
    // Add process nodes with fixed positions
    const processSpacing = width / (this.processes + 1);
    for (let i = 0; i < this.processes; i++) {
      nodes.push({
        id: `P${i}`,
        type: 'process',
        x: processSpacing * (i + 1),
        y: height * 0.6,
        color: '#00ff00', // Neon green for processes
        label: `P${i}`,
        fixed: true
      });
    }

    // Add resource nodes with fixed positions
    const resourceSpacing = width / (this.resources + 1);
    for (let i = 0; i < this.resources; i++) {
      nodes.push({
        id: `R${i}`,
        type: 'resource',
        x: resourceSpacing * (i + 1),
        y: height * 0.2,
        color: '#00ffff', // Neon cyan for resources
        label: `R${i} (${this.availableResources[i]})`,
        fixed: true
      });
    }

    // Create links
    const links = [];

    // Add allocation links
    for (let i = 0; i < this.processes; i++) {
      for (let j = 0; j < this.resources; j++) {
        if (this.allocationMatrix[i][j] > 0) {
          links.push({
            source: `R${j}`,
            target: `P${i}`,
            type: 'allocation',
            value: this.allocationMatrix[i][j],
            label: this.allocationMatrix[i][j]
          });
        }
      }
    }

    // Add request links
    for (let i = 0; i < this.processes; i++) {
      for (let j = 0; j < this.resources; j++) {
        if (this.requestMatrix[i][j] > 0) {
          links.push({
            source: `P${i}`,
            target: `R${j}`,
            type: 'request',
            value: this.requestMatrix[i][j],
            label: this.requestMatrix[i][j]
          });
        }
      }
    }

    // Add arrow markers with glow
    defs.selectAll('marker')
      .data(['allocation', 'request'])
      .enter().append('marker')
      .attr('id', d => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d === 'allocation' ? '#00ffff' : '#00ff00');

    // Draw links with glow effect
    const linkGroups = g.selectAll('.link')
      .data(links)
      .enter().append('g')
      .attr('class', 'link');

    // Add glow effect to links
    linkGroups.append('line')
      .attr('class', 'link-glow')
      .attr('stroke', d => d.type === 'allocation' ? '#00ffff' : '#00ff00')
      .attr('stroke-width', 4)
      .attr('filter', 'url(#link-glow)')
      .attr('opacity', 0.5);

    linkGroups.append('line')
      .attr('class', 'link-line')
      .attr('stroke', d => d.type === 'allocation' ? '#00ffff' : '#00ff00')
      .attr('stroke-width', 2)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    linkGroups.append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .attr('fill', '#fff')
      .attr('font-family', 'monospace')
      .text(d => d.label);

    // Draw nodes with enhanced visibility and glow
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node');

    // Add glow effect to nodes
    nodeGroups.append('circle')
      .attr('class', 'node-glow')
      .attr('r', 30)
      .attr('fill', d => d.color)
      .attr('filter', d => d.type === 'process' ? 'url(#process-glow)' : 'url(#resource-glow)')
      .attr('opacity', 0.5);

    // Add main node circle
    nodeGroups.append('circle')
      .attr('r', 25)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add node labels with cyberpunk style
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('font-size', '14px')
      .text(d => d.label);

    // Add labels for process and resource groups with cyberpunk style
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height * 0.1)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('fill', '#00ffff')
      .text('Resources');

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height * 0.9)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .attr('fill', '#00ff00')
      .text('Processes');

    // Update positions with more stable forces
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(100)
        .strength(0.8))
      .force('charge', d3.forceManyBody()
        .strength(-300)
        .distanceMax(200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX()
        .strength(0.1)
        .x(d => d.x))
      .force('y', d3.forceY()
        .strength(0.1)
        .y(d => d.y))
      .on('tick', () => {
        linkGroups.select('.link-line')
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        linkGroups.select('.link-glow')
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        linkGroups.select('.link-label')
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2);

        nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    // Stop the simulation after a few ticks to maintain stability
    setTimeout(() => {
      simulation.stop();
    }, 1000);
  }

  startSimulation() {
    if (this.simulationInterval) {
      this.stopSimulation();
    }

    const speedMap = {
      slow: 2000,
      medium: 1000,
      fast: 500
    };

    // Generate initial graph when simulation starts
    this.updateGraph();

    this.simulationInterval = setInterval(() => {
      this.simulationStep++;
      this.updateSimulation();
    }, speedMap[this.simulationSpeed]);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    // Clear the graph when simulation stops
    document.getElementById('resource-graph').innerHTML = '';
  }

  resetSimulation() {
    this.stopSimulation();
    this.simulationStep = 0;
    // Initialize all matrices with zeros
    this.maxMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );
    this.allocationMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );
    this.requestMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );
    this.availableResources = Array(this.resources).fill(0);
    this.needMatrix = Array(this.processes).fill().map(() => 
      Array(this.resources).fill(0)
    );
    document.getElementById('matrices-container').innerHTML = '';
    document.getElementById('resource-graph').innerHTML = '';
    document.getElementById('ai-suggestions').innerHTML = 
      '<p>Configure the system and start simulation to see AI analysis.</p>';
  }

  updateSimulation() {
    // Update matrices based on simulation step
    this.updateNeedMatrix();
    this.createMatrixInputs();
    this.updateGraph();
    this.checkSystemSafety();
  }

  checkSystemSafety() {
    const work = [...this.availableResources];
    const finish = Array(this.processes).fill(false);
    const safeSequence = [];
    let found = true;

    while (found) {
      found = false;
      for (let i = 0; i < this.processes; i++) {
        if (!finish[i] && this.canAllocate(i, work)) {
          for (let j = 0; j < this.resources; j++) {
            work[j] += this.allocationMatrix[i][j];
          }
          finish[i] = true;
          safeSequence.push(`P${i}`);
          found = true;
        }
      }
    }

    const isSafe = finish.every(f => f);
    this.updateAIOutput(isSafe, safeSequence);
  }

  canAllocate(processIndex, work) {
    for (let i = 0; i < this.resources; i++) {
      if (this.needMatrix[processIndex][i] > work[i]) {
        return false;
      }
    }
    return true;
  }

  updateAIOutput(isSafe, safeSequence) {
    const aiSuggestions = document.getElementById('ai-suggestions');
    
    if (isSafe) {
      aiSuggestions.innerHTML = `
        <div class="ai-suggestion safe">
          <h3>System is in a Safe State</h3>
          <p>Safe sequence: ${safeSequence.join(' → ')}</p>
          <p>No deadlock detected. The system can allocate resources safely.</p>
        </div>
      `;
    } else {
      aiSuggestions.innerHTML = `
        <div class="ai-suggestion unsafe">
          <h3>System is in an Unsafe State</h3>
          <p>Potential deadlock detected. The system cannot guarantee safe resource allocation.</p>
          <p>Recommendations:</p>
          <ul>
            <li>Reduce resource requests from processes</li>
            <li>Increase available resources</li>
            <li>Modify resource allocation to break circular wait</li>
          </ul>
        </div>
      `;
    }
  }
}

// Initialize simulation when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new DeadlockSimulation();
});