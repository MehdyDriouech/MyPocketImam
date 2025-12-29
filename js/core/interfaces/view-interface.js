/**
 * Interface pour les Views
 * Définit le contrat que toutes les views doivent respecter
 * Respecte ISP : définit uniquement les méthodes essentielles
 */

/**
 * Interface IView
 * Toutes les views doivent implémenter cette interface
 */
export class IView {
  /**
   * Rend la vue dans le conteneur fourni
   * @param {HTMLElement} container - Conteneur DOM où rendre la vue
   * @returns {void}
   */
  render(container) {
    throw new Error('render() must be implemented');
  }
}

/**
 * Vérifie si un objet implémente l'interface IView
 * @param {Object} obj - Objet à vérifier
 * @returns {boolean}
 */
export function isView(obj) {
  return obj !== null && 
         typeof obj === 'object' && 
         typeof obj.render === 'function';
}

