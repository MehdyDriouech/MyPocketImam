export class TasbihView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        
        this.viewMode = 'counter';
        this.showAddForm = false;
        this.addFormMode = 'single';
        this.sequenceSteps = [];
        
        // Pour éviter les listeners multiples
        this.boundHandleClick = null;
        this.currentContainer = null;
        
        // Écouter les événements du moteur une seule fois
        this.eventBus.on('tasbih:count-updated', () => {
            if (this.viewMode === 'counter') {
                this.updateProgressCircle();
            }
        });

        this.eventBus.on('tasbih:target-reached', () => {
            if (this.engine.isInSequence()) {
                setTimeout(() => {
                    if (this.engine.nextSequenceStep()) {
                        this.render(this.currentContainer);
                    } else {
                        alert('🎉 Séquence terminée ! Masha Allah !');
                        this.render(this.currentContainer);
                    }
                }, 500);
            }
        });
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        this.currentContainer = container;
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();

        container.innerHTML = `
            <div class="tasbih-container" style="min-height: 100vh; background: var(--bg-color); position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background-image: repeating-linear-gradient(45deg, var(--primary-color) 0, var(--primary-color) 1px, transparent 0, transparent 50%); background-size: 10px 10px; pointer-events: none;"></div>
                
                <div class="max-w-md mx-auto h-full flex flex-col relative" style="padding: 1.5rem 1rem 0.5rem;">
                    ${this.renderHeader(trans, rtl)}
                    
                    <div id="tasbih-content" class="flex-1 flex flex-col" style="padding-bottom: 80px;">
                        ${this.renderContent(trans)}
                    </div>

                    ${this.renderBottomNav(trans)}
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        
        if (this.viewMode === 'counter') {
            this.updateProgressCircle();
        }
    }

    renderHeader(trans, rtl) {
        return `
            <div class="card mb-6" style="padding: 1rem 1.5rem; border-radius: 16px; background: var(--card-bg); border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between;" dir="${rtl ? 'rtl' : 'ltr'}">
                    <button type="button" data-action="go-tools" style="
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 0.5rem 1rem;
                        background: var(--bg-color);
                        border: 1px solid var(--border-color);
                        border-radius: 12px;
                        color: var(--text-color);
                        font-weight: 500;
                        font-size: 0.9rem;
                        cursor: pointer;
                    ">
                        <span>${rtl ? '▶' : '◀'}</span>
                        <span>${trans.back || 'Retour'}</span>
                    </button>
                    <h1 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); margin: 0;">
                        📿 ${trans.tasbihDigital || 'Tasbih Digital'}
                    </h1>
                    <div style="width: 90px;"></div>
                </div>
            </div>
        `;
    }

    renderContent(trans) {
        if (this.viewMode === 'history') return this.renderHistoryList(trans);
        if (this.viewMode === 'presets') return this.renderPresetsList(trans);
        return this.renderCounter(trans);
    }

    renderCounter(trans) {
        const isSequenceMode = this.engine.isInSequence();
        const sequenceInfo = this.engine.getSequenceInfo();
        const dhikr = this.engine.currentDhikr || { transliteration: 'Tasbih', arabic: 'تسبيح', meaning: 'Gloire à Allah' };
        const progress = Math.min((this.engine.count / (this.engine.target || 33)) * 100, 100);
        
        const radius = 110;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;

        return `
            <div class="flex-1 flex flex-col items-center justify-center" style="gap: 1.5rem;">
                
                ${isSequenceMode ? `
                    <div style="width: 100%; max-width: 380px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 1rem; color: white;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.25rem;">🔄</span>
                                <span style="font-weight: 700; font-size: 0.9rem;">${sequenceInfo.name}</span>
                            </div>
                            <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                                Étape ${sequenceInfo.currentStep + 1}/${sequenceInfo.totalSteps}
                            </span>
                        </div>
                        <div style="display: flex; gap: 0.25rem;">
                            ${sequenceInfo.steps.map((step, i) => `
                                <div style="flex: 1; height: 6px; border-radius: 3px; background: ${i < sequenceInfo.currentStep ? 'rgba(255,255,255,0.9)' : i === sequenceInfo.currentStep ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)'};"></div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="card" style="width: 100%; max-width: 380px; padding: 1.5rem; text-align: center; border: 2px solid var(--primary-light); background: linear-gradient(135deg, var(--card-bg) 0%, var(--primary-light) 100%);">
                    <p class="font-arabic" style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color); line-height: 1.4; margin-bottom: 0.5rem;" dir="rtl">${dhikr.arabic}</p>
                    <p style="font-size: 1.125rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.25rem;">${dhikr.transliteration}</p>
                    <p style="font-size: 0.875rem; font-style: italic; color: var(--text-muted);">${dhikr.meaning}</p>
                </div>

                <div style="position: relative; width: 260px; height: 260px; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, var(--primary-light) 0%, transparent 50%); opacity: 0.3;"></div>
                    
                    <svg style="position: absolute; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" r="${radius}" stroke="var(--border-color)" stroke-width="14" fill="none" opacity="0.3"/>
                        <circle id="progress-ring" cx="120" cy="120" r="${radius}" 
                                stroke="var(--primary-color)" 
                                stroke-width="14" 
                                fill="none" 
                                stroke-dasharray="${circumference}" 
                                stroke-dashoffset="${offset}" 
                                stroke-linecap="round"
                                style="transition: stroke-dashoffset 0.3s ease-out;" />
                    </svg>

                    <button type="button" data-action="tap" style="
                        width: 180px; 
                        height: 180px; 
                        border-radius: 50%; 
                        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
                        color: white;
                        border: none;
                        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
                        cursor: pointer;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        z-index: 10;
                        user-select: none;
                    ">
                        <span style="font-size: 0.7rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em;">TAP</span>
                        <span id="counter-display" style="font-size: 3.5rem; font-weight: 700; font-family: monospace; line-height: 1;">${this.engine.count}</span>
                        <span style="font-size: 0.65rem; opacity: 0.8;">${trans.target || 'Objectif'}: ${this.engine.target}</span>
                    </button>
                </div>

                <div style="width: 100%; max-width: 380px; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="card" style="padding: 0.875rem; text-align: center; border-left: 4px solid var(--primary-color);">
                        <p style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">Total</p>
                        <p id="total-count" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); font-family: monospace;">${this.engine.totalCount}</p>
                    </div>
                    <div class="card" style="padding: 0.875rem; text-align: center; border-left: 4px solid var(--accent-color);">
                        <p style="font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">Progrès</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color); font-family: monospace;">${Math.round(progress)}%</p>
                    </div>
                </div>

                <div style="width: 100%; max-width: 380px; display: flex; gap: 0.75rem;">
                    <button type="button" data-action="reset-counter" style="flex: 1; background: var(--card-bg); color: var(--text-color); border: 2px solid var(--border-color); padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer;">
                        🔄 Reset
                    </button>
                    ${isSequenceMode ? `
                        <button type="button" data-action="skip-step" style="flex: 1; background: #f59e0b; color: white; border: none; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer;">
                            ⏭️ Passer
                        </button>
                        <button type="button" data-action="stop-sequence" style="flex: 1; background: #ef4444; color: white; border: none; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer;">
                            ⏹️ Stop
                        </button>
                    ` : `
                        <button type="button" data-action="view-presets" style="flex: 1; background: var(--primary-color); color: white; border: none; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer;">
                            📋 Dhikr
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    renderHistoryList(trans) {
        const history = this.engine.getHistory();
        return `
            <div class="flex-1 overflow-y-auto" style="padding: 0 0.5rem;">
                <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--heading-color); margin-bottom: 1rem;">
                    📜 ${trans.history || 'Historique'}
                </h2>
                
                ${history.length === 0 ? 
                    `<div class="card" style="padding: 3rem 2rem; text-align: center;">
                        <p style="color: var(--text-muted);">Aucune session enregistrée</p>
                    </div>` : 
                    `<div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${history.map((h) => `
                            <div class="card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--primary-color);">
                                <div>
                                    <p style="font-weight: 700; color: var(--text-color);">${h.dhikr}</p>
                                    <p style="font-size: 0.75rem; color: var(--text-muted);">${new Date(h.date).toLocaleDateString()}</p>
                                </div>
                                <div style="padding: 0.5rem 1rem; border-radius: 12px; background: var(--primary-light);">
                                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); font-family: monospace;">${h.count}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        `;
    }

    renderPresetsList(trans) {
        const presets = this.engine.getPresets();
        const customDhikrs = this.engine.getCustomDhikrs();
        const sequences = this.engine.getSequences();
        
        return `
            <div class="flex-1 overflow-y-auto" style="padding: 0 0.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--heading-color);">
                        ✨ Dhikr & Séquences
                    </h2>
                    <button type="button" id="btn-toggle-form" style="
                        width: 44px;
                        height: 44px;
                        border-radius: 50%;
                        background: var(--primary-color);
                        color: white;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    ">
                        ${this.showAddForm ? '✕' : '+'}
                    </button>
                </div>

                ${this.showAddForm ? this.renderAddForm(presets) : ''}

                ${sequences.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase;">
                            🔄 Mes Séquences
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            ${sequences.map((seq) => `
                                <div style="position: relative;">
                                    <button type="button" data-action="start-sequence" data-id="${seq.id}" style="
                                        width: 100%;
                                        text-align: left; 
                                        padding: 1rem; 
                                        border-radius: 16px; 
                                        border: 2px solid #667eea;
                                        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                                        cursor: pointer;
                                    ">
                                        <p style="font-weight: 700; color: var(--text-color); margin-bottom: 0.5rem;">🔄 ${seq.name}</p>
                                        <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                                            ${seq.steps.map(step => `
                                                <span style="background: var(--card-bg); border: 1px solid var(--border-color); padding: 0.125rem 0.5rem; border-radius: 12px; font-size: 0.7rem;">${step.transliteration} ×${step.count}</span>
                                            `).join('')}
                                        </div>
                                    </button>
                                    <button type="button" data-action="delete-sequence" data-id="${seq.id}" style="
                                        position: absolute; top: 0.5rem; right: 0.5rem;
                                        width: 28px; height: 28px; border-radius: 50%;
                                        background: #ef4444; color: white; border: none;
                                        font-size: 0.75rem; cursor: pointer;
                                    ">🗑️</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${customDhikrs.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase;">
                            🌟 Mes Dhikrs
                        </h3>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${customDhikrs.map((p) => this.renderDhikrCard(p, true)).join('')}
                        </div>
                    </div>
                ` : ''}

                <div>
                    <h3 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase;">
                        📿 Dhikrs Classiques
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${presets.map((p) => this.renderDhikrCard(p, false)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderAddForm(presets) {
        return `
            <div class="card" style="padding: 1.5rem; margin-bottom: 1.5rem; border: 2px dashed var(--primary-color); background: var(--primary-light);">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                    <button type="button" id="btn-mode-single" style="
                        flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer;
                        border: 2px solid ${this.addFormMode === 'single' ? 'var(--primary-color)' : 'var(--border-color)'};
                        background: ${this.addFormMode === 'single' ? 'var(--primary-color)' : 'var(--card-bg)'};
                        color: ${this.addFormMode === 'single' ? 'white' : 'var(--text-color)'};
                    ">📿 Dhikr</button>
                    <button type="button" id="btn-mode-sequence" style="
                        flex: 1; padding: 0.75rem; border-radius: 12px; font-weight: 600; cursor: pointer;
                        border: 2px solid ${this.addFormMode === 'sequence' ? '#667eea' : 'var(--border-color)'};
                        background: ${this.addFormMode === 'sequence' ? '#667eea' : 'var(--card-bg)'};
                        color: ${this.addFormMode === 'sequence' ? 'white' : 'var(--text-color)'};
                    ">🔄 Séquence</button>
                </div>

                ${this.addFormMode === 'single' ? this.renderSingleDhikrForm() : this.renderSequenceForm(presets)}
            </div>
        `;
    }

    renderSingleDhikrForm() {
        return `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem; text-transform: uppercase;">Texte Arabe</label>
                    <input type="text" id="new-dhikr-arabic" placeholder="سُبْحَانَ اللّٰه" dir="rtl"
                           style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color); font-size: 1.25rem; text-align: right;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem; text-transform: uppercase;">Translitération</label>
                    <input type="text" id="new-dhikr-translit" placeholder="SubhanAllah"
                           style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color);">
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem; text-transform: uppercase;">Signification</label>
                    <input type="text" id="new-dhikr-meaning" placeholder="Gloire à Allah"
                           style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color);">
                </div>
                <div>
                    <label style="display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem; text-transform: uppercase;">Objectif</label>
                    <input type="number" id="new-dhikr-target" placeholder="33" min="1" value="33"
                           style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color);">
                </div>
                <button type="button" id="btn-save-dhikr" style="
                    width: 100%; padding: 1rem; border-radius: 12px;
                    background: var(--primary-color); color: white; border: none;
                    font-weight: 700; cursor: pointer;
                ">💾 Enregistrer</button>
            </div>
        `;
    }

    renderSequenceForm(presets) {
        const allDhikrs = [...this.engine.getCustomDhikrs(), ...presets];
        
        return `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.25rem; text-transform: uppercase;">Nom de la séquence</label>
                    <input type="text" id="sequence-name" placeholder="Ex: Tasbih après la prière"
                           style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color);">
                </div>

                <div>
                    <label style="display: block; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">Étapes</label>
                    
                    <div id="sequence-steps-list" style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; min-height: 50px;">
                        ${this.sequenceSteps.length === 0 ? `
                            <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; background: var(--card-bg); border-radius: 12px; border: 2px dashed var(--border-color);">
                                Aucune étape - Ajoutez-en ci-dessous
                            </div>
                        ` : this.sequenceSteps.map((step, i) => `
                            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
                                <span style="width: 24px; height: 24px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">${i + 1}</span>
                                <span style="flex: 1; font-weight: 600; color: var(--text-color);">${step.transliteration}</span>
                                <span style="background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600;">×${step.count}</span>
                                <button type="button" class="btn-remove-step" data-index="${i}" style="width: 28px; height: 28px; border-radius: 50%; background: #ef4444; color: white; border: none; cursor: pointer; font-size: 0.875rem;">✕</button>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Ajouter depuis liste existante -->
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <select id="step-dhikr-select" style="flex: 2; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color);">
                            <option value="">-- Choisir un dhikr --</option>
                            ${allDhikrs.map(d => `<option value="${d.id}">${d.transliteration}</option>`).join('')}
                        </select>
                        <input type="number" id="step-count-select" placeholder="33" min="1" value="33"
                               style="flex: 1; padding: 0.75rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color); text-align: center;">
                        <button type="button" id="btn-add-step-select" style="padding: 0.75rem 1rem; border-radius: 12px; background: #667eea; color: white; border: none; font-weight: 700; cursor: pointer;">+</button>
                    </div>

                    <!-- OU Ajouter personnalisé -->
                    <div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; margin: 0.5rem 0;">— ou écrire un dhikr personnalisé —</div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color);">
                        <input type="text" id="step-custom-arabic" placeholder="Texte arabe" dir="rtl"
                               style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); text-align: right;">
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="step-custom-translit" placeholder="Translitération"
                                   style="flex: 2; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                            <input type="number" id="step-custom-count" placeholder="33" min="1" value="33"
                                   style="flex: 1; padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); text-align: center;">
                            <button type="button" id="btn-add-step-custom" style="padding: 0.5rem 1rem; border-radius: 8px; background: #10b981; color: white; border: none; font-weight: 700; cursor: pointer;">+</button>
                        </div>
                    </div>
                </div>
                
                <button type="button" id="btn-save-sequence" style="
                    width: 100%; padding: 1rem; border-radius: 12px;
                    background: ${this.sequenceSteps.length >= 2 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc'};
                    color: white; border: none; font-weight: 700; cursor: ${this.sequenceSteps.length >= 2 ? 'pointer' : 'not-allowed'};
                " ${this.sequenceSteps.length < 2 ? 'disabled' : ''}>
                    💾 Enregistrer la séquence ${this.sequenceSteps.length < 2 ? '(min 2 étapes)' : ''}
                </button>
            </div>
        `;
    }

    renderDhikrCard(p, isCustom) {
        const isActive = this.engine.currentDhikr?.id === p.id && !this.engine.isInSequence();
        
        return `
            <div style="position: relative;">
                <button type="button" data-action="select-preset" data-id="${p.id}" style="
                    width: 100%;
                    text-align: left; 
                    padding: 0.875rem; 
                    border-radius: 12px; 
                    border: 2px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'};
                    background: ${isActive ? 'var(--primary-light)' : 'var(--card-bg)'};
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                ">
                    <div style="flex: 1;">
                        <p style="font-weight: 700; color: var(--text-color); margin-bottom: 0.125rem;">${p.transliteration}</p>
                        <p class="font-arabic" style="font-size: 1.125rem; color: var(--primary-color);" dir="rtl">${p.arabic}</p>
                    </div>
                    <div style="text-align: center;">
                        <p style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color);">${p.target}</p>
                        <p style="font-size: 0.6rem; color: var(--text-muted);">fois</p>
                    </div>
                </button>
                ${isCustom ? `
                    <button type="button" data-action="delete-custom-dhikr" data-id="${p.id}" style="
                        position: absolute; bottom: 0.5rem; right: 0.5rem;
                        width: 24px; height: 24px; border-radius: 50%;
                        background: #ef4444; color: white; border: none;
                        font-size: 0.65rem; cursor: pointer;
                    ">🗑️</button>
                ` : ''}
            </div>
        `;
    }

    renderBottomNav(trans) {
        const modes = [
            { id: 'counter', icon: '🔘', label: 'Compteur' },
            { id: 'presets', icon: '📋', label: 'Liste' },
            { id: 'history', icon: '📜', label: 'Historique' }
        ];
        
        return `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: var(--card-bg); border-top: 1px solid var(--border-color); z-index: 100;">
                <div class="max-w-md mx-auto" style="display: flex; padding: 0.5rem;">
                    ${modes.map(mode => `
                        <button type="button" data-action="view-${mode.id}" style="
                            flex: 1; 
                            padding: 0.75rem 0.5rem; 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            gap: 0.25rem;
                            border-radius: 12px;
                            background: ${this.viewMode === mode.id ? 'var(--primary-light)' : 'transparent'};
                            color: ${this.viewMode === mode.id ? 'var(--primary-color)' : 'var(--text-muted)'};
                            font-weight: ${this.viewMode === mode.id ? '600' : '500'};
                            font-size: 0.75rem;
                            cursor: pointer;
                            border: none;
                        ">
                            <span style="font-size: 1.5rem;">${mode.icon}</span>
                            <span>${mode.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    updateProgressCircle() {
        const ring = document.getElementById('progress-ring');
        const counterDisplay = document.getElementById('counter-display');
        const totalDisplay = document.getElementById('total-count');
        
        if (ring && counterDisplay) {
            const progress = Math.min((this.engine.count / (this.engine.target || 33)) * 100, 100);
            const radius = 110;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (progress / 100) * circumference;
            
            ring.style.strokeDashoffset = offset;
            counterDisplay.innerText = this.engine.count;
            if (totalDisplay) totalDisplay.innerText = this.engine.totalCount;
        }
    }

    attachEventListeners(container) {
        // Gestionnaire pour le bouton TAP
        const tapButton = container.querySelector('[data-action="tap"]');
        if (tapButton) {
            let isProcessing = false;
            tapButton.onclick = (e) => {
                e.preventDefault();
                if (isProcessing) return;
                isProcessing = true;
                
                this.engine.increment();
                tapButton.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    tapButton.style.transform = 'scale(1)';
                    isProcessing = false;
                }, 100);
            };
        }

        // Bouton toggle formulaire
        const toggleFormBtn = container.querySelector('#btn-toggle-form');
        if (toggleFormBtn) {
            toggleFormBtn.onclick = (e) => {
                e.preventDefault();
                this.showAddForm = !this.showAddForm;
                this.addFormMode = 'single';
                this.sequenceSteps = [];
                this.render(container);
            };
        }

        // Boutons mode formulaire
        const btnModeSingle = container.querySelector('#btn-mode-single');
        const btnModeSequence = container.querySelector('#btn-mode-sequence');
        if (btnModeSingle) {
            btnModeSingle.onclick = () => {
                this.addFormMode = 'single';
                this.render(container);
            };
        }
        if (btnModeSequence) {
            btnModeSequence.onclick = () => {
                this.addFormMode = 'sequence';
                this.render(container);
            };
        }

        // Sauvegarder dhikr simple
        const btnSaveDhikr = container.querySelector('#btn-save-dhikr');
        if (btnSaveDhikr) {
            btnSaveDhikr.onclick = () => {
                const arabic = container.querySelector('#new-dhikr-arabic').value.trim();
                const translit = container.querySelector('#new-dhikr-translit').value.trim();
                const meaning = container.querySelector('#new-dhikr-meaning').value.trim();
                const target = parseInt(container.querySelector('#new-dhikr-target').value) || 33;
                
                if (!arabic || !translit) {
                    alert('Veuillez remplir le texte arabe et la translitération.');
                    return;
                }
                
                this.engine.addCustomDhikr({ arabic, transliteration: translit, meaning: meaning || translit, target });
                this.showAddForm = false;
                this.render(container);
            };
        }

        // Ajouter étape depuis sélection
        const btnAddStepSelect = container.querySelector('#btn-add-step-select');
        if (btnAddStepSelect) {
            btnAddStepSelect.onclick = () => {
                const select = container.querySelector('#step-dhikr-select');
                const countInput = container.querySelector('#step-count-select');
                const dhikrId = select.value;
                const count = parseInt(countInput.value) || 33;
                
                if (!dhikrId) {
                    alert('Sélectionnez un dhikr');
                    return;
                }
                
                const allDhikrs = [...this.engine.getCustomDhikrs(), ...this.engine.getPresets()];
                const dhikr = allDhikrs.find(d => d.id === dhikrId);
                
                if (dhikr) {
                    this.sequenceSteps.push({
                        dhikrId: dhikr.id,
                        transliteration: dhikr.transliteration,
                        arabic: dhikr.arabic,
                        meaning: dhikr.meaning,
                        count
                    });
                    this.render(container);
                }
            };
        }

        // Ajouter étape personnalisée
        const btnAddStepCustom = container.querySelector('#btn-add-step-custom');
        if (btnAddStepCustom) {
            btnAddStepCustom.onclick = () => {
                const arabic = container.querySelector('#step-custom-arabic').value.trim();
                const translit = container.querySelector('#step-custom-translit').value.trim();
                const count = parseInt(container.querySelector('#step-custom-count').value) || 33;
                
                if (!translit) {
                    alert('Veuillez au moins remplir la translitération');
                    return;
                }
                
                this.sequenceSteps.push({
                    dhikrId: 'custom_' + Date.now(),
                    transliteration: translit,
                    arabic: arabic || translit,
                    meaning: translit,
                    count
                });
                this.render(container);
            };
        }

        // Supprimer étape
        container.querySelectorAll('.btn-remove-step').forEach(btn => {
            btn.onclick = (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sequenceSteps.splice(index, 1);
                this.render(container);
            };
        });

        // Sauvegarder séquence
        const btnSaveSequence = container.querySelector('#btn-save-sequence');
        if (btnSaveSequence && !btnSaveSequence.disabled) {
            btnSaveSequence.onclick = () => {
                const name = container.querySelector('#sequence-name').value.trim();
                if (!name) {
                    alert('Donnez un nom à la séquence');
                    return;
                }
                if (this.sequenceSteps.length < 2) {
                    alert('Ajoutez au moins 2 étapes');
                    return;
                }
                
                this.engine.addSequence({ name, steps: this.sequenceSteps });
                this.showAddForm = false;
                this.sequenceSteps = [];
                this.render(container);
            };
        }

        // Actions générales via data-action
        container.querySelectorAll('[data-action]').forEach(el => {
            const action = el.dataset.action;
            
            // Ignorer tap (déjà géré)
            if (action === 'tap') return;
            
            el.onclick = (e) => {
                e.preventDefault();
                
                switch(action) {
                    case 'go-tools':
                        this.state.set('currentView', 'muslim-tools');
                        this.eventBus.emit('view:change', 'muslim-tools');
                        break;
                    case 'reset-counter':
                        if (this.engine.count > 0 && confirm('Réinitialiser ?')) {
                            this.engine.reset();
                            this.render(container);
                        }
                        break;
                    case 'view-counter':
                    case 'view-presets':
                    case 'view-history':
                        this.viewMode = action.replace('view-', '');
                        this.showAddForm = false;
                        this.render(container);
                        break;
                    case 'select-preset':
                        this.engine.setDhikr(el.dataset.id);
                        this.viewMode = 'counter';
                        this.render(container);
                        break;
                    case 'delete-custom-dhikr':
                        if (confirm('Supprimer ce dhikr ?')) {
                            this.engine.deleteCustomDhikr(el.dataset.id);
                            this.render(container);
                        }
                        break;
                    case 'start-sequence':
                        this.engine.startSequence(el.dataset.id);
                        this.viewMode = 'counter';
                        this.render(container);
                        break;
                    case 'delete-sequence':
                        if (confirm('Supprimer cette séquence ?')) {
                            this.engine.deleteSequence(el.dataset.id);
                            this.render(container);
                        }
                        break;
                    case 'skip-step':
                        this.engine.skipToNextStep();
                        this.render(container);
                        break;
                    case 'stop-sequence':
                        this.engine.stopSequence();
                        this.render(container);
                        break;
                }
            };
        });
    }
}
