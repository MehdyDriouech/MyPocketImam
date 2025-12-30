export class PrayersView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        this.clickHandler = null; // Référence au handler pour pouvoir le supprimer
        this.attachedListeners = new Set(); // Track des listeners attachés pour éviter les doublons
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
            case 'prayer-extra-menu':
                container.innerHTML = this.renderExtraPrayersMenu();
                break;
            case 'prayer-extra-detail':
                container.innerHTML = this.renderExtraPrayerDetail();
                break;
            default:
                // Fallback ou autres vues gérées par d'autres plugins (Settings, etc)
                // Mais si le plugin manager nous appelle, c'est que nous sommes responsables
                if (currentView === 'home') container.innerHTML = this.renderHome();
                break;
        }

        // Attacher les event listeners au conteneur principal
        // container est l'élément #app, et innerHTML crée les éléments enfants
        // On doit attacher les listeners au conteneur lui-même pour capturer les événements de tous les enfants
        // Mais on ne doit l'attacher qu'une seule fois pour éviter l'accumulation
        this.attachEventListeners(container);
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
        const dailyHadith = this.state.get('hadith');

        // Toutes les prières
        const allPrayerKeys = Object.keys(PRAYERS);
        const topRowPrayers = allPrayerKeys.slice(0, 3); // Fajr, Dohr, Asr
        const bottomRowPrayers = allPrayerKeys.slice(3); // Maghreb, Isha

        const renderPrayerCard = (key) => {
            const prayer = PRAYERS[key];
            const prayerTime = prayerTimes ? prayerTimes[prayer.apiKey] : null;
            const hasLocation = city && country;
            
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
                            min-height: 160px;
                        ">
                    <div style="font-size: 3.5rem; margin-bottom: 0.75rem; line-height: 1;">
                        ${prayer.icon}
                    </div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                        ${trans.prayers[key] || prayer.name}
                    </h3>
                    <p style="font-size: 0.8rem; color: var(--primary-color); opacity: 0.7;">
                        ${prayer.rakaats} ${trans.rakaats || 'Rakaats'}
                    </p>
                    ${hasLocation && prayerTime ? `
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-top: 0.5rem;">
                            ${prayerTime}
                        </p>
                    ` : ''}
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
                    <button data-action="go-extra-prayers-menu" 
                            class="prayer-card-home"
                            style="
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                text-align: center;
                                padding: 1.5rem 1rem;
                                background: var(--card-bg);
                                border: 2px dashed var(--primary-color);
                                border-radius: 16px;
                                transition: all 0.2s ease;
                                cursor: pointer;
                                min-height: 160px;
                            "
                            onmouseover="this.style.borderStyle='solid'; this.style.background='var(--primary-light)';"
                            onmouseout="this.style.borderStyle='dashed'; this.style.background='var(--card-bg)';">
                        <div style="font-size: 3.5rem; margin-bottom: 0.75rem; line-height: 1;">
                            📿
                        </div>
                        <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                            ${trans.extraPrayers || 'Prières supplémentaires'}
                        </h3>
                        <p style="font-size: 0.8rem; color: var(--primary-color); opacity: 0.7;">
                            ${trans.extraPrayersSubtitle || '14 prières spéciales'}
                        </p>
                    </button>
                </div>

                <!-- Hadith du jour -->
                ${dailyHadith && dailyHadith.text ? `
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
                            <span style="font-weight: 600; color: var(--primary-color); font-size: 0.85rem;">${dailyHadith.collection || 'Hadith'}</span>
                            <span style="font-size: 0.8rem; color: var(--text-muted);">#${dailyHadith.number || ''}</span>
                        </div>
                    </div>
                ` : dailyHadith && this.state.get('hadithLoading') ? `
                    <div style="
                        margin-top: 2rem;
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 16px;
                        padding: 1.5rem;
                        text-align: center;
                    ">
                        <p style="color: var(--text-muted);">Chargement du hadith...</p>
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
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-home" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.configuration} ${trans.prayers[selectedPrayer] || prayer.name}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="card mb-6" style="background: var(--primary-color);">
                <div class="flex items-center gap-3">
                    <div style="font-size: 2rem;">🎙️</div>
                    <div style="flex: 1;">
                        <label class="block text-sm mb-2" style="color: rgba(255, 255, 255, 0.9);">${trans.reciter}</label>
                        <select data-action="change-reciter" class="input-field" style="background: white; color: var(--text-color); border: 2px solid rgba(255, 255, 255, 0.3);">
                            ${RECITERS.map(reciter => `
                                <option value="${reciter.id}" ${this.state.get('selectedReciter') === reciter.id ? 'selected' : ''}>
                                    ${reciter.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-4 mb-8">
                ${rakaatConfig.map((config, index) => `
                    <div class="card">
                        <div class="mb-4">
                            <h3 class="text-xl font-bold" style="color: var(--heading-color);">${trans.rakaat} ${config.rakaat}</h3>
                        </div>
                        <div class="mb-4 p-4 rounded-xl" style="background: var(--primary-light); border: 1px solid var(--primary-color);">
                            <div class="flex items-center justify-between gap-4">
                                <p class="font-bold" style="color: var(--primary-dark); margin: 0;">${trans.mandatorySurah}</p>
                                <p class="text-xl font-arabic ${rtl ? 'text-left' : 'text-right'}" dir="rtl" style="color: var(--primary-dark); font-weight: 600; margin: 0;">${SURAHS[0].arabic}</p>
                            </div>
                        </div>
                        ${config.rakaat <= 2 ? `
                            <div>
                                <label class="block text-sm font-medium mb-2" style="color: var(--text-color);">${trans.secondarySurah}</label>
                                <select data-action="update-surah" data-index="${index}" class="input-field">
                                    ${SURAHS.filter(s => !s.mandatory).map(surah => `
                                        <option value="${surah.id}" ${config.secondarySurah.id === surah.id ? 'selected' : ''}>
                                            ${trans.surahs?.[surah.id] || surah.name} - ${surah.arabic} (${surah.number})
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                        ` : `
                            <div class="p-4 rounded-xl" style="background: var(--card-bg); border: 1px solid var(--border-color);">
                                <p class="text-sm italic" style="color: var(--text-color);">
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

    renderExtraPrayersMenu() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';
        
        const groups = this.engine.getExtraPrayersByGroup();
        const currentLang = this.state.get('language') || 'fr';

        if (!groups || Object.keys(groups).length === 0) {
            return `
                <div class="container" dir="${dirAttr}">
                    <div class="app-header mb-8 rounded-xl">
                        <button data-action="go-home" class="btn btn-secondary">
                            <span>${rtl ? '◀' : '▶'}</span>
                            <span>${trans.back || 'Retour'}</span>
                        </button>
                        <h1 class="app-title">${trans.extraPrayers || 'Prières supplémentaires'}</h1>
                        <div style="width: 24px;"></div>
                    </div>
                    <div class="card text-center">
                        <p style="color: var(--text-muted);">${trans.loading || 'Chargement...'}</p>
                    </div>
                </div>
            `;
        }

        const renderPrayerCard = (prayer) => {
            const badge = this.engine.getBadgeLabel(prayer.ui.badgeKey);
            const icon = this.engine.getIconEmoji(prayer.ui.iconKey);
            const shortLabel = prayer.ui.shortLabel[currentLang] || prayer.ui.shortLabel.fr || prayer.id;
            const rakaatText = prayer.defaultRakaat === 0 
                ? 'Sans rakaʿāt' 
                : prayer.minRakaat === prayer.maxRakaat 
                    ? `${prayer.defaultRakaat} rakaʿāt`
                    : `${prayer.minRakaat}-${prayer.maxRakaat} rakaʿāt`;

            return `
                <button data-action="view-extra-prayer" data-prayer-id="${prayer.id}" 
                        style="
                            display: flex;
                            flex-direction: column;
                            align-items: flex-start;
                            padding: 1.25rem;
                            background: var(--card-bg);
                            border: 1px solid var(--border-color);
                            border-radius: 12px;
                            transition: all 0.2s ease;
                            cursor: pointer;
                            width: 100%;
                            text-align: left;
                        "
                        onmouseover="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)';"
                        onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)';">
                    <div style="display: flex; align-items: center; gap: 0.75rem; width: 100%; margin-bottom: 0.5rem;">
                        <div style="font-size: 2rem;">${icon}</div>
                        <div style="flex: 1;">
                            <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color); margin: 0 0 0.25rem 0;">
                                ${shortLabel}
                            </h3>
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <span style="
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 0.25rem;
                                    padding: 0.25rem 0.5rem;
                                    background: var(--primary-light);
                                    border-radius: 6px;
                                    font-size: 0.75rem;
                                    font-weight: 500;
                                    color: var(--primary-color);
                                ">
                                    <span>${badge.emoji}</span>
                                    <span>${badge.label}</span>
                                </span>
                                <span style="font-size: 0.85rem; color: var(--text-muted);">
                                    ${rakaatText}
                                </span>
                            </div>
                        </div>
                        <span style="font-size: 1.25rem; color: var(--text-muted);">${rtl ? '◀' : '▶'}</span>
                    </div>
                </button>
            `;
        };

        return `
            <div class="container" dir="${dirAttr}">
                <div class="app-header mb-8 rounded-xl">
                    <button data-action="go-home" class="btn btn-secondary">
                        <span>${rtl ? '◀' : '▶'}</span>
                        <span>${trans.back || 'Retour'}</span>
                    </button>
                    <h1 class="app-title">${trans.extraPrayers || 'Prières supplémentaires'}</h1>
                    <div style="width: 24px;"></div>
                </div>

                <div style="display: flex; flex-col; gap: 2rem;">
                    ${Object.values(groups).map(group => {
                        const groupLabel = group.label[currentLang] || group.label.fr || group.id;
                        return `
                            <div class="mb-6">
                                <h2 style="
                                    font-size: 1.5rem;
                                    font-weight: 700;
                                    color: var(--primary-color);
                                    margin-bottom: 1rem;
                                    padding-bottom: 0.5rem;
                                    border-bottom: 2px solid var(--primary-color);
                                ">
                                    ${groupLabel}
                                </h2>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                                    ${group.prayers.map(prayer => renderPrayerCard(prayer)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    renderExtraPrayerDetail() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';
        const currentLang = this.state.get('language') || 'fr';
        
        const prayerId = this.state.get('selectedExtraPrayer');
        if (!prayerId) {
            // Rediriger vers le menu si aucune prière sélectionnée
            this.state.set('currentView', 'prayer-extra-menu');
            return this.renderExtraPrayersMenu();
        }

        const prayer = this.engine.getExtraPrayerById(prayerId);
        if (!prayer) {
            return `
                <div class="container" dir="${dirAttr}">
                    <div class="app-header mb-8 rounded-xl">
                        <button data-action="go-extra-prayers-menu" class="btn btn-secondary">
                            <span>${rtl ? '◀' : '▶'}</span>
                            <span>${trans.back || 'Retour'}</span>
                        </button>
                        <h1 class="app-title">${trans.extraPrayer || 'Prière supplémentaire'}</h1>
                        <div style="width: 24px;"></div>
                    </div>
                    <div class="card text-center">
                        <p style="color: var(--text-muted);">${trans.prayerNotFound || 'Prière non trouvée'}</p>
                    </div>
                </div>
            `;
        }

        const status = this.engine.getExtraPrayerStatus(prayer.statusId);
        const group = this.engine.getExtraPrayerGroup(prayer.groupId);
        const badge = this.engine.getBadgeLabel(prayer.ui.badgeKey);
        const icon = this.engine.getIconEmoji(prayer.ui.iconKey);
        
        const fullLabel = prayer.ui.fullLabel[currentLang] || prayer.ui.fullLabel.fr || prayer.id;
        const summary = prayer.summary[currentLang] || prayer.summary.fr || '';
        const notes = prayer.notes[currentLang] || prayer.notes.fr || '';
        const statusLabel = status ? (status.label[currentLang] || status.label.fr || status.id) : '';
        const groupLabel = group ? (group.label[currentLang] || group.label.fr || group.id) : '';

        // Formatage des rakaʿāt
        let rakaatInfo = '';
        if (prayer.defaultRakaat === 0) {
            rakaatInfo = 'Sans rakaʿāt (prière spéciale)';
        } else if (prayer.minRakaat === prayer.maxRakaat) {
            rakaatInfo = `${prayer.defaultRakaat} rakaʿāt`;
        } else {
            rakaatInfo = `${prayer.minRakaat} à ${prayer.maxRakaat} rakaʿāt (par défaut: ${prayer.defaultRakaat})`;
        }

        // Informations sur le timing
        let timingInfo = '';
        if (prayer.timing) {
            const timingType = prayer.timing.timingType;
            const timingLabels = {
                'around_dhuhr': 'Autour de Dohr',
                'after_isha_until_fajr': 'Après ʿIshā jusqu\'à Fajr',
                'eid_morning': 'Matin des fêtes',
                'funeral': 'Lors d\'un décès',
                'during_eclipse': 'Pendant une éclipse',
                'between_sunrise_and_zenith': 'Entre le lever du soleil et le zénith',
                'generic': 'À tout moment (hors temps interdits)',
                'on_mosque_entry': 'À l\'entrée de la mosquée',
                'when_needed': 'Quand le besoin se fait sentir',
                'after_isha_in_ramadan': 'Après ʿIshā pendant le Ramadan',
                'during_danger': 'En situation de danger',
                'anytime_except_forbidden': 'À tout moment (hors temps interdits)',
                'travel': 'En voyage'
            };
            timingInfo = timingLabels[timingType] || timingType;
        }

        // Flags comportementaux pertinents
        const behaviorNotes = [];
        if (prayer.behaviorFlags) {
            if (prayer.behaviorFlags.isCongregationalOnly) {
                behaviorNotes.push('En congrégation uniquement');
            } else if (prayer.behaviorFlags.isCongregationalPreferred) {
                behaviorNotes.push('Préférable en congrégation');
            }
            if (prayer.behaviorFlags.hasKhutba) {
                behaviorNotes.push('Avec sermon (khutba)');
            }
            if (prayer.behaviorFlags.hasQunut) {
                behaviorNotes.push('Avec invocation du qunût');
            }
            if (prayer.behaviorFlags.hasExtraTakbir) {
                behaviorNotes.push('Avec takbīrs supplémentaires');
            }
            if (prayer.behaviorFlags.noRukuNoSujud) {
                behaviorNotes.push('Sans rukūʿ ni sujūd');
            }
            if (prayer.behaviorFlags.hasDoubleRukuPerRakaat) {
                behaviorNotes.push('Deux rukūʿ par rakaʿa');
            }
            if (prayer.behaviorFlags.isRamadanOnly) {
                behaviorNotes.push('Uniquement pendant le Ramadan');
            }
            if (prayer.replacesFardPrayer) {
                behaviorNotes.push(`Remplace la prière ${prayer.replacesFardPrayer}`);
            }
        }

        return `
            <div class="container" dir="${dirAttr}">
                <div class="app-header mb-8 rounded-xl">
                    <button data-action="go-extra-prayers-menu" class="btn btn-secondary">
                        <span>${rtl ? '◀' : '▶'}</span>
                        <span>${trans.back || 'Retour'}</span>
                    </button>
                    <h1 class="app-title" style="font-size: 1.25rem;">${fullLabel}</h1>
                    <div style="width: 24px;"></div>
                </div>

                <!-- En-tête avec icône et badge -->
                <div class="card mb-6" style="background: var(--primary-light); border: 2px solid var(--primary-color);">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="font-size: 3rem;">${icon}</div>
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                <span style="
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    padding: 0.5rem 1rem;
                                    background: var(--primary-color);
                                    color: white;
                                    border-radius: 8px;
                                    font-size: 0.9rem;
                                    font-weight: 600;
                                ">
                                    <span>${badge.emoji}</span>
                                    <span>${badge.label}</span>
                                </span>
                            </div>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                                ${statusLabel ? `Statut: ${statusLabel}` : ''}
                                ${groupLabel ? ` • ${groupLabel}` : ''}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Résumé -->
                ${summary ? `
                    <div class="card mb-6">
                        <h2 style="
                            font-size: 1.25rem;
                            font-weight: 700;
                            color: var(--primary-color);
                            margin-bottom: 1rem;
                        ">
                            📖 ${trans.summary || 'Résumé'}
                        </h2>
                        <p style="
                            font-size: 1rem;
                            line-height: 1.7;
                            color: var(--text-color);
                        ">
                            ${summary}
                        </p>
                    </div>
                ` : ''}

                <!-- Notes -->
                ${notes ? `
                    <div class="card mb-6">
                        <h2 style="
                            font-size: 1.25rem;
                            font-weight: 700;
                            color: var(--primary-color);
                            margin-bottom: 1rem;
                        ">
                            📝 ${trans.notes || 'Notes'}
                        </h2>
                        <p style="
                            font-size: 1rem;
                            line-height: 1.7;
                            color: var(--text-color);
                        ">
                            ${notes}
                        </p>
                    </div>
                ` : ''}

                <!-- Informations -->
                <div class="card mb-6">
                    <h2 style="
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: var(--primary-color);
                        margin-bottom: 1rem;
                    ">
                        ℹ️ ${trans.information || 'Informations'}
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <strong style="color: var(--primary-color);">${trans.rakaats || 'Rakaʿāt'}:</strong>
                            <span style="margin-left: 0.5rem;">${rakaatInfo}</span>
                        </div>
                        ${timingInfo ? `
                            <div>
                                <strong style="color: var(--primary-color);">${trans.timing || 'Moment'}:</strong>
                                <span style="margin-left: 0.5rem;">${timingInfo}</span>
                            </div>
                        ` : ''}
                        ${behaviorNotes.length > 0 ? `
                            <div>
                                <strong style="color: var(--primary-color);">${trans.characteristics || 'Caractéristiques'}:</strong>
                                <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                                    ${behaviorNotes.map(note => `<li style="margin-bottom: 0.25rem;">${note}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Bouton guidage (désactivé pour l'instant) -->
                <div class="card mb-6" style="background: var(--card-bg); border: 1px dashed var(--border-color);">
                    <button data-action="start-extra-prayer-guidance" 
                            disabled
                            style="
                                width: 100%;
                                padding: 1rem;
                                background: var(--card-bg);
                                border: 1px solid var(--border-color);
                                border-radius: 8px;
                                color: var(--text-muted);
                                font-size: 1rem;
                                font-weight: 500;
                                cursor: not-allowed;
                                opacity: 0.6;
                            ">
                        ▶ ${trans.startGuidance || 'Démarrer le guidage'} (${trans.comingSoon || 'Bientôt disponible'})
                    </button>
                </div>

                <!-- Bouton retour -->
                <button data-action="go-extra-prayers-menu" class="btn btn-secondary w-full">
                    ${rtl ? '◀' : '▶'} ${trans.back || 'Retour au menu'}
                </button>
            </div>
        `;
    }

    attachEventListeners(container) {
        if (!container) {
            console.warn('PrayersView: container is null or undefined');
            return;
        }
        
        // N'attacher le listener principal qu'une seule fois
        // Utiliser un identifiant unique pour éviter les doublons
        const listenerId = 'prayers-view-main-click';
        if (this.attachedListeners.has(listenerId)) {
            // Le listener est déjà attaché, pas besoin de le réattacher
            return;
        }
        
        // Créer le handler une seule fois
        this.clickHandler = (e) => {
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
                case 'toggle-lang-dropdown':
                    e.stopPropagation();
                    const langDropdown = container.querySelector('#lang-dropdown');
                    if (langDropdown) {
                        langDropdown.classList.toggle('hidden');
                    }
                    break;
                case 'select-lang':
                    const lang = target.dataset.lang;
                    this.pluginManager.get('translations').engine.changeLanguage(lang);
                    const langDropdown2 = container.querySelector('#lang-dropdown');
                    if (langDropdown2) {
                        langDropdown2.classList.add('hidden');
                    }
                    break;
                case 'select-language':
                    const langOld = target.dataset.lang;
                    this.pluginManager.get('translations').engine.changeLanguage(langOld);
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
                case 'go-extra-prayers-menu':
                    this.state.set('currentView', 'prayer-extra-menu');
                    this.eventBus.emit('view:change', 'prayer-extra-menu');
                    break;
                case 'view-extra-prayer':
                    const prayerId = target.dataset.prayerId;
                    this.engine.startExtraPrayer(prayerId);
                    this.eventBus.emit('view:change', 'prayer-extra-detail');
                    break;
                case 'start-extra-prayer-guidance':
                    // TODO: Intégration future du guidage pas-à-pas pour les prières supplémentaires
                    // Pour l'instant, cette action est désactivée
                    break;
            }
        };
        
        // Attacher le listener
        container.addEventListener('click', this.clickHandler);
        this.attachedListeners.add(listenerId);

        // Handle Select changes separately - utiliser la délégation d'événements
        // Pas besoin d'attacher des listeners individuels, le click handler principal les gère
        // Mais pour les selects, on doit gérer l'événement 'change' séparément
        // On utilise aussi la délégation pour éviter l'accumulation
        const selectChangeId = 'prayers-view-select-change';
        if (!this.attachedListeners.has(selectChangeId)) {
            container.addEventListener('change', (e) => {
                const target = e.target;
                
                // Handle surah selection
                if (target.dataset.action === 'update-surah') {
                    const index = parseInt(target.dataset.index);
                    const surahId = target.value;
                    this.engine.setRakaatSurah(index, surahId);
                    return;
                }
                
                // Handle reciter selection
                if (target.dataset.action === 'change-reciter') {
                    const reciterId = target.value;
                    const settingsEngine = this.pluginManager.get('settings')?.engine;
                    if (settingsEngine) {
                        settingsEngine.updateSetting('selectedReciter', reciterId);
                        this.eventBus.emit('view:refresh');
                    }
                    return;
                }
            });
            this.attachedListeners.add(selectChangeId);
        }

        // Handle language dropdown toggle - utiliser la délégation
        // Le click handler principal gère déjà les clics, mais on doit gérer spécifiquement le toggle
        // On utilise un listener document-level pour le "click outside" qui doit être unique
        const langDropdownOutsideId = 'prayers-view-lang-outside';
        if (!this.attachedListeners.has(langDropdownOutsideId)) {
            document.addEventListener('click', (e) => {
                const langToggle = container.querySelector('[data-action="toggle-lang-dropdown"]');
                const langDropdown = container.querySelector('#lang-dropdown');
                
                if (langToggle && langDropdown) {
                    if (!langToggle.contains(e.target) && !langDropdown.contains(e.target)) {
                        langDropdown.classList.add('hidden');
                    }
                }
                
                // Handle old language menu if it exists
                const menu = container.querySelector('#language-menu');
                const toggleBtn = container.querySelector('[data-action="toggle-language-menu"]');
                if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && toggleBtn && !toggleBtn.contains(e.target)) {
                    menu.classList.add('hidden');
                }
            });
            this.attachedListeners.add(langDropdownOutsideId);
        }
    }
}

