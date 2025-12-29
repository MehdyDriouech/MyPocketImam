/**
 * PersistenceManager - Gestionnaire de persistance
 * Responsabilité unique : gérer la persistance de l'état dans localStorage
 * Respecte SRP : séparation de la gestion d'état et de la persistance
 */
class PersistenceManager {
  constructor(storageKey = 'mpi_state') {
    this.storageKey = storageKey;
  }

  /**
   * Sauvegarde un état dans localStorage
   * @param {Object} state - État à sauvegarder
   * @param {Array<string>} persistentKeys - Clés à persister
   */
  save(state, persistentKeys) {
    const persistentState = {};
    
    persistentKeys.forEach(key => {
      if (state[key] !== undefined) {
        persistentState[key] = state[key];
      }
    });

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(persistentState));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  /**
   * Charge l'état depuis localStorage
   * @returns {Object} - État chargé ou objet vide
   */
  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    }
    return {};
  }

  /**
   * Efface l'état sauvegardé
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing state from localStorage:', error);
    }
  }

  /**
   * Obtient les clés par défaut à persister
   * @returns {Array<string>}
   */
  getDefaultPersistentKeys() {
    return [
      'language',
      'city',
      'country',
      'selectedReciter',
      'avatarGender',
      'calculationMethod',
      'onboardingCompleted',
      'themePreference',
      'currentTheme'
    ];
  }
}

export { PersistenceManager };

