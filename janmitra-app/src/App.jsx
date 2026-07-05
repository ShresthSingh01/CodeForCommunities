function App() {
  return (
    <div className="min-h-screen bg-ink-navy text-aged-parchment p-8 font-body">
      <header className="mb-8">
        <h1 className="font-display text-4xl text-marigold">JanMitra AI</h1>
        <p className="text-slate-ink mt-2 font-mono">MVP Prototype / Phase 0 Scaffold</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-aged-parchment text-ink-navy p-6 rounded paper-texture">
          <h2 className="font-display text-2xl mb-4">Threaded Ledger</h2>
          <div className="border-l-4 border-evidence-teal pl-4 py-2">
            <span className="inline-block bg-seal-red text-aged-parchment px-2 py-1 text-sm font-bold rotate-[-2deg] mb-2">
              CRITICAL
            </span>
            <p className="font-bold">Ward 7 Water Access</p>
            <p className="text-slate-ink text-sm mt-1">1,240 people affected</p>
          </div>
        </section>

        <section className="bg-aged-parchment text-ink-navy p-6 rounded paper-texture flex items-center justify-center min-h-[300px]">
          <p className="font-mono text-slate-ink">Google Maps Placeholder</p>
        </section>
      </div>
    </div>
  )
}

export default App
