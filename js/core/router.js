/**
 * Router - Gestionnaire de routing basé sur configuration
 * Respecte le principe OCP : nouvelles routes ajoutées via configuration sans modifier le code
 */
class Router {
  constructor(viewRegistry) {
    this.viewRegistry = viewRegistry;
    this.routes = new Map();
  }

  /**
   * Enregistre une route avec un pattern et un plugin associé
   * @param {string|RegExp} pattern - Pattern de route (string ou regex)
   * @param {string} pluginName - Nom du plugin qui gère cette route
   */
  register(pattern, pluginName) {
    if (typeof pattern === 'string') {
      // Convertir les patterns simples en regex
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      this.routes.set(regex, pluginName);
    } else if (pattern instanceof RegExp) {
      this.routes.set(pattern, pluginName);
    } else {
      console.warn(`Invalid route pattern: ${pattern}`);
    }
  }

  /**
   * Enregistre plusieurs routes pour un plugin
   * @param {Array<string|RegExp>} patterns - Liste de patterns
   * @param {string} pluginName - Nom du plugin
   */
  registerMultiple(patterns, pluginName) {
    patterns.forEach(pattern => this.register(pattern, pluginName));
  }

  /**
   * Trouve le plugin correspondant à une vue
   * @param {string} viewName - Nom de la vue
   * @returns {string|null} - Nom du plugin ou null
   */
  resolve(viewName) {
    for (const [pattern, pluginName] of this.routes) {
      if (pattern.test(viewName)) {
        return pluginName;
      }
    }
    return null;
  }

  /**
   * Obtient la vue pour une route donnée
   * @param {string} viewName - Nom de la vue
   * @param {Object} pluginManager - Instance du PluginManager
   * @returns {Object|null} - Instance de la vue ou null
   */
  getView(viewName, pluginManager) {
    const pluginName = this.resolve(viewName);
    if (!pluginName) {
      return null;
    }

    const plugin = pluginManager.get(pluginName);
    return plugin?.view || null;
  }

  /**
   * Initialise les routes par défaut basées sur les conventions de nommage
   * @param {Object} pluginManager - Instance du PluginManager
   */
  initializeDefaultRoutes(pluginManager) {
    // Routes par défaut basées sur les patterns existants
    this.registerMultiple(['home', 'prayer*'], 'prayers');
    this.registerMultiple(['ablution*'], 'ablutions');
    this.registerMultiple(['pillar*'], 'pillars');
    this.registerMultiple(['settings', 'muslim-tools'], 'settings');
    this.registerMultiple(['citadel*'], 'citadel');
    this.registerMultiple(['coran*'], 'coran');
    this.registerMultiple(['islamic-calendar*'], 'islamic-calendar');
    this.registerMultiple(['names-of-allah*'], 'names-of-allah');
    this.register('tafsir', 'tafsir');
    this.register('tasbih', 'tasbih');
    this.register('qibla', 'qibla');
    this.register('zakat', 'zakat');
    this.register('ramadan', 'ramadan');
  }
}

export { Router };

