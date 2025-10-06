// feature-handlers.js - Event Handlers

import { state, resetPrayerState, saveSettings } from './feature-state.js';
import { render } from './feature-render.js';
import { playAudio, stopAudio, timeoutId } from './feature-audio.js';
import { PRAYERS, SURAHS } from './feature-config.js';
import { getCurrentSteps } from './feature-prayers.js';
import { fetchPrayerTimes, fetchDailyHadith } from './feature-api.js';
import { getCitadelCategories, loadCitadelCategory } from './feature-citadel.js';
import { loadPillarsData, getPillars, getPillarById } from './feature-pillars-of-prayers.js';
import { fetchSurahsList, fetchSurah, getCurrentSurahData, getSurahsList } from './feature-coran.js';
import { initOnboarding, completeOnboarding } from './feature-onboarding.js';

// Initialize onboarding on app start
document.addEventListener('DOMContentLoaded', () => {
    initOnboarding();
    render();
});

// Onboarding handlers
window.nextOnboardingStep = () => {
    // Si on est à l'étape 3 (formulaire), on sauvegarde les données
    if (state.onboardingStep === 3) {
        const cityInput = document.getElementById('onboardingCityInput');
        const countryInput = document.getElementById('onboardingCountryInput');
        
        if (cityInput) state.city = cityInput.value;
        if (countryInput) state.country = countryInput.value.toUpperCase();
    }
    
    state.onboardingStep++;
    render();
};

window.previousOnboardingStep = () => {
    if (state.onboardingStep > 1) {
        state.onboardingStep--;
        render();
    }
};

window.completeOnboardingFlow = () => {
    // Sauvegarder les données du formulaire si remplies
    const cityInput = document.getElementById('onboardingCityInput');
    const countryInput = document.getElementById('onboardingCountryInput');
    
    if (cityInput) state.city = cityInput.value;
    if (countryInput) state.country = countryInput.value.toUpperCase();
    
    // Sauvegarder dans localStorage
    saveSettings();
    
    // Récupérer les horaires de prière si localisation remplie
    if (state.city && state.country) {
        fetchPrayerTimes(state.city, state.country);
    }
    
    // Marquer l'onboarding comme complété
    completeOnboarding();
    render();
};

window.skipOnboarding = () => {
    completeOnboarding();
    render();
};

// Navigation handlers
window.goHome = () => {
    stopAudio();
    if (timeoutId) clearTimeout(timeoutId);
    resetPrayerState();
    state.screen = 'home';
    render();
};

window.goToSettings = () => {
    state.screen = 'settings';
    render();
};

window.goToMuslimTools = () => {
    state.screen = 'muslim-tools';
    render();
};

window.goToAblutions = () => {
    state.screen = 'ablutions';
    render();
};

window.goToConfig = () => {
    stopAudio();
    if (timeoutId) clearTimeout(timeoutId);
    state.scenarioMode = false;
    state.screen = 'config';
    render();
};

// Settings handlers
window.toggleLanguageMenu = () => {
    const menu = document.getElementById('languageMenu');
    menu.classList.toggle('hidden');
};

window.changeLanguage = (lang) => {
    state.language = lang;
    localStorage.setItem('prayerAppLanguage', lang);
    document.documentElement.lang = lang;
    fetchDailyHadith(lang);
    render();
};

window.updateCity = (city) => {
    state.city = city;
};

window.updateCountry = (country) => {
    state.country = country.toUpperCase();
};

window.selectCalculationMethod = (methodId) => {
    state.calculationMethod = methodId;
    render();
};

window.selectReciter = (reciterId) => {
    state.selectedReciter = reciterId;
    render();
};

window.selectAvatar = (gender) => {
    state.avatarGender = gender;
    render();
};

window.saveSettingsAndReturn = () => {
    saveSettings();
    
    if (state.city && state.country) {
        fetchPrayerTimes(state.city, state.country);
    }
    
    state.screen = 'home';
    render();
};

// Prayer configuration handlers
window.selectPrayer = (prayerId) => {
    state.selectedPrayer = prayerId;
    state.rakaatConfig = Array.from({ length: PRAYERS[prayerId].rakaats }, (_, i) => ({
        rakaat: i + 1,
        secondarySurah: SURAHS.find(s => s.id === 'ikhlas')
    }));
    state.screen = 'config';
    render();
};

window.updateSurah = (index, surahId) => {
    state.rakaatConfig[index].secondarySurah = SURAHS.find(s => s.id === surahId);
    render();
};

window.startGuidance = () => {
    state.currentRakaat = 1;
    state.currentStepIndex = 0;
    state.screen = 'guidance';
    render();
};

// Prayer guidance handlers
window.toggleAudio = () => {
    if (state.isPlaying) {
        stopAudio();
    } else {
        playAudio();
    }
    render();
};

window.toggleScenario = () => {
    state.scenarioMode = !state.scenarioMode;
    if (state.scenarioMode) {
        playAudio();
    } else {
        stopAudio();
        if (timeoutId) clearTimeout(timeoutId);
    }
    render();
};

window.changeVariant = (direction) => {
    const steps = getCurrentSteps(() => {});
    const step = steps[state.currentStepIndex];
    if (step.audioFiles) {
        state.audioOption = (state.audioOption + direction + step.audioFiles.length) % step.audioFiles.length;
        stopAudio();
        render();
    }
};

window.nextStep = () => {
    const steps = getCurrentSteps(() => {});
    if (state.currentStepIndex < steps.length - 1) {
        state.currentStepIndex++;
    } else if (state.currentRakaat < PRAYERS[state.selectedPrayer].rakaats) {
        state.currentRakaat++;
        state.currentStepIndex = 0;
    }
    stopAudio();
    state.audioOption = 0;
    render();
    
    if (state.scenarioMode) {
        setTimeout(() => playAudio(), 300);
    }
};

window.previousStep = () => {
    if (state.currentStepIndex > 0) {
        state.currentStepIndex--;
    } else if (state.currentRakaat > 1) {
        state.currentRakaat--;
        const prevSteps = getCurrentSteps(() => {});
        state.currentStepIndex = prevSteps.length - 1;
    }
    stopAudio();
    state.audioOption = 0;
    render();
};

// Ablution handlers
window.selectAblutionType = (typeId) => {
    state.selectedAblutionType = typeId;
    state.currentAblutionStep = 0;
    state.screen = 'ablution-guidance';
    render();
};

window.nextAblutionStep = () => {
    const steps = window.getAblutionSteps(state.selectedAblutionType, {});
    if (state.currentAblutionStep < steps.length - 1) {
        state.currentAblutionStep++;
        render();
    }
};

window.previousAblutionStep = () => {
    if (state.currentAblutionStep > 0) {
        state.currentAblutionStep--;
        render();
    }
};

// Citadel handlers
window.goToCitadel = () => {
    state.screen = 'citadel';
    render();
};

window.selectCitadelCategory = async (categoryId, categoryFile) => {
    state.selectedCitadelCategory = categoryId;
    state.loadingCitadel = true;
    state.currentDouaIndex = 0;
    state.screen = 'citadel-douas';
    render();
    
    const douas = await loadCitadelCategory(categoryFile);
    state.citadelDouas = douas;
    state.loadingCitadel = false;
    render();
};

window.nextDoua = () => {
    if (state.citadelDouas && state.currentDouaIndex < state.citadelDouas.length - 1) {
        state.currentDouaIndex++;
        render();
    }
};

window.previousDoua = () => {
    if (state.currentDouaIndex > 0) {
        state.currentDouaIndex--;
        render();
    }
};

// Pillars handlers
window.goToPillars = async () => {
    state.screen = 'pillars';
    await loadPillarsData();
    render();
};

window.selectPillar = (pillarId) => {
    state.selectedPillar = pillarId;
    state.screen = 'pillar-detail';
    render();
};

window.navigatePillar = (direction) => {
    const pillars = getPillars();
    const currentPillar = getPillarById(state.selectedPillar);
    
    if (!currentPillar) return;
    
    const targetOrder = currentPillar.order + direction;
    const targetPillar = pillars.find(p => p.order === targetOrder);
    
    if (targetPillar) {
        state.selectedPillar = targetPillar.id;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Hadith handlers
window.refreshHadith = () => {
    fetchDailyHadith(state.language);
};

// Utility handlers
window.downloadSourceCode = () => {
    const link = document.createElement('a');
    link.href = 'prayer-guidance-app-source.zip';
    link.download = 'prayer-guidance-app-source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Close language menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('languageMenu');
    if (menu && !e.target.closest('button')) {
        menu.classList.add('hidden');
    }
});

// Coran handlers
window.goToCoran = async () => {
    state.screen = 'coran-surahs';
    state.loadingCoran = true;
    render();
    
    await fetchSurahsList();
    state.loadingCoran = false;
    render();
};

window.goToCoranSurahs = async () => {
    state.screen = 'coran-surahs';
    if (!getSurahsList()) {
        await fetchSurahsList();
    }
    render();
};

window.selectSurah = async (surahNumber) => {
    state.selectedSurah = surahNumber;
    state.currentAyahIndex = 0;
    state.loadingCoran = true;
    state.screen = 'coran-reader';
    render();
    
    await fetchSurah(surahNumber, state.language);
    state.loadingCoran = false;
    render();
};

window.nextAyah = () => {
    const surahData = getCurrentSurahData();
    if (surahData && state.currentAyahIndex < surahData.arabic.numberOfAyahs - 1) {
        state.currentAyahIndex++;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.previousAyah = () => {
    if (state.currentAyahIndex > 0) {
        state.currentAyahIndex--;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};
