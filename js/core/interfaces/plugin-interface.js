/**
 * Interface pour les Plugins
 * Définit le contrat que tous les plugins doivent respecter
 * Respecte ISP : définit uniquement les méthodes essentielles
 */

import { isEngine } from './engine-interface.js';
import { isView } from './view-interface.js';

/**
 * Interface IPlugin
 * Tous les plugins doivent implémenter cette interface
 */
export class IPlugin {
  /**
   * Obtient l'engine du plugin (optionnel)
   * @returns {IEngine|null}
   */
  get engine() {
    return null;
  }

  /**
   * Obtient la view du plugin (optionnel)
   * @returns {IView|null}
   */
  get view() {
    return null;
  }

  /**
   * Obtient les métadonnées du plugin
   * @returns {Object}
   */
  get metadata() {
    return {
      name: null,
      version: '1.0.0',
      dependencies: [],
      routes: []
    };
  }
}

/**
 * Vérifie si un objet implémente l'interface IPlugin
 * @param {Object} obj - Objet à vérifier
 * @returns {boolean}
 */
export function isPlugin(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Un plugin doit avoir au moins un engine ou une view
  const hasEngine = obj.engine !== undefined;
  const hasView = obj.view !== undefined;

  if (!hasEngine && !hasView) {
    return false;
  }

  // Si un engine est présent, il doit implémenter IEngine
  if (hasEngine && obj.engine !== null && !isEngine(obj.engine)) {
    return false;
  }

  // Si une view est présente, elle doit implémenter IView
  if (hasView && obj.view !== null && !isView(obj.view)) {
    return false;
  }

  return true;
}

/**
 * Crée un plugin à partir d'un objet simple
 * @param {Object} pluginData - Données du plugin { engine?, view?, metadata? }
 * @returns {Object} - Plugin conforme à IPlugin
 */
export function createPlugin(pluginData) {
  return {
    get engine() {
      return pluginData.engine || null;
    },
    get view() {
      return pluginData.view || null;
    },
    get metadata() {
      return pluginData.metadata || {
        name: null,
        version: '1.0.0',
        dependencies: [],
        routes: []
      };
    }
  };
}

