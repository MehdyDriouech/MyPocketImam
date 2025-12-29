/**
 * DependencyContainer - Container d'injection de dépendances
 * Respecte DIP : les modules dépendent d'abstractions, pas de concrétions
 * Permet de résoudre les dépendances de manière déclarative
 */
class DependencyContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  /**
   * Enregistre un service singleton
   * @param {string} name - Nom du service
   * @param {*} instance - Instance du service
   */
  register(name, instance) {
    this.services.set(name, instance);
  }

  /**
   * Enregistre une factory pour créer des instances à la demande
   * @param {string} name - Nom du service
   * @param {Function} factory - Fonction factory
   */
  registerFactory(name, factory) {
    this.factories.set(name, factory);
  }

  /**
   * Résout un service par son nom
   * @param {string} name - Nom du service
   * @returns {*} - Instance du service
   */
  resolve(name) {
    // Vérifier d'abord les services enregistrés
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Vérifier les factories
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory(this);
      // Cache l'instance pour les appels suivants
      this.services.set(name, instance);
      return instance;
    }

    throw new Error(`Service "${name}" not found in dependency container`);
  }

  /**
   * Vérifie si un service est enregistré
   * @param {string} name - Nom du service
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Résout plusieurs services à la fois
   * @param {Array<string>} names - Liste de noms de services
   * @returns {Object} - Objet avec les services résolus
   */
  resolveMany(names) {
    const resolved = {};
    names.forEach(name => {
      resolved[name] = this.resolve(name);
    });
    return resolved;
  }

  /**
   * Crée un objet de dépendances standardisé pour les plugins
   * @param {Object} additionalServices - Services additionnels à inclure
   * @returns {Object} - Objet de dépendances
   */
  createDependencies(additionalServices = {}) {
    const standardDeps = {
      state: this.resolve('state'),
      eventBus: this.resolve('eventBus'),
      pluginManager: this.resolve('pluginManager')
    };

    // Ajouter les services additionnels
    Object.keys(additionalServices).forEach(key => {
      if (this.has(additionalServices[key])) {
        standardDeps[key] = this.resolve(additionalServices[key]);
      } else {
        standardDeps[key] = additionalServices[key];
      }
    });

    return standardDeps;
  }

  /**
   * Efface tous les services (utile pour les tests)
   */
  clear() {
    this.services.clear();
    this.factories.clear();
  }
}

export { DependencyContainer };

