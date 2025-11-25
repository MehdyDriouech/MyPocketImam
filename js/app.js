import { stateManager } from './core/state-manager.js';
import { eventBus } from './core/event-bus.js';
import { PluginManager } from './core/plugin-manager.js';

// Import Engines
import { ConfigEngine } from './features/config/engine-config.js';
import { TranslationsEngine } from './features/translations/engine-translations.js';
import { AudioEngine } from './features/audio/engine-audio.js';
import { ApiEngine } from './features/api/engine-api.js';
import { PrayersEngine } from './features/prayers/engine-prayers.js';
import { PrayersView } from './features/prayers/view-prayers.js';
import { AblutionsEngine } from './features/ablutions/engine-ablutions.js';
import { AblutionsView } from './features/ablutions/view-ablutions.js';
import { PillarsEngine } from './features/pillars-of-prayer/engine-pillars.js';
import { PillarsView } from './features/pillars-of-prayer/view-pillars.js';
import { SettingsEngine } from './features/settings/engine-settings.js';
import { SettingsView } from './features/settings/view-settings.js';
import { CitadelEngine } from './features/citadel/engine-citadel.js';
import { CitadelView } from './features/citadel/view-citadel.js';
import { CoranEngine } from './features/coran/engine-coran.js';
import { CoranView } from './features/coran/view-coran.js';
import { OnboardingEngine } from './features/onboarding/engine-onboarding.js';
import { OnboardingView } from './features/onboarding/view-onboarding.js';
import { IslamicCalendarEngine } from './features/islamic-calendar/engine-islamic-calendar.js';
import { IslamicCalendarView } from './features/islamic-calendar/view-islamic-calendar.js';
import { NamesOfAllahEngine } from './features/names-of-allah/engine-names-of-allah.js';
import { NamesOfAllahView } from './features/names-of-allah/view-names-of-allah.js';
import { TafsirEngine } from './features/tafsir/engine-tafsir.js';
import { TafsirView } from './features/tafsir/view-tafsir.js';
import { TasbihEngine } from './features/tasbih/engine-tasbih.js';
import { TasbihView } from './features/tasbih/view-tasbih.js';
import { QiblaEngine } from './features/qibla/engine-qibla.js';
import { QiblaView } from './features/qibla/view-qibla.js';
import { ThemeEngine } from './features/theme/engine-theme.js';
import { ThemeView } from './features/theme/view-theme.js';
import { ZakatEngine } from './features/zakat/engine-zakat.js';
import { ZakatView } from './features/zakat/view-zakat.js';
import { RamadanEngine } from './features/ramadan/engine-ramadan.js';
import { RamadanView } from './features/ramadan/view-ramadan.js';

class App {
  constructor() {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.pluginManager = new PluginManager(this.stateManager, this.eventBus);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Écouter les changements de vue
    this.eventBus.on('view:change', (viewName) => {
      this.render();
    });

    this.eventBus.on('view:refresh', () => {
      this.render();
    });

    // Listen for prayer times loaded to update UI
    this.eventBus.on('api:prayerTimes:loaded', () => {
      this.render();
    });

    // Listen for translations loaded to update UI (Language change)
    this.eventBus.on('translations:loaded', () => {
      this.render();
    });

    // Écouter les changements de state pour re-render si nécessaire
    this.stateManager.subscribe((key, value) => {
      if (key === 'currentView' || key === 'batch') {
        this.render();
      }
    });

    // Debug events
    this.eventBus.on('plugins:initialized', () => {
      console.log('✅ My Pocket Imam - All plugins initialized');
    });
  }

  render() {
    const currentView = this.stateManager.get('currentView');
    const container = document.getElementById('app');

    // Déterminer quel plugin/view doit être rendu
    let viewPlugin = null;

    if (currentView.startsWith('prayer') || currentView === 'home') {
      viewPlugin = this.pluginManager.get('prayers')?.view;
    } else if (currentView.startsWith('ablution')) {
      viewPlugin = this.pluginManager.get('ablutions')?.view;
    } else if (currentView.startsWith('pillar')) {
      viewPlugin = this.pluginManager.get('pillars')?.view;
    } else if (currentView === 'settings' || currentView === 'muslim-tools') {
      viewPlugin = this.pluginManager.get('settings')?.view;
    } else if (currentView.startsWith('citadel')) {
      viewPlugin = this.pluginManager.get('citadel')?.view;
    } else if (currentView.startsWith('coran')) {
      viewPlugin = this.pluginManager.get('coran')?.view;
    } else if (currentView.startsWith('islamic-calendar')) {
      viewPlugin = this.pluginManager.get('islamic-calendar')?.view;
    } else if (currentView.startsWith('names-of-allah')) {
      viewPlugin = this.pluginManager.get('names-of-allah')?.view;
    } else if (currentView === 'tafsir') {
      viewPlugin = this.pluginManager.get('tafsir')?.view;
    } else if (currentView === 'tasbih') {
      viewPlugin = this.pluginManager.get('tasbih')?.view;
    } else if (currentView === 'qibla') {
      viewPlugin = this.pluginManager.get('qibla')?.view;
    } else if (currentView === 'zakat') {
      viewPlugin = this.pluginManager.get('zakat')?.view;
    } else if (currentView === 'ramadan') {
      viewPlugin = this.pluginManager.get('ramadan')?.view;
    }

    if (viewPlugin && container) {
      viewPlugin.render(container);
    }
  }

  async init() {
    console.log('🚀 Initializing My Pocket Imam (Plugin Architecture)...');

    // Charger state sauvegardé
    this.stateManager.load();

    // Enregistrer tous les plugins
    await this.registerPlugins();

    // Initialiser les plugins
    await this.pluginManager.init();

    // Initialize Theme immediately to prevent flash
    const themeEngine = this.pluginManager.get('theme')?.engine;
    if (themeEngine) themeEngine.init();

    // Listen for location changes from Onboarding
    this.eventBus.on('settings:location-changed', ({ city, country }) => {
      const apiEngine = this.pluginManager.get('api')?.engine;
      if (apiEngine) {
        apiEngine.fetchPrayerTimes(city, country);
      }
    });

    // Premier render
    this.render();

    // Check Onboarding
    const onboardingView = this.pluginManager.get('onboarding')?.view;
    if (onboardingView) {
      onboardingView.render(); // Will check internal state
    }
  }

  async registerPlugins() {
    const dependencies = this.pluginManager.getDependencies();

    // 1. Config
    const configEngine = new ConfigEngine(dependencies);
    this.pluginManager.register('config', { engine: configEngine });

    // 2. Translations
    const translationsEngine = new TranslationsEngine(dependencies);
    this.pluginManager.register('translations', { engine: translationsEngine });

    // 3. Audio
    const audioEngine = new AudioEngine(dependencies);
    this.pluginManager.register('audio', { engine: audioEngine });

    // 4. API
    const apiEngine = new ApiEngine(dependencies);
    this.pluginManager.register('api', { engine: apiEngine });

    // 5. Prayers
    const prayersEngine = new PrayersEngine(dependencies);
    const prayersView = new PrayersView({
      ...dependencies,
      engine: prayersEngine
    });
    this.pluginManager.register('prayers', { engine: prayersEngine, view: prayersView });

    // 6. Ablutions
    const ablutionsEngine = new AblutionsEngine(dependencies);
    const ablutionsView = new AblutionsView({
      ...dependencies,
      engine: ablutionsEngine
    });
    this.pluginManager.register('ablutions', { engine: ablutionsEngine, view: ablutionsView });

    // 7. Pillars
    const pillarsEngine = new PillarsEngine(dependencies);
    const pillarsView = new PillarsView({
      ...dependencies,
      engine: pillarsEngine
    });
    this.pluginManager.register('pillars', { engine: pillarsEngine, view: pillarsView });

    // 8. Settings (Hub)
    const settingsEngine = new SettingsEngine(dependencies);
    const settingsView = new SettingsView({
      ...dependencies,
      engine: settingsEngine
    });
    this.pluginManager.register('settings', { engine: settingsEngine, view: settingsView });

    // 9. Citadel
    const citadelEngine = new CitadelEngine(dependencies);
    const citadelView = new CitadelView({
      ...dependencies,
      engine: citadelEngine
    });
    this.pluginManager.register('citadel', { engine: citadelEngine, view: citadelView });

    // 10. Coran
    const coranEngine = new CoranEngine(dependencies);
    const coranView = new CoranView({
      ...dependencies,
      engine: coranEngine
    });
    this.pluginManager.register('coran', { engine: coranEngine, view: coranView });

    // 11. Onboarding
    const onboardingEngine = new OnboardingEngine(dependencies);
    const onboardingView = new OnboardingView({
      ...dependencies,
      engine: onboardingEngine
    });
    this.pluginManager.register('onboarding', { engine: onboardingEngine, view: onboardingView });

    // 12. Islamic Calendar
    const calendarEngine = new IslamicCalendarEngine(dependencies);
    const calendarView = new IslamicCalendarView({
      ...dependencies,
      engine: calendarEngine
    });
    this.pluginManager.register('islamic-calendar', { engine: calendarEngine, view: calendarView });

    // 13. Names of Allah
    const namesOfAllahEngine = new NamesOfAllahEngine(dependencies);
    const namesOfAllahView = new NamesOfAllahView({
      ...dependencies,
      engine: namesOfAllahEngine
    });
    this.pluginManager.register('names-of-allah', { engine: namesOfAllahEngine, view: namesOfAllahView });

    // 16. Tafsir
    const tafsirEngine = new TafsirEngine(dependencies);
    const tafsirView = new TafsirView({
        ...dependencies,
        engine: tafsirEngine
    });
    this.pluginManager.register('tafsir', { engine: tafsirEngine, view: tafsirView });

    // 17. Tasbih
    const tasbihEngine = new TasbihEngine(dependencies);
    const tasbihView = new TasbihView({
        ...dependencies,
        engine: tasbihEngine
    });
    this.pluginManager.register('tasbih', { engine: tasbihEngine, view: tasbihView });

    // 14. Qibla
    const qiblaEngine = new QiblaEngine(dependencies);
    const qiblaView = new QiblaView({
      ...dependencies,
      engine: qiblaEngine
    });
    this.pluginManager.register('qibla', { engine: qiblaEngine, view: qiblaView });

    // 15. Theme
    const themeEngine = new ThemeEngine(dependencies);
    const themeView = new ThemeView({
      ...dependencies,
      engine: themeEngine
    });
    this.pluginManager.register('theme', { engine: themeEngine, view: themeView });

    // 18. Zakat Calculator
    const zakatEngine = new ZakatEngine(dependencies);
    const zakatView = new ZakatView({
      ...dependencies,
      engine: zakatEngine
    });
    this.pluginManager.register('zakat', { engine: zakatEngine, view: zakatView });

    // 19. Ramadan Tracker
    const ramadanEngine = new RamadanEngine(dependencies);
    const ramadanView = new RamadanView({
      ...dependencies,
      engine: ramadanEngine
    });
    this.pluginManager.register('ramadan', { engine: ramadanEngine, view: ramadanView });

    // ... autres plugins à venir
  }
}

// Démarrer l'app
const app = new App();
// Exposer l'app globalement pour le debug si nécessaire
window.app = app;

// Lancer l'initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
