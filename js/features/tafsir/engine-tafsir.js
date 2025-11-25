export class TafsirEngine {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.pluginManager = dependencies.pluginManager;
        
        this.tafsirData = null;
        this.currentTafsir = null;
        
        // État local pour la navigation
        this.currentSurah = 1;
        this.currentAyah = 1;
    }

    async init() {
        // Précharger les données locales si besoin
        await this.loadTafsirData();
    }

    async loadTafsirData() {
        if (this.tafsirData) return this.tafsirData;

        try {
            const response = await fetch('js/features/tafsir/data/tafsir-data.json');
            this.tafsirData = await response.json();
            return this.tafsirData;
        } catch (error) {
            console.error('Erreur chargement Tafsir local:', error);
            this.tafsirData = [];
            return [];
        }
    }

    // Récupérer la liste des sourates (via CoranEngine)
    getSurahsList() {
        const coranEngine = this.pluginManager.get('coran').engine;
        return coranEngine.getSurahsList() || [];
    }

    // Récupérer le Tafsir pour un verset spécifique
    async getTafsirForVerse(surahNumber, ayahNumber) {
        this.currentSurah = parseInt(surahNumber);
        this.currentAyah = parseInt(ayahNumber);

        // 1. Chercher en local
        if (!this.tafsirData) await this.loadTafsirData();
        
        // Chercher la sourate dans les données
        const surahEntry = this.tafsirData.find(s => s.surah === this.currentSurah);
        if (surahEntry && surahEntry.tafsirs) {
            // La structure a une double imbrication : tafsirs[0].tafsirs contient les versets
            for (const tafsirGroup of surahEntry.tafsirs) {
                if (tafsirGroup.tafsirs && Array.isArray(tafsirGroup.tafsirs)) {
                    // Chercher le verset dans ce groupe
                    const verseTafsir = tafsirGroup.tafsirs.find(t => t.ayah === this.currentAyah);
                    if (verseTafsir) {
                        // Récupérer le texte selon la langue
                        const lang = this.state.get('language') || 'fr';
                        const textKey = `text_${lang}`;
                        const text = verseTafsir[textKey] || verseTafsir.text_fr || verseTafsir.text;
                        
                        return {
                            text: text,
                            source: verseTafsir.source,
                            isLocal: true
                        };
                    }
                }
            }
        }

        // 2. Fallback - message générique si pas trouvé
        return {
            text: "Tafsir non disponible pour ce verset dans la version hors-ligne. Nous travaillons à enrichir notre base de données.",
            source: "N/A",
            isLocal: false
        };
    }

    // Navigation
    async loadSurahAndAyah(surah, ayah) {
        this.currentSurah = parseInt(surah);
        this.currentAyah = parseInt(ayah);
        
        // Charger le texte du verset via CoranEngine
        const coranEngine = this.pluginManager.get('coran').engine;
        
        // S'assurer que la sourate est chargée dans le moteur Coran
        let surahData = coranEngine.getCurrentSurahData();
        if (!surahData || surahData.number !== this.currentSurah) {
            surahData = await coranEngine.fetchSurah(this.currentSurah);
        }

        const tafsir = await this.getTafsirForVerse(this.currentSurah, this.currentAyah);

        const verseText = surahData.arabic.ayahs[this.currentAyah - 1];
        const translationText = surahData.translation.ayahs[this.currentAyah - 1];

        return {
            surah: surahData,
            ayah: this.currentAyah,
            verseArabic: verseText,
            verseTranslation: translationText,
            tafsir: tafsir
        };
    }

    async nextAyah() {
        // Logique pour passer au verset suivant
        const coranEngine = this.pluginManager.get('coran').engine;
        let surahData = coranEngine.getCurrentSurahData();
        
        // Si pas de données, les charger
        if (!surahData || surahData.number !== this.currentSurah) {
            surahData = await coranEngine.fetchSurah(this.currentSurah);
        }
        
        if (surahData && this.currentAyah < surahData.arabic.numberOfAyahs) {
            this.currentAyah++;
            this.eventBus.emit('tafsir:navigate', { surah: this.currentSurah, ayah: this.currentAyah });
            return true;
        }
        return false;
    }

    previousAyah() {
        if (this.currentAyah > 1) {
            this.currentAyah--;
            this.eventBus.emit('tafsir:navigate', { surah: this.currentSurah, ayah: this.currentAyah });
            return true;
        }
        return false;
    }
}
