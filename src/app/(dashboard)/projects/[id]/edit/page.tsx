export default function ProjectEditorPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="font-semibold">Project Editor</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-50">2D</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50">3D</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar - Furniture Library */}
        <aside className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">Furniture</h2>
          <p className="text-gray-500 text-sm">Drag items to canvas</p>
          {/* TODO: Add furniture library component */}
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">
            Canvas for project {params.id}
            <br />
            <span className="text-sm">2D/3D viewer coming soon...</span>
          </p>
        </main>

        {/* Properties Panel */}
        <aside className="w-64 bg-white border-l p-4">
          <h2 className="font-semibold mb-4">Properties</h2>
          <p className="text-gray-500 text-sm">Select an item to edit</p>
        </aside>
      </div>
    </div>
  )
}
