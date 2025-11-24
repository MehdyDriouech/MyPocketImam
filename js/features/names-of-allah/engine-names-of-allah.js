export class NamesOfAllahEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.pluginManager = dependencies.pluginManager;
    
    this.namesList = [];
    this.favorites = new Set();
    this.learned = new Set();
    this.searchQuery = '';
    
    // Clés localStorage
    this.STORAGE_KEYS = {
      FAVORITES: 'mpi_names_favorites',
      LEARNED: 'mpi_names_learned'
    };
  }

  async init() {
    await this.loadNames();
    this.loadUserData();
  }

  /**
   * Charge les noms depuis le JSON
   */
  async loadNames() {
    try {
      const response = await fetch('js/features/names-of-allah/data/names-of-allah.json');
      this.namesList = await response.json();
      
      // Mise à jour du state avec le compte total
      this.state.set('namesOfAllahTotal', this.namesList.length);
    } catch (error) {
      console.error('Erreur chargement noms:', error);
      this.namesList = [];
    }
  }

  /**
   * Charge les préférences utilisateur
   */
  loadUserData() {
    try {
      const favs = localStorage.getItem(this.STORAGE_KEYS.FAVORITES);
      if (favs) {
        this.favorites = new Set(JSON.parse(favs));
      }

      const learned = localStorage.getItem(this.STORAGE_KEYS.LEARNED);
      if (learned) {
        this.learned = new Set(JSON.parse(learned));
        this.state.set('namesOfAllahLearnedCount', this.learned.size);
      }
    } catch (e) {
      console.error('Erreur chargement user data:', e);
    }
  }

  /**
   * Sauvegarde les préférences
   */
  saveUserData() {
    localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(this.favorites)));
    localStorage.setItem(this.STORAGE_KEYS.LEARNED, JSON.stringify(Array.from(this.learned)));
    
    // Notifier le state global
    this.state.set('namesOfAllahLearnedCount', this.learned.size);
  }

  /**
   * Obtient un nom par son numéro
   */
  getName(number) {
    return this.namesList.find(n => n.number === parseInt(number));
  }

  /**
   * Retourne tous les noms (filtrés si recherche active)
   */
  getNames() {
    if (!this.searchQuery) return this.namesList;
    
    const query = this.searchQuery.toLowerCase();
    const lang = this.state.get('language') || 'fr';
    
    return this.namesList.filter(name => {
      return (
        name.transliteration.toLowerCase().includes(query) ||
        name.number.toString().includes(query) ||
        (name.translation[lang] && name.translation[lang].toLowerCase().includes(query)) ||
        (name.meaning[lang] && name.meaning[lang].toLowerCase().includes(query))
      );
    });
  }
  
  /**
   * Effectue une recherche
   */
  search(query) {
    this.searchQuery = query;
    this.eventBus.emit('names:search-results');
  }

  /**
   * Gestion des favoris
   */
  toggleFavorite(number) {
    const num = parseInt(number);
    if (this.favorites.has(num)) {
      this.favorites.delete(num);
    } else {
      this.favorites.add(num);
    }
    this.saveUserData();
    this.eventBus.emit('names:favorites-changed');
    return this.favorites.has(num);
  }

  isFavorite(number) {
    return this.favorites.has(parseInt(number));
  }
  
  getFavorites() {
    return this.namesList.filter(n => this.favorites.has(n.number));
  }

  /**
   * Gestion de l'apprentissage
   */
  markAsLearned(number) {
    const num = parseInt(number);
    if (!this.learned.has(num)) {
      this.learned.add(num);
      this.saveUserData();
      this.eventBus.emit('names:progress-changed');
    }
  }
  
  isLearned(number) {
    return this.learned.has(parseInt(number));
  }

  /**
   * Prochain nom non appris pour le mode apprentissage
   */
  getNextToLearn() {
    return this.namesList.find(n => !this.learned.has(n.number)) || null;
  }

  /**
   * Navigation
   */
  getNextName(currentNumber) {
    const current = this.namesList.findIndex(n => n.number === parseInt(currentNumber));
    if (current !== -1 && current < this.namesList.length - 1) {
      return this.namesList[current + 1];
    }
    return null;
  }

  getPreviousName(currentNumber) {
    const current = this.namesList.findIndex(n => n.number === parseInt(currentNumber));
    if (current > 0) {
      return this.namesList[current - 1];
    }
    return null;
  }
}

