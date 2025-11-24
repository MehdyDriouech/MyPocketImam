export class CitadelView {
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
            case 'citadel':
                container.innerHTML = this.renderCategories();
                break;
            case 'citadel-douas':
                container.innerHTML = this.renderDouas();
                break;
        }

        this.attachEventListeners(container.firstElementChild);
    }

    renderCategories() {
        const trans = this.translations.getAll();
        const categories = this.engine.getCitadelCategories();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-tools" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.citadel || 'La Citadelle'}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${categories.map(cat => `
                    <button data-action="select-category" data-id="${cat.id}" data-file="${cat.file}" class="card hover:shadow-lg transition-all p-6 text-left">
                        <div class="text-4xl mb-3 pointer-events-none">${cat.icon}</div>
                        <h3 class="text-lg font-bold pointer-events-none">${trans[cat.nameKey] || cat.nameKey}</h3>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    }

    renderDouas() {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        if (this.state.get('loadingCitadel')) {
            return `
            <div class="container text-center p-6">
                <div class="text-6xl mb-4 animate-pulse">📖</div>
                <p class="text-xl text-muted">${trans.loading || 'Chargement...'}</p>
            </div>
        `;
        }

        const douas = this.state.get('citadelDouas');
        if (!douas || douas.length === 0) {
            return `
            <div class="container p-6">
                <button data-action="go-categories" class="btn btn-secondary mb-4">
                    ${rtl ? '◀' : '▶'} ${trans.back || 'Retour'}
                </button>
                <p class="text-center text-muted">${trans.noData || 'Aucune donnée disponible'}</p>
            </div>
        `;
        }

        const currentIndex = this.state.get('currentDouaIndex');
        const currentDoua = douas[currentIndex];
        const currentLang = this.state.get('language');

        return `
        <div class="container" dir="${dirAttr}">
            <div class="flex justify-between mb-4">
                <button data-action="go-categories" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <div class="btn btn-secondary pointer-events-none">
                    ${currentIndex + 1} / ${douas.length}
                </div>
            </div>
            
            <div class="card p-8 mb-6">
              ${currentDoua.situation ? `
                <h3 class="text-xl font-bold mb-4" style="color: var(--primary-dark);">${currentDoua.situationText || 'Invocation'}</h3>
              ` : ''}

              ${currentDoua.doua && currentDoua.doua.ar ? `
                <div class="rounded-xl p-6 mb-4" dir="rtl" style="background: #fffbeb;">
                    <p class="text-2xl leading-relaxed text-right font-arabic" style="color: #1f2937;">${currentDoua.doua.ar}</p>
                </div>
              ` : ''}

              ${currentDoua.transliteration ? `
                <div class="rounded-xl p-4 mb-4" style="background: #eff6ff;">
                    <p class="text-sm italic" style="color: #374151;">${currentDoua.transliteration}</p>
                </div>
              ` : ''}

              ${currentDoua.doua ? `
                <div class="rounded-xl p-4" style="background: #f9fafb;">
                    <p style="color: #1f2937;">${currentDoua.douaText || ''}</p>
                </div>
              ` : ''}   
            </div>
            
            <div class="flex gap-4">
                <button data-action="prev-doua" 
                    ${currentIndex === 0 ? 'disabled' : ''} 
                    class="btn btn-secondary flex-1 justify-center">
                    ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                </button>
                <button data-action="next-doua" 
                    ${currentIndex === douas.length - 1 ? 'disabled' : ''} 
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
                case 'go-home':
                    this.state.set('currentView', 'home');
                    this.eventBus.emit('view:change', 'home');
                    break;
                case 'go-categories':
                    this.state.set('currentView', 'citadel');
                    this.eventBus.emit('view:change', 'citadel');
                    break;
                case 'select-category':
                    this.engine.loadCategory(target.dataset.id, target.dataset.file);
                    // View change is handled in engine (Optimistic UI) or triggered by state change
                    this.eventBus.emit('view:change', 'citadel-douas');
                    break;
                case 'prev-doua':
                    if (this.engine.previousDoua()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'next-doua':
                    if (this.engine.nextDoua()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
            }
        });
    }
}

