// feature-citadel.js - Citadel of the Muslim (Douas) - VERSION AVEC FALLBACK CATÉGORIE

import { state } from './feature-state.js';
import { render } from './feature-render.js';

let citadelIndex = null;
let citadelCategories = [];
let currentCategoryName = ''; // Stocke le nom de la catégorie actuelle

/**
 * Récupère une traduction avec fallback vers le nom de catégorie
 * @param {Object|string} obj - L'objet de traduction
 * @param {string} lang - La langue souhaitée
 * @param {string} categoryFallback - Le nom de la catégorie en fallback
 * @returns {string} - La traduction ou le nom de catégorie
 */
function getTranslation(obj, lang = 'fr', categoryFallback = '') {
    // Si c'est une string, la retourner directement
    if (typeof obj === 'string' && obj.trim() !== '') {
        return obj;
    }
    
    // Si l'objet n'existe pas, retourner le fallback
    if (!obj || typeof obj !== 'object') {
        return categoryFallback || '';
    }
    
    // Essayer la langue demandée
    if (obj[lang] && obj[lang].trim() !== '') {
        return obj[lang];
    }
    
    // Essayer le français
    if (obj['fr'] && obj['fr'].trim() !== '') {
        return obj['fr'];
    }
    
    // Essayer l'anglais
    if (obj['en'] && obj['en'].trim() !== '') {
        return obj['en'];
    }
    
    // Essayer l'arabe
    if (obj['ar'] && obj['ar'].trim() !== '') {
        return obj['ar'];
    }
    
    // Essayer n'importe quelle valeur disponible
    for (let key in obj) {
        if (obj[key] && typeof obj[key] === 'string' && obj[key].trim() !== '') {
            return obj[key];
        }
    }
    
    // Dernier recours : retourner le nom de catégorie
    return categoryFallback || '';
}

/**
 * Obtient le nom traduit d'une catégorie
 * @param {string} categoryId - L'ID de la catégorie
 * @param {Object} translations - L'objet des traductions
 * @returns {string} - Le nom traduit de la catégorie
 */
function getCategoryName(categoryId, translations = {}) {
    const categories = getCitadelCategories();
    const category = categories.find(cat => cat.id === categoryId);
    
    if (!category) return '';
    
    // Récupérer la traduction depuis le fichier de langue
    return translations[category.nameKey] || category.nameKey || '';
}

/**
 * Enrichit les données citadel avec les traductions et le fallback
 * @param {Array} data - Les données de la citadelle
 * @param {string} currentLang - La langue actuelle
 * @param {string} categoryName - Le nom de la catégorie pour le fallback
 * @returns {Array} - Les données enrichies
 */
function enrichCitadelData(data, currentLang = 'fr', categoryName = '') {
    if (!Array.isArray(data)) return data;
    
    return data.map((item, index) => {
        // Créer un fallback avec le nom de catégorie + numéro d'invocation
        const fallbackSituation = categoryName ? `${categoryName} - Invocation ${index + 1}` : '';
        
        return {
            ...item,
            situationText: getTranslation(item.situation, currentLang, fallbackSituation),
            douaText: getTranslation(item.doua, currentLang, ''),
            transliteration: item.transliteration || ''
        };
    });
}

// Load citadel index
export async function loadCitadelIndex() {
    try {
        const response = await fetch('assets/data/citadel_index.json');
        citadelIndex = await response.json();
        return citadelIndex;
    } catch (error) {
        console.error('Error loading citadel index:', error);
        return null;
    }
}

/**
 * Charge une catégorie spécifique avec traductions enrichies
 * @param {string} filename - Le nom du fichier
 * @param {string} currentLang - La langue actuelle
 * @param {string} categoryId - L'ID de la catégorie (pour le fallback)
 * @param {Object} translations - L'objet des traductions
 * @returns {Promise<Array>} - Les données enrichies
 */
export async function loadCitadelCategory(filename, currentLang = 'fr', categoryId = '', translations = {}) {
    try {
        const response = await fetch(`assets/data/${filename}`);
        const data = await response.json();
        
        // Obtenir le nom traduit de la catégorie pour le fallback
        const categoryName = categoryId ? getCategoryName(categoryId, translations) : '';
        currentCategoryName = categoryName;
        
        // Enrichir les données avec les traductions appropriées
        return enrichCitadelData(data, currentLang, categoryName);
    } catch (error) {
        console.error(`Error loading citadel category ${filename}:`, error);
        return null;
    }
}

// Get citadel categories with translations
export function getCitadelCategories() {
    const categories = [
        {
            id: 'morning_evening',
            file: 'citadel_morning_evening.json',
            icon: '🌅',
            nameKey: 'morningEvening'
        },
        {
            id: 'wake_up',
            file: 'citadel_wake_up.json',
            icon: '🛏️',
            nameKey: 'wakeUp'
        },
        {
            id: 'toilets',
            file: 'citadel_toilets.json',
            icon: '🚽',
            nameKey: 'toilets'
        },
        {
            id: 'ablutions',
            file: 'citadel_ablutions.json',
            icon: '💧',
            nameKey: 'ablutionsDoua'
        },
        {
            id: 'home',
            file: 'citadel_home.json',
            icon: '🏠',
            nameKey: 'homeDoua'
        },
        {
            id: 'mosque',
            file: 'citadel_mosque.json',
            icon: '🕌',
            nameKey: 'mosque'
        },
        {
            id: 'travel',
            file: 'citadel_travel.json',
            icon: '✈️',
            nameKey: 'travel'
        },
        {
            id: 'market',
            file: 'citadel_market.json',
            icon: '🛒',
            nameKey: 'market'
        },
        {
            id: 'children_protection',
            file: 'citadel_children_protection.json',
            icon: '👶',
            nameKey: 'childrenProtection'
        },
        {
            id: 'stress_sorrow',
            file: 'citadel_stress_sorrow.json',
            icon: '😰',
            nameKey: 'stressSorrow'
        },
        {
            id: 'after_meal',
            file: 'citadel_after_meal.json',
            icon: '🍽️',
            nameKey: 'afterMeal'
        },
        {
            id: 'final_tashahhud',
            file: 'citadel_final_tashahhud.json',
            icon: '🤲',
            nameKey: 'finalTashahhud'
        },
        {
            id: 'marriage_vehicle',
            file: 'citadel_marriage_vehicle.json',
            icon: '💑',
            nameKey: 'marriageVehicle'
        },
        {
            id: 'rain',
            file: 'citadel_rain.json',
            icon: '🌧️',
            nameKey: 'rain'
        },
        {
            id: 'anger',
            file: 'citadel_anger.json',
            icon: '😤',
            nameKey: 'anger'
        },
        {
            id: 'funeral',
            file: 'citadel_funeral.json',
            icon: '⚰️',
            nameKey: 'funeral'
        },
        {
            id: 'illness',
            file: 'citadel_illness.json',
            icon: '🤒',
            nameKey: 'illness'
        },
        {
            id: 'visit_sick',
            file: 'citadel_visit_sick.json',
            icon: '🏥',
            nameKey: 'visitSick'
        },
        {
            id: 'evil_eye',
            file: 'citadel_evil_eye.json',
            icon: '🧿',
            nameKey: 'evilEye'
        }
    ];
    
    return categories;
}

// Initialize citadel on app load
export async function initCitadel() {
    await loadCitadelIndex();
}

// Export les fonctions helpers
export { getTranslation, enrichCitadelData, getCategoryName };
