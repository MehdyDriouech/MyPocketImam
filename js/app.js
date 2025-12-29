import { stateManager } from './core/state-manager.js';
import { eventBus } from './core/event-bus.js';
import { PluginManager } from './core/plugin-manager.js';
import { Router } from './core/router.js';
import { ViewRegistry } from './core/view-registry.js';
import { PersistenceManager } from './core/persistence-manager.js';
import { DependencyContainer } from './core/dependency-container.js';

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
    this.persistenceManager = new PersistenceManager();
    this.viewRegistry = new ViewRegistry();
    this.router = new Router(this.viewRegistry);
    
    // Initialiser le dependency container
    this.dependencyContainer = new DependencyContainer();
    this.dependencyContainer.register('state', this.stateManager);
    this.dependencyContainer.register('eventBus', this.eventBus);
    
    this.pluginManager = new PluginManager(this.stateManager, this.eventBus, this.dependencyContainer);
    this.dependencyContainer.register('pluginManager', this.pluginManager);

    this.setupEventListeners();
    this.setupPersistence();
  }

  setupPersistence() {
    // Sauvegarder automatiquement l'état lors des changements
    this.stateManager.subscribe((key, value) => {
      const persistentKeys = this.persistenceManager.getDefaultPersistentKeys();
      if (persistentKeys.includes(key)) {
        this.persistenceManager.save(this.stateManager.getAll(), persistentKeys);
      }
    });
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

    // Listen for hadith loaded to update UI
    this.eventBus.on('api:hadith:loaded', () => {
      this.render();
    });

    // Listen for translations loaded to update UI (Language change)
    this.eventBus.on('translations:loaded', () => {
      this.render();
      // Recharger le hadith dans la nouvelle langue
      const apiEngine = this.pluginManager.get('api')?.engine;
      if (apiEngine) {
        apiEngine.fetchDailyHadith();
      }
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

    if (!container) return;

    // Utiliser le router pour résoudre la vue
    const viewPlugin = this.router.getView(currentView, this.pluginManager);

    if (viewPlugin) {
      viewPlugin.render(container);
    }
  }

  async init() {
    console.log('🚀 Initializing My Pocket Imam (Plugin Architecture)...');

    // Charger state sauvegardé
    const savedState = this.persistenceManager.load();
    if (Object.keys(savedState).length > 0) {
      this.stateManager.update(savedState);
    }

    // Enregistrer tous les plugins (les routes sont enregistrées automatiquement)
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

  /**
   * Configuration déclarative des plugins
   * Respecte OCP : ajout de nouveaux plugins sans modifier le code existant
   */
  getPluginConfigurations() {
    const dependencies = this.pluginManager.getDependencies();
    
    return [
      {
        name: 'config',
        engineClass: ConfigEngine,
        metadata: {
          dependencies: [],
          routes: []
        }
      },
      {
        name: 'translations',
        engineClass: TranslationsEngine,
        metadata: {
          dependencies: ['config'],
          routes: []
        }
      },
      {
        name: 'audio',
        engineClass: AudioEngine,
        metadata: {
          dependencies: [],
          routes: []
        }
      },
      {
        name: 'api',
        engineClass: ApiEngine,
        metadata: {
          dependencies: ['config'],
          routes: []
        }
      },
      {
        name: 'prayers',
        engineClass: PrayersEngine,
        viewClass: PrayersView,
        metadata: {
          dependencies: ['config', 'translations'],
          routes: ['home', 'prayer*']
        }
      },
      {
        name: 'ablutions',
        engineClass: AblutionsEngine,
        viewClass: AblutionsView,
        metadata: {
          dependencies: ['translations'],
          routes: ['ablution*']
        }
      },
      {
        name: 'pillars',
        engineClass: PillarsEngine,
        viewClass: PillarsView,
        metadata: {
          dependencies: ['translations'],
          routes: ['pillar*']
        }
      },
      {
        name: 'settings',
        engineClass: SettingsEngine,
        viewClass: SettingsView,
        metadata: {
          dependencies: ['translations', 'config'],
          routes: ['settings', 'muslim-tools']
        }
      },
      {
        name: 'citadel',
        engineClass: CitadelEngine,
        viewClass: CitadelView,
        metadata: {
          dependencies: ['translations'],
          routes: ['citadel*']
        }
      },
      {
        name: 'coran',
        engineClass: CoranEngine,
        viewClass: CoranView,
        metadata: {
          dependencies: ['translations', 'config'],
          routes: ['coran*']
        }
      },
      {
        name: 'onboarding',
        engineClass: OnboardingEngine,
        viewClass: OnboardingView,
        metadata: {
          dependencies: ['translations', 'config'],
          routes: []
        }
      },
      {
        name: 'islamic-calendar',
        engineClass: IslamicCalendarEngine,
        viewClass: IslamicCalendarView,
        metadata: {
          dependencies: ['translations'],
          routes: ['islamic-calendar*']
        }
      },
      {
        name: 'names-of-allah',
        engineClass: NamesOfAllahEngine,
        viewClass: NamesOfAllahView,
        metadata: {
          dependencies: ['translations'],
          routes: ['names-of-allah*']
        }
      },
      {
        name: 'tafsir',
        engineClass: TafsirEngine,
        viewClass: TafsirView,
        metadata: {
          dependencies: ['translations', 'config'],
          routes: ['tafsir']
        }
      },
      {
        name: 'tasbih',
        engineClass: TasbihEngine,
        viewClass: TasbihView,
        metadata: {
          dependencies: ['translations'],
          routes: ['tasbih']
        }
      },
      {
        name: 'qibla',
        engineClass: QiblaEngine,
        viewClass: QiblaView,
        metadata: {
          dependencies: ['translations'],
          routes: ['qibla']
        }
      },
      {
        name: 'theme',
        engineClass: ThemeEngine,
        viewClass: ThemeView,
        metadata: {
          dependencies: [],
          routes: []
        }
      },
      {
        name: 'zakat',
        engineClass: ZakatEngine,
        viewClass: ZakatView,
        metadata: {
          dependencies: ['translations'],
          routes: ['zakat']
        }
      },
      {
        name: 'ramadan',
        engineClass: RamadanEngine,
        viewClass: RamadanView,
        metadata: {
          dependencies: ['translations'],
          routes: ['ramadan']
        }
      }
    ];
  }

  async registerPlugins() {
    const dependencies = this.pluginManager.getDependencies();
    const configurations = this.getPluginConfigurations();

    // Enregistrer tous les plugins de manière déclarative
    for (const config of configurations) {
      const engine = new config.engineClass(dependencies);
      
      let view = null;
      if (config.viewClass) {
        view = new config.viewClass({
          ...dependencies,
          engine
        });
      }

      // Enregistrer le plugin avec ses métadonnées
      this.pluginManager.register(
        config.name,
        { engine, view },
        config.metadata
      );

      // Enregistrer les routes dans le router
      if (config.metadata.routes && config.metadata.routes.length > 0) {
        this.router.registerMultiple(config.metadata.routes, config.name);
      }
    }
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
