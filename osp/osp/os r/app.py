from flask import Flask, request, jsonify
from flask_cors import CORS
from collections import defaultdict
import numpy as np

app = Flask(__name__)
CORS(app)

class DeadlockDetector:
    def __init__(self):
        self.processes = []
        self.resources = []
        self.allocation = []
        self.request = []
        self.available = []
        self.need = []

    def set_system_state(self, processes, resources, allocation, request, available):
        self.processes = processes
        self.resources = resources
        self.allocation = allocation
        self.request = request
        self.available = available
        self.calculate_need_matrix()

    def calculate_need_matrix(self):
        self.need = []
        for i in range(len(self.processes)):
            process_need = []
            for j in range(len(self.resources)):
                process_need.append(self.request[i][j] - self.allocation[i][j])
            self.need.append(process_need)

    def detect_deadlock(self):
        work = self.available.copy()
        finish = [False] * len(self.processes)
        deadlock_processes = []

        while True:
            found = False
            for i, process in enumerate(self.processes):
                if not finish[i]:
                    can_allocate = True
                    for j in range(len(self.resources)):
                        if self.need[i][j] > work[j]:
                            can_allocate = False
                            break
                    
                    if can_allocate:
                        found = True
                        finish[i] = True
                        for j in range(len(self.resources)):
                            work[j] += self.allocation[i][j]

            if not found:
                break

        for i in range(len(finish)):
            if not finish[i]:
                deadlock_processes.append(self.processes[i])

        return {
            'deadlock_detected': len(deadlock_processes) > 0,
            'deadlocked_processes': deadlock_processes,
            'system_state': {
                'processes': self.processes,
                'resources': self.resources,
                'allocation': self.allocation,
                'request': self.request,
                'available': self.available,
                'need': self.need
            }
        }

    def prevent_deadlock(self):
        # AI-based deadlock prevention using resource allocation optimization
        if not self.processes or not self.resources:
            return {'error': 'System state not initialized'}

        # Convert to numpy arrays for easier computation
        allocation = np.array(self.allocation)
        request = np.array(self.request)
        available = np.array(self.available)
        need = np.array(self.need)

        # Calculate resource utilization
        total_resources = allocation.sum(axis=0) + available
        utilization = allocation.sum(axis=0) / total_resources

        # Identify potential bottlenecks
        bottleneck_resources = np.where(utilization > 0.8)[0]
        
        # Calculate process priority based on resource needs and current allocation
        process_priority = []
        for i in range(len(self.processes)):
            
            priority = 0
            for j in range(len(self.resources)):
                if j in bottleneck_resources and self.need[i][j] > 0:
                    priority -= 2  # Penalize processes requesting bottleneck resources
                priority += (1 - self.need[i][j] / total_resources[j])  # Higher priority for lower needs
                priority += (1 - self.allocation[i][j] / total_resources[j])  # Higher priority for lower allocation
            process_priority.append(priority)

        # Sort processes by priority
        sorted_processes = sorted(range(len(process_priority)), 
                                key=lambda i: process_priority[i], 
                                reverse=True)

        # Generate safe allocation sequence
        safe_sequence = []
        work = available.copy()
        finish = [False] * len(self.processes)

        for i in sorted_processes:
            if not finish[i]:
                can_allocate = True
                for j in range(len(self.resources)):
                    if self.need[i][j] > work[j]:
                        can_allocate = False
                        break
                
                if can_allocate:
                    finish[i] = True
                    safe_sequence.append(i)
                    work += allocation[i]

        # Check if all processes can be allocated
        is_safe = all(finish)

        # Generate recommendations
        recommendations = []
        if not is_safe:
            # Identify problematic processes
            problematic = [i for i, f in enumerate(finish) if not f]
            for p in problematic:
                recommendations.append({
                    'process': p,
                    'action': 'Review resource requests',
                    'details': f'Process {p} has high resource needs that may lead to deadlock'
                })

            # Suggest resource adjustments
            for j in bottleneck_resources:
                recommendations.append({
                    'resource': j,
                    'action': 'Increase available resources',
                    'details': f'Resource {j} is highly utilized ({utilization[j]:.2%})'
                })

        return {
            'is_safe': is_safe,
            'safe_sequence': safe_sequence,
            'recommendations': recommendations,
            'resource_utilization': utilization.tolist(),
            'process_priorities': process_priority
        }

detector = DeadlockDetector()

@app.route('/api/detect', methods=['POST'])
def detect_deadlock():
    try:
        data = request.get_json()
        detector.set_system_state(
            data['processes'],
            data['resources'],
            data['allocation'],
            data['request'],
            data['available']
        )
        result = detector.detect_deadlock()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/prevent', methods=['POST'])
def prevent_deadlock():
    try:
        data = request.get_json()
        detector.set_system_state(
            data['processes'],
            data['resources'],
            data['allocation'],
            data['request'],
            data['available']
        )
        result = detector.prevent_deadlock()
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)