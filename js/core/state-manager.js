import { PersistenceManager } from './persistence-manager.js';

class StateManager {
  constructor() {
    this.state = {
      // Migrer toutes les propriétés de l'ancien state
      theme: 'light',
      language: 'fr',
      city: '',
      country: '',
      selectedPrayer: null,
      currentView: 'home',
      currentRakaat: 1,
      currentStepIndex: 0,
      selectedReciter: 'saad-el-ghamidi', // Valeur par défaut valide (ID string)
      avatarGender: 'boy',
      calculationMethod: '3',
      rakaatConfig: {},
      audioOption: 0,
      scenarioMode: false,
      isPlaying: false,
      currentAudio: null,
      prayerTimes: null,
      prayerTimesLoading: false,
      hadith: null,
      hadithLoading: false,
      translations: {},
      currentAblutionType: null,
      currentAblutionStep: 0,
      currentCitadelCategory: null,
      currentCitadelIndex: 0,
      citadelData: null,
      onboardingCompleted: false
    };
    
    this.listeners = [];
  }
  
  get(key) {
    return this.state[key];
  }
  
  getAll() {
    return { ...this.state };
  }
  
  set(key, value) {
    this.state[key] = value;
    this.notify(key, value);
  }
  
  update(updates) {
    Object.keys(updates).forEach(key => {
      this.state[key] = updates[key];
    });
    this.notify('batch', updates);
  }
  
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notify(key, value) {
    this.listeners.forEach(callback => callback(key, value));
  }

  /**
   * Sauvegarde l'état dans localStorage
   * Délègue à PersistenceManager pour maintenir la compatibilité avec le code existant
   * Note: Pour une meilleure architecture, utilisez PersistenceManager directement
   */
  save() {
    const persistenceManager = new PersistenceManager();
    const persistentKeys = persistenceManager.getDefaultPersistentKeys();
    persistenceManager.save(this.state, persistentKeys);
  }
}

export const stateManager = new StateManager();

