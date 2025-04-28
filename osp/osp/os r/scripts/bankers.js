// Banker's Algorithm Implementation and Visualization

class BankersAlgorithm {
  constructor() {
    this.processes = [];
    this.resources = [];
    this.maxMatrix = [];
    this.allocationMatrix = [];
    this.needMatrix = [];
    this.available = [];
    this.initializeUI();
    this.initializeGraph();
  }

  initializeUI() {
    // Get DOM elements
    this.processInput = document.getElementById('bankers-processes');
    this.resourceInput = document.getElementById('bankers-resources');
    this.initButton = document.getElementById('initialize-bankers');
    this.checkButton = document.getElementById('check-safety');
    this.resetButton = document.getElementById('reset-bankers');
    this.matricesContainer = document.getElementById('bankers-matrices');
    this.safetyResult = document.getElementById('safety-result');
    this.safeSequence = document.getElementById('safe-sequence');

    // Add event listeners
    this.initButton.addEventListener('click', () => this.initializeMatrices());
    this.checkButton.addEventListener('click', () => this.checkSystemSafety());
    this.resetButton.addEventListener('click', () => this.resetSystem());
  }

  initializeGraph() {
    const width = 800;
    const height = 400;
    this.svg = d3.select('#resource-graph')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
  }

  initializeMatrices() {
    const numProcesses = parseInt(this.processInput.value);
    const numResources = parseInt(this.resourceInput.value);

    // Initialize matrices
    this.maxMatrix = Array(numProcesses).fill().map(() => Array(numResources).fill(0));
    this.allocationMatrix = Array(numProcesses).fill().map(() => Array(numResources).fill(0));
    this.needMatrix = Array(numProcesses).fill().map(() => Array(numResources).fill(0));
    this.available = Array(numResources).fill(0);

    this.createMatrixInputs();
  }

  createMatrixInputs() {
    let html = `
      <div class="matrix-section">
        <h3>Maximum Need Matrix</h3>
        ${this.createMatrixTable('max', this.maxMatrix)}
      </div>
      <div class="matrix-section">
        <h3>Allocation Matrix</h3>
        ${this.createMatrixTable('allocation', this.allocationMatrix)}
      </div>
      <div class="matrix-section">
        <h3>Available Resources</h3>
        ${this.createAvailableResourcesInput()}
      </div>
    `;

    this.matricesContainer.innerHTML = html;
    this.addMatrixInputListeners();
  }

  createMatrixTable(id, matrix) {
    return `
      <table class="matrix-table">
        ${matrix.map((row, i) => `
          <tr>
            ${row.map((cell, j) => `
              <td>
                <input type="number" 
                       min="0" 
                       value="${cell}" 
                       data-matrix="${id}" 
                       data-row="${i}" 
                       data-col="${j}">
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </table>
    `;
  }

  createAvailableResourcesInput() {
    return `
      <div class="available-resources">
        ${this.available.map((val, i) => `
          <input type="number" 
                 min="0" 
                 value="${val}" 
                 data-index="${i}" 
                 class="available-input">
        `).join('')}
      </div>
    `;
  }

  addMatrixInputListeners() {
    // Add listeners for matrix inputs
    document.querySelectorAll('.matrix-table input').forEach(input => {
      input.addEventListener('change', (e) => {
        const matrix = e.target.dataset.matrix;
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const value = parseInt(e.target.value);

        if (matrix === 'max') {
          this.maxMatrix[row][col] = value;
          this.updateNeedMatrix();
        } else if (matrix === 'allocation') {
          this.allocationMatrix[row][col] = value;
          this.updateNeedMatrix();
        }

        this.updateGraph();
      });
    });

    // Add listeners for available resources
    document.querySelectorAll('.available-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.available[index] = parseInt(e.target.value);
        this.updateGraph();
      });
    });
  }

  updateNeedMatrix() {
    for (let i = 0; i < this.maxMatrix.length; i++) {
      for (let j = 0; j < this.maxMatrix[i].length; j++) {
        this.needMatrix[i][j] = this.maxMatrix[i][j] - this.allocationMatrix[i][j];
      }
    }
  }

  checkSystemSafety() {
    const work = [...this.available];
    const finish = Array(this.maxMatrix.length).fill(false);
    const safeSequence = [];

    let found;
    do {
      found = false;
      for (let i = 0; i < this.maxMatrix.length; i++) {
        if (!finish[i] && this.canAllocate(i, work)) {
          for (let j = 0; j < work.length; j++) {
            work[j] += this.allocationMatrix[i][j];
          }
          finish[i] = true;
          safeSequence.push(i);
          found = true;
        }
      }
    } while (found);

    const isSafe = finish.every(f => f);
    this.displaySafetyResult(isSafe, safeSequence);
    this.updateGraph(safeSequence);
  }

  canAllocate(process, work) {
    return this.needMatrix[process].every((need, j) => need <= work[j]);
  }

  displaySafetyResult(isSafe, safeSequence) {
    this.safetyResult.innerHTML = `
      <h3>Safety Analysis Result</h3>
      <p class="${isSafe ? 'safe' : 'unsafe'}">
        System is ${isSafe ? 'SAFE' : 'UNSAFE'}
      </p>
    `;

    if (isSafe) {
      this.safeSequence.innerHTML = `
        <h3>Safe Sequence</h3>
        <p class="sequence">P${safeSequence.join(' → P')}</p>
      `;
    } else {
      this.safeSequence.innerHTML = `
        <h3>Deadlock Detected</h3>
        <p class="warning">System is in an unsafe state. Deadlock may occur.</p>
      `;
    }
  }

  updateGraph(safeSequence = []) {
    const nodes = [];
    const links = [];

    // Add process nodes
    for (let i = 0; i < this.maxMatrix.length; i++) {
      nodes.push({
        id: `P${i}`,
        type: 'process',
        safe: safeSequence.includes(i)
      });
    }

    // Add resource nodes
    for (let i = 0; i < this.available.length; i++) {
      nodes.push({
        id: `R${i}`,
        type: 'resource',
        available: this.available[i]
      });
    }

    // Add links for allocations and needs
    for (let i = 0; i < this.allocationMatrix.length; i++) {
      for (let j = 0; j < this.allocationMatrix[i].length; j++) {
        if (this.allocationMatrix[i][j] > 0) {
          links.push({
            source: `R${j}`,
            target: `P${i}`,
            value: this.allocationMatrix[i][j],
            type: 'allocation'
          });
        }
        if (this.needMatrix[i][j] > 0) {
          links.push({
            source: `P${i}`,
            target: `R${j}`,
            value: this.needMatrix[i][j],
            type: 'need'
          });
        }
      }
    }

    this.updateVisualization(nodes, links);
  }

  updateVisualization(nodes, links) {
    // Update force simulation
    this.simulation.nodes(nodes);
    this.simulation.force('link').links(links);

    // Clear previous visualization
    this.svg.selectAll('*').remove();

    // Draw links
    const link = this.svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .attr('stroke', d => d.type === 'allocation' ? '#2ecc71' : '#e74c3c')
      .attr('marker-end', d => d.type === 'need' ? 'url(#arrowhead)' : '');

    // Draw nodes
    const node = this.svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', 20)
      .attr('fill', d => {
        if (d.type === 'process') {
          return d.safe ? '#2ecc71' : '#e74c3c';
        }
        return '#3498db';
      })
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    // Add labels
    const label = this.svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.id)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white');

    // Update positions on tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Restart simulation
    this.simulation.alpha(1).restart();
  }

  dragstarted(event) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragended(event) {
    if (!event.active) this.simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  resetSystem() {
    this.maxMatrix = [];
    this.allocationMatrix = [];
    this.needMatrix = [];
    this.available = [];
    this.matricesContainer.innerHTML = '';
    this.safetyResult.innerHTML = `
      <h3>Safety Analysis Result</h3>
      <p>Configure the system and check safety to see results.</p>
    `;
    this.safeSequence.innerHTML = '';
    this.svg.selectAll('*').remove();
  }
}

// Initialize Banker's Algorithm when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const bankersAlgorithm = new BankersAlgorithm();
});