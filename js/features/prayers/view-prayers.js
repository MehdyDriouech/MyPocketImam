export class PrayersView {
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
            case 'home':
                container.innerHTML = this.renderHome();
                break;
            case 'prayer-config':
                container.innerHTML = this.renderPrayerConfig();
                break;
            case 'prayer-guidance':
                container.innerHTML = this.renderPrayerGuidance();
                break;
            case 'prayer-complete':
                container.innerHTML = this.renderPrayerComplete();
                break;
            default:
                // Fallback ou autres vues gérées par d'autres plugins (Settings, etc)
                // Mais si le plugin manager nous appelle, c'est que nous sommes responsables
                if (currentView === 'home') container.innerHTML = this.renderHome();
                break;
        }

        this.attachEventListeners(container.firstElementChild);
    }

    renderHome() {
        const trans = this.translations.getAll();
        if (!trans || !trans.prayers) return '<div class="loading-container"><div class="spinner">🕌</div><p>Chargement...</p></div>';

        const PRAYERS = this.config.getPrayers();
        const LANGUAGES = this.config.getLanguages();
        const RECITERS = this.config.getReciters();

        const dirAttr = this.translations.isRTL() ? 'rtl' : 'ltr';
        const rtl = this.translations.isRTL();
        const currentReciter = RECITERS.find(r => r.id === this.state.get('selectedReciter'));
        const currentDate = this.state.get('currentDate');
        const prayerTimes = this.state.get('prayerTimes');
        const dailyHadith = this.state.get('dailyHadith');

        const prayersHTML = Object.entries(PRAYERS).map(([key, prayer]) => {
            const prayerTime = prayerTimes ? prayerTimes[prayer.apiKey] : null;
            return `
            <button data-action="select-prayer" data-prayer="${key}" class="card prayer-card w-full text-left">
                <div class="mb-4" style="font-size: 3rem;">${prayer.icon}</div>
                <h3 class="prayer-name mb-2">${trans.prayers[key] || prayer.name}</h3>
                <p class="text-muted">${prayer.rakaats} ${trans.rakaats}</p>
                ${prayerTime ? `
                    <p class="prayer-time mt-4">${prayerTime}</p>
                ` : ''}
            </button>
        `;
        }).join('');

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-4 rounded-xl">
                <div class="flex gap-2">
                    <button data-action="go-settings" class="btn btn-secondary">
                        <span>⚙️</span>
                        <span>${trans.settings}</span>
                    </button>
                    <button data-action="go-tools" class="btn btn-secondary">
                        <span>🧰</span>
                        <span>${trans.muslimTools || 'Outils'}</span>
                    </button>
                </div>
                
                <div class="flex gap-2">
                    <button data-action="toggle-theme" class="btn btn-icon">
                        <span>🌓</span>
                    </button>
                    
                    <div class="relative inline-block">
                        <button data-action="toggle-language-menu" class="btn btn-secondary">
                            <span>${LANGUAGES.find(l => l.code === this.state.get('language')).flag}</span>
                            <span>▼</span>
                        </button>
                        <div id="language-menu" class="hidden absolute ${rtl ? 'left-0' : 'right-0'} mt-2 card p-2 z-50 w-48">
                            ${LANGUAGES.map(lang => `
                                <button data-action="select-language" data-lang="${lang.code}" class="btn btn-ghost w-full justify-start ${this.state.get('language') === lang.code ? 'bg-primary-light' : ''}">
                                    <span>${lang.flag}</span>
                                    <span>${lang.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mb-12 pt-8">
                <div class="mb-4" style="font-size: 4rem;">🕌</div>
                <h1 class="app-title mb-2" style="font-size: 2.5rem;">${trans.appTitle}</h1>
                <p class="text-muted">${trans.subtitle}</p>
                <p class="text-sm mt-2" style="color: var(--primary-color)">${trans.reciter}: ${currentReciter?.name}</p>
                ${this.state.get('city') ? `<p class="text-sm text-muted">${this.state.get('city')}, ${this.state.get('country')}</p>` : ''}
            </div>
            
            ${currentDate ? `
                <div class="card mb-6 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <span class="text-2xl">📅</span>
                        <div>
                            <p class="text-sm text-muted">${currentDate.hijri.weekday.ar} - ${currentDate.hijri.day} ${currentDate.hijri.month.ar} ${currentDate.hijri.year}</p>
                            <p class="text-lg font-bold" style="color: var(--heading-color)">${currentDate.gregorian.weekday.en}, ${currentDate.gregorian.day} ${currentDate.gregorian.month.en} ${currentDate.gregorian.year}</p>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="grid grid-cols-2 gap-4">
                ${prayersHTML}
            </div>

            ${dailyHadith ? `
                <div class="card mt-8" style="background: var(--primary-light); border-color: var(--accent-color);" dir="${dailyHadith.language === 'ara' || dailyHadith.language === 'urd' ? 'rtl' : 'ltr'}">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-lg">📖</span>
                                <h3 class="text-sm font-bold" style="color: var(--accent-hover)">${trans.hadithOfTheDay || 'Hadith du Jour'}</h3>
                            </div>
                            <div class="card p-3 mb-2" style="background: rgba(255,255,255,0.8);">
                                <p class="text-sm leading-relaxed ${dailyHadith.language === 'ara' || dailyHadith.language === 'urd' ? 'text-right font-arabic' : 'text-left'}">${dailyHadith.text}</p>
                            </div>
                            <div class="flex items-center justify-between text-xs text-muted">
                                <span class="font-medium">${dailyHadith.collection}</span>
                                <span>#${dailyHadith.number}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    }

    renderPrayerConfig() {
        const trans = this.translations.getAll();
        if (!trans.prayers) return ''; // Wait for translations
        const PRAYERS = this.config.getPrayers();
        const SURAHS = this.config.getSurahs();
        const RECITERS = this.config.getReciters();

        const selectedPrayer = this.state.get('selectedPrayer');
        const prayer = PRAYERS[selectedPrayer];
        const rakaatConfig = this.state.get('rakaatConfig') || [];
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-4 rounded-xl">
                <button data-action="go-home" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title" style="font-size: 1.2rem;">${trans.configuration} ${trans.prayers[selectedPrayer] || prayer.name}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="card mb-6 text-white" style="background: var(--primary-color);">
                <div class="flex items-center gap-3">
                    <div style="font-size: 2rem;">🎙️</div>
                    <div>
                        <p class="text-sm opacity-90">${trans.reciter}</p>
                        <p class="text-xl font-bold">${(RECITERS.find(r => r.id === this.state.get('selectedReciter')) || RECITERS[0] || { name: 'Reciter' }).name}</p>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-4 mb-8">
                ${rakaatConfig.map((config, index) => `
                    <div class="card">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="flex items-center justify-center font-bold rounded-full" style="background: var(--primary-color); color: white; width: 40px; height: 40px;">${config.rakaat}</div>
                            <h3 class="text-xl font-bold">${trans.rakaat} ${config.rakaat}</h3>
                        </div>
                        <div class="mb-4 p-4 rounded-xl" style="background: var(--primary-light); border: 1px solid var(--primary-color);">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="font-bold" style="color: var(--primary-color)">${trans.mandatorySurah}</p>
                                    <p class="text-sm ${rtl ? 'text-left' : 'text-right'}">${SURAHS[0].arabic}</p>
                                </div>
                            </div>
                        </div>
                        ${config.rakaat <= 2 ? `
                            <div>
                                <label class="block text-sm font-medium mb-2">${trans.secondarySurah}</label>
                                <select data-action="update-surah" data-index="${index}" class="input-field">
                                    ${SURAHS.filter(s => !s.mandatory).map(surah => `
                                        <option value="${surah.id}" ${config.secondarySurah.id === surah.id ? 'selected' : ''}>
                                            ${trans.surahs?.[surah.id] || surah.name} - ${surah.arabic} (${surah.number})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        ` : `
                            <div class="p-4 rounded-xl" style="background: var(--bg-color); border: 1px solid var(--border-color);">
                                <p class="text-sm italic text-muted">
                                    ℹ️ ${trans.infoRakaat34}
                                </p>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
            
            <button data-action="start-guidance" class="btn btn-primary w-full py-4 text-xl shadow-lg">
                ▶ ${trans.startGuidance}
            </button>
        </div>
    `;
    }

    renderPrayerGuidance() {
        const trans = this.translations.getAll();
        if (!trans.prayers) return '';
        const PRAYERS = this.config.getPrayers();
        const RECITERS = this.config.getReciters();

        const steps = this.engine.getCurrentSteps();
        const currentStepIndex = this.state.get('currentStepIndex');
        const currentStep = steps[currentStepIndex];

        // Safety check if migration state is weird
        if (!currentStep) return '<div>Error: No step found</div>';

        const avatarGender = this.state.get('avatarGender');
        const imageUrl = this.engine.getPositionImage(currentStep.id, avatarGender);
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';
        const isPlaying = this.state.get('isPlaying');

        const selectedPrayer = this.state.get('selectedPrayer');
        const currentRakaat = this.state.get('currentRakaat');
        const isLastStep = currentRakaat === PRAYERS[selectedPrayer].rakaats && currentStepIndex === steps.length - 1;
        const audioFile = this.engine.getCurrentAudioFile();

        return `
      <div class="container" dir="${dirAttr}">
        <div class="app-header mb-6 rounded-xl">
            <button data-action="go-config" class="btn btn-secondary">
                <span>⚙️ ${trans.config}</span>
            </button>
            <div class="text-center">
                <h1 class="text-xl font-bold" style="color: var(--primary-color)">${trans.prayers[selectedPrayer] || PRAYERS[selectedPrayer].name}</h1>
                <p class="text-muted">${trans.rakaat} ${currentRakaat}/${PRAYERS[selectedPrayer].rakaats}</p>
            </div>
            <button data-action="go-home" class="btn btn-secondary">
                <span>🏠</span>
            </button>
        </div>
        
        <div class="card mb-8 text-center">
            <div class="flex justify-center items-center mb-8">
                <img src="${imageUrl}" alt="${currentStep.name}" class="prayer-image" style="max-height: 400px; object-fit: contain;">
            </div>
            
            <div class="space-y-4">
                <h2 class="text-2xl font-bold" style="color: var(--heading-color)">${currentStep.name}</h2>
                
                <div class="p-6 rounded-xl space-y-3" style="background: var(--primary-light);">
                    <p class="text-3xl font-arabic leading-loose">${currentStep.arabic}</p>
                    <p class="text-lg font-medium" style="color: var(--primary-color)">${currentStep.transliteration}</p>
                    <p class="text-md text-muted">${currentStep.translation}</p>
                </div>
                
                ${audioFile ? `
                    <div class="mt-4">
                        <button data-action="toggle-audio" class="btn btn-primary px-8 py-3 rounded-full shadow-lg mx-auto">
                            <span>${isPlaying ? '⏸️' : '🔊'}</span>
                            <span>${isPlaying ? trans.pause : trans.listenRecitation}</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="flex gap-4">
            <button data-action="prev-step" ${currentRakaat === 1 && currentStepIndex === 0 ? 'disabled' : ''} class="btn btn-secondary flex-1 py-4 disabled:opacity-50">
                ${rtl ? '►' : '◄'} ${trans.previous}
            </button>
            <button data-action="next-step" ${isLastStep ? 'disabled' : ''} class="btn btn-primary flex-1 py-4 disabled:opacity-50">
                ${trans.next} ${rtl ? '◄' : '►'}
            </button>
        </div>

        ${isLastStep ? `
            <div class="mt-6 p-6 rounded-xl text-center" style="background: var(--primary-light); border: 2px solid var(--primary-color);">
                <button data-action="finish-prayer" class="btn btn-primary px-6 py-3">
                    ${trans.returnHome}
                </button>
            </div>
        ` : ''}

      </div>
    `;
    }

    renderPrayerComplete() {
        const trans = this.translations.getAll();
        return `
      <div class="container text-center" style="min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <h1 class="text-4xl mb-4">✅ ${trans.prayerComplete}</h1>
        <p class="mb-8 text-xl text-muted">${trans.prayerAccepted}</p>
        <button data-action="go-home" class="btn btn-primary px-8 py-4 text-xl">${trans.returnHome}</button>
      </div>
    `;
    }

    attachEventListeners(container) {
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch (action) {
                case 'select-prayer':
                    this.engine.startPrayer(target.dataset.prayer);
                    this.eventBus.emit('view:change', 'prayer-config');
                    break;
                case 'go-home':
                    this.state.set('currentView', 'home');
                    this.eventBus.emit('view:change', 'home');
                    break;
                case 'go-settings':
                    this.state.set('currentView', 'settings');
                    this.eventBus.emit('view:change', 'settings');
                    break;
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;
                case 'toggle-theme':
                    this.pluginManager.get('theme').engine.toggleTheme();
                    break;
                case 'toggle-language-menu':
                    const menu = container.querySelector('#language-menu');
                    if (menu) menu.classList.toggle('hidden');
                    break;
                case 'select-language':
                    const lang = target.dataset.lang;
                    this.pluginManager.get('translations').engine.changeLanguage(lang);
                    break;
                case 'start-guidance':
                    this.state.set('currentView', 'prayer-guidance');
                    this.eventBus.emit('view:change', 'prayer-guidance');
                    break;
                case 'go-config':
                    this.state.set('currentView', 'prayer-config');
                    this.eventBus.emit('view:change', 'prayer-config');
                    break;
                case 'toggle-audio':
                    const audioFile = this.engine.getCurrentAudioFile();
                    if (this.state.get('isPlaying')) {
                        this.eventBus.emit('audio:pause');
                    } else if (audioFile) {
                        this.eventBus.emit('audio:play', audioFile);
                    }
                    break;
                case 'prev-step':
                    if (this.engine.previousStep()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'next-step':
                    if (!this.engine.nextStep()) {
                        if (!this.engine.nextRakaat()) {
                            // Fin de prière (le bouton termine apparaitra)
                        } else {
                            this.eventBus.emit('view:refresh');
                        }
                    } else {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'finish-prayer':
                    this.state.set('currentView', 'home');
                    this.eventBus.emit('view:change', 'home');
                    break;
            }
        });

        // Handle Select changes separately
        const selects = container.querySelectorAll('select[data-action="update-surah"]');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                const surahId = e.target.value;
                this.engine.setRakaatSurah(index, surahId);
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const menu = container.querySelector('#language-menu');
            const toggleBtn = container.querySelector('[data-action="toggle-language-menu"]');
            if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !toggleBtn.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }
}

