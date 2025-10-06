// feature-state.js - Application State Management

export const state = {
    screen: 'home',
    selectedPrayer: null,
    rakaatConfig: [],
    currentRakaat: 1,
    currentStepIndex: 0,
    audioOption: 0,
    scenarioMode: false,
    isPlaying: false,
    language: localStorage.getItem('prayerAppLanguage') || 'fr',
    selectedReciter: localStorage.getItem('prayerAppReciter') || 'saad-el-ghamidi',
    avatarGender: localStorage.getItem('prayerAppAvatar') || 'boy',
    city: localStorage.getItem('prayerAppCity') || '',
    country: localStorage.getItem('prayerAppCountry') || '',
    calculationMethod: parseInt(localStorage.getItem('prayerAppCalculationMethod')) || 3,
    prayerTimes: null,
    currentDate: null,
    loadingPrayerTimes: false,
    dailyHadith: null,
    loadingHadith: false,
    hadithError: null,
    selectedAblutionType: null,
    currentAblutionStep: 0,
    selectedCitadelCategory: null,
    citadelDouas: null,
    currentDouaIndex: 0,
    loadingCitadel: false,
    // États pour l'onboarding
    showOnboarding: false,
    onboardingStep: 1
};

export function resetPrayerState() {
    state.currentRakaat = 1;
    state.currentStepIndex = 0;
    state.audioOption = 0;
    state.scenarioMode = false;
    state.isPlaying = false;
}

export function saveSettings() {
    localStorage.setItem('prayerAppReciter', state.selectedReciter);
    localStorage.setItem('prayerAppAvatar', state.avatarGender);
    localStorage.setItem('prayerAppCity', state.city);
    localStorage.setItem('prayerAppCountry', state.country);
    localStorage.setItem('prayerAppCalculationMethod', state.calculationMethod);
    localStorage.setItem('prayerAppLanguage', state.language);
}
