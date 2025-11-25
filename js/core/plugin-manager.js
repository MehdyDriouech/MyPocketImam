class PluginManager {
  constructor(stateManager, eventBus) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.plugins = new Map();
    this.initialized = false;
  }
  
  register(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`Plugin "${name}" already registered`);
      return;
    }
    this.plugins.set(name, plugin);
  }
  
  get(name) {
    return this.plugins.get(name);
  }
  
  async init() {
    if (this.initialized) return;
    
    // Initialiser les plugins dans l'ordre de dépendance
    const initOrder = [
      'config',
      'translations',
      'audio',
      'api',
      'prayers',
      'ablutions',
      'citadel',
      'coran',
      'onboarding',
      'pillars-of-prayer',
      'islamic-calendar',
      'names-of-allah',
      'tasbih',
      'tafsir',
      'qibla',
      'zakat',
      'ramadan'
    ];
    
    const initializedPlugins = new Set();

    // 1. Initialiser l'ordre prioritaire
    for (const name of initOrder) {
      const plugin = this.plugins.get(name);
      if (plugin) {
          if (plugin.engine && typeof plugin.engine.init === 'function') {
            await plugin.engine.init();
          } else if (typeof plugin.init === 'function') {
            await plugin.init();
          }
          initializedPlugins.add(name);
      }
    }

    // 2. Initialiser tous les autres plugins qui n'étaient pas dans la liste
    for (const [name, plugin] of this.plugins) {
        if (!initializedPlugins.has(name)) {
            console.log(`Initializing extra plugin: ${name}`);
            if (plugin.engine && typeof plugin.engine.init === 'function') {
                await plugin.engine.init();
            } else if (typeof plugin.init === 'function') {
                await plugin.init();
            }
        }
    }
    
    this.initialized = true;
    this.eventBus.emit('plugins:initialized');
  }
  
  getAll() {
    return Array.from(this.plugins.values());
  }
  
  getDependencies() {
    return {
      state: this.stateManager,
      eventBus: this.eventBus,
      pluginManager: this
    };
  }
}

export { PluginManager };

