// feature-coran.js - Coran/Quran Logic

let surahsList = null;
let currentSurahData = null;

// Mapping des langues de l'app vers les éditions de l'API
const QURAN_EDITIONS = {
    'fr': { 
        translation: 'fr.hamidullah',
        arabic: 'quran-simple'
    },
    'en': { 
        translation: 'en.sahih',
        arabic: 'quran-simple'
    },
    'ar': { 
        translation: 'ar.muyassar',
        arabic: 'quran-simple'
    },
    // Fallback pour les autres langues (utilise l'anglais)
    'default': { 
        translation: 'en.sahih',
        arabic: 'quran-simple'
    }
};

/**
 * Obtenir l'édition appropriée selon la langue
 */
function getEditionForLanguage(language) {
    return QURAN_EDITIONS[language] || QURAN_EDITIONS['default'];
}

/**
 * Récupérer la liste des sourates
 */
export async function fetchSurahsList() {
    try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            surahsList = data.data;
            return surahsList;
        }
        throw new Error('Failed to fetch surahs list');
    } catch (error) {
        console.error('Error fetching surahs list:', error);
        return null;
    }
}

/**
 * Récupérer une sourate spécifique avec traduction
 */
export async function fetchSurah(surahNumber, language) {
    try {
        const edition = getEditionForLanguage(language);
        
        // Récupérer la version arabe et la traduction en parallèle
        const [arabicResponse, translationResponse] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition.arabic}`),
            fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${edition.translation}`)
        ]);
        
        const arabicData = await arabicResponse.json();
        const translationData = await translationResponse.json();
        
        if (arabicData.code === 200 && translationData.code === 200) {
            currentSurahData = {
                number: surahNumber,
                arabic: arabicData.data,
                translation: translationData.data,
                edition: edition
            };
            return currentSurahData;
        }
        throw new Error('Failed to fetch surah');
    } catch (error) {
        console.error('Error fetching surah:', error);
        return null;
    }
}

/**
 * Obtenir la liste des sourates en cache
 */
export function getSurahsList() {
    return surahsList;
}

/**
 * Obtenir les données de la sourate actuelle
 */
export function getCurrentSurahData() {
    return currentSurahData;
}

/**
 * Obtenir les informations d'une sourate par son numéro
 */
export function getSurahInfo(surahNumber) {
    if (!surahsList) return null;
    return surahsList.find(s => s.number === surahNumber);
}

/**
 * Formater le nom de la sourate selon la langue
 */
export function formatSurahName(surah, language) {
    if (!surah) return '';
    
    if (language === 'ar') {
        return surah.name;
    }
    
    // Pour les autres langues, afficher la translittération + nom arabe
    return `${surah.englishName} - ${surah.name}`;
}

/**
 * Obtenir la catégorie/révélation de la sourate traduite
 */
export function getRevelationType(revelationType, trans) {
    if (revelationType === 'Meccan') {
        return trans.meccan || 'Mecquoise';
    } else if (revelationType === 'Medinan') {
        return trans.medinan || 'Médinoise';
    }
    return revelationType;
}
