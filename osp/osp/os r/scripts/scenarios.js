// Scenarios page logic and visualization

class ScenariosManager {
  constructor() {
    this.initializeVisualization();
    this.initializeEventListeners();
  }

  initializeVisualization() {
    const width = 800;
    const height = 400;

    this.svg = d3.select('#scenario-visualization')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
  }

  initializeEventListeners() {
    const buttons = document.querySelectorAll('[data-scenario]');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const scenario = button.getAttribute('data-scenario');
        this.loadScenario(scenario);
      });
    });
  }

  loadScenario(scenarioName) {
    const scenarioData = this.getScenarioData(scenarioName);
    this.updateVisualization(scenarioData.graph);
    this.updateDescription(scenarioData.description);
    this.updateSolutions(scenarioData.solutions);
  }

  getScenarioData(scenarioName) {
    const scenarios = {
      'dining-philosophers': {
        graph: {
          nodes: [
            { id: 'P1', type: 'process', label: 'Philosopher 1' },
            { id: 'P2', type: 'process', label: 'Philosopher 2' },
            { id: 'P3', type: 'process', label: 'Philosopher 3' },
            { id: 'P4', type: 'process', label: 'Philosopher 4' },
            { id: 'P5', type: 'process', label: 'Philosopher 5' },
            { id: 'R1', type: 'resource', label: 'Fork 1' },
            { id: 'R2', type: 'resource', label: 'Fork 2' },
            { id: 'R3', type: 'resource', label: 'Fork 3' },
            { id: 'R4', type: 'resource', label: 'Fork 4' },
            { id: 'R5', type: 'resource', label: 'Fork 5' }
          ],
          links: [
            { source: 'R1', target: 'P1' },
            { source: 'R2', target: 'P2' },
            { source: 'R3', target: 'P3' },
            { source: 'R4', target: 'P4' },
            { source: 'R5', target: 'P5' }
          ]
        },
        description: 'The Dining Philosophers problem is a classic synchronization problem. Five philosophers sit at a round table with five forks placed between them. Each philosopher needs two forks to eat, leading to potential deadlock if all philosophers pick up their left fork simultaneously.',
        solutions: [
          'Implement resource hierarchy (numbered forks)',
          'Use a waiter (semaphore) to control access',
          'Allow only N-1 philosophers to sit simultaneously'
        ]
      },
      'resource-hierarchy': {
        graph: {
          nodes: [
            { id: 'P1', type: 'process', label: 'Process 1' },
            { id: 'P2', type: 'process', label: 'Process 2' },
            { id: 'P3', type: 'process', label: 'Process 3' },
            { id: 'P4', type: 'process', label: 'Process 4' },
            { id: 'R1', type: 'resource', label: 'Resource 1' },
            { id: 'R2', type: 'resource', label: 'Resource 2' },
            { id: 'R3', type: 'resource', label: 'Resource 3' },
            { id: 'R4', type: 'resource', label: 'Resource 4' }
          ],
          links: [
            { source: 'R1', target: 'P1' },
            { source: 'R2', target: 'P2' },
            { source: 'R3', target: 'P3' },
            { source: 'R4', target: 'P4' }
          ]
        },
        description: 'In this scenario, multiple processes request resources in different orders. Without a proper resource allocation strategy, this can lead to circular wait conditions and deadlock.',
        solutions: [
          'Implement global resource ordering',
          'Use deadlock detection algorithm',
          'Implement resource request scheduling'
        ]
      },
      'producer-consumer': {
        graph: {
          nodes: [
            { id: 'P1', type: 'process', label: 'Producer 1' },
            { id: 'P2', type: 'process', label: 'Producer 2' },
            { id: 'P3', type: 'process', label: 'Producer 3' },
            { id: 'C1', type: 'process', label: 'Consumer 1' },
            { id: 'C2', type: 'process', label: 'Consumer 2' },
            { id: 'C3', type: 'process', label: 'Consumer 3' },
            { id: 'B1', type: 'resource', label: 'Buffer' }
          ],
          links: [
            { source: 'P1', target: 'B1' },
            { source: 'P2', target: 'B1' },
            { source: 'P3', target: 'B1' },
            { source: 'B1', target: 'C1' },
            { source: 'B1', target: 'C2' },
            { source: 'B1', target: 'C3' }
          ]
        },
        description: 'The Producer-Consumer problem involves multiple producers writing to a shared buffer and multiple consumers reading from it. Deadlock can occur if the buffer becomes full and synchronization is not properly managed.',
        solutions: [
          'Use semaphores for synchronization',
          'Implement bounded buffer with monitoring',
          'Use condition variables for coordination'
        ]
      }
    };

    return scenarios[scenarioName];
  }

  updateVisualization(graphData) {
    // Clear existing visualization
    this.svg.selectAll('*').remove();

    const link = this.svg.selectAll('.link')
      .data(graphData.links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    const node = this.svg.selectAll('.node')
      .data(graphData.nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    node.append('circle')
      .attr('r', 10)
      .attr('fill', d => d.type === 'process' ? '#0066cc' : '#00c8ff');

    node.append('title')
      .text(d => d.label);

    node.append('text')
      .attr('dx', 15)
      .attr('dy', 5)
      .text(d => d.label);

    this.simulation
      .nodes(graphData.nodes)
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });

    this.simulation.force('link')
      .links(graphData.links);

    this.simulation.alpha(1).restart();
  }

  updateDescription(description) {
    document.getElementById('scenario-problem').textContent = description;
  }

  updateSolutions(solutions) {
    const solutionsList = document.getElementById('solution-approaches');
    solutionsList.innerHTML = solutions.map(solution => `<li>${solution}</li>`).join('');
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
}

// Initialize scenarios manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ScenariosManager();
});