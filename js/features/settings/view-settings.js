export class SettingsView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    get config() {
        return this.pluginManager.get('config').engine;
    }

    render(container) {
        const currentView = this.state.get('currentView');

        switch (currentView) {
            case 'settings':
                container.innerHTML = this.renderSettings();
                break;
            case 'muslim-tools':
                container.innerHTML = this.renderMuslimTools();
                break;
        }

        this.attachEventListeners(container.firstElementChild);
    }

    renderMuslimTools() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-home" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.muslimTools}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <button data-action="go-ablutions" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">💧</div>
                    <h3 class="font-bold mb-2">${trans.ablutions}</h3>
                    <p class="text-muted text-sm">${trans.guidedAblutions}</p>
                </button>
                <button data-action="go-citadel" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">📖</div>
                    <h3 class="font-bold mb-2">${trans.citadel || 'La Citadelle'}</h3>
                    <p class="text-muted text-sm">${trans.citadelDesc || 'Invocations quotidiennes'}</p>
                </button>
                <button data-action="go-pillars" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">🏛️</div>
                    <h3 class="font-bold mb-2">${trans.pillars || 'Piliers de la Prière'}</h3>
                    <p class="text-muted text-sm">${trans.pillarsDesc || 'Les 14 piliers essentiels'}</p>
                </button>
                <button data-action="go-coran" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">📗</div>
                    <h3 class="font-bold mb-2">${trans.coran || 'Le Coran'}</h3>
                    <p class="text-muted text-sm">${trans.coranDesc || 'Lecture et traduction'}</p>
                </button>
                <button data-action="go-calendar" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">🌙</div>
                    <h3 class="font-bold mb-2">${trans.islamicCalendar || 'Calendrier Hijri'}</h3>
                    <p class="text-muted text-sm">${trans.calendarDesc || 'Dates et événements'}</p>
                </button>
                <button data-action="go-names-allah" class="card text-left hover:shadow-lg transition-all" style="border-color: var(--primary-color);">
                    <div class="mb-4" style="font-size: 3rem;">📿</div>
                    <h3 class="font-bold mb-2">99 Noms</h3>
                    <p class="text-muted text-sm">${trans.namesDesc || "Asmā' Allāh al-Husnā"}</p>
                </button>
                <button data-action="go-tafsir" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">📖</div>
                    <h3 class="font-bold mb-2">${trans.tafsirTitle || 'Tafsir du Coran'}</h3>
                    <p class="text-muted text-sm">${trans.tafsirSubtitle || 'Exégèse et sens des versets'}</p>
                </button>
                <button data-action="go-tasbih" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">📿</div>
                    <h3 class="font-bold mb-2">${trans.tasbih || 'Tasbih Digital'}</h3>
                    <p class="text-muted text-sm">${trans.tasbihDesc || 'Compteur de dhikr'}</p>
                </button>
                <button data-action="go-qibla" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">🕋</div>
                    <h3 class="font-bold mb-2">${trans.qiblaDirection}</h3>
                    <p class="text-muted text-sm">${trans.qiblaDesc}</p>
                </button>
                <button data-action="go-zakat" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">💰</div>
                    <h3 class="font-bold mb-2">${trans.zakatCalculator || 'Calculateur Zakat'}</h3>
                    <p class="text-muted text-sm">${trans.zakatDesc || 'Estimez votre Zakat'}</p>
                </button>
                <button data-action="go-ramadan" class="card text-left hover:shadow-lg transition-all">
                    <div class="mb-4" style="font-size: 3rem;">🌙</div>
                    <h3 class="font-bold mb-2">${trans.ramadanTracker || 'Tracker Ramadan'}</h3>
                    <p class="text-muted text-sm">${trans.ramadanDesc || 'Suivi des 30 jours'}</p>
                </button>
            </div>
        </div>
    `;
    }

    renderSettings() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        const RECITERS = this.config.getReciters();
        const CALCULATION_METHODS = this.config.getCalculationMethods();
        const selectedReciter = this.state.get('selectedReciter');
        const calculationMethod = this.state.get('calculationMethod');
        const avatarGender = this.state.get('avatarGender');

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-home" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.settings}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="flex flex-col gap-6">
                <div class="settings-section">
                    <h3 class="settings-title">
                        <span>📍</span>
                        <span>${trans.location}</span>
                    </h3>
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">${trans.city}</label>
                            <input 
                                type="text" 
                                data-setting="city"
                                placeholder="${trans.cityPlaceholder}"
                                value="${this.state.get('city') || ''}"
                                class="input-field"
                            />
                            <p class="text-sm text-muted mt-1">${trans.enterCity}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">${trans.country}</label>
                            <input 
                                type="text" 
                                data-setting="country"
                                placeholder="${trans.countryPlaceholder}"
                                value="${this.state.get('country') || ''}"
                                maxlength="2"
                                class="input-field uppercase"
                            />
                            <p class="text-sm text-muted mt-1">${trans.enterCountry}</p>
                        </div>
                    </div>
                </div>
                
                <div class="settings-section mb-6">
                    ${this.pluginManager.get('theme').view.getTemplate()}
                </div>

                <div class="settings-section mb-6">
                    <h3 class="settings-title">
                        <span>🧮</span>
                        <span>${trans.selectCalculationMethod}</span>
                    </h3>
                    <div class="flex flex-col gap-3 max-h-96 overflow-y-auto pr-2">
                        ${CALCULATION_METHODS.map(method => `
                            <button data-action="set-calculation" data-id="${method.id}" class="btn w-full justify-between text-left p-4 ${calculationMethod === method.id ? 'btn-primary' : 'btn-secondary'}">
                                <div class="flex items-center gap-3 pointer-events-none flex-1 min-w-0">
                                    <span class="text-2xl flex-shrink-0">${method.regions}</span>
                                    <div class="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                        <span class="font-bold text-base whitespace-nowrap">${trans.calculationMethods?.[method.id] || method.name}</span>
                                        <span class="text-xs opacity-80 whitespace-nowrap" dir="rtl">${rtl ? trans.calculationMethods?.[method.id] : method.nameAr}</span>
                                    </div>
                                </div>
                                ${calculationMethod === method.id ? '<span class="text-xl flex-shrink-0">✓</span>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="settings-section mb-6">
                    <h3 class="settings-title">
                        <span>🎙️</span>
                        <span>${trans.selectReciter}</span>
                    </h3>
                    <div class="flex flex-col gap-3">
                        ${RECITERS.map(reciter => `
                            <button data-action="set-reciter" data-id="${reciter.id}" class="btn w-full justify-between text-left p-4 ${selectedReciter === reciter.id ? 'btn-primary' : 'btn-secondary'}">
                                <div class="flex items-center gap-2 pointer-events-none flex-1 min-w-0 overflow-hidden">
                                    <span class="font-bold text-base whitespace-nowrap">${reciter.name}</span>
                                    <span class="text-sm opacity-80 whitespace-nowrap" dir="rtl">${reciter.arabicName}</span>
                                </div>
                                ${selectedReciter === reciter.id ? '<span class="text-xl flex-shrink-0">✓</span>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3 class="settings-title">
                        <span>👤</span>
                        <span>${trans.selectAvatar}</span>
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <button data-action="set-avatar" data-gender="boy" class="card flex flex-col items-center gap-3 ${avatarGender === 'boy' ? 'border-primary' : ''}" style="${avatarGender === 'boy' ? 'border: 2px solid var(--primary-color); background: var(--primary-light);' : ''}">
                            <img src="js/features/prayers/assets/images/position-debout-main-coeur.png" class="h-32 object-contain pointer-events-none">
                            <p class="font-bold">${trans.boy}</p>
                            ${avatarGender === 'boy' ? '<span>✓</span>' : ''}
                        </button>
                        <button data-action="set-avatar" data-gender="girl" class="card flex flex-col items-center gap-3 ${avatarGender === 'girl' ? 'border-primary' : ''}" style="${avatarGender === 'girl' ? 'border: 2px solid var(--primary-color); background: var(--primary-light);' : ''}">
                            <img src="js/features/prayers/assets/images/position-debout-main-coeur-girl.png" class="h-32 object-contain pointer-events-none">
                            <p class="font-bold">${trans.girl}</p>
                            ${avatarGender === 'girl' ? '<span>✓</span>' : ''}
                        </button>
                    </div>
                </div>

                <div class="card" style="background: var(--primary-light); border-color: var(--primary-color);">
                    <h3 class="settings-title" style="border-bottom-color: var(--primary-color);">
                        <span>💚</span>
                        <span>${trans.donations}</span>
                    </h3>
                    <p class="mb-4 text-sm leading-relaxed">${trans.donationsMessage}</p>
                    <a href="https://www.paypal.com/paypalme/MDRIOUECH" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                        💝 ${trans.supportProject}
                    </a>
                </div>
                
                <div class="card" style="background: #f0f9ff; border-color: #bae6fd; margin-top: 2.5%; margin-bottom: 2.5%;">
                    <h3 class="settings-title" style="color: #0369a1; border-bottom-color: #bae6fd;">
                        <span>📂</span>
                        <span>${trans.openSource}</span>
                    </h3>
                    <p class="mb-3 text-sm leading-relaxed">${trans.openSourceMessage}</p>
                    <div class="p-4 mb-4 rounded-xl" style="background: #fffbeb; border: 1px solid #fcd34d;">
                        <p class="text-sm font-medium" style="color: #92400e;">${trans.openSourceWarning}</p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-4 mt-6">
                        <a href="https://github.com/MehdyDriouech/MyPocketImam/" target="_blank" rel="noopener noreferrer" class="btn flex-1 justify-center gap-2 py-3" style="background: #1f2937; color: white;">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            ${trans.viewOnGithub}
                        </a>
                        <button data-action="download-code" class="btn flex-1 justify-center gap-2 py-3" style="background: linear-gradient(to right, #3b82f6, #6366f1); color: white;">
                            <span>⬇️</span>
                            ${trans.downloadCode}
                        </button>
                    </div>
                </div>

                <button data-action="save-settings" class="btn btn-primary w-full py-4 text-xl shadow-lg font-bold tracking-wide">
                    ${trans.saveSettings}
                </button>
            </div>
        </div>
    `;
    }

    attachEventListeners(container) {
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch (action) {
                case 'go-home':
                    this.state.set('currentView', 'home');
                    this.eventBus.emit('view:change', 'home');
                    break;
                case 'go-ablutions':
                    this.state.set('currentView', 'ablutions');
                    this.eventBus.emit('view:change', 'ablutions');
                    break;
                case 'go-pillars':
                    this.state.set('currentView', 'pillars');
                    this.eventBus.emit('view:change', 'pillars');
                    break;
                case 'go-citadel':
                    this.state.set('currentView', 'citadel');
                    this.eventBus.emit('view:change', 'citadel');
                    break;
                case 'go-coran':
                    this.state.set('currentView', 'coran-surahs');
                    this.eventBus.emit('view:change', 'coran-surahs');
                    break;
                case 'go-calendar':
                    this.state.set('currentView', 'islamic-calendar');
                    this.eventBus.emit('view:change', 'islamic-calendar');
                    break;
                case 'go-names-allah':
                    this.state.set('currentView', 'names-of-allah');
                    this.eventBus.emit('view:change', 'names-of-allah');
                    break;
                case 'go-tafsir':
                    this.state.set('currentView', 'tafsir');
                    this.eventBus.emit('view:change', 'tafsir');
                    break;
                case 'go-tasbih':
                    this.state.set('currentView', 'tasbih');
                    this.eventBus.emit('view:change', 'tasbih');
                    break;
                case 'go-qibla':
                    this.state.set('currentView', 'qibla');
                    this.eventBus.emit('view:change', 'qibla');
                    break;
                case 'go-zakat':
                    this.state.set('currentView', 'zakat');
                    this.eventBus.emit('view:change', 'zakat');
                    break;
                case 'go-ramadan':
                    this.state.set('currentView', 'ramadan');
                    this.eventBus.emit('view:change', 'ramadan');
                    break;
                case 'set-calculation':
                    this.engine.updateSetting('calculationMethod', parseInt(target.dataset.id));
                    this.eventBus.emit('view:refresh');
                    break;
                case 'set-reciter':
                    this.engine.updateSetting('selectedReciter', target.dataset.id);
                    this.eventBus.emit('view:refresh');
                    break;
                case 'set-avatar':
                    this.engine.updateSetting('avatarGender', target.dataset.gender);
                    this.eventBus.emit('view:refresh');
                    break;
                case 'download-code':
                    this.engine.downloadSourceCode();
                    break;
                case 'save-settings':
                    this.engine.saveSettings();
                    this.eventBus.emit('view:change', 'home');
                    break;
            }
        });

        // Inputs events
        const cityInput = container.querySelector('input[data-setting="city"]');
        if (cityInput) {
            cityInput.addEventListener('change', (e) => {
                this.engine.updateSetting('city', e.target.value);
            });
        }

        const countryInput = container.querySelector('input[data-setting="country"]');
        if (countryInput) {
            countryInput.addEventListener('change', (e) => {
                this.engine.updateSetting('country', e.target.value);
            });
        }

        // Attach Theme listeners
        this.pluginManager.get('theme').view.attachEventListeners(container);
    }
}
