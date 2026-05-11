import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Research Node' },
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    data: { label: 'Summarization Node' },
    position: { x: 240, y: 0 },
  },
  {
    id: '3',
    data: { label: 'Draft Email Node' },
    position: { x: 480, y: 0 },
  },
  {
    id: '4',
    data: { label: 'Send Email Node' },
    position: { x: 720, y: 0 },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

function GraphCanvas() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default GraphCanvas;
