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
        if (!trans || !trans.prayers) return '<div class="loading-container"><div class="spinner"></div><p>Chargement...</p></div>';

        const PRAYERS = this.config.getPrayers();
        const LANGUAGES = this.config.getLanguages();
        const RECITERS = this.config.getReciters();

        const dirAttr = this.translations.isRTL() ? 'rtl' : 'ltr';
        const rtl = this.translations.isRTL();
        const currentReciter = RECITERS.find(r => r.id === this.state.get('selectedReciter'));
        const currentLang = LANGUAGES.find(l => l.code === this.state.get('language'));
        const city = this.state.get('city') || '';
        const country = this.state.get('country') || '';
        const currentDate = this.state.get('currentDate');
        const prayerTimes = this.state.get('prayerTimes');
        const dailyHadith = this.state.get('dailyHadith');

        // Toutes les prières
        const allPrayerKeys = Object.keys(PRAYERS);
        const topRowPrayers = allPrayerKeys.slice(0, 3); // Fajr, Dohr, Asr
        const bottomRowPrayers = allPrayerKeys.slice(3); // Maghreb, Isha

        const renderPrayerCard = (key) => {
            const prayer = PRAYERS[key];
            const prayerTime = prayerTimes ? prayerTimes[prayer.apiKey] : null;
            return `
                <button data-action="select-prayer" data-prayer="${key}" 
                        class="prayer-card-home"
                        style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            padding: 1.5rem 1rem;
                            background: var(--card-bg);
                            border: 1px solid var(--border-color);
                            border-radius: 16px;
                            transition: all 0.2s ease;
                            cursor: pointer;
                            min-height: 180px;
                        ">
                    <div style="font-size: 3.5rem; margin-bottom: 0.75rem; line-height: 1;">
                        ${prayer.icon}
                    </div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                        ${trans.prayers[key] || prayer.name}
                    </h3>
                    <p style="font-size: 0.8rem; color: var(--primary-color); opacity: 0.7; margin-bottom: 0.75rem;">
                        ${prayer.rakaats} ${trans.rakaats || 'Rakaats'}
                    </p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">
                        ${prayerTime || '--:--'}
                    </p>
                </button>
            `;
        };

        return `
        <div style="min-height: 100vh; background: var(--bg-color);">
            <div style="max-width: 900px; margin: 0 auto; padding: 1rem 1rem 2rem;">
                
                <!-- Top Navigation Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 0.75rem;">
                    <button data-action="go-settings" style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.75rem 1.25rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 50px;
                        color: var(--text-color);
                        font-weight: 500;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        <span style="font-size: 1.1rem;">⚙️</span>
                        <span>${trans.settings || 'Paramètres'}</span>
                    </button>
                    
                    <button data-action="go-tools" style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.75rem 1.25rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 50px;
                        color: var(--text-color);
                        font-weight: 500;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    ">
                        <span style="font-size: 1.1rem;">🧰</span>
                        <span>${trans.muslimTools || 'Outils du Musulman'}</span>
                    </button>
                    
                    <div style="position: relative;" class="language-selector-wrapper">
                        <button data-action="toggle-lang-dropdown" style="
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            padding: 0.75rem 1.25rem;
                            background: var(--card-bg);
                            border: 1px solid var(--border-color);
                            border-radius: 50px;
                            color: var(--primary-color);
                            font-weight: 600;
                            font-size: 0.9rem;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        ">
                            <span>${currentLang?.flag || '🌐'}</span>
                            <span>${currentLang?.name || 'Français'}</span>
                            <span style="font-size: 0.6rem; margin-left: 0.25rem;">▼</span>
                        </button>
                        <div id="lang-dropdown" class="hidden" style="
                            position: absolute;
                            top: calc(100% + 0.5rem);
                            right: 0;
                            background: var(--card-bg);
                            border: 1px solid var(--border-color);
                            border-radius: 16px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                            overflow: hidden;
                            z-index: 1000;
                            min-width: 180px;
                        ">
                            ${LANGUAGES.map(lang => `
                                <button data-action="select-lang" data-lang="${lang.code}" style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.75rem;
                                    width: 100%;
                                    padding: 0.75rem 1rem;
                                    background: ${lang.code === this.state.get('language') ? 'var(--primary-light)' : 'transparent'};
                                    border: none;
                                    color: var(--text-color);
                                    font-size: 0.9rem;
                                    cursor: pointer;
                                    transition: background 0.15s ease;
                                    text-align: left;
                                " onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background='${lang.code === this.state.get('language') ? 'var(--primary-light)' : 'transparent'}'">
                                    <span style="font-size: 1.25rem;">${lang.flag}</span>
                                    <span style="font-weight: ${lang.code === this.state.get('language') ? '600' : '400'}; color: ${lang.code === this.state.get('language') ? 'var(--primary-color)' : 'var(--text-color)'};">${lang.name}</span>
                                    ${lang.code === this.state.get('language') ? '<span style="margin-left: auto; color: var(--primary-color);">✓</span>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Hero Section -->
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">🕌</div>
                    <h1 style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                        My Pocket Imam
                    </h1>
                    <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 0.25rem;">
                        ${trans.appSubtitle || 'Apprenez et pratiquez vos prières quotidiennes'}
                    </p>
                    <p style="color: var(--primary-color); font-size: 0.85rem; opacity: 0.8;">
                        ${trans.reciter || 'Récitateur'}: ${currentReciter?.name || 'Saad El Ghamidi'}
                    </p>
                    ${city ? `
                        <p style="color: var(--primary-color); font-size: 0.85rem; opacity: 0.8;">
                            ${city}${country ? ', ' + country : ''}
                        </p>
                    ` : ''}
                </div>

                <!-- Date Card -->
                ${currentDate ? `
                    <div style="
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 1rem 1.5rem;
                        margin-bottom: 1.5rem;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    ">
                        <div style="font-size: 2rem;">📅</div>
                        <div style="flex: 1; text-align: center;">
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem; font-family: 'Amiri', serif;" dir="rtl">
                                ${currentDate.hijri.weekday.ar} - ${currentDate.hijri.day} ${currentDate.hijri.month.ar} ${currentDate.hijri.year}
                            </p>
                            <p style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color);">
                                ${currentDate.gregorian.weekday.en}, ${currentDate.gregorian.day} ${currentDate.gregorian.month.en} ${currentDate.gregorian.year}
                            </p>
                        </div>
                    </div>
                ` : ''}

                <!-- Prayer Cards Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem;">
                    ${topRowPrayers.map(key => renderPrayerCard(key)).join('')}
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                    ${bottomRowPrayers.map(key => renderPrayerCard(key)).join('')}
                    <div></div>
                </div>

                <!-- Hadith du jour -->
                ${dailyHadith ? `
                    <div style="
                        margin-top: 2rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 1.5rem;
                    ">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                            <span style="font-size: 1.25rem;">📖</span>
                            <span style="font-weight: 600; color: var(--primary-color); font-size: 0.9rem;">
                                ${trans.hadithOfTheDay || 'Hadith du Jour'}
                            </span>
                        </div>
                        <p style="
                            font-size: 1rem; 
                            line-height: 1.7; 
                            color: var(--text-color); 
                            ${dailyHadith.language === 'ara' || dailyHadith.language === 'urd' ? 'text-align: right; font-family: Amiri, serif; font-size: 1.1rem;' : 'text-align: left;'} 
                            font-style: italic; 
                            margin-bottom: 1rem;
                        ">
                            "${dailyHadith.text}"
                        </p>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                            <span style="font-weight: 600; color: var(--primary-color); font-size: 0.85rem;">${dailyHadith.collection}</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">#${dailyHadith.number}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
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

        // Handle language dropdown toggle
        const langToggle = container.querySelector('[data-action="toggle-lang-dropdown"]');
        const langDropdown = container.querySelector('#lang-dropdown');
        if (langToggle && langDropdown) {
            langToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                langDropdown.classList.toggle('hidden');
            });

            // Handle language selection
            langDropdown.querySelectorAll('[data-action="select-lang"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const lang = btn.dataset.lang;
                    this.pluginManager.get('translations').engine.changeLanguage(lang);
                    langDropdown.classList.add('hidden');
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!langToggle.contains(e.target) && !langDropdown.contains(e.target)) {
                    langDropdown.classList.add('hidden');
                }
            });
        }

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

