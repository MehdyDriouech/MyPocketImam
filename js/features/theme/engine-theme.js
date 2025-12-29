export class ThemeEngine {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Bind methods
        this.handleSystemChange = this.handleSystemChange.bind(this);
    }

    init() {
        // Listen for system changes
        this.mediaQuery.addEventListener('change', this.handleSystemChange);

        // Load saved preference or default to 'light'
        const savedTheme = this.state.get('themePreference') || 'light';
        this.applyTheme(savedTheme);
    }

    handleSystemChange(e) {
        // Only auto-update if the user has chosen "system" or hasn't set a preference
        const currentPreference = this.state.get('themePreference');
        if (currentPreference === 'system' || !currentPreference) {
            this.applyTheme('system');
        }
    }

    setThemeFromSystem() {
        this.applyTheme('system');
    }

    applyTheme(theme) {
        let effectiveTheme = theme;

        if (theme === 'system') {
            effectiveTheme = this.mediaQuery.matches ? 'dark' : 'light';
        }

        // Apply to DOM
        document.body.setAttribute('data-theme', effectiveTheme);

        // Save preference
        this.state.set('themePreference', theme);
        this.state.set('currentTheme', effectiveTheme); // Actual visual theme
        this.state.save();

        // Emit event
        this.eventBus.emit('theme:changed', {
            preference: theme,
            effective: effectiveTheme
        });

        console.log(`🎨 Theme applied: ${theme} (effective: ${effectiveTheme})`);
    }

    toggleTheme() {
        const current = this.state.get('currentTheme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
}
