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
        // Ne plus précharger toutes les données, on chargera à la demande
        // pour économiser la mémoire et améliorer les performances
        this.tafsirData = null;
    }

    async loadTafsirData(surahNumber = null) {
        // Si une sourate spécifique est demandée, charger uniquement ce fichier
        if (surahNumber) {
            return await this.loadSurahTafsir(surahNumber);
        }

        // Sinon, retourner les données déjà chargées ou un tableau vide
        return this.tafsirData || [];
    }

    async loadSurahTafsir(surahNumber) {
        // Cette méthode n'est plus utilisée car on charge maintenant les fichiers individuels par verset
        // Conservée pour compatibilité mais retourne null
        return null;
    }

    // Charger un fichier tafsir individuel pour un verset spécifique
    async loadTafsirFile(surahNumber, ayahNumber, lang) {
        const fileName = `surah${surahNumber}-ayah${ayahNumber}-${lang}.json`;
        const filePath = `js/features/tafsir/data/${lang}/${fileName}`;
        
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return data;
        } catch (error) {
            return null;
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

        // Récupérer la langue de l'interface
        const preferredLang = this.state.get('language') || 'fr';
        
        // Ordre de fallback : langue préférée -> fr -> en -> ar
        const langOrder = [preferredLang];
        if (preferredLang !== 'fr') langOrder.push('fr');
        if (preferredLang !== 'en') langOrder.push('en');
        if (preferredLang !== 'ar') langOrder.push('ar');

        // Essayer de charger le fichier pour chaque langue dans l'ordre de fallback
        let tafsirData = null;
        let loadedLang = null;
        
        for (const lang of langOrder) {
            tafsirData = await this.loadTafsirFile(this.currentSurah, this.currentAyah, lang);
            if (tafsirData) {
                loadedLang = lang;
                break;
            }
        }

        if (tafsirData) {
            // Extraire le texte selon la langue chargée
            const textKey = `text_${loadedLang}`;
            let text = tafsirData[textKey] || '';
            
            // Si le texte n'est pas disponible dans la langue chargée, essayer les autres
            if (!text || text.trim().length === 0) {
                if (tafsirData.text_fr && tafsirData.text_fr.trim().length > 0) {
                    text = tafsirData.text_fr;
                } else if (tafsirData.text_en && tafsirData.text_en.trim().length > 0) {
                    text = tafsirData.text_en;
                } else if (tafsirData.text_ar && tafsirData.text_ar.trim().length > 0) {
                    text = tafsirData.text_ar;
                }
            }
            
            // Si toujours pas de texte, afficher un message selon la langue préférée
            if (!text || text.trim().length === 0) {
                if (preferredLang === 'fr') {
                    text = 'Tafsir en français non disponible pour ce verset. Nous travaillons à enrichir notre base de données.';
                } else if (preferredLang === 'en') {
                    text = 'Tafsir in English not available for this verse. We are working to enrich our database.';
                } else if (preferredLang === 'ar' || preferredLang === 'ara') {
                    text = 'التفسير غير متاح لهذه الآية';
                } else {
                    text = 'Tafsir non disponible pour ce verset';
                }
            }
            
            return {
                text: text,
                source: tafsirData.source || 'Ibn Kathir',
                isLocal: true
            };
        }

        // Fallback - message générique si pas trouvé
        const lang = this.state.get('language') || 'fr';
        let fallbackMessage = "Tafsir non disponible pour ce verset dans la version hors-ligne. Nous travaillons à enrichir notre base de données.";
        if (lang === 'en') {
            fallbackMessage = "Tafsir not available for this verse in the offline version. We are working to enrich our database.";
        } else if (lang === 'ar' || lang === 'ara') {
            fallbackMessage = "التفسير غير متاح لهذه الآية في النسخة غير المتصلة. نحن نعمل على إثراء قاعدة البيانات الخاصة بنا.";
        }
        
        return {
            text: fallbackMessage,
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
