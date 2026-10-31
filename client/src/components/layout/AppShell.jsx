// Client: App Shell Layout
export function AppShell({ children }) {
    return (<div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            AI Knowledge Search
          </h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Not authenticated</span>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>);
}
