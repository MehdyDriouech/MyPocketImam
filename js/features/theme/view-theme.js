export class ThemeView {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.engine = dependencies.engine;
    this.pluginManager = dependencies.pluginManager;
  }

  render(container) {
    // This view is likely a sub-component of the Settings page
    // We will provide a method to get the HTML or append it

    // If container is provided, we append to it (e.g. if it's a standalone modal)
    // But typically this will be called by SettingsView to get the markup
    if (container) {
      const section = document.createElement('section');
      section.className = 'settings-section theme-settings';
      section.innerHTML = this.getTemplate();
      container.appendChild(section);
      this.attachEventListeners(section);
    }
  }

  getTemplate() {
    const currentPreference = this.state.get('themePreference') || 'system';
    const translations = this.pluginManager.get('translations').engine;
    const t = (key) => translations.get(key);

    return `
      <h3 class="settings-title">
        <span>🎨</span>
        ${t('appearance') || 'Apparence'}
      </h3>
      <div class="theme-options">
        <label class="theme-option">
          <input type="radio" name="theme" value="light" ${currentPreference === 'light' ? 'checked' : ''}>
          <span class="theme-label">
            <span class="icon">☀️</span>
            ${t('theme_light') || 'Mode clair'}
          </span>
        </label>
        
        <label class="theme-option">
          <input type="radio" name="theme" value="dark" ${currentPreference === 'dark' ? 'checked' : ''}>
          <span class="theme-label">
            <span class="icon">🌙</span>
            ${t('theme_dark') || 'Mode sombre'}
          </span>
        </label>

        <label class="theme-option">
          <input type="radio" name="theme" value="system" ${currentPreference === 'system' ? 'checked' : ''}>
          <span class="theme-label">
            <span class="icon">💻</span>
            ${t('theme_system') || 'Système'}
          </span>
        </label>
      </div>
    `;
  }

  attachEventListeners(container) {
    const radios = container.querySelectorAll('input[name="theme"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.engine.applyTheme(e.target.value);
      });
    });
  }
}
