export class CoranEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.pluginManager = dependencies.pluginManager;
    this.surahsList = null;
    this.currentSurahData = null;
    
    this.QURAN_EDITIONS = {
        'fr': { translation: 'fr.hamidullah', arabic: 'quran-simple' },
        'en': { translation: 'en.sahih', arabic: 'quran-simple' },
        'ar': { translation: 'ar.muyassar', arabic: 'quran-simple' },
        'default': { translation: 'en.sahih', arabic: 'quran-simple' }
    };
  }
  
  get translations() {
      return this.pluginManager.get('translations').engine;
  }

  async init() {
    // On pourrait précharger la liste ici, mais on attend d'entrer dans la vue pour ne pas bloquer le démarrage
  }

  getEditionForLanguage(language) {
    return this.QURAN_EDITIONS[language] || this.QURAN_EDITIONS['default'];
  }

  async fetchSurahsList() {
    if (this.surahsList) return this.surahsList;

    this.state.set('loadingCoran', true);
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            this.surahsList = data.data;
            this.state.set('loadingCoran', false);
            return this.surahsList;
        }
        throw new Error('Failed to fetch surahs list');
    } catch (error) {
        console.error('Error fetching surahs list:', error);
        this.state.set('loadingCoran', false);
        return null;
    }
  }

  async fetchSurah(surahNumber) {
    this.state.set('loadingCoran', true);
    try {
        const language = this.state.get('language');
        const edition = this.getEditionForLanguage(language);
        
        const [arabicResponse, translationResponse] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition.arabic}`),
            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition.translation}`)
        ]);
        
        const arabicData = await arabicResponse.json();
        const translationData = await translationResponse.json();
        
        if (arabicData.code === 200 && translationData.code === 200) {
            this.currentSurahData = {
                number: surahNumber,
                arabic: arabicData.data,
                translation: translationData.data,
                edition: edition
            };
            
            this.state.update({
                currentSurahNumber: surahNumber,
                currentAyahIndex: 0,
                loadingCoran: false
            });
            return this.currentSurahData;
        }
        throw new Error('Failed to fetch surah');
    } catch (error) {
        console.error('Error fetching surah:', error);
        this.state.set('loadingCoran', false);
        return null;
    }
  }

  getSurahsList() {
    return this.surahsList;
  }

  getCurrentSurahData() {
    return this.currentSurahData;
  }

  formatSurahName(surah) {
    if (!surah) return '';
    const language = this.state.get('language');
    
    if (language === 'ar') {
        return surah.name;
    }
    return `${surah.englishName} - ${surah.name}`;
  }

  getRevelationType(revelationType) {
    const t = this.translations.getAll();
    if (revelationType === 'Meccan') {
        return t.meccan || 'Mecquoise';
    } else if (revelationType === 'Medinan') {
        return t.medinan || 'Médinoise';
    }
    return revelationType;
  }

  nextAyah() {
    if (!this.currentSurahData) return false;
    const currentIndex = this.state.get('currentAyahIndex');
    const totalAyahs = this.currentSurahData.arabic.numberOfAyahs;
    
    if (currentIndex < totalAyahs - 1) {
        this.state.set('currentAyahIndex', currentIndex + 1);
        return true;
    }
    return false;
  }

  previousAyah() {
    const currentIndex = this.state.get('currentAyahIndex');
    if (currentIndex > 0) {
        this.state.set('currentAyahIndex', currentIndex - 1);
        return true;
    }
    return false;
  }
}

