/**
 * ViewRegistry - Registre des vues avec mapping automatique
 * Permet aux plugins d'enregistrer leurs routes de manière déclarative
 */
class ViewRegistry {
  constructor() {
    this.views = new Map(); // Map<viewName, pluginName>
    this.pluginRoutes = new Map(); // Map<pluginName, Set<viewName>>
  }

  /**
   * Enregistre une vue pour un plugin
   * @param {string} viewName - Nom de la vue
   * @param {string} pluginName - Nom du plugin
   */
  register(viewName, pluginName) {
    this.views.set(viewName, pluginName);
    
    if (!this.pluginRoutes.has(pluginName)) {
      this.pluginRoutes.set(pluginName, new Set());
    }
    this.pluginRoutes.get(pluginName).add(viewName);
  }

  /**
   * Enregistre plusieurs vues pour un plugin
   * @param {Array<string>} viewNames - Liste de noms de vues
   * @param {string} pluginName - Nom du plugin
   */
  registerMultiple(viewNames, pluginName) {
    viewNames.forEach(viewName => this.register(viewName, pluginName));
  }

  /**
   * Enregistre un pattern de route pour un plugin
   * @param {string|RegExp} pattern - Pattern de route
   * @param {string} pluginName - Nom du plugin
   */
  registerPattern(pattern, pluginName) {
    // Les patterns sont gérés par le Router, on les enregistre ici pour référence
    if (!this.pluginRoutes.has(pluginName)) {
      this.pluginRoutes.set(pluginName, new Set());
    }
    // Stocker le pattern pour référence future
    const routes = this.pluginRoutes.get(pluginName);
    if (typeof pattern === 'string') {
      routes.add(`pattern:${pattern}`);
    }
  }

  /**
   * Obtient le plugin associé à une vue
   * @param {string} viewName - Nom de la vue
   * @returns {string|null} - Nom du plugin ou null
   */
  getPlugin(viewName) {
    return this.views.get(viewName) || null;
  }

  /**
   * Obtient toutes les vues d'un plugin
   * @param {string} pluginName - Nom du plugin
   * @returns {Set<string>} - Ensemble de noms de vues
   */
  getPluginViews(pluginName) {
    return this.pluginRoutes.get(pluginName) || new Set();
  }

  /**
   * Vérifie si une vue est enregistrée
   * @param {string} viewName - Nom de la vue
   * @returns {boolean}
   */
  has(viewName) {
    return this.views.has(viewName);
  }

  /**
   * Efface toutes les routes
   */
  clear() {
    this.views.clear();
    this.pluginRoutes.clear();
  }
}

export { ViewRegistry };

