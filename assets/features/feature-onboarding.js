// feature-onboarding.js - Onboarding Modal

import { state } from './feature-state.js';
import { t, getDirectionAttr, isRTL } from './feature-translations.js';

const ONBOARDING_KEY = 'prayerAppOnboardingCompleted';

export function hasCompletedOnboarding() {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    state.showOnboarding = false;
    state.onboardingStep = 1;
}

export function initOnboarding() {
    if (!hasCompletedOnboarding()) {
        state.showOnboarding = true;
        state.onboardingStep = 1;
    }
}

export function renderOnboardingModal() {
    if (!state.showOnboarding) return '';
    
    const trans = t();
    const dirAttr = getDirectionAttr();
    const rtl = isRTL();
    
    const steps = [
        {
            icon: '🕌',
            title: trans.onboardingWelcome || 'Bienvenue sur My Pocket Imam',
            description: trans.onboardingWelcomeDesc || 'Votre compagnon pour apprendre et pratiquer la prière islamique avec guidance audio et visuelle.',
            features: [
                { icon: '📿', text: trans.onboardingFeature1 || 'Guidance pas à pas pour chaque prière' },
                { icon: '🎙️', text: trans.onboardingFeature2 || 'Récitations audio de plusieurs récitateurs' },
                { icon: '💧', text: trans.onboardingFeature3 || 'Guide des ablutions (Wudu, Ghusl, Tayammum)' },
                { icon: '📖', text: trans.onboardingFeature4 || 'La Citadelle du Musulman - Invocations quotidiennes' }
            ]
        },
        {
            icon: '🔔',
            title: trans.onboardingPrayerTimes || 'Horaires de prière',
            description: trans.onboardingPrayerTimesDesc || 'Pour afficher les horaires de prière précis pour votre localisation, nous avons besoin de quelques informations.',
            warning: trans.onboardingPrayerTimesWarning || '⚠️ Sans ces informations, les horaires de prière ne seront pas disponibles.',
            info: trans.onboardingPrayerTimesInfo || 'Vous pourrez toujours configurer cela plus tard dans les paramètres.'
        },
        {
            icon: '📍',
            title: trans.onboardingLocation || 'Configuration de la localisation',
            description: trans.onboardingLocationDesc || 'Entrez votre ville et code pays pour obtenir les horaires précis.',
            showForm: true
        }
    ];
    
    const currentStep = steps[state.onboardingStep - 1];
    const isLastStep = state.onboardingStep === steps.length;
    const progress = (state.onboardingStep / steps.length) * 100;
    
    return `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn" style="animation: fadeIn 0.3s ease-in-out;">
            <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="${dirAttr}">
                <!-- Progress bar -->
                <div class="sticky top-0 bg-white rounded-t-3xl z-10">
                    <div class="h-2 bg-gray-200 rounded-t-3xl overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-8 md:p-12">
                    <!-- Step indicator -->
                    <div class="flex justify-center gap-2 mb-6">
                        ${steps.map((_, idx) => `
                            <div class="h-2 w-12 rounded-full ${idx < state.onboardingStep ? 'bg-teal-500' : 'bg-gray-200'} transition-all"></div>
                        `).join('')}
                    </div>
                    
                    <!-- Icon -->
                    <div class="text-center mb-6">
                        <div class="text-7xl mb-4">${currentStep.icon}</div>
                        <h2 class="text-3xl font-bold text-teal-800 mb-3">${currentStep.title}</h2>
                        <p class="text-lg text-gray-600">${currentStep.description}</p>
                    </div>
                    
                    <!-- Step 1: Features list -->
                    ${state.onboardingStep === 1 ? `
                        <div class="space-y-4 mb-8">
                            ${currentStep.features.map(feature => `
                                <div class="flex items-start gap-4 p-4 bg-teal-50 rounded-xl border-2 border-teal-100">
                                    <span class="text-3xl flex-shrink-0">${feature.icon}</span>
                                    <p class="text-gray-700 font-medium pt-1">${feature.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Step 2: Prayer times warning -->
                    ${state.onboardingStep === 2 ? `
                        <div class="space-y-4 mb-8">
                            <div class="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                                <p class="text-amber-900 font-medium text-center">${currentStep.warning}</p>
                            </div>
                            <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <div class="flex items-start gap-3">
                                    <span class="text-2xl">ℹ️</span>
                                    <p class="text-blue-900">${currentStep.info}</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Step 3: Location form -->
                    ${state.onboardingStep === 3 && currentStep.showForm ? `
                        <div class="space-y-6 mb-8">
                            <div class="bg-white border-2 border-teal-200 rounded-xl p-6">
                                <label class="block text-sm font-bold text-teal-800 mb-3">
                                    📍 ${trans.city || 'Ville'}
                                </label>
                                <input 
                                    type="text" 
                                    id="onboardingCityInput" 
                                    placeholder="${trans.cityPlaceholder || 'Ex: Paris'}"
                                    value="${state.city}"
                                    class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg"
                                />
                                <p class="text-sm text-gray-600 mt-2">${trans.enterCity || 'Entrez le nom de votre ville'}</p>
                            </div>
                            
                            <div class="bg-white border-2 border-teal-200 rounded-xl p-6">
                                <label class="block text-sm font-bold text-teal-800 mb-3">
                                    🌍 ${trans.country || 'Code pays (2 lettres)'}
                                </label>
                                <input 
                                    type="text" 
                                    id="onboardingCountryInput" 
                                    placeholder="${trans.countryPlaceholder || 'Ex: FR'}"
                                    value="${state.country}"
                                    maxlength="2"
                                    class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg uppercase"
                                />
                                <p class="text-sm text-gray-600 mt-2">${trans.enterCountry || 'Code ISO à 2 lettres (FR, US, MA, etc.)'}</p>
                            </div>
                            
                            <div class="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                                <p class="text-sm text-emerald-800 text-center">
                                    💡 ${trans.onboardingOptional || 'Ces informations sont optionnelles. Vous pouvez les configurer plus tard dans les paramètres.'}
                                </p>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Navigation buttons -->
                    <div class="flex gap-4">
                        ${state.onboardingStep > 1 ? `
                            <button onclick="previousOnboardingStep()" class="flex-1 bg-white text-teal-700 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-teal-200">
                                ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                            </button>
                        ` : ''}
                        
                        <button onclick="${isLastStep ? 'completeOnboardingFlow()' : 'nextOnboardingStep()'}" class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all">
                            ${isLastStep ? (trans.start || 'Commencer') + ' ✨' : (trans.next || 'Suivant') + (rtl ? ' ◀' : ' ▶')}
                        </button>
                    </div>
                    
                    ${!isLastStep ? `
                        <button onclick="skipOnboarding()" class="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm py-2">
                            ${trans.skip || 'Passer'} →
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        </style>
    `;
}
