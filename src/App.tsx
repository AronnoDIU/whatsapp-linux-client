import './App.css'

function App() {
  return (
    <main className="app-shell" aria-label="WhatsApp Linux Client">
      <section className="hero-card">
        <div className="app-badge" aria-hidden="true">
          <span className="app-badge__dot" />
        </div>

        <p className="eyebrow">WhatsApp Linux Client</p>
        <h1>Ready to launch</h1>
        <p className="subtitle">
          A polished Electron shell for WhatsApp Web with tray support, Snap packaging,
          and smoother window behavior on Linux.
        </p>

        <div className="shortcut-grid" aria-label="Keyboard shortcuts">
          <div>
            <span>Toggle window</span>
            <strong>Ctrl + Alt + W</strong>
          </div>
          <div>
            <span>Exit fullscreen</span>
            <strong>Esc</strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
