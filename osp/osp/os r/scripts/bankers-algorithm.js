// Banker's Algorithm implementation

class BankersAlgorithm {
  constructor() {
    this.processes = 0;
    this.resources = 0;
    this.available = [];
    this.max = [];
    this.allocation = [];
    this.need = [];
    
    this.initializeControls();
  }

  initializeControls() {
    // Get DOM elements
    this.processesInput = document.getElementById('bankers-processes');
    this.resourcesInput = document.getElementById('bankers-resources');
    this.initializeButton = document.getElementById('initialize-bankers');
    this.checkSafetyButton = document.getElementById('check-safety');
    this.resetButton = document.getElementById('reset-bankers');
    this.matricesContainer = document.getElementById('bankers-matrices');
    this.safetyResult = document.getElementById('safety-result');
    this.safeSequence = document.getElementById('safe-sequence');

    // Add event listeners
    this.initializeButton.addEventListener('click', () => this.initializeMatrices());
    this.checkSafetyButton.addEventListener('click', () => this.checkSystemSafety());
    this.resetButton.addEventListener('click', () => this.resetSystem());
  }

  initializeMatrices() {
    this.processes = parseInt(this.processesInput.value);
    this.resources = parseInt(this.resourcesInput.value);

    // Initialize matrices
    this.available = Array(this.resources).fill(0);
    this.max = Array(this.processes).fill().map(() => Array(this.resources).fill(0));
    this.allocation = Array(this.processes).fill().map(() => Array(this.resources).fill(0));
    this.need = Array(this.processes).fill().map(() => Array(this.resources).fill(0));

    // Render matrices
    this.renderMatrices();
  }

  renderMatrices() {
    this.matricesContainer.innerHTML = '';

    // Create Available Resources section
    const availableSection = document.createElement('div');
    availableSection.className = 'matrix-section';
    availableSection.innerHTML = `<h3>Available Resources</h3>`;
    
    const availableTable = document.createElement('table');
    const availableHeader = document.createElement('tr');
    
    for (let i = 0; i < this.resources; i++) {
      const th = document.createElement('th');
      th.textContent = `R${i + 1}`;
      availableHeader.appendChild(th);
    }
    
    availableTable.appendChild(availableHeader);
    
    const availableRow = document.createElement('tr');
    for (let i = 0; i < this.resources; i++) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = this.available[i];
      input.addEventListener('change', (e) => {
        this.available[i] = parseInt(e.target.value) || 0;
        this.updateNeedMatrix();
      });
      td.appendChild(input);
      availableRow.appendChild(td);
    }
    
    availableTable.appendChild(availableRow);
    availableSection.appendChild(availableTable);
    this.matricesContainer.appendChild(availableSection);

    // Create Max Matrix section
    this.createMatrixSection('Maximum Claim', this.max, (i, j, value) => {
      this.max[i][j] = value;
      this.updateNeedMatrix();
    });

    // Create Allocation Matrix section
    this.createMatrixSection('Current Allocation', this.allocation, (i, j, value) => {
      this.allocation[i][j] = value;
      this.updateNeedMatrix();
    });

    // Create Need Matrix section (read-only)
    this.createMatrixSection('Need Matrix', this.need, null, true);
  }

  createMatrixSection(title, matrix, onChange, readOnly = false) {
    const section = document.createElement('div');
    section.className = 'matrix-section';
    section.innerHTML = `<h3>${title}</h3>`;
    
    const table = document.createElement('table');
    const header = document.createElement('tr');
    header.appendChild(document.createElement('th')); // Empty corner cell
    
    for (let i = 0; i < this.resources; i++) {
      const th = document.createElement('th');
      th.textContent = `R${i + 1}`;
      header.appendChild(th);
    }
    
    table.appendChild(header);
    
    for (let i = 0; i < this.processes; i++) {
      const row = document.createElement('tr');
      const th = document.createElement('th');
      th.textContent = `P${i + 1}`;
      row.appendChild(th);
      
      for (let j = 0; j < this.resources; j++) {
        const td = document.createElement('td');
        if (readOnly) {
          td.textContent = matrix[i][j];
          td.className = 'read-only';
        } else {
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.value = matrix[i][j];
          input.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            onChange(i, j, value);
          });
          td.appendChild(input);
        }
        row.appendChild(td);
      }
      
      table.appendChild(row);
    }
    
    section.appendChild(table);
    this.matricesContainer.appendChild(section);
  }

  updateNeedMatrix() {
    for (let i = 0; i < this.processes; i++) {
      for (let j = 0; j < this.resources; j++) {
        this.need[i][j] = Math.max(0, this.max[i][j] - this.allocation[i][j]);
      }
    }
    
    // Update the Need Matrix display
    const needSection = this.matricesContainer.querySelector('.matrix-section:nth-child(4)');
    if (needSection) {
      const cells = needSection.querySelectorAll('tr:not(:first-child) td.read-only');
      let cellIndex = 0;
      
      for (let i = 0; i < this.processes; i++) {
        for (let j = 0; j < this.resources; j++) {
          if (cellIndex < cells.length) {
            cells[cellIndex].textContent = this.need[i][j];
            cellIndex++;
          }
        }
      }
    }
  }

  checkSystemSafety() {
    // Implement Banker's Algorithm safety check
    const work = [...this.available];
    const finish = Array(this.processes).fill(false);
    const safeSequence = [];
    
    let count = 0;
    while (count < this.processes) {
      let found = false;
      
      for (let i = 0; i < this.processes; i++) {
        if (!finish[i]) {
          let canAllocate = true;
          
          for (let j = 0; j < this.resources; j++) {
            if (this.need[i][j] > work[j]) {
              canAllocate = false;
              break;
            }
          }
          
          if (canAllocate) {
            for (let j = 0; j < this.resources; j++) {
              work[j] += this.allocation[i][j];
            }
            
            finish[i] = true;
            safeSequence.push(i);
            found = true;
            count++;
          }
        }
      }
      
      if (!found) {
        break;
      }
    }
    
    const isSafe = count === this.processes;
    this.displaySafetyResult(isSafe, safeSequence);
  }

  displaySafetyResult(isSafe, safeSequence) {
    if (isSafe) {
      this.safetyResult.innerHTML = `
        <h3 class="status-safe">✅ System is in a Safe State</h3>
        <p>The current resource allocation state is safe. All processes can complete without deadlock.</p>
      `;
      
      this.safeSequence.innerHTML = `
        <h3>Safe Sequence</h3>
        <div class="sequence-display">
          ${safeSequence.map(i => `<div class="sequence-item">P${i + 1}</div>`).join(' → ')}
        </div>
        <p>This sequence guarantees that all processes will be able to complete their execution.</p>
      `;
    } else {
      this.safetyResult.innerHTML = `
        <h3 class="status-danger">⚠️ System is in an Unsafe State</h3>
        <p>The current resource allocation state may lead to deadlock. No safe sequence exists.</p>
        <p>Consider releasing some resources or adjusting the maximum claims.</p>
      `;
      
      this.safeSequence.innerHTML = '';
    }
  }

  resetSystem() {
    this.processes = parseInt(this.processesInput.value);
    this.resources = parseInt(this.resourcesInput.value);
    
    this.available = Array(this.resources).fill(0);
    this.max = Array(this.processes).fill().map(() => Array(this.resources).fill(0));
    this.allocation = Array(this.processes).fill().map(() => Array(this.resources).fill(0));
    this.need = Array(this.processes).fill().map(() => Array(this.resources).fill(0));
    
    this.renderMatrices();
    this.safetyResult.innerHTML = `
      <h3>Safety Analysis Result</h3>
      <p>Configure the system and check safety to see results.</p>
    `;
    this.safeSequence.innerHTML = '';
  }
}

// Initialize Banker's Algorithm when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new BankersAlgorithm();
});