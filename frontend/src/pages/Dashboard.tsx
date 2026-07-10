/**
 * Cartographer — Dashboard Page
 *
 * Overview of repositories, recent agent runs, and system health.
 * Implemented fully in Phase 3.
 */

export default function Dashboard() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Cartographer</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Repositories', value: '—', color: 'text-blue-400' },
          { label: 'Total Chunks', value: '—', color: 'text-purple-400' },
          { label: 'Graph Nodes', value: '—', color: 'text-green-400' },
          { label: 'Agent Runs', value: '—', color: 'text-orange-400' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5 animate-fade-in">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="glass-card rounded-xl p-8 flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Phase 3 — Full implementation coming
        </p>
      </div>
    </div>
  )
}
