// Home page animations and interactions

class HomePageAnimations {
  constructor() {
    this.initializeHeroAnimation();
    this.initializeFeatureAnimations();
    this.addScrollAnimations();
  }

  initializeHeroAnimation() {
    const width = document.getElementById('hero-animation').clientWidth;
    const height = document.getElementById('hero-animation').clientHeight;

    this.svg = d3.select('#hero-animation')
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create animated nodes representing processes and resources
    const nodes = [
      { id: 'P1', type: 'process', x: width * 0.2, y: height * 0.3 },
      { id: 'P2', type: 'process', x: width * 0.8, y: height * 0.3 },
      { id: 'P3', type: 'process', x: width * 0.5, y: height * 0.7 },
      { id: 'R1', type: 'resource', x: width * 0.5, y: height * 0.2 },
      { id: 'R2', type: 'resource', x: width * 0.2, y: height * 0.6 },
      { id: 'R3', type: 'resource', x: width * 0.8, y: height * 0.6 }
    ];

    const links = [
      { source: nodes[0], target: nodes[3] },
      { source: nodes[1], target: nodes[4] },
      { source: nodes[2], target: nodes[5] }
    ];

    // Draw connecting lines
    const link = this.svg.selectAll('.link')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#00c8ff')
      .attr('stroke-width', 2)
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // Draw nodes
    const node = this.svg.selectAll('.node')
      .data(nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', 12)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => d.type === 'process' ? '#0066cc' : '#00c8ff');

    // Add labels
    const label = this.svg.selectAll('.label')
      .data(nodes)
      .join('text')
      .attr('class', 'label')
      .attr('x', d => d.x)
      .attr('y', d => d.y + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f5f7fa')
      .text(d => d.id);

    // Add animation
    this.animateHero();
  }

  animateHero() {
    // Pulse animation for nodes
    this.svg.selectAll('.node')
      .transition()
      .duration(2000)
      .attr('r', 15)
      .transition()
      .duration(2000)
      .attr('r', 12)
      .on('end', () => this.animateHero());

    // Glow animation for links
    this.svg.selectAll('.link')
      .transition()
      .duration(2000)
      .attr('stroke-width', 3)
      .attr('opacity', 1)
      .transition()
      .duration(2000)
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);
  }

  initializeFeatureAnimations() {
    // Deadlock animation
    const deadlockSvg = d3.select('#deadlock-animation')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 100 100');

    // Add circular arrow pattern
    this.createCircularArrow(deadlockSvg);

    // Conditions animation
    const conditionsSvg = d3.select('#conditions-animation')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 100 100');

    // Add checkmark pattern
    this.createCheckmarks(conditionsSvg);

    // Detection animation
    const detectionSvg = d3.select('#detection-animation')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', '0 0 100 100');

    // Add scanning pattern
    this.createScanningAnimation(detectionSvg);
  }

  createCircularArrow(svg) {
    const arrow = svg.append('path')
      .attr('d', 'M50,20 A30,30 0 1,1 20,50')
      .attr('fill', 'none')
      .attr('stroke', '#0066cc')
      .attr('stroke-width', '4')
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#0066cc');

    // Animate the arrow
    function rotateArrow() {
      arrow.transition()
        .duration(3000)
        .attrTween('transform', () => {
          return t => `rotate(${t * 360}, 50, 50)`;
        })
        .on('end', rotateArrow);
    }

    rotateArrow();
  }

  createCheckmarks(svg) {
    const conditions = [
      { y: 25, text: 'Mutual Exclusion' },
      { y: 50, text: 'Hold and Wait' },
      { y: 75, text: 'No Preemption' }
    ];

    conditions.forEach((condition, i) => {
      // Add checkmark
      const check = svg.append('path')
        .attr('d', 'M10,50 L25,65 L45,35')
        .attr('transform', `translate(0,${condition.y - 50})`)
        .attr('stroke', '#0066cc')
        .attr('stroke-width', '4')
        .attr('fill', 'none')
        .attr('stroke-dasharray', '100')
        .attr('stroke-dashoffset', '100');

      // Add text
      svg.append('text')
        .attr('x', 60)
        .attr('y', condition.y)
        .attr('fill', '#333')
        .attr('font-size', '12')
        .text(condition.text);

      // Animate checkmark
      function animateCheck() {
        check.transition()
          .duration(1000)
          .attr('stroke-dashoffset', '0')
          .transition()
          .duration(1000)
          .attr('stroke-dashoffset', '100')
          .transition()
          .duration(1000)
          .on('end', animateCheck);
      }

      setTimeout(animateCheck, i * 500);
    });
  }

  createScanningAnimation(svg) {
    // Create scanning line
    const scanLine = svg.append('line')
      .attr('x1', 10)
      .attr('y1', 0)
      .attr('x2', 10)
      .attr('y2', 100)
      .attr('stroke', '#0066cc')
      .attr('stroke-width', '2');

    // Add data points
    const points = [];
    for (let i = 0; i < 5; i++) {
      points.push({
        x: 20 + i * 15,
        y: 30 + Math.random() * 40
      });
    }

    // Draw data points
    svg.selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 4)
      .attr('fill', '#00c8ff');

    // Animate scanning
    function scan() {
      scanLine.transition()
        .duration(2000)
        .attr('x1', 90)
        .attr('x2', 90)
        .transition()
        .duration(0)
        .attr('x1', 10)
        .attr('x2', 10)
        .on('end', scan);
    }

    scan();
  }

  addScrollAnimations() {
    const elements = document.querySelectorAll('.feature-card, .step');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(element => observer.observe(element));
  }
}

// Initialize animations when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new HomePageAnimations();
});