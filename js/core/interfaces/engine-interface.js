/**
 * Interface pour les Engines
 * Définit le contrat que tous les engines doivent respecter
 * Respecte ISP : définit uniquement les méthodes essentielles
 */

/**
 * Interface IEngine
 * Tous les engines doivent implémenter cette interface
 */
export class IEngine {
  /**
   * Initialise l'engine
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error('init() must be implemented');
  }
}

/**
 * Vérifie si un objet implémente l'interface IEngine
 * @param {Object} obj - Objet à vérifier
 * @returns {boolean}
 */
export function isEngine(obj) {
  return obj !== null && 
         typeof obj === 'object' && 
         typeof obj.init === 'function';
}

