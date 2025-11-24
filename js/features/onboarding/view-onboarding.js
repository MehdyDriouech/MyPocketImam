export class OnboardingView {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.engine = dependencies.engine;
    this.pluginManager = dependencies.pluginManager;
    
    // Subscribe to state changes to re-render modal
    this.state.subscribe((key, value) => {
        if (key === 'showOnboarding' || key === 'onboardingStep' || (this.state.get('showOnboarding') && key === 'city') || (this.state.get('showOnboarding') && key === 'country')) {
            this.render();
        }
    });
  }
  
  get translations() {
      return this.pluginManager.get('translations').engine;
  }
  
  // This render is special, it injects/removes from body
  render(container) { // Container is ignored here, we use a fixed modal container
    const showOnboarding = this.state.get('showOnboarding');
    
    let modalContainer = document.getElementById('onboarding-modal-container');
    
    if (!showOnboarding) {
        if (modalContainer) modalContainer.remove();
        return;
    }
    
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'onboarding-modal-container';
        document.body.appendChild(modalContainer);
    }
    
    modalContainer.innerHTML = this.generateModalHTML();
    this.attachEventListeners(modalContainer);
  }
  
  generateModalHTML() {
    const trans = this.translations.getAll();
    const dirAttr = this.translations.isRTL() ? 'rtl' : 'ltr';
    const rtl = this.translations.isRTL();
    const currentStepNum = this.state.get('onboardingStep');
    
    const steps = [
        {
            icon: '🕌',
            title: trans.onboardingWelcome || 'Bienvenue sur My Pocket Imam',
            description: trans.onboardingWelcomeDesc || 'Votre compagnon pour apprendre et pratiquer la prière islamique.',
            features: [
                { icon: '📿', text: trans.onboardingFeature1 || 'Guidance pas à pas' },
                { icon: '🎙️', text: trans.onboardingFeature2 || 'Récitations audio' },
                { icon: '💧', text: trans.onboardingFeature3 || 'Guide des ablutions' },
                { icon: '📖', text: trans.onboardingFeature4 || 'La Citadelle du Musulman' }
            ]
        },
        {
            icon: '🔔',
            title: trans.onboardingPrayerTimes || 'Horaires de prière',
            description: trans.onboardingPrayerTimesDesc || 'Pour afficher les horaires de prière précis.',
            warning: trans.onboardingPrayerTimesWarning || '⚠️ Sans ces informations, les horaires ne seront pas disponibles.',
            info: trans.onboardingPrayerTimesInfo || 'Configurable plus tard dans les paramètres.'
        },
        {
            icon: '📍',
            title: trans.onboardingLocation || 'Localisation',
            description: trans.onboardingLocationDesc || 'Entrez votre ville et code pays.',
            showForm: true
        }
    ];
    
    const currentStep = steps[currentStepNum - 1];
    const isLastStep = currentStepNum === steps.length;
    const progress = (currentStepNum / steps.length) * 100;
    
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
                            <div class="h-2 w-12 rounded-full ${idx < currentStepNum ? 'bg-teal-500' : 'bg-gray-200'} transition-all"></div>
                        `).join('')}
                    </div>
                    
                    <!-- Icon -->
                    <div class="text-center mb-6">
                        <div class="text-7xl mb-4">${currentStep.icon}</div>
                        <h2 class="text-3xl font-bold text-teal-800 mb-3">${currentStep.title}</h2>
                        <p class="text-lg text-gray-600">${currentStep.description}</p>
                    </div>
                    
                    <!-- Step 1: Features list -->
                    ${currentStepNum === 1 ? `
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
                    ${currentStepNum === 2 ? `
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
                    ${currentStepNum === 3 ? `
                        <div class="space-y-6 mb-8">
                            <div class="bg-white border-2 border-teal-200 rounded-xl p-6">
                                <label class="block text-sm font-bold text-teal-800 mb-3">
                                    📍 ${trans.city || 'Ville'}
                                </label>
                                <input 
                                    type="text" 
                                    data-input="city"
                                    placeholder="${trans.cityPlaceholder || 'Ex: Paris'}"
                                    value="${this.state.get('city') || ''}"
                                    class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg"
                                />
                            </div>
                            
                            <div class="bg-white border-2 border-teal-200 rounded-xl p-6">
                                <label class="block text-sm font-bold text-teal-800 mb-3">
                                    🌍 ${trans.country || 'Code pays (2 lettres)'}
                                </label>
                                <input 
                                    type="text" 
                                    data-input="country"
                                    placeholder="${trans.countryPlaceholder || 'Ex: FR'}"
                                    value="${this.state.get('country') || ''}"
                                    maxlength="2"
                                    class="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none text-lg uppercase"
                                />
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Navigation buttons -->
                    <div class="flex gap-4">
                        ${currentStepNum > 1 ? `
                            <button data-action="prev-step" class="flex-1 bg-white text-teal-700 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 border-teal-200">
                                ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                            </button>
                        ` : ''}
                        
                        <button data-action="next-step" class="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all">
                            ${isLastStep ? (trans.start || 'Commencer') + ' ✨' : (trans.next || 'Suivant') + (rtl ? ' ◀' : ' ▶')}
                        </button>
                    </div>
                    
                    ${!isLastStep ? `
                        <button data-action="skip" class="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm py-2">
                            ${trans.skip || 'Passer'} →
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        <style>@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }</style>
    `;
  }
  
  attachEventListeners(container) {
    container.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        switch(action) {
            case 'next-step':
                this.engine.nextStep();
                break;
            case 'prev-step':
                this.engine.previousStep();
                break;
            case 'skip':
                this.engine.skipOnboarding();
                break;
        }
    });

    const cityInput = container.querySelector('input[data-input="city"]');
    const countryInput = container.querySelector('input[data-input="country"]');
    
    if (cityInput) {
        cityInput.addEventListener('change', (e) => {
            this.engine.updateLocation(e.target.value, this.state.get('country'));
        });
    }
    if (countryInput) {
        countryInput.addEventListener('change', (e) => {
            this.engine.updateLocation(this.state.get('city'), e.target.value);
        });
    }
  }
}

