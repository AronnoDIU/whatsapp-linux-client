import { useState, useEffect } from 'react'

interface AppSettings {
  darkMode: 'auto' | 'light' | 'dark'
  customTheme: {
    primaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
  }
  compactMode: boolean
  spellCheck: {
    enabled: boolean
    languages: string[]
  }
  zoomLevel: number
}

declare global {
  interface Window {
    whatsappNative: {
      getSettings: () => Promise<AppSettings>
      setSetting: (key: string, value: unknown) => Promise<boolean>
      resetSettings: () => Promise<boolean>
    }
  }
}

function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const currentSettings = await window.whatsappNative.getSettings()
      setSettings(currentSettings)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: unknown) => {
    try {
      await window.whatsappNative.setSetting(key, value)
      await loadSettings()
    } catch (err) {
      console.error('Failed to update setting:', err)
    }
  }

  const resetAllSettings = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await window.whatsappNative.resetSettings()
        await loadSettings()
      } catch (err) {
        console.error('Failed to reset settings:', err)
      }
    }
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="settings-container">
        <div className="error">Failed to load settings</div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <button onClick={resetAllSettings} className="reset-btn">
          Reset to Defaults
        </button>
      </div>

      {/* Dark Mode Section */}
      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="setting-item">
          <label htmlFor="darkMode">Dark Mode</label>
          <select
            id="darkMode"
            value={settings.darkMode}
            onChange={(e) => updateSetting('darkMode', e.target.value)}
          >
            <option value="auto">Auto (System Theme)</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="setting-item">
          <label htmlFor="compactMode">Compact Mode</label>
          <input
            type="checkbox"
            id="compactMode"
            checked={settings.compactMode}
            onChange={(e) => updateSetting('compactMode', e.target.checked)}
          />
          <span className="setting-description">
            Smaller UI elements for laptop users
          </span>
        </div>
      </section>

      {/* Spell Check Section */}
      <section className="settings-section">
        <h3>Spell Check</h3>
        <div className="setting-item">
          <label htmlFor="spellCheckEnabled">Enable Spell Check</label>
          <input
            type="checkbox"
            id="spellCheckEnabled"
            checked={settings.spellCheck.enabled}
            onChange={(e) => {
              const newSpellCheck = { ...settings.spellCheck, enabled: e.target.checked }
              updateSetting('spellCheck', newSpellCheck)
            }}
          />
        </div>

        <div className="setting-item">
          <label>Languages</label>
          <div className="checkbox-group">
            {['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'pt-BR', 'ru-RU'].map((lang) => (
              <label key={lang} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={settings.spellCheck.languages.includes(lang)}
                  onChange={(e) => {
                    const newLanguages = e.target.checked
                      ? [...settings.spellCheck.languages, lang]
                      : settings.spellCheck.languages.filter((l) => l !== lang)
                    const newSpellCheck = { ...settings.spellCheck, languages: newLanguages }
                    updateSetting('spellCheck', newSpellCheck)
                  }}
                />
                <span>{lang === 'en-US' ? 'English (US)' : lang === 'en-GB' ? 'English (UK)' : lang}</span>
              </label>
            ))}
          </div>
          <p className="setting-description">
            Note: Bangla spell check is not supported by Electron's built-in spell checker
          </p>
        </div>
      </section>

      {/* Zoom Section */}
      <section className="settings-section">
        <h3>Zoom</h3>
        <div className="setting-item">
          <label htmlFor="zoomLevel">Zoom Level</label>
          <input
            type="range"
            id="zoomLevel"
            min="0.5"
            max="3"
            step="0.1"
            value={settings.zoomLevel}
            onChange={(e) => updateSetting('zoomLevel', parseFloat(e.target.value))}
          />
          <span className="zoom-value">{Math.round(settings.zoomLevel * 100)}%</span>
        </div>
      </section>
    </div>
  )
}

export default Settings
