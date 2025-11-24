export class SettingsEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.pluginManager = dependencies.pluginManager;
    this.eventBus = dependencies.eventBus;
  }
  
  get config() {
      return this.pluginManager.get('config').engine;
  }

  init() {
    // Rien à initialiser
  }

  updateSetting(key, value) {
    this.state.set(key, value);
  }
  
  saveSettings() {
    this.state.save();
    // On recharge les horaires de prière si la ville/pays a changé
    const apiEngine = this.pluginManager.get('api').engine;
    const city = this.state.get('city');
    const country = this.state.get('country');
    
    if (city && country) {
        apiEngine.fetchPrayerTimes(city, country);
    }
    
    this.state.set('currentView', 'home');
  }

  // Helper pour télécharger le code source (gardé de l'original)
  downloadSourceCode() {
     window.open('https://github.com/MehdyDriouech/MyPocketImam/archive/refs/heads/main.zip', '_blank');
  }
}

