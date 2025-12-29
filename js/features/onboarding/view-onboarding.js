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
    
    // Vérification de sécurité si onboardingStep n'est pas encore défini
    const stepIndex = (currentStepNum || 1) - 1;
    const currentStep = steps[stepIndex] || steps[0];
    const isLastStep = (currentStepNum || 1) === steps.length;
    const progress = ((currentStepNum || 1) / steps.length) * 100;
    
    return `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            animation: fadeIn 0.3s ease-in-out;
        ">
            <div style="
                background: white;
                border-radius: 1.5rem;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
            " dir="${dirAttr}">
                <!-- Progress bar -->
                <div style="position: sticky; top: 0; background: white; border-radius: 1.5rem 1.5rem 0 0; z-index: 10;">
                    <div style="height: 6px; background: #e5e7eb; border-radius: 1.5rem 1.5rem 0 0; overflow: hidden;">
                        <div style="height: 100%; background: linear-gradient(to right, #14b8a6, #10b981); transition: width 0.5s; width: ${progress}%;"></div>
                    </div>
                </div>
                
                <!-- Content -->
                <div style="padding: 2rem;">
                    <!-- Step indicator -->
                    <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                        ${steps.map((_, idx) => `
                            <div style="height: 6px; width: 3rem; border-radius: 9999px; background: ${idx < (currentStepNum || 1) ? '#14b8a6' : '#e5e7eb'}; transition: background 0.3s;"></div>
                        `).join('')}
                    </div>
                    
                    <!-- Icon -->
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">${currentStep.icon}</div>
                        <h2 style="font-size: 1.75rem; font-weight: 700; color: #115e59; margin-bottom: 0.75rem;">${currentStep.title}</h2>
                        <p style="font-size: 1.1rem; color: #6b7280;">${currentStep.description}</p>
                    </div>
                    
                    <!-- Step 1: Features list -->
                    ${(currentStepNum || 1) === 1 ? `
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                            ${currentStep.features.map(feature => `
                                <div style="display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: #f0fdfa; border-radius: 0.75rem; border: 2px solid #ccfbf1;">
                                    <span style="font-size: 1.75rem; flex-shrink: 0;">${feature.icon}</span>
                                    <p style="color: #374151; font-weight: 500; padding-top: 0.25rem;">${feature.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Step 2: Prayer times warning -->
                    ${(currentStepNum || 1) === 2 ? `
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                            <div style="background: #fffbeb; border: 2px solid #fcd34d; border-radius: 0.75rem; padding: 1.5rem;">
                                <p style="color: #92400e; font-weight: 500; text-align: center;">${currentStep.warning}</p>
                            </div>
                            <div style="background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 0.75rem; padding: 1.5rem;">
                                <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                                    <span style="font-size: 1.5rem;">ℹ️</span>
                                    <p style="color: #1e40af;">${currentStep.info}</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Step 3: Location form -->
                    ${(currentStepNum || 1) === 3 ? `
                        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;">
                            <div style="background: white; border: 2px solid #99f6e4; border-radius: 0.75rem; padding: 1.5rem;">
                                <label style="display: block; font-size: 0.875rem; font-weight: 700; color: #115e59; margin-bottom: 0.75rem;">
                                    📍 ${trans.city || 'Ville'}
                                </label>
                                <input 
                                    type="text" 
                                    data-input="city"
                                    placeholder="${trans.cityPlaceholder || 'Ex: Paris'}"
                                    value="${this.state.get('city') || ''}"
                                    style="width: 100%; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 0.75rem; font-size: 1rem; outline: none; box-sizing: border-box;"
                                />
                            </div>
                            
                            <div style="background: white; border: 2px solid #99f6e4; border-radius: 0.75rem; padding: 1.5rem;">
                                <label style="display: block; font-size: 0.875rem; font-weight: 700; color: #115e59; margin-bottom: 0.75rem;">
                                    🌍 ${trans.country || 'Code pays (2 lettres)'}
                                </label>
                                <input 
                                    type="text" 
                                    data-input="country"
                                    placeholder="${trans.countryPlaceholder || 'Ex: FR'}"
                                    value="${this.state.get('country') || ''}"
                                    maxlength="2"
                                    style="width: 100%; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 0.75rem; font-size: 1rem; outline: none; text-transform: uppercase; box-sizing: border-box;"
                                />
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Navigation buttons -->
                    <div style="display: flex; gap: 1rem;">
                        ${(currentStepNum || 1) > 1 ? `
                            <button data-action="prev-step" style="
                                flex: 1;
                                background: white;
                                color: #0f766e;
                                font-weight: 700;
                                padding: 1rem;
                                border-radius: 0.75rem;
                                border: 2px solid #99f6e4;
                                cursor: pointer;
                                font-size: 1rem;
                            ">
                                ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                            </button>
                        ` : ''}
                        
                        <button data-action="next-step" style="
                            flex: 1;
                            background: linear-gradient(to right, #14b8a6, #10b981);
                            color: white;
                            font-weight: 700;
                            padding: 1rem;
                            border-radius: 0.75rem;
                            border: none;
                            cursor: pointer;
                            font-size: 1rem;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        ">
                            ${isLastStep ? (trans.start || 'Commencer') + ' ✨' : (trans.next || 'Suivant') + (rtl ? ' ◀' : ' ▶')}
                        </button>
                    </div>
                    
                    ${!isLastStep ? `
                        <button data-action="skip" style="
                            width: 100%;
                            margin-top: 1rem;
                            color: #6b7280;
                            background: none;
                            border: none;
                            font-size: 0.875rem;
                            padding: 0.5rem;
                            cursor: pointer;
                        ">
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

