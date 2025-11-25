export class PillarsView {
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
            case 'pillars':
                container.innerHTML = this.renderList();
                break;
            case 'pillar-detail':
                container.innerHTML = this.renderDetail();
                break;
        }

        this.attachEventListeners(container.firstElementChild);
    }

    renderList() {
        const trans = this.translations.getAll();
        const pillars = this.engine.getPillars();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';
        const lang = this.state.get('language');

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-tools" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.pillars || 'Les 14 Piliers'}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${pillars.map(pillar => `
                    <button data-action="select-pillar" data-id="${pillar.id}" class="card hover:shadow-lg transition-all p-6 text-left">
                        <div class="flex items-start gap-4 pointer-events-none">
                            <div class="text-4xl flex-shrink-0">${this.engine.getPillarIcon(pillar.id)}</div>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold mb-2" style="color: var(--primary-dark);">${this.engine.getPillarLabel(pillar, lang)}</h3>
                                <p class="text-sm text-muted line-clamp-2">${this.engine.getPillarDescription(pillar, lang)}</p>
                            </div>
                        </div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    }

    renderDetail() {
        const trans = this.translations.getAll();
        const pillarId = this.state.get('selectedPillar');
        const pillar = this.engine.getPillarById(pillarId);
        const lang = this.state.get('language');
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        if (!pillar) return '<div>Error: Pillar not found</div>';

        const pillars = this.engine.getPillars();
        const canGoBack = pillar.order > 1;
        const canGoForward = pillar.order < pillars.length;

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-6 rounded-xl">
                <button data-action="go-list" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <div class="text-center">
                    <h1 class="app-title text-xl">${trans.pillar || 'Pilier'} ${pillar.order}</h1>
                </div>
                <button data-action="go-home" class="btn btn-secondary">
                    <span>🏠</span>
                </button>
            </div>
            
            <div class="card p-8 mb-6">
                <div class="text-center mb-6">
                    <div class="text-6xl mb-4">${this.engine.getPillarIcon(pillar.id)}</div>
                    <h2 class="text-3xl font-bold mb-2" style="color: var(--primary-dark);">${this.engine.getPillarLabel(pillar, lang)}</h2>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <h3 class="text-xl font-bold mb-3" style="color: var(--primary-color);">📖 ${trans.description || 'Description'}</h3>
                        <p class="leading-relaxed text-muted">${this.engine.getPillarDescription(pillar, lang)}</p>
                    </div>
                    
                    <div>
                        <h3 class="text-xl font-bold mb-3" style="color: var(--primary-color);">✨ ${trans.howTo || 'Comment faire'}</h3>
                        <p class="leading-relaxed text-muted">${this.engine.getPillarHowTo(pillar, lang)}</p>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-4">
                <button data-action="prev-pillar" 
                    ${!canGoBack ? 'disabled' : ''} 
                    class="btn btn-secondary flex-1 justify-center">
                    ${rtl ? '▶' : '◀'} ${trans.previous || 'Précédent'}
                </button>
                <button data-action="next-pillar" 
                    ${!canGoForward ? 'disabled' : ''} 
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
                case 'go-list':
                    this.state.set('currentView', 'pillars');
                    this.eventBus.emit('view:change', 'pillars');
                    break;
                case 'select-pillar':
                    this.engine.selectPillar(target.dataset.id);
                    this.eventBus.emit('view:change', 'pillar-detail');
                    break;
                case 'prev-pillar':
                    this.engine.navigatePillar(-1);
                    this.eventBus.emit('view:refresh');
                    break;
                case 'next-pillar':
                    this.engine.navigatePillar(1);
                    this.eventBus.emit('view:refresh');
                    break;
            }
        });
    }
}

