export class CoranView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        const currentView = this.state.get('currentView');

        switch (currentView) {
            case 'coran-surahs':
                // Trigger load if needed
                if (!this.engine.getSurahsList() && !this.state.get('loadingCoran')) {
                    this.engine.fetchSurahsList().then(() => this.eventBus.emit('view:refresh'));
                }
                container.innerHTML = this.renderSurahsList();
                break;
            case 'coran-reader':
                container.innerHTML = this.renderReader();
                break;
        }

        this.attachEventListeners(container.firstElementChild);
    }

    renderSurahsList() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        if (this.state.get('loadingCoran')) {
            return `
            <div class="container text-center p-6">
                <div class="text-6xl mb-4 animate-pulse">📗</div>
                <p class="text-xl text-muted">${trans.loading || 'Chargement...'}</p>
            </div>
        `;
        }

        const surahs = this.engine.getSurahsList();
        if (!surahs) {
            return `
            <div class="container text-center p-6">
                <p class="text-muted">${trans.errorLoading || 'Erreur de chargement'}</p>
                <button data-action="retry-surahs" class="btn btn-primary mt-4">
                    ${trans.retry || 'Réessayer'}
                </button>
            </div>
        `;
        }

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-tools" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.coran || 'Le Coran'}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${surahs.map(surah => `
                    <button data-action="select-surah" data-number="${surah.number}" class="card hover:shadow-lg transition-all p-4 text-left">
                        <div class="flex items-center gap-4 pointer-events-none">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0" style="background: var(--primary-light); color: var(--primary-dark);">
                                ${surah.number}
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold" style="color: var(--primary-dark);">${this.engine.formatSurahName(surah)}</h3>
                                <p class="text-sm text-muted">${surah.numberOfAyahs} ${trans.verses || 'versets'} • ${this.engine.getRevelationType(surah.revelationType)}</p>
                            </div>
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    }

    renderReader() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        if (this.state.get('loadingCoran')) {
            return `
            <div class="container text-center p-6">
                <div class="text-6xl mb-4 animate-pulse">📗</div>
                <p class="text-xl text-muted">${trans.loading || 'Chargement...'}</p>
            </div>
        `;
        }

        const surahData = this.engine.getCurrentSurahData();
        if (!surahData) {
            return `
            <div class="container text-center p-6">
                <p class="text-muted">${trans.errorLoading || 'Erreur de chargement'}</p>
                <button data-action="go-surahs" class="btn btn-primary mt-4">
                    ${trans.back || 'Retour'}
                </button>
            </div>
        `;
        }

        const currentAyahIndex = this.state.get('currentAyahIndex');
        const arabicAyah = surahData.arabic.ayahs[currentAyahIndex];
        const translationAyah = surahData.translation.ayahs[currentAyahIndex];

        return `
        <div class="container" dir="${dirAttr}">
            <div class="flex justify-between mb-4">
                <button data-action="go-surahs" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <div class="btn btn-secondary pointer-events-none">
                    ${trans.verse || 'Verset'} ${currentAyahIndex + 1} / ${surahData.arabic.numberOfAyahs}
                </div>
            </div>
            
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold mb-1" style="color: var(--primary-dark);">${this.engine.formatSurahName(surahData.arabic)}</h2>
                <p class="text-muted">${surahData.arabic.numberOfAyahs} ${trans.verses || 'versets'} • ${this.engine.getRevelationType(surahData.arabic.revelationType)}</p>
            </div>
            
            ${currentAyahIndex === 0 && surahData.arabic.number !== 1 && surahData.arabic.number !== 9 ? `
                <div class="rounded-2xl p-6 mb-6 border-2" dir="rtl" style="background: #fffbeb; border-color: #fcd34d;">
                    <p class="text-3xl text-center font-arabic" style="color: #1f2937;">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                </div>
            ` : ''}
            
            <div class="card p-8 mb-6">
                <div class="mb-6" dir="rtl">
                    <p class="text-3xl leading-loose text-right font-arabic" style="color: #1f2937;">${arabicAyah.text}</p>
                </div>
                
                <div class="pt-6 border-t" style="border-color: var(--bg-color);">
                    <p class="text-lg leading-relaxed" style="color: #374151;">${translationAyah.text}</p>
                </div>
                
                <div class="mt-4 flex justify-between items-center text-sm text-muted">
                    <span>${surahData.arabic.englishName} ${arabicAyah.numberInSurah}</span>
                    <span>${trans.page || 'Page'} ${arabicAyah.page || '-'}</span>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button data-action="prev-ayah" 
                    ${currentAyahIndex === 0 ? 'disabled' : ''} 
                    class="btn btn-secondary flex-1 justify-center">
                    ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                </button>
                <button data-action="next-ayah" 
                    ${currentAyahIndex === surahData.arabic.numberOfAyahs - 1 ? 'disabled' : ''} 
                    class="btn btn-primary flex-1 justify-center">
                    ${trans.next || 'Suivant'} ${rtl ? '◀' : '▶'}
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
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;
                case 'go-surahs':
                    this.state.set('currentView', 'coran-surahs');
                    this.eventBus.emit('view:change', 'coran-surahs');
                    break;
                case 'retry-surahs':
                    this.engine.fetchSurahsList().then(() => this.eventBus.emit('view:refresh'));
                    break;
                case 'select-surah':
                    this.engine.fetchSurah(target.dataset.number).then(() => {
                        this.state.set('currentView', 'coran-reader');
                        this.eventBus.emit('view:change', 'coran-reader');
                    });
                    this.eventBus.emit('view:change', 'coran-reader'); // Switch to reader (shows loader)
                    break;
                case 'prev-ayah':
                    if (this.engine.previousAyah()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'next-ayah':
                    if (this.engine.nextAyah()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
            }
        });
    }
}

