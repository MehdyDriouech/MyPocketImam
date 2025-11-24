export class CitadelEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.pluginManager = dependencies.pluginManager;
    this.citadelIndex = null;
  }
  
  get translations() {
      return this.pluginManager.get('translations').engine;
  }

  async init() {
    await this.loadCitadelIndex();
  }

  async loadCitadelIndex() {
    try {
        const response = await fetch('assets/data/citadel_index.json');
        this.citadelIndex = await response.json();
        return this.citadelIndex;
    } catch (error) {
        console.error('Error loading citadel index:', error);
        return null;
    }
  }

  getCitadelCategories() {
    // Same list as original
    return [
        { id: 'morning_evening', file: 'citadel_morning_evening.json', icon: '🌅', nameKey: 'morningEvening' },
        { id: 'wake_up', file: 'citadel_wake_up.json', icon: '🛏️', nameKey: 'wakeUp' },
        { id: 'toilets', file: 'citadel_toilets.json', icon: '🚽', nameKey: 'toilets' },
        { id: 'ablutions', file: 'citadel_ablutions.json', icon: '💧', nameKey: 'ablutionsDoua' },
        { id: 'home', file: 'citadel_home.json', icon: '🏠', nameKey: 'homeDoua' },
        { id: 'mosque', file: 'citadel_mosque.json', icon: '🕌', nameKey: 'mosque' },
        { id: 'travel', file: 'citadel_travel.json', icon: '✈️', nameKey: 'travel' },
        { id: 'market', file: 'citadel_market.json', icon: '🛒', nameKey: 'market' },
        { id: 'children_protection', file: 'citadel_children_protection.json', icon: '👶', nameKey: 'childrenProtection' },
        { id: 'stress_sorrow', file: 'citadel_stress_sorrow.json', icon: '😰', nameKey: 'stressSorrow' },
        { id: 'after_meal', file: 'citadel_after_meal.json', icon: '🍽️', nameKey: 'afterMeal' },
        { id: 'final_tashahhud', file: 'citadel_final_tashahhud.json', icon: '🤲', nameKey: 'finalTashahhud' },
        { id: 'marriage_vehicle', file: 'citadel_marriage_vehicle.json', icon: '💑', nameKey: 'marriageVehicle' },
        { id: 'rain', file: 'citadel_rain.json', icon: '🌧️', nameKey: 'rain' },
        { id: 'anger', file: 'citadel_anger.json', icon: '😤', nameKey: 'anger' },
        { id: 'funeral', file: 'citadel_funeral.json', icon: '⚰️', nameKey: 'funeral' },
        { id: 'illness', file: 'citadel_illness.json', icon: '🤒', nameKey: 'illness' },
        { id: 'visit_sick', file: 'citadel_visit_sick.json', icon: '🏥', nameKey: 'visitSick' },
        { id: 'evil_eye', file: 'citadel_evil_eye.json', icon: '🧿', nameKey: 'evilEye' }
    ];
  }

  async loadCategory(categoryId, filename) {
      this.state.set('loadingCitadel', true);
      this.state.set('currentView', 'citadel-douas'); // Optimistic UI switch
      
      try {
          const currentLang = this.state.get('language') || 'fr';
          const response = await fetch(`assets/data/${filename}`);
          const data = await response.json();
          
          // Get category name for fallback
          const categories = this.getCitadelCategories();
          const category = categories.find(c => c.id === categoryId);
          const trans = this.translations.getAll();
          const categoryName = category ? (trans[category.nameKey] || category.nameKey) : '';

          const enrichedData = this.enrichCitadelData(data, currentLang, categoryName);
          
          this.state.update({
              citadelDouas: enrichedData,
              currentCitadelCategory: categoryId,
              currentDouaIndex: 0,
              loadingCitadel: false
          });
      } catch (error) {
          console.error(`Error loading citadel category ${filename}:`, error);
          this.state.set('loadingCitadel', false);
          // Handle error state if needed
      }
  }

  // Logic from feature-citadel.js
  getTranslation(obj, lang = 'fr', categoryFallback = '') {
    if (typeof obj === 'string' && obj.trim() !== '') return obj;
    if (!obj || typeof obj !== 'object') return categoryFallback || '';
    
    if (obj[lang] && obj[lang].trim() !== '') return obj[lang];
    if (obj['fr'] && obj['fr'].trim() !== '') return obj['fr'];
    if (obj['en'] && obj['en'].trim() !== '') return obj['en'];
    if (obj['ar'] && obj['ar'].trim() !== '') return obj['ar'];
    
    for (let key in obj) {
        if (obj[key] && typeof obj[key] === 'string' && obj[key].trim() !== '') {
            return obj[key];
        }
    }
    return categoryFallback || '';
  }

  enrichCitadelData(data, currentLang = 'fr', categoryName = '') {
    if (!Array.isArray(data)) return data;
    
    return data.map((item, index) => {
        const fallbackSituation = categoryName ? `${categoryName} - Invocation ${index + 1}` : '';
        return {
            ...item,
            situationText: this.getTranslation(item.situation, currentLang, fallbackSituation),
            douaText: this.getTranslation(item.doua, currentLang, ''),
            transliteration: item.transliteration || ''
        };
    });
  }

  nextDoua() {
      const duas = this.state.get('citadelDouas');
      const currentIndex = this.state.get('currentDouaIndex');
      if (currentIndex < duas.length - 1) {
          this.state.set('currentDouaIndex', currentIndex + 1);
          return true;
      }
      return false;
  }

  previousDoua() {
      const currentIndex = this.state.get('currentDouaIndex');
      if (currentIndex > 0) {
          this.state.set('currentDouaIndex', currentIndex - 1);
          return true;
      }
      return false;
  }
}

