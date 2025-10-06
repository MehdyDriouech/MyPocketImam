// feature-render.js - Rendering Logic (CORRECTED VERSION)

import { state } from './feature-state.js';
import { t, getDirectionAttr, isRTL } from './feature-translations.js';
import { LANGUAGES, RECITERS, CALCULATION_METHODS, PRAYERS, SURAHS } from './feature-config.js';
import { getCurrentSteps, getPositionImage, getCurrentAudioFile } from './feature-prayers.js';
import { ABLUTION_TYPES, getAblutionSteps } from './feature-ablutions.js';
import { getPrayerSteps, getFinalSteps } from './feature-prayers.js';
import { getCitadelCategories } from './feature-citadel.js';
import { getPillars, getPillarById, getPillarLabel, getPillarDescription, getPillarHowTo, getPillarIcon } from './feature-pillars-of-prayers.js';
import { getSurahsList, getCurrentSurahData, formatSurahName, getRevelationType } from './feature-coran.js';
import { renderOnboardingModal } from './feature-onboarding.js';

// Expose getAblutionSteps globally for handlers
window.getAblutionSteps = getAblutionSteps;

export function render() {
    const app = document.getElementById('app');
    const trans = t();
    
    // Ajouter des objets par défaut si manquants
    trans.prayers = trans.prayers || {};
    trans.calculationMethods = trans.calculationMethods || {};
    trans.surahs = trans.surahs || {};
    
    const dirAttr = getDirectionAttr();
    const rtl = isRTL();
    
    if (state.screen === 'home') {
        renderHome(app, trans, dirAttr, rtl);
    } else if (state.screen === 'muslim-tools') {
        renderMuslimTools(app, trans, dirAttr, rtl);
    } else if (state.screen === 'ablutions') {
        renderAblutions(app, trans, dirAttr, rtl);
    } else if (state.screen === 'ablution-guidance') {
        renderAblutionGuidance(app, trans, dirAttr, rtl);
    } else if (state.screen === 'citadel') {
        renderCitadel(app, trans, dirAttr, rtl);
    } else if (state.screen === 'citadel-douas') {
        renderCitadelDouas(app, trans, dirAttr, rtl);
    } else if (state.screen === 'pillars') {
        renderPillars(app, trans, dirAttr, rtl);
    } else if (state.screen === 'pillar-detail') {
        renderPillarDetail(app, trans, dirAttr, rtl);
    } else if (state.screen === 'coran-surahs') {
        renderCoranSurahs(app, trans, dirAttr, rtl);
    } else if (state.screen === 'coran-reader') {
        renderCoranReader(app, trans, dirAttr, rtl);
    } else if (state.screen === 'settings') {
        renderSettings(app, trans, dirAttr, rtl);
    } else if (state.screen === 'config') {
        renderConfig(app, trans, dirAttr, rtl);
    } else if (state.screen === 'guidance') {
        renderGuidance(app, trans, dirAttr, rtl);
    }
    
    // Handle onboarding modal
    if (state.showOnboarding) {
        const onboardingModal = renderOnboardingModal();
        let modalContainer = document.getElementById('onboarding-modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'onboarding-modal-container';
            document.body.appendChild(modalContainer);
        }
        modalContainer.innerHTML = onboardingModal;
    } else {
        const modalContainer = document.getElementById('onboarding-modal-container');
        if (modalContainer) {
            modalContainer.remove();
        }
    }
}

// ============================================================================
// HOME SCREEN
// ============================================================================
function renderHome(app, trans, dirAttr, rtl) {
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex justify-between mb-4">
                <button onclick="goToSettings()" class="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-all border-2 border-teal-100">
                    <span class="text-xl">⚙️</span>
                    <span class="font-medium text-teal-800">${trans.settings}</span>
                </button>
                <button onclick="goToMuslimTools()" class="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-all border-2 border-teal-100">
                    <span class="text-xl">🧰</span>
                    <span class="font-medium text-teal-800">${trans.muslimTools || 'Outils du musulman'}</span>
                </button>
                <div class="relative inline-block">
                    <button onclick="toggleLanguageMenu()" class="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2 hover:shadow-xl transition-all border-2 border-teal-100">
                        <span class="text-2xl">${LANGUAGES.find(l => l.code === state.language).flag}</span>
                        <span class="font-medium text-teal-800">${LANGUAGES.find(l => l.code === state.language).name}</span>
                        <span>▼</span>
                    </button>
                    <div id="languageMenu" class="hidden absolute ${rtl ? 'left-0' : 'right-0'} mt-2 bg-white rounded-xl shadow-xl border-2 border-teal-100 overflow-hidden z-10">
                        ${LANGUAGES.map(lang => `
                            <button onclick="changeLanguage('${lang.code}')" class="w-full px-4 py-3 flex items-center gap-3 hover:bg-teal-50 transition-colors ${state.language === lang.code ? 'bg-teal-100' : ''}">
                                <span class="text-2xl">${lang.flag}</span>
                                <span class="font-medium">${lang.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="text-center mb-12 pt-8">
                <div class="text-6xl mb-4">🕌</div>
                <h1 class="text-4xl font-bold text-teal-800 mb-2">${trans.appTitle}</h1>
                <p class="text-teal-600">${trans.subtitle}</p>
                <p class="text-sm text-teal-500 mt-2">${trans.reciter}: ${RECITERS.find(r => r.id === state.selectedReciter).name}</p>
                ${state.city && state.country ? `<p class="text-sm text-teal-500">${state.city}, ${state.country.toUpperCase()}</p>` : ''}
            </div>
            
            ${state.loadingPrayerTimes ? `
                <div class="text-center mb-8">
                    <p class="text-teal-600">${trans.loadingPrayerTimes}</p>
                </div>
            ` : ''}
            
            ${state.currentDate ? `
                <div class="text-center mb-6 bg-white rounded-2xl shadow-lg p-4 border-2 border-teal-100">
                    <div class="flex items-center justify-center gap-3">
                        <span class="text-2xl">📅</span>
                        <div>
                            <p class="text-sm text-gray-600">${state.currentDate.hijri.weekday.ar} - ${state.currentDate.hijri.day} ${state.currentDate.hijri.month.ar} ${state.currentDate.hijri.year}</p>
                            <p class="text-lg font-bold text-teal-800">${state.currentDate.gregorian.weekday.en}, ${state.currentDate.gregorian.day} ${state.currentDate.gregorian.month.en} ${state.currentDate.gregorian.year}</p>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${Object.entries(PRAYERS).map(([key, prayer]) => {
                    const prayerTime = state.prayerTimes ? state.prayerTimes[prayer.apiKey] : null;
                    return `
                        <button onclick="selectPrayer('${key}')" class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-teal-100 hover:border-teal-300 hover:scale-105">
                            <div class="text-6xl mb-4">${prayer.icon}</div>
                            <h3 class="text-2xl font-bold text-teal-800 mb-2">${trans.prayers[key] || prayer.name}</h3>
                            <p class="text-teal-600">${prayer.rakaats} ${trans.rakaats}</p>
                            ${prayerTime ? `
                                <p class="text-xl font-bold text-teal-700 mt-2">${prayerTime}</p>
                            ` : ''}
                        </button>
                    `;
                }).join('')}
            </div>
            
            ${state.dailyHadith ? `
                <div class="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow p-4 border border-amber-200" dir="${state.dailyHadith.language === 'ara' || state.dailyHadith.language === 'urd' ? 'rtl' : 'ltr'}">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-lg">📖</span>
                                <h3 class="text-sm font-bold text-amber-900">${trans.hadithOfTheDay || 'Hadith du Jour'}</h3>
                            </div>
                            <div class="bg-white/80 rounded-lg p-3 mb-2">
                                <p class="text-sm text-gray-700 leading-relaxed ${state.dailyHadith.language === 'ara' || state.dailyHadith.language === 'urd' ? 'text-right font-arabic' : 'text-left'}">${state.dailyHadith.text}</p>
                            </div>
                            <div class="flex items-center justify-between text-xs text-amber-700">
                                <span class="font-medium">${state.dailyHadith.collection}</span>
                                <span>#${state.dailyHadith.number}</span>
                            </div>
                        </div>
                        <button onclick="refreshHadith()" class="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0 p-1" title="${trans.refresh || 'Rafraîchir'}">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            ` : state.loadingHadith ? `
                <div class="mt-8 bg-amber-50 rounded-xl shadow p-4 border border-amber-200 text-center">
                    <p class="text-sm text-amber-700 animate-pulse">📖 ${trans.loadingHadith || 'Chargement du hadith...'}</p>
                </div>
            ` : state.hadithError ? `
                <div class="mt-8 bg-red-50 rounded-xl shadow p-4 border border-red-200">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-red-700">⚠️ ${trans.hadithError || 'Erreur'}</p>
                        <button onclick="refreshHadith()" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs transition-colors">
                            ${trans.retry || 'Réessayer'}
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================================
// MUSLIM TOOLS SCREEN
// ============================================================================
function renderMuslimTools(app, trans, dirAttr, rtl) {
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goHome()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.muslimTools}</h1>
                <div class="w-24"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onclick="goToAblutions()" class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-teal-100 hover:border-teal-300 hover:scale-105">
                    <div class="text-6xl mb-4">💧</div>
                    <h3 class="text-2xl font-bold text-teal-800 mb-2">${trans.ablutions}</h3>
                    <p class="text-teal-600">${trans.guidedAblutions}</p>
                </button>
                <button onclick="goToCitadel()" class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-teal-100 hover:border-teal-300 hover:scale-105">
                    <div class="text-6xl mb-4">📖</div>
                    <h3 class="text-2xl font-bold text-teal-800 mb-2">${trans.citadel || 'La Citadelle'}</h3>
                    <p class="text-teal-600">${trans.citadelDesc || 'Invocations quotidiennes'}</p>
                </button>
                <button onclick="goToPillars()" class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-teal-100 hover:border-teal-300 hover:scale-105">
                    <div class="text-6xl mb-4">🏛️</div>
                    <h3 class="text-2xl font-bold text-teal-800 mb-2">${trans.pillars || 'Piliers de la Prière'}</h3>
                    <p class="text-teal-600">${trans.pillarsDesc || 'Les 14 piliers essentiels'}</p>
                </button>
                <button onclick="goToCoran()" class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-teal-100 hover:border-teal-300 hover:scale-105">
                    <div class="text-6xl mb-4">📗</div>
                    <h3 class="text-2xl font-bold text-teal-800 mb-2">${trans.coran || 'Le Coran'}</h3>
                    <p class="text-teal-600">${trans.coranDesc || 'Lecture et traduction'}</p>
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// ABLUTIONS SCREEN
// ============================================================================
function renderAblutions(app, trans, dirAttr, rtl) {
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goToMuslimTools()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.guidedAblutions}</h1>
                <div class="w-24"></div>
            </div>
            
            <p class="text-center text-gray-700 mb-8 text-lg">${trans.selectAblutionType}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${ABLUTION_TYPES.map(type => `
                    <button onclick="selectAblutionType('${type.id}')" class="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-8 border-2 border-teal-100 hover:border-teal-300 hover:scale-105">
                        <div class="text-6xl mb-4">${type.icon}</div>
                        <h3 class="text-xl font-bold text-teal-800 mb-2">${trans[type.nameKey] || type.name}</h3>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================================================
// ABLUTION GUIDANCE SCREEN
// ============================================================================
function renderAblutionGuidance(app, trans, dirAttr, rtl) {
    const steps = getAblutionSteps(state.selectedAblutionType, trans);
    const step = steps[state.currentAblutionStep];
    const isLastStep = state.currentAblutionStep === steps.length - 1;
    const progress = ((state.currentAblutionStep + 1) / steps.length) * 100;
    const ablutionType = ABLUTION_TYPES.find(t => t.id === state.selectedAblutionType);
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-6">
                <button onclick="goToAblutions()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-teal-800">${trans[ablutionType.nameKey]}</h1>
                    <p class="text-teal-600">${trans.step} ${state.currentAblutionStep + 1} ${trans.of} ${steps.length}</p>
                </div>
                <button onclick="goHome()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>🏠</span>
                </button>
            </div>
            
            <div class="mb-8">
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500 rounded-full" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <div class="bg-white rounded-3xl shadow-2xl p-12 mb-8 border-2 border-teal-100">
                <div class="flex justify-center items-center mb-8">
                    <div class="text-9xl">${step.icon}</div>
                </div>
                
                <div class="text-center space-y-4">
                    <h2 class="text-3xl font-bold text-teal-800">${step.name}</h2>
                    ${step.repetitions ? `<p class="text-xl text-teal-600 font-semibold">${step.repetitions} ${trans.times}</p>` : ''}
                    
                    <div class="bg-teal-50 rounded-2xl p-6 space-y-3">
                        <p class="text-lg text-gray-700 leading-relaxed">${step.description}</p>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="previousAblutionStep()" ${state.currentAblutionStep === 0 ? 'disabled' : ''} class="flex-1 bg-white text-teal-700 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-teal-200">
                    ${rtl ? '▶' : '◀'} ${trans.previous}
                </button>
                <button onclick="nextAblutionStep()" ${isLastStep ? 'disabled' : ''} class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    ${trans.next} ${rtl ? '◀' : '▶'}
                </button>
            </div>
            
            ${isLastStep ? `
                <div class="mt-6 bg-emerald-100 border-2 border-emerald-300 rounded-2xl p-6 text-center">
                    <p class="text-2xl font-bold text-emerald-800 mb-2">🎉 ${trans.ablutionComplete}</p>
                    <p class="text-emerald-700 mb-4">${trans.ablutionAccepted}</p>
                    <button onclick="goHome()" class="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-all">
                        ${trans.returnHome}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================================
// CITADEL SCREEN
// ============================================================================
function renderCitadel(app, trans, dirAttr, rtl) {
    const categories = getCitadelCategories();
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goToMuslimTools()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.citadel || 'La Citadelle'}</h1>
                <div class="w-24"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${categories.map(cat => `
                    <button onclick="selectCitadelCategory('${cat.id}', '${cat.file}')" class="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 border-2 border-teal-100 hover:border-teal-300 transition-all">
                        <div class="text-4xl mb-3">${cat.icon}</div>
                        <h3 class="text-lg font-bold text-teal-800">${trans[cat.nameKey] || cat.id}</h3>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================================================
// CITADEL DOUAS SCREEN
// ============================================================================
function renderCitadelDouas(app, trans, dirAttr, rtl) {
    if (state.loadingCitadel) {
        app.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 text-center">
                <div class="text-6xl mb-4 animate-pulse">📖</div>
                <p class="text-xl text-teal-600">${trans.loading || 'Chargement...'}</p>
            </div>
        `;
        return;
    }
    
    if (!state.citadelDouas || state.citadelDouas.length === 0) {
        app.innerHTML = `
            <div class="max-w-4xl mx-auto p-6">
                <button onclick="goToCitadel()" class="mb-4 bg-white rounded-xl shadow-lg px-4 py-2">
                    ${rtl ? '◀' : '▶'} ${trans.back || 'Retour'}
                </button>
                <p class="text-center text-gray-600">${trans.noData || 'Aucune donnée disponible'}</p>
            </div>
        `;
        return;
    }
    
    const currentDoua = state.citadelDouas[state.currentDouaIndex];
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex justify-between mb-4">
                <button onclick="goToCitadel()" class="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <div class="bg-white rounded-xl shadow-lg px-4 py-2">
                    ${state.currentDouaIndex + 1} / ${state.citadelDouas.length}
                </div>
            </div>
            
            <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-teal-100 mb-6">
              ${currentDoua.situation ? `
    <h3 class="text-xl font-bold text-teal-800 mb-4">${currentDoua.situation[state.language] || currentDoua.situation.fr || currentDoua.situation.ar || 'Invocation'}</h3>
` : ''}

${currentDoua.doua && currentDoua.doua.ar ? `
    <div class="bg-amber-50 rounded-xl p-6 mb-4" dir="rtl">
        <p class="text-2xl text-gray-800 leading-relaxed text-right font-arabic">${currentDoua.doua.ar}</p>
    </div>
` : ''}

${currentDoua.transliteration ? `
    <div class="bg-blue-50 rounded-xl p-4 mb-4">
        <p class="text-sm text-gray-700 italic">${currentDoua.transliteration}</p>
    </div>
` : ''}

${currentDoua.doua ? `
    <div class="bg-gray-50 rounded-xl p-4">
        <p class="text-gray-800">${currentDoua.doua[state.language] || currentDoua.doua.fr || currentDoua.doua.ar || ''}</p>
    </div>
` : ''}   
            </div>
            
            <div class="flex gap-4">
                <button onclick="previousDoua()" 
                    ${state.currentDouaIndex === 0 ? 'disabled' : ''} 
                    class="flex-1 bg-white rounded-xl shadow-lg py-4 font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                </button>
                <button onclick="nextDoua()" 
                    ${state.currentDouaIndex === state.citadelDouas.length - 1 ? 'disabled' : ''} 
                    class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-lg py-4 font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    ${trans.next || 'Suivant'} ${rtl ? '◀' : '▶'}
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// PILLARS SCREEN
// ============================================================================
function renderPillars(app, trans, dirAttr, rtl) {
    const pillars = getPillars();
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goToMuslimTools()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.pillars || 'Les 14 Piliers'}</h1>
                <div class="w-24"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${pillars.map(pillar => `
                    <button onclick="selectPillar('${pillar.id}')" class="bg-white rounded-xl shadow-lg hover:shadow-xl p-6 border-2 border-teal-100 hover:border-teal-300 transition-all text-left">
                        <div class="flex items-start gap-4">
                            <div class="text-4xl flex-shrink-0">${getPillarIcon(pillar.id)}</div>
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm font-bold">${pillar.order}</span>
                                    <h3 class="text-lg font-bold text-teal-800">${getPillarLabel(pillar, state.language)}</h3>
                                </div>
                                <p class="text-sm text-gray-600 line-clamp-2">${getPillarDescription(pillar, state.language)}</p>
                            </div>
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================================================
// PILLAR DETAIL SCREEN
// ============================================================================
function renderPillarDetail(app, trans, dirAttr, rtl) {
    const pillar = getPillarById(state.selectedPillar);
    if (!pillar) {
        app.innerHTML = '<div>Error: Pillar not found</div>';
        return;
    }
    
    const pillars = getPillars();
    const canGoBack = pillar.order > 1;
    const canGoForward = pillar.order < pillars.length;
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-6">
                <button onclick="goToPillars()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-teal-800">${trans.pillar || 'Pilier'} ${pillar.order}</h1>
                </div>
                <button onclick="goHome()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>🏠</span>
                </button>
            </div>
            
            <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-teal-100 mb-6">
                <div class="text-center mb-6">
                    <div class="text-6xl mb-4">${getPillarIcon(pillar.id)}</div>
                    <h2 class="text-3xl font-bold text-teal-800 mb-2">${getPillarLabel(pillar, state.language)}</h2>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <h3 class="text-xl font-bold text-teal-700 mb-3">📖 ${trans.description || 'Description'}</h3>
                        <p class="text-gray-700 leading-relaxed">${getPillarDescription(pillar, state.language)}</p>
                    </div>
                    
                    <div>
                        <h3 class="text-xl font-bold text-teal-700 mb-3">✨ ${trans.howTo || 'Comment faire'}</h3>
                        <p class="text-gray-700 leading-relaxed">${getPillarHowTo(pillar, state.language)}</p>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="navigatePillar(-1)" 
                    ${!canGoBack ? 'disabled' : ''} 
                    class="flex-1 bg-white rounded-xl shadow-lg py-4 font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-teal-200">
                    ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                </button>
                <button onclick="navigatePillar(1)" 
                    ${!canGoForward ? 'disabled' : ''} 
                    class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-lg py-4 font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    ${trans.next || 'Suivant'} ${rtl ? '◀' : '▶'}
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// CORAN SURAHS LIST SCREEN
// ============================================================================
function renderCoranSurahs(app, trans, dirAttr, rtl) {
    if (state.loadingCoran) {
        app.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 text-center">
                <div class="text-6xl mb-4 animate-pulse">📗</div>
                <p class="text-xl text-teal-600">${trans.loading || 'Chargement...'}</p>
            </div>
        `;
        return;
    }
    
    const surahs = getSurahsList();
    if (!surahs) {
        app.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 text-center">
                <p class="text-gray-600">${trans.errorLoading || 'Erreur de chargement'}</p>
                <button onclick="goToCoran()" class="mt-4 bg-teal-500 text-white px-6 py-2 rounded-xl">
                    ${trans.retry || 'Réessayer'}
                </button>
            </div>
        `;
        return;
    }
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goToMuslimTools()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.coran || 'Le Coran'}</h1>
                <div class="w-24"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${surahs.map(surah => `
                    <button onclick="selectSurah(${surah.number})" class="bg-white rounded-xl shadow-lg hover:shadow-xl p-4 border-2 border-teal-100 hover:border-teal-300 transition-all text-left">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-800 font-bold flex-shrink-0">
                                ${surah.number}
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-teal-800">${formatSurahName(surah, state.language)}</h3>
                                <p class="text-sm text-gray-600">${surah.numberOfAyahs} ${trans.verses || 'versets'} • ${getRevelationType(surah.revelationType, trans)}</p>
                            </div>
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

// ============================================================================
// CORAN READER SCREEN
// ============================================================================
function renderCoranReader(app, trans, dirAttr, rtl) {
    if (state.loadingCoran) {
        app.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 text-center">
                <div class="text-6xl mb-4 animate-pulse">📗</div>
                <p class="text-xl text-teal-600">${trans.loading || 'Chargement...'}</p>
            </div>
        `;
        return;
    }
    
    const surahData = getCurrentSurahData();
    if (!surahData) {
        app.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 text-center">
                <p class="text-gray-600">${trans.errorLoading || 'Erreur de chargement'}</p>
                <button onclick="goToCoranSurahs()" class="mt-4 bg-teal-500 text-white px-6 py-2 rounded-xl">
                    ${trans.back || 'Retour'}
                </button>
            </div>
        `;
        return;
    }
    
    const arabicAyah = surahData.arabic.ayahs[state.currentAyahIndex];
    const translationAyah = surahData.translation.ayahs[state.currentAyahIndex];
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex justify-between mb-4">
                <button onclick="goToCoranSurahs()" class="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <div class="bg-white rounded-xl shadow-lg px-4 py-2">
                    ${trans.verse || 'Verset'} ${state.currentAyahIndex + 1} / ${surahData.arabic.numberOfAyahs}
                </div>
            </div>
            
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-teal-800 mb-1">${formatSurahName(surahData.arabic, state.language)}</h2>
                <p class="text-gray-600">${surahData.arabic.numberOfAyahs} ${trans.verses || 'versets'} • ${getRevelationType(surahData.arabic.revelationType, trans)}</p>
            </div>
            
            ${state.currentAyahIndex === 0 && surahData.arabic.number !== 1 && surahData.arabic.number !== 9 ? `
                <div class="bg-amber-50 rounded-2xl p-6 mb-6 border-2 border-amber-200" dir="rtl">
                    <p class="text-3xl text-center text-gray-800 font-arabic">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                </div>
            ` : ''}
            
            <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-teal-100 mb-6">
                <div class="mb-6" dir="rtl">
                    <p class="text-3xl text-gray-800 leading-loose text-right font-arabic">${arabicAyah.text}</p>
                </div>
                
                <div class="pt-6 border-t-2 border-gray-200">
                    <p class="text-lg text-gray-700 leading-relaxed">${translationAyah.text}</p>
                </div>
                
                <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
                    <span>${surahData.arabic.englishName} ${arabicAyah.numberInSurah}</span>
                    <span>${trans.page || 'Page'} ${arabicAyah.page || '-'}</span>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button onclick="previousAyah()" 
                    ${state.currentAyahIndex === 0 ? 'disabled' : ''} 
                    class="flex-1 bg-white rounded-xl shadow-lg py-4 font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-teal-200">
                    ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                </button>
                <button onclick="nextAyah()" 
                    ${state.currentAyahIndex === surahData.arabic.numberOfAyahs - 1 ? 'disabled' : ''} 
                    class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl shadow-lg py-4 font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    ${trans.next || 'Suivant'} ${rtl ? '◀' : '▶'}
                </button>
            </div>
        </div>
    `;
}

// ============================================================================
// SETTINGS SCREEN
// ============================================================================
function renderSettings(app, trans, dirAttr, rtl) {
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goHome()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.settings}</h1>
                <div class="w-24"></div>
            </div>
            
            <div class="space-y-6">
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-teal-100">
                    <h3 class="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                        <span>📍</span>
                        <span>${trans.location}</span>
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">${trans.city}</label>
                            <input 
                                type="text" 
                                id="cityInput" 
                                placeholder="${trans.cityPlaceholder}"
                                value="${state.city}"
                                onchange="updateCity(this.value)"
                                class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg"
                            />
                            <p class="text-sm text-gray-600 mt-1">${trans.enterCity}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">${trans.country}</label>
                            <input 
                                type="text" 
                                id="countryInput" 
                                placeholder="${trans.countryPlaceholder}"
                                value="${state.country}"
                                onchange="updateCountry(this.value)"
                                maxlength="2"
                                class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg uppercase"
                            />
                            <p class="text-sm text-gray-600 mt-1">${trans.enterCountry}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-teal-100">
                    <h3 class="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                        <span>🧮</span>
                        <span>${trans.selectCalculationMethod}</span>
                    </h3>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${CALCULATION_METHODS.map(method => `
                            <button onclick="selectCalculationMethod(${method.id})" class="w-full p-3 rounded-xl border-2 transition-all text-left ${state.calculationMethod === method.id ? 'bg-teal-100 border-teal-500' : 'bg-gray-50 border-gray-200 hover:border-teal-300'}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <span class="text-lg">${method.regions}</span>
                                        <div>
                                            <p class="font-bold text-gray-800 text-sm">${trans.calculationMethods?.[method.id] || method.name}</p>
                                            <p class="text-xs text-gray-600">${rtl ? trans.calculationMethods?.[method.id] : method.nameAr}</p>
                                        </div>
                                    </div>
                                    ${state.calculationMethod === method.id ? '<span class="text-xl">✓</span>' : ''}
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-teal-100">
                    <h3 class="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                        <span>🎙️</span>
                        <span>${trans.selectReciter}</span>
                    </h3>
                    <div class="space-y-3">
                        ${RECITERS.map(reciter => `
                            <button onclick="selectReciter('${reciter.id}')" class="w-full p-4 rounded-xl border-2 transition-all ${state.selectedReciter === reciter.id ? 'bg-teal-100 border-teal-500' : 'bg-gray-50 border-gray-200 hover:border-teal-300'}">
                                <div class="flex items-center justify-between">
                                    <div class="text-left">
                                        <p class="font-bold text-gray-800">${reciter.name}</p>
                                        <p class="text-sm text-gray-600">${reciter.arabicName}</p>
                                    </div>
                                    ${state.selectedReciter === reciter.id ? '<span class="text-2xl">✓</span>' : ''}
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-teal-100">
                    <h3 class="text-xl font-bold text-teal-800 mb-4 flex items-center gap-2">
                        <span>👤</span>
                        <span>${trans.selectAvatar}</span>
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="selectAvatar('boy')" class="p-6 rounded-xl border-2 transition-all ${state.avatarGender === 'boy' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}">
                            <div class="flex flex-col items-center gap-3">
                                <img src="assets/images/position-debout-main-coeur.png" class="h-32 object-contain">
                                <p class="font-bold text-gray-800">${trans.boy}</p>
                                ${state.avatarGender === 'boy' ? '<span class="text-2xl">✓</span>' : ''}
                            </div>
                        </button>
                        <button onclick="selectAvatar('girl')" class="p-6 rounded-xl border-2 transition-all ${state.avatarGender === 'girl' ? 'bg-pink-100 border-pink-500' : 'bg-gray-50 border-gray-200 hover:border-pink-300'}">
                            <div class="flex flex-col items-center gap-3">
                                <img src="assets/images/position-debout-main-coeur-girl.png" class="h-32 object-contain">
                                <p class="font-bold text-gray-800">${trans.girl}</p>
                                ${state.avatarGender === 'girl' ? '<span class="text-2xl">✓</span>' : ''}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border-2 border-emerald-200 mt-6">
                <h3 class="text-xl font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <span>💚</span>
                    <span>${trans.donations}</span>
                </h3>
                <p class="text-gray-700 mb-4 text-sm leading-relaxed">${trans.donationsMessage}</p>
                <a href="https://www.paypal.com/paypalme/MDRIOUECH" target="_blank" rel="noopener noreferrer" class="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all">
                    💝 ${trans.supportProject}
                </a>
            </div>
            
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200 mt-6">
                <h3 class="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <span>📂</span>
                    <span>${trans.openSource}</span>
                </h3>
                <p class="text-gray-700 mb-3 text-sm leading-relaxed">${trans.openSourceMessage}</p>
                <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
                    <p class="text-amber-900 text-sm font-medium">${trans.openSourceWarning}</p>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <a href="https://github.com/MehdyDriouech/MyPocketImam/" target="_blank" rel="noopener noreferrer" class="flex-1 bg-gray-800 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-900 transition-all text-center flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        ${trans.viewOnGithub}
                    </a>
                    <button onclick="downloadSourceCode()" class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2">
                        <span>⬇️</span>
                        ${trans.downloadCode}
                    </button>
                </div>
            </div>
            
            <button onclick="saveSettingsAndReturn()" class="w-full mt-8 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xl font-bold py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                ${trans.saveSettings}
            </button>
        </div>
    `;
}

// ============================================================================
// CONFIG SCREEN
// ============================================================================
function renderConfig(app, trans, dirAttr, rtl) {
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-8">
                <button onclick="goHome()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>${rtl ? '◀' : '▶'} ${trans.back}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.configuration} ${trans.prayers[state.selectedPrayer] || PRAYERS[state.selectedPrayer].name}</h1>
                <div class="w-24"></div>
            </div>
            
            <div class="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-lg p-6 mb-8 text-white">
                <div class="flex items-center gap-3">
                    <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    <div>
                        <p class="text-sm opacity-90">${trans.reciter}</p>
                        <p class="text-xl font-bold">${RECITERS.find(r => r.id === state.selectedReciter).name}</p>
                    </div>
                </div>
            </div>
            
            <div class="space-y-6 mb-8">
                ${state.rakaatConfig.map((config, index) => `
                    <div class="bg-white rounded-2xl shadow-lg p-6 border-2 border-teal-100">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="bg-teal-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">${config.rakaat}</div>
                            <h3 class="text-xl font-bold text-teal-800">${trans.rakaat} ${config.rakaat}</h3>
                        </div>
                        <div class="mb-4 p-4 bg-teal-50 rounded-xl border-2 border-teal-200">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-bold text-teal-800">${trans.mandatorySurah}</p>
                                    <p class="text-sm text-teal-600 ${rtl ? 'text-left' : 'text-right'}">${SURAHS[0].arabic}</p>
                                </div>
                            </div>
                        </div>
                        ${config.rakaat <= 2 ? `
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">${trans.secondarySurah}</label>
                                <select onchange="updateSurah(${index}, this.value)" class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none">
                                    ${SURAHS.filter(s => !s.mandatory).map(surah => `
                                        <option value="${surah.id}" ${config.secondarySurah.id === surah.id ? 'selected' : ''}>
                                            ${trans.surahs?.[surah.id] || surah.name} - ${surah.arabic} (${surah.number})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        ` : `
                            <div class="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                <p class="text-sm text-gray-600 italic">
                                    ℹ️ ${trans.infoRakaat34}
                                </p>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
            
            <button onclick="startGuidance()" class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xl font-bold py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                ▶ ${trans.startGuidance}
            </button>
        </div>
    `;
}

// ============================================================================
// GUIDANCE SCREEN
// ============================================================================
function renderGuidance(app, trans, dirAttr, rtl) {
    const steps = getCurrentSteps(trans);
    const step = steps[state.currentStepIndex];
    const isLastStep = state.currentRakaat === PRAYERS[state.selectedPrayer].rakaats && state.currentStepIndex === steps.length - 1;
    const audioFile = getCurrentAudioFile();
    const totalSteps = PRAYERS[state.selectedPrayer].rakaats * getPrayerSteps(trans).length + getFinalSteps(trans).length;
    const currentAbsoluteStep = (state.currentRakaat - 1) * getPrayerSteps(trans).length + state.currentStepIndex + 1;
    const progress = (currentAbsoluteStep / totalSteps) * 100;
    const positionImage = getPositionImage(step.id, state.avatarGender);
    
    app.innerHTML = `
        <div class="max-w-4xl mx-auto p-6" dir="${dirAttr}">
            <div class="flex items-center justify-between mb-6">
                <button onclick="goToConfig()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>⚙️ ${trans.config}</span>
                </button>
                <div class="text-center">
                    <h1 class="text-2xl font-bold text-teal-800">${trans.prayers[state.selectedPrayer] || PRAYERS[state.selectedPrayer].name}</h1>
                    <p class="text-teal-600">${trans.rakaat} ${state.currentRakaat}/${PRAYERS[state.selectedPrayer].rakaats}</p>
                </div>
                <button onclick="goHome()" class="flex items-center gap-2 text-teal-700 hover:text-teal-900">
                    <span>🏠</span>
                </button>
            </div>
            
            <div class="mb-6 bg-white rounded-2xl shadow-lg p-4 border-2 border-teal-100">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">🎬</span>
                        <div>
                            <p class="font-bold text-teal-800">${trans.scenarioMode}</p>
                            <p class="text-sm text-gray-600">${trans.automaticFlow}</p>
                        </div>
                    </div>
                    <button onclick="toggleScenario()" class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${state.scenarioMode ? 'bg-teal-500' : 'bg-gray-300'}">
                        <span class="inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${state.scenarioMode ? 'translate-x-7' : 'translate-x-1'}"></span>
                    </button>
                </div>
                ${state.scenarioMode ? `
                    <div class="mt-3 p-3 bg-teal-50 rounded-xl">
                        <p class="text-sm text-teal-700">🎬 ${trans.automaticActive}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="mb-8">
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500 rounded-full" style="width: ${progress}%"></div>
                </div>
            </div>
            
            <div class="bg-white rounded-3xl shadow-2xl p-12 mb-8 border-2 border-teal-100">
                <div class="flex justify-center items-center mb-8">
                    <img src="${positionImage}" alt="${step.name}" class="prayer-image">
                </div>
                
                <div class="text-center space-y-4">
                    <h2 class="text-3xl font-bold text-teal-800">${step.name}</h2>
                    <p class="text-lg text-gray-600 italic">${step.action}</p>
                    
                    <div class="bg-teal-50 rounded-2xl p-6 space-y-3">
                        <p class="text-4xl font-arabic leading-loose">${step.arabic}</p>
                        <p class="text-xl text-teal-700 font-medium">${step.transliteration}</p>
                        <p class="text-lg text-gray-700">${step.translation}</p>
                    </div>
                    
                    ${audioFile ? `
                        <div class="space-y-2">
                            ${!state.scenarioMode ? `
                                <button onclick="toggleAudio()" class="bg-teal-500 text-white px-8 py-4 rounded-full font-medium hover:bg-teal-600 transition-all flex items-center gap-3 mx-auto shadow-lg">
                                    <span>${state.isPlaying ? '⏸️' : '🔊'}</span>
                                    ${state.isPlaying ? trans.pause : trans.listenRecitation}
                                </button>
                            ` : `
                                <div class="flex items-center justify-center gap-2 text-teal-600">
                                    <span class="animate-pulse">🔊</span>
                                    <span class="text-sm font-medium">${state.isPlaying ? trans.playing : trans.waiting}</span>
                                </div>
                            `}
                            
                            ${!state.scenarioMode && step.hasOptions && step.audioFiles && step.audioFiles.length > 1 ? `
                                <div class="flex items-center justify-center gap-2">
                                    <button onclick="changeVariant(-1)" class="text-teal-600 hover:text-teal-800 px-3 py-1 rounded">${rtl ? '►' : '◄'}</button>
                                    <span class="text-sm text-teal-600">${trans.variant} ${state.audioOption + 1}/${step.audioFiles.length}</span>
                                    <button onclick="changeVariant(1)" class="text-teal-600 hover:text-teal-800 px-3 py-1 rounded">${rtl ? '◄' : '►'}</button>
                                </div>
                            ` : ''}
                            
                            <p class="text-sm text-teal-600">${trans.reciter}: ${RECITERS.find(r => r.id === state.selectedReciter).name}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            ${!state.scenarioMode ? `
                <div class="flex gap-4">
                    <button onclick="previousStep()" ${state.currentRakaat === 1 && state.currentStepIndex === 0 ? 'disabled' : ''} class="flex-1 bg-white text-teal-700 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-teal-200">
                        ${rtl ? '►' : '◄'} ${trans.previous}
                    </button>
                    <button onclick="nextStep()" ${isLastStep ? 'disabled' : ''} class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        ${trans.next} ${rtl ? '◄' : '►'}
                    </button>
                </div>
            ` : ''}
            
            ${isLastStep ? `
                <div class="mt-6 bg-emerald-100 border-2 border-emerald-300 rounded-2xl p-6 text-center">
                    <p class="text-2xl font-bold text-emerald-800 mb-2">🎉 ${trans.prayerComplete}</p>
                    <p class="text-emerald-700">${trans.prayerAccepted}</p>
                    <button onclick="goHome()" class="mt-4 bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-all">
                        ${trans.returnHome}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}
