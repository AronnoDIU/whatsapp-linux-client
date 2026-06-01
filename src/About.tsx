import { useState, useEffect } from 'react'

interface AppVersion {
  version: string
  platform: string
}

function About() {
  const [version, setVersion] = useState<AppVersion | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVersion()
  }, [])

  const loadVersion = async () => {
    try {
      if (window.whatsappNative && window.whatsappNative.getAppVersion) {
        const appVersion = await window.whatsappNative.getAppVersion()
        setVersion(appVersion)
      } else {
        console.warn('whatsappNative not available, using default version')
        setVersion({ version: '0.1.0', platform: 'Linux' })
      }
    } catch (err) {
      console.error('Failed to load version:', err)
      setVersion({ version: '0.1.0', platform: 'Linux' })
    } finally {
      setLoading(false)
    }
  }

  const openLink = async (url: string) => {
    try {
      if (window.whatsappNative && window.whatsappNative.openExternal) {
        await window.whatsappNative.openExternal(url)
      } else {
        // Fallback to opening in default browser
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Failed to open link:', err)
      // Fallback to opening in default browser
      window.open(url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="about-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="about-container">
      <div className="about-card">
        <div className="about-header">
          <div className="app-icon">
            <span className="app-icon__dot" />
          </div>
          <div className="app-info">
            <h1>WhatsApp for Linux</h1>
            <p className="version">Version {version?.version || '0.1.0'}</p>
          </div>
        </div>

        <div className="about-content">
          <p className="description">
            An elegant, open-source desktop client that elevates your WhatsApp Web experience on Linux with seamless system integration and power-user features.
          </p>

          <div className="developer-info">
            <h3>Developer</h3>
            <p className="developer-name">Yeasir Arafat Aronno</p>
            <a
              href="https://www.linkedin.com/in/yeasirarafataronno/"
              onClick={(e) => {
                e.preventDefault()
                openLink('https://www.linkedin.com/in/yeasirarafataronno/')
              }}
              className="link"
            >
              LinkedIn Profile
            </a>
          </div>

          <div className="links-section">
            <h3>Links</h3>
            <div className="links-grid">
              <button
                onClick={() => openLink('https://github.com/AronnoDIU/whatsapp-linux-client')}
                className="link-btn"
              >
                <span>📦</span>
                <span>Source Code</span>
              </button>
              <button
                onClick={() => openLink('https://github.com/AronnoDIU/whatsapp-linux-client/issues')}
                className="link-btn"
              >
                <span>🐛</span>
                <span>Report Issue</span>
              </button>
              <button
                onClick={() => openLink('https://github.com/AronnoDIU/whatsapp-linux-client')}
                className="link-btn"
              >
                <span>⭐</span>
                <span>Star on GitHub</span>
              </button>
            </div>
          </div>

          <div className="license-section">
            <h3>License</h3>
            <p className="license">
              This project is licensed under the MIT License.
            </p>
            <button
              onClick={() => openLink('https://github.com/AronnoDIU/whatsapp-linux-client/blob/main/LICENSE')}
              className="link-btn small"
            >
              View License
            </button>
          </div>

          <div className="tech-stack">
            <h3>Built With</h3>
            <div className="tech-tags">
              <span className="tech-tag">Electron</span>
              <span className="tech-tag">React</span>
              <span className="tech-tag">TypeScript</span>
              <span className="tech-tag">Vite</span>
            </div>
          </div>
        </div>

        <div className="about-footer">
          <p className="copyright">
            © 2026 Yeasir Arafat Aronno. All rights reserved.
          </p>
          <p className="platform">
            Platform: {version?.platform || 'Linux'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default About
