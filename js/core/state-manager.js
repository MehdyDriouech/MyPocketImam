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
  
  // Persistance dans localStorage
  save() {
    const persistentState = {
      language: this.state.language,
      city: this.state.city,
      country: this.state.country,
      selectedReciter: this.state.selectedReciter,
      avatarGender: this.state.avatarGender,
      calculationMethod: this.state.calculationMethod,
      onboardingCompleted: this.state.onboardingCompleted
    };
    localStorage.setItem('mpi_state', JSON.stringify(persistentState));
  }
  
  load() {
    const saved = localStorage.getItem('mpi_state');
    if (saved) {
      const persistentState = JSON.parse(saved);
      this.update(persistentState);
    }
  }
}

export const stateManager = new StateManager();

