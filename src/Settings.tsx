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
  notifications: {
    enabled: boolean
    showPreview: boolean
    enableActions: boolean
    customSound: string
    dndEnabled: boolean
    dndStartHour: number
    dndEndHour: number
  }
  advanced: {
    messageSearchEnabled: boolean
    quickReplyTemplates: string[]
    autoReplyEnabled: boolean
    autoReplyMessage: string
    autoReplyKeywords: string[]
  }
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

      {/* Notifications Section */}
      <section className="settings-section">
        <h3>Notifications</h3>
        <div className="setting-item">
          <label htmlFor="notificationsEnabled">Enable Notifications</label>
          <input
            type="checkbox"
            id="notificationsEnabled"
            checked={settings.notifications.enabled}
            onChange={(e) => {
              const newNotifications = { ...settings.notifications, enabled: e.target.checked }
              updateSetting('notifications', newNotifications)
            }}
          />
        </div>

        <div className="setting-item">
          <label htmlFor="showPreview">Show Message Preview</label>
          <input
            type="checkbox"
            id="showPreview"
            checked={settings.notifications.showPreview}
            onChange={(e) => {
              const newNotifications = { ...settings.notifications, showPreview: e.target.checked }
              updateSetting('notifications', newNotifications)
            }}
          />
          <span className="setting-description">
            Show message content in notifications
          </span>
        </div>

        <div className="setting-item">
          <label htmlFor="enableActions">Enable Notification Actions</label>
          <input
            type="checkbox"
            id="enableActions"
            checked={settings.notifications.enableActions}
            onChange={(e) => {
              const newNotifications = { ...settings.notifications, enableActions: e.target.checked }
              updateSetting('notifications', newNotifications)
            }}
          />
          <span className="setting-description">
            Add Reply and Mark as Read buttons to notifications
          </span>
        </div>

        <div className="setting-item">
          <label htmlFor="dndEnabled">Do Not Disturb Mode</label>
          <input
            type="checkbox"
            id="dndEnabled"
            checked={settings.notifications.dndEnabled}
            onChange={(e) => {
              const newNotifications = { ...settings.notifications, dndEnabled: e.target.checked }
              updateSetting('notifications', newNotifications)
            }}
          />
          <span className="setting-description">
            Mute notifications during specific hours
          </span>
        </div>

        {settings.notifications.dndEnabled && (
          <>
            <div className="setting-item">
              <label htmlFor="dndStartHour">DND Start Hour</label>
              <input
                type="number"
                id="dndStartHour"
                min="0"
                max="23"
                value={settings.notifications.dndStartHour}
                onChange={(e) => {
                  const newNotifications = { ...settings.notifications, dndStartHour: parseInt(e.target.value) }
                  updateSetting('notifications', newNotifications)
                }}
              />
              <span className="setting-description">
                (0-23, 24-hour format)
              </span>
            </div>

            <div className="setting-item">
              <label htmlFor="dndEndHour">DND End Hour</label>
              <input
                type="number"
                id="dndEndHour"
                min="0"
                max="23"
                value={settings.notifications.dndEndHour}
                onChange={(e) => {
                  const newNotifications = { ...settings.notifications, dndEndHour: parseInt(e.target.value) }
                  updateSetting('notifications', newNotifications)
                }}
              />
              <span className="setting-description">
                (0-23, 24-hour format)
              </span>
            </div>
          </>
        )}
      </section>

      {/* Advanced Features Section */}
      <section className="settings-section">
        <h3>Advanced Features</h3>
        
        <div className="setting-item">
          <label htmlFor="messageSearchEnabled">Message Search</label>
          <input
            type="checkbox"
            id="messageSearchEnabled"
            checked={settings.advanced.messageSearchEnabled}
            onChange={(e) => {
              const newAdvanced = { ...settings.advanced, messageSearchEnabled: e.target.checked }
              updateSetting('advanced', newAdvanced)
            }}
          />
          <span className="setting-description">
            Enable search across all conversations (Ctrl+Alt+S)
          </span>
        </div>

        <div className="setting-item">
          <label>Quick Reply Templates</label>
          <div className="quick-reply-templates">
            {settings.advanced.quickReplyTemplates.map((template, index) => (
              <div key={index} className="template-item">
                <span>{template}</span>
                <button
                  onClick={() => {
                    const newAdvanced = { ...settings.advanced }
                    newAdvanced.quickReplyTemplates = newAdvanced.quickReplyTemplates.filter((_, i) => i !== index)
                    updateSetting('advanced', newAdvanced)
                  }}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="add-template">
            <input
              type="text"
              placeholder="Add new template..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const newAdvanced = { ...settings.advanced }
                  newAdvanced.quickReplyTemplates = [...newAdvanced.quickReplyTemplates, e.currentTarget.value.trim()]
                  updateSetting('advanced', newAdvanced)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
          <p className="setting-description">
            Quick access to common responses (Ctrl+Alt+T)
          </p>
        </div>

        <div className="setting-item">
          <label htmlFor="autoReplyEnabled">Auto-Reply (Busy Mode)</label>
          <input
            type="checkbox"
            id="autoReplyEnabled"
            checked={settings.advanced.autoReplyEnabled}
            onChange={(e) => {
              const newAdvanced = { ...settings.advanced, autoReplyEnabled: e.target.checked }
              updateSetting('advanced', newAdvanced)
            }}
          />
          <span className="setting-description">
            Automatically reply when busy (Ctrl+Alt+B to toggle)
          </span>
        </div>

        {settings.advanced.autoReplyEnabled && (
          <>
            <div className="setting-item">
              <label htmlFor="autoReplyMessage">Auto-Reply Message</label>
              <textarea
                id="autoReplyMessage"
                value={settings.advanced.autoReplyMessage}
                onChange={(e) => {
                  const newAdvanced = { ...settings.advanced, autoReplyMessage: e.target.value }
                  updateSetting('advanced', newAdvanced)
                }}
                rows={3}
              />
            </div>

            <div className="setting-item">
              <label htmlFor="autoReplyKeywords">Auto-Reply Keywords</label>
              <input
                type="text"
                id="autoReplyKeywords"
                value={settings.advanced.autoReplyKeywords.join(', ')}
                onChange={(e) => {
                  const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  const newAdvanced = { ...settings.advanced, autoReplyKeywords: keywords }
                  updateSetting('advanced', newAdvanced)
                }}
                placeholder="busy, meeting, driving"
              />
              <span className="setting-description">
                Comma-separated keywords that trigger auto-reply
              </span>
            </div>
          </>
        )}
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
