// scripts.js - Main Entry Point

import { state } from './features/feature-state.js';
import { loadTranslations } from './features/feature-translations.js';
import { render } from './features/feature-render.js';
import { fetchPrayerTimes, fetchDailyHadith } from './features/feature-api.js';
import { setupAudioEndedHandler } from './features/feature-audio.js';
import { PRAYERS } from './features/feature-config.js';
import { getCurrentSteps } from './features/feature-prayers.js';
import { getAblutionSteps } from './features/feature-ablutions.js';
import './features/feature-handlers.js';

// Setup audio ended handler with dependencies
import { audio } from './features/feature-audio.js';
setupAudioEndedHandler(
    window.nextStep,
    () => getCurrentSteps(() => {}),
    PRAYERS
);

// Make getAblutionSteps available globally for handlers
window.getAblutionSteps = getAblutionSteps;

// Initialize the application
async function initializeApp() {
    // Load translations first
    await loadTranslations();
    
    // Then fetch prayer times if city and country are set
    if (state.city && state.country) {
        fetchPrayerTimes(state.city, state.country);
    }
    
    // Load daily hadith
    fetchDailyHadith(state.language);
    
    // Finally render the app
    render();
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
