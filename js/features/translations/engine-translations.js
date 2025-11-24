export class TranslationsEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
  }
  
  async init() {
    await this.loadTranslations();
  }
  
  async loadTranslations() {
    const lang = this.state.get('language') || 'fr';
    try {
      const response = await fetch(`assets/lang/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load translations for ${lang}`);
      
      const translations = await response.json();
      this.state.set('translations', translations);
      this.eventBus.emit('translations:loaded', translations);
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback or retry logic could go here
    }
  }
  
  async changeLanguage(newLang) {
    this.state.set('language', newLang);
    await this.loadTranslations();
    this.state.save();
  }
  
  get(key) {
    const translations = this.state.get('translations');
    return translations && translations[key] ? translations[key] : key;
  }

  getAll() {
    return this.state.get('translations') || {};
  }
  
  getNested(path) {
    const translations = this.state.get('translations');
    if (!translations) return path;
    
    return path.split('.').reduce((obj, key) => obj?.[key], translations) || path;
  }
  
  isRTL() {
      const lang = this.state.get('language');
      return lang === 'ar';
  }
}

