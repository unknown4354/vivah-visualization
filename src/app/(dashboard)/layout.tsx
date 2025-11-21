export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TODO: Add navigation sidebar */}
      <nav className="fixed top-0 left-0 h-screen w-64 bg-white border-r p-4">
        <div className="font-bold text-xl mb-8">Vivah Visualization</div>
        <ul className="space-y-2">
          <li><a href="/dashboard" className="block p-2 hover:bg-gray-100 rounded">Dashboard</a></li>
          <li><a href="/projects" className="block p-2 hover:bg-gray-100 rounded">Projects</a></li>
          <li><a href="/settings" className="block p-2 hover:bg-gray-100 rounded">Settings</a></li>
        </ul>
      </nav>
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
