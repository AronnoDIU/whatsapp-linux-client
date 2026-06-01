import { useState, useEffect } from 'react'
import './App.css'
import Settings from './Settings'
import About from './About'
import './Settings.css'
import './About.css'

// Declare the ipcRenderer property on the Window interface
// This is necessary because Electron injects ipcRenderer onto the window object
// and TypeScript doesn't know about it by default.
declare global {
  interface Window {
    ipcRenderer?: {
      on: (channel: string, listener: (...args: unknown[]) => void) => void;
      off: (channel: string, listener: (...args: unknown[]) => void) => void;
    };
  }
}

type View = 'home' | 'settings' | 'about'

function App() {
  // Get initial view from URL query parameter
  const urlParams = new URLSearchParams(window.location.search)
  const initialView = (urlParams.get('view') as View) || 'home'
  const [currentView, setCurrentView] = useState<View>(initialView)

  useEffect(() => {
    // Listen for show-settings event from main process
    const handleShowSettings = () => {
      setCurrentView('settings')
    }

    // Listen for show-about event from main process
    const handleShowAbout = () => {
      setCurrentView('about')
    }

    if (window.ipcRenderer) {
      window.ipcRenderer.on('show-settings', handleShowSettings)
      window.ipcRenderer.on('show-about', handleShowAbout)
    }

    return () => {
      if (window.ipcRenderer) {
        window.ipcRenderer.off('show-settings', handleShowSettings)
        window.ipcRenderer.off('show-about', handleShowAbout)
      }
    }
  }, [])

  if (currentView === 'settings') {
    return (
      <main className="app-shell" aria-label="WhatsApp Linux Client Settings">
        <Settings />
        <button 
          onClick={() => setCurrentView('home')}
          className="back-btn"
        >
          ← Back to Home
        </button>
      </main>
    )
  }

  if (currentView === 'about') {
    return (
      <main className="app-shell" aria-label="WhatsApp Linux Client About">
        <About />
        <button 
          onClick={() => setCurrentView('home')}
          className="back-btn"
        >
          ← Back to Home
        </button>
      </main>
    )
  }

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

        <div className="action-buttons">
          <button 
            onClick={() => setCurrentView('settings')}
            className="settings-btn"
          >
            ⚙️ Open Settings
          </button>
          <button 
            onClick={() => setCurrentView('about')}
            className="about-btn"
          >
            ℹ️ About
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
