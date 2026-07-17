import { useState, useCallback, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Filter, Search, Share2, ZoomIn } from 'lucide-react'

import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'

// Dummy initial data for progressive rendering testing
const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'cartographer.backend.app' }, type: 'default', className: 'node-module' },
  { id: '2', position: { x: 100, y: 200 }, data: { label: 'api.v1' }, type: 'default', className: 'node-module' },
  { id: '3', position: { x: 400, y: 200 }, data: { label: 'services' }, type: 'default', className: 'node-module' },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
  { id: 'e1-3', source: '1', target: '3', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
]

export default function RepositoryGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [search, setSearch] = useState('')

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Progressive rendering dummy logic (expand neighbors on click)
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // In a real app, this would fetch 1-2 hops from the backend
    if (node.id === '3') {
      const newNodes = [
        { id: '4', position: { x: 300, y: 350 }, data: { label: 'GraphBuilder' }, className: 'node-class' },
        { id: '5', position: { x: 500, y: 350 }, data: { label: 'ASTParser' }, className: 'node-class' }
      ]
      const newEdges = [
        { id: 'e3-4', source: '3', target: '4', animated: true, markerEnd: { type: MarkerType.ArrowClosed } },
        { id: 'e3-5', source: '3', target: '5', animated: true, markerEnd: { type: MarkerType.ArrowClosed } }
      ]
      
      setNodes((nds) => {
        // Prevent duplicate adds
        if (nds.find(n => n.id === '4')) return nds
        return [...nds, ...newNodes]
      })
      setEdges((eds) => {
        if (eds.find(e => e.id === 'e3-4')) return eds
        return [...eds, ...newEdges]
      })
    }
  }, [setNodes, setEdges])

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Top Toolbar overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <Card className="glass-card p-2 flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classes, functions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64 h-8 text-xs bg-secondary/50 border-border"
            />
          </div>
          <div className="w-px h-4 bg-border" />
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </Button>
        </Card>
      </div>

      {/* React Flow Graph */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.1}
          maxZoom={4}
        >
          <Background color="var(--muted-foreground)" gap={20} size={1} />
          <Controls className="bg-card border-border shadow-lg" />
          <MiniMap 
            nodeColor={(node) => {
              if (node.className?.includes('node-module')) return '#a855f7' // purple-500
              if (node.className?.includes('node-class')) return '#22c55e' // green-500
              return '#3b82f6' // blue-500
            }}
            maskColor="rgba(0,0,0, 0.4)"
            className="bg-card border border-border rounded-lg shadow-lg"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="glass-card p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Node Types</h3>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-purple-500/20 border border-purple-500/50"></div> Module / Package</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-green-500/20 border border-green-500/50"></div> Class / Interface</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-blue-500/20 border border-blue-500/50"></div> Function</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-orange-500/20 border border-orange-500/50"></div> Import</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
