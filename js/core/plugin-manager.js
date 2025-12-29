import { isPlugin, createPlugin } from './interfaces/plugin-interface.js';
import { isEngine } from './interfaces/engine-interface.js';
import { isView } from './interfaces/view-interface.js';

class PluginManager {
  constructor(stateManager, eventBus, dependencyContainer = null) {
    this.stateManager = stateManager;
    this.eventBus = eventBus;
    this.dependencyContainer = dependencyContainer;
    this.plugins = new Map();
    this.pluginMetadata = new Map(); // Map<name, metadata>
    this.initialized = false;
  }
  
  /**
   * Enregistre un plugin avec métadonnées optionnelles
   * @param {string} name - Nom du plugin
   * @param {Object} plugin - Plugin (doit respecter IPlugin)
   * @param {Object} metadata - Métadonnées du plugin (dépendances, routes, etc.)
   */
  register(name, plugin, metadata = {}) {
    if (this.plugins.has(name)) {
      console.warn(`Plugin "${name}" already registered`);
      return;
    }

    // Créer un plugin conforme à l'interface si nécessaire
    const normalizedPlugin = createPlugin(plugin);
    
    // Valider que le plugin respecte l'interface
    if (!isPlugin(normalizedPlugin)) {
      console.warn(`Plugin "${name}" does not conform to IPlugin interface`);
    }

    this.plugins.set(name, normalizedPlugin);
    
    // Enregistrer les métadonnées
    const fullMetadata = {
      name,
      version: metadata.version || '1.0.0',
      dependencies: metadata.dependencies || [],
      routes: metadata.routes || [],
      initOrder: metadata.initOrder || null,
      ...metadata
    };
    this.pluginMetadata.set(name, fullMetadata);
  }
  
  get(name) {
    return this.plugins.get(name);
  }
  
  /**
   * Calcule l'ordre d'initialisation basé sur les dépendances
   * @returns {Array<string>} - Ordre d'initialisation
   */
  calculateInitOrder() {
    const initOrder = [];
    const initialized = new Set();
    const processing = new Set();

    const visit = (name) => {
      if (initialized.has(name)) return;
      if (processing.has(name)) {
        console.warn(`Circular dependency detected involving plugin "${name}"`);
        return;
      }

      processing.add(name);
      const metadata = this.pluginMetadata.get(name);
      
      // Initialiser les dépendances d'abord
      if (metadata && metadata.dependencies) {
        metadata.dependencies.forEach(dep => {
          if (this.plugins.has(dep)) {
            visit(dep);
          }
        });
      }

      processing.delete(name);
      if (!initialized.has(name)) {
        initOrder.push(name);
        initialized.add(name);
      }
    };

    // Visiter tous les plugins
    for (const name of this.plugins.keys()) {
      visit(name);
    }

    return initOrder;
  }

  async init() {
    if (this.initialized) return;
    
    // Calculer l'ordre d'initialisation basé sur les dépendances
    const initOrder = this.calculateInitOrder();
    
    console.log('Initializing plugins in order:', initOrder);

    // Initialiser les plugins dans l'ordre calculé
    for (const name of initOrder) {
      const plugin = this.plugins.get(name);
      if (!plugin) continue;

      try {
        // Initialiser l'engine si présent
        if (plugin.engine && isEngine(plugin.engine)) {
          await plugin.engine.init();
        }
        
        // Note: Les views n'ont généralement pas besoin d'init
        // Elles sont initialisées lors du render
      } catch (error) {
        console.error(`Error initializing plugin "${name}":`, error);
      }
    }
    
    this.initialized = true;
    this.eventBus.emit('plugins:initialized');
  }
  
  getAll() {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Obtient les dépendances standard pour les plugins
   * Utilise le dependency container si disponible, sinon retourne les dépendances directes
   * @returns {Object} - Objet de dépendances
   */
  getDependencies() {
    if (this.dependencyContainer) {
      return this.dependencyContainer.createDependencies({
        pluginManager: this
      });
    }
    
    // Fallback vers l'ancien système pour compatibilité
    return {
      state: this.stateManager,
      eventBus: this.eventBus,
      pluginManager: this
    };
  }

  /**
   * Obtient les métadonnées d'un plugin
   * @param {string} name - Nom du plugin
   * @returns {Object|null} - Métadonnées ou null
   */
  getMetadata(name) {
    return this.pluginMetadata.get(name) || null;
  }

  /**
   * Obtient toutes les métadonnées
   * @returns {Map} - Map des métadonnées
   */
  getAllMetadata() {
    return new Map(this.pluginMetadata);
  }
}

export { PluginManager };

