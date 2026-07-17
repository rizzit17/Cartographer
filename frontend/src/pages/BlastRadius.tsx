import { Zap, ArrowRight } from 'lucide-react'
import { EmptyState } from '@components/ui/EmptyState'
import { Button } from '@components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function BlastRadius() {
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Blast Radius</h1>
        <p className="text-muted-foreground mt-1">Estimate the impact of a proposed code change across the dependency graph.</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<Zap className="h-10 w-10 text-orange-500" />}
          title="No changes analyzed"
          description="Ask Cartographer to evaluate a refactor or change in the Chat to see its blast radius here."
          action={
            <Button onClick={() => navigate('/chat')}>
              Ask Cartographer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
