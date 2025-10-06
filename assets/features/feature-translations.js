// feature-translations.js - Translation Management
// feature-translations.js - Translation Management (version avec préchargement)

import { state } from './feature-state.js';

let TRANSLATIONS = {};
let translationsLoaded = false;

export async function loadTranslations() {
    try {
        // Charger la config
        const configResponse = await fetch('assets/lang/lang.json');
        const config = await configResponse.json();
        
        // Charger toutes les langues en parallèle
        const loadPromises = config.availableLanguages.map(async (lang) => {
            const response = await fetch(`assets/lang/${lang}.json`);
            const translations = await response.json();
            TRANSLATIONS[lang] = translations;
        });
        
        await Promise.all(loadPromises);
        translationsLoaded = true;
        console.log('All translations loaded from external files');
        return true;
    } catch (error) {
        console.warn('Could not load external translations:', error);
        translationsLoaded = true;
        return false;
    }
}

export function t() {
    if (!TRANSLATIONS || !TRANSLATIONS[state.language]) {
        return {};
    }
    return TRANSLATIONS[state.language];
}

export function isRTL() {
    return state.language === 'ar';
}

export function getDirectionAttr() {
    return isRTL() ? 'rtl' : 'ltr';
}