import { QuranAudioService } from './quran-audio-service.js';

export class CoranEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.pluginManager = dependencies.pluginManager;
    this.surahsList = null;
    this.currentSurahData = null;
    this.audioService = new QuranAudioService();
    this.recitationsList = null;
    
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

  /**
   * Récupère l'URL audio pour le verset actuel
   * @param {number} recitationId - ID de la récitation (optionnel, utilise la préférence utilisateur par défaut)
   * @returns {Promise<string|null>} URL du fichier audio ou null si erreur
   */
  async getAudioUrl(recitationId = null) {
    if (!this.currentSurahData) return null;

    const surahNumber = this.currentSurahData.number;
    const currentAyahIndex = this.state.get('currentAyahIndex');
    const ayahNumber = currentAyahIndex + 1; // Les indices commencent à 0, les numéros de verset à 1

    // Utiliser le récitateur sélectionné ou celui par défaut
    const selectedRecitationId = recitationId || this.state.get('coranRecitationId') || 1;

    try {
      this.state.set('loadingAudio', true);
      const audioUrl = await this.audioService.getVerseAudioUrl(surahNumber, ayahNumber, selectedRecitationId);
      this.state.set('loadingAudio', false);
      return audioUrl;
    } catch (error) {
      console.error('Error getting audio URL:', error);
      this.state.set('loadingAudio', false);
      this.state.set('audioError', error.message || 'Erreur lors de la récupération de l\'audio');
      return null;
    }
  }

  /**
   * Récupère l'URL audio pour une sourate complète
   * @param {number} surahNumber - Numéro de la sourate (optionnel, utilise la sourate actuelle par défaut)
   * @param {number} recitationId - ID de la récitation (optionnel, utilise la préférence utilisateur par défaut)
   * @returns {Promise<string|null>} URL du fichier audio ou null si erreur
   */
  async getSurahAudioUrl(surahNumber = null, recitationId = null) {
    const targetSurahNumber = surahNumber || (this.currentSurahData?.number);
    if (!targetSurahNumber) return null;

    const selectedRecitationId = recitationId || this.state.get('coranRecitationId') || 1;

    try {
      this.state.set('loadingAudio', true);
      const audioUrl = await this.audioService.getSurahAudioUrl(targetSurahNumber, selectedRecitationId);
      this.state.set('loadingAudio', false);
      return audioUrl;
    } catch (error) {
      console.error('Error getting surah audio URL:', error);
      this.state.set('loadingAudio', false);
      this.state.set('audioError', error.message || 'Erreur lors de la récupération de l\'audio');
      return null;
    }
  }

  /**
   * Récupère la liste des récitations disponibles
   * @returns {Promise<Array>} Liste des récitations
   */
  async getRecitations() {
    if (this.recitationsList) return this.recitationsList;

    try {
      this.state.set('loadingRecitations', true);
      this.recitationsList = await this.audioService.getRecitations();
      this.state.set('loadingRecitations', false);
      return this.recitationsList;
    } catch (error) {
      console.error('Error fetching recitations:', error);
      this.state.set('loadingRecitations', false);
      return [];
    }
  }

  /**
   * Définit le récitateur sélectionné
   * @param {number} recitationId - ID de la récitation
   */
  setRecitationId(recitationId) {
    this.state.set('coranRecitationId', recitationId);
  }

  /**
   * Récupère le récitateur sélectionné
   * @returns {number} ID de la récitation (1 par défaut)
   */
  getRecitationId() {
    return this.state.get('coranRecitationId') || 1;
  }

  /**
   * Télécharge une sourate pour utilisation hors-ligne
   * @param {number} surahNumber - Numéro de la sourate
   * @param {number} totalAyahs - Nombre total de versets
   * @param {number} recitationId - ID du récitateur
   * @param {Function} onProgress - Callback de progression
   */
  async downloadSurahForOffline(surahNumber, totalAyahs, recitationId, onProgress) {
    return this.audioService.downloadSurahForOffline(surahNumber, totalAyahs, recitationId, onProgress);
  }

  /**
   * Vérifie si une sourate est disponible hors-ligne
   */
  async isSurahAvailableOffline(surahNumber, recitationId, totalAyahs) {
    return this.audioService.isSurahAvailableOffline(surahNumber, recitationId, totalAyahs);
  }

  /**
   * Supprime le cache d'une sourate
   */
  async deleteSurahCache(surahNumber, recitationId) {
    return this.audioService.deleteSurahCache(surahNumber, recitationId);
  }

  /**
   * Récupère la liste des sourates en cache
   */
  async getCachedSurahs() {
    return this.audioService.getCachedSurahs();
  }

  /**
   * Récupère la taille du cache
   */
  async getCacheSize() {
    return this.audioService.getCacheSize();
  }
}

