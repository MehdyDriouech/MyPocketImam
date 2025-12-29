export class AblutionsView {
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
            case 'ablutions':
                container.innerHTML = this.renderMenu();
                break;
            case 'ablution-guidance':
                container.innerHTML = this.renderGuidance();
                break;
        }

        this.attachEventListeners(container.firstElementChild);
    }

    renderMenu() {
        const trans = this.translations.getAll();
        const ABLUTION_TYPES = this.engine.getAblutionTypes();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        return `
        <div class="container" dir="${dirAttr}">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-tools" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <h1 class="app-title">${trans.guidedAblutions}</h1>
                <div style="width: 24px;"></div>
            </div>
            
            <p class="text-center text-muted mb-8 text-lg">${trans.selectAblutionType}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${ABLUTION_TYPES.map(type => `
                    <button data-action="select-type" data-type="${type.id}" class="card hover:shadow-lg transition-all text-center">
                        <div class="text-6xl mb-4 pointer-events-none">${type.icon}</div>
                        <h3 class="text-xl font-bold mb-2 pointer-events-none">${trans[type.nameKey] || type.name}</h3>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    }

    renderGuidance() {
        const trans = this.translations.getAll();
        const selectedType = this.state.get('selectedAblutionType');
        const steps = this.engine.getAblutionSteps(selectedType);
        const currentStepIndex = this.state.get('currentAblutionStep');
        const step = steps[currentStepIndex];

        if (!step) return '<div>Error: Step not found</div>';

        const isLastStep = currentStepIndex === steps.length - 1;
        const progress = ((currentStepIndex + 1) / steps.length) * 100;
        const ablutionType = this.engine.getAblutionTypes().find(t => t.id === selectedType);
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';

        return `
        <div class="container" dir="${dirAttr}" style="padding-bottom: 100px;">
            <div class="app-header mb-8 rounded-xl">
                <button data-action="go-menu" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back}</span>
                </button>
                <div class="text-center">
                    <h1 class="app-title text-xl">${trans[ablutionType.nameKey] || ablutionType.name}</h1>
                    <p class="text-sm opacity-80">${trans.step} ${currentStepIndex + 1} ${trans.of} ${steps.length}</p>
                </div>
                <button data-action="go-home" class="btn btn-secondary">
                    <span>🏠</span>
                </button>
            </div>
            
            <div class="mb-8">
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="h-full transition-all duration-500 rounded-full" style="width: ${progress}%; background: var(--primary-color);"></div>
                </div>
            </div>
            
            <div class="card p-12 mb-6 text-center">
                <div class="flex justify-center items-center mb-8">
                    <div class="text-9xl">${step.icon}</div>
                </div>
                
                <div class="space-y-4">
                    <h2 class="text-3xl font-bold" style="color: var(--primary-dark);">${step.name}</h2>
                    ${step.repetitions ? `<p class="text-xl font-semibold" style="color: var(--primary-color);">${step.repetitions} ${trans.times}</p>` : ''}
                    
                    <div class="rounded-2xl p-6 space-y-3" style="background: var(--bg-color);">
                        <p class="text-lg leading-relaxed">${step.description}</p>
                    </div>
                </div>
            </div>
            
            ${isLastStep ? `
                <div class="mb-6 rounded-2xl p-6 text-center" style="background: #d1fae5; border: 2px solid #10b981;">
                    <p class="text-2xl font-bold mb-2" style="color: #065f46;">🎉 ${trans.ablutionComplete}</p>
                    <p class="mb-4" style="color: #047857;">${trans.ablutionAccepted}</p>
                    <button data-action="go-home" class="btn btn-primary">
                        ${trans.returnHome}
                    </button>
                </div>
            ` : ''}
            
            <!-- Navigation buttons fixed at bottom -->
            <div class="flex gap-4" style="position: fixed; bottom: 1rem; left: 1rem; right: 1rem; max-width: 900px; margin: 0 auto; padding: 0 1rem; z-index: 50; background: var(--bg-color); padding-top: 1rem; padding-bottom: 1rem;">
                <button data-action="prev-step" ${currentStepIndex === 0 ? 'disabled' : ''} class="btn btn-secondary flex-1 justify-center">
                    ${rtl ? '▶' : '◀'} ${trans.previous}
                </button>
                <button data-action="next-step" ${isLastStep ? 'disabled' : ''} class="btn btn-primary flex-1 justify-center">
                    ${trans.next} ${rtl ? '◀' : '▶'}
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
                case 'select-type':
                    this.engine.selectAblutionType(target.dataset.type);
                    this.eventBus.emit('view:change', 'ablution-guidance');
                    break;
                case 'go-menu':
                    this.state.set('currentView', 'ablutions');
                    this.eventBus.emit('view:change', 'ablutions');
                    break;
                case 'prev-step':
                    if (this.engine.previousStep()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'next-step':
                    if (this.engine.nextStep()) {
                        this.eventBus.emit('view:refresh');
                    }
                    break;
            }
        });
    }
}

