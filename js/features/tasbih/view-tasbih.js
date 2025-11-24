export class TasbihView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        
        this.viewMode = 'counter'; // 'counter', 'history', 'presets'
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();

        // Layout principal avec fond dégradé élégant
        container.innerHTML = `
            <div class="tasbih-container" style="min-height: 100vh; background: var(--bg-color); position: relative; overflow: hidden;">
                <!-- Pattern de fond subtil -->
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
            <div class="flex items-center justify-between mb-6" dir="${rtl ? 'rtl' : 'ltr'}" style="position: relative; z-index: 10;">
                <button data-action="go-tools" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 500;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="${rtl ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}"/>
                    </svg>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <h1 class="text-xl font-bold" style="color: var(--heading-color); letter-spacing: -0.02em;">📿 ${trans.tasbihDigital || 'Tasbih Digital'}</h1>
                <div style="width: 80px;"></div>
            </div>
        `;
    }

    renderContent(trans) {
        if (this.viewMode === 'history') return this.renderHistoryList(trans);
        if (this.viewMode === 'presets') return this.renderPresetsList(trans);
        return this.renderCounter(trans);
    }

    renderCounter(trans) {
        const dhikr = this.engine.currentDhikr || { transliteration: 'Tasbih', arabic: 'تسبيح', meaning: 'Gloire à Allah' };
        const progress = Math.min((this.engine.count / (this.engine.target || 33)) * 100, 100);
        
        const radius = 110;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;

        return `
            <div class="flex-1 flex flex-col items-center justify-center" style="gap: 2rem; animation: fadeIn 0.3s ease-in;">
                
                <!-- Card Dhikr Info -->
                <div class="card" style="width: 100%; max-width: 380px; padding: 1.5rem; text-align: center; border: 2px solid var(--primary-light); background: linear-gradient(135deg, var(--card-bg) 0%, var(--primary-light) 100%);">
                    <p class="text-4xl font-arabic font-bold mb-2" style="color: var(--primary-color); line-height: 1.4;" dir="rtl">${dhikr.arabic}</p>
                    <p class="text-lg font-semibold mb-1" style="color: var(--text-color);">${dhikr.transliteration}</p>
                    <p class="text-sm italic" style="color: var(--text-muted);">${dhikr.meaning}</p>
                </div>

                <!-- Zone de Tap avec cercle de progression -->
                <div style="position: relative; width: 280px; height: 280px; display: flex; align-items: center; justify-center; margin: 1rem 0;">
                    
                    <!-- Anneau externe décoratif -->
                    <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, var(--primary-light) 0%, transparent 50%); opacity: 0.3;"></div>
                    
                    <!-- SVG Progress Circle -->
                    <svg style="position: absolute; width: 100%; height: 100%; transform: rotate(-90deg); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));" viewBox="0 0 240 240">
                        <!-- Cercle de fond -->
                        <circle cx="120" cy="120" r="${radius}" stroke="var(--border-color)" stroke-width="14" fill="none" opacity="0.3"/>
                        <!-- Cercle de progression -->
                        <circle id="progress-ring" cx="120" cy="120" r="${radius}" 
                                stroke="url(#gradient)" 
                                stroke-width="14" 
                                fill="none" 
                                stroke-dasharray="${circumference}" 
                                stroke-dashoffset="${offset}" 
                                stroke-linecap="round"
                                style="transition: stroke-dashoffset 0.3s ease-out;" />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color: var(--primary-color); stop-opacity: 1" />
                                <stop offset="100%" style="stop-color: var(--accent-color); stop-opacity: 1" />
                            </linearGradient>
                        </defs>
                    </svg>

                    <!-- Bouton Tap Central -->
                    <button data-action="tap" 
                            class="tap-button"
                            style="
                                width: 200px; 
                                height: 200px; 
                                border-radius: 50%; 
                                background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%);
                                color: white;
                                border: none;
                                box-shadow: 0 8px 16px rgba(0,0,0,0.15), inset 0 -2px 8px rgba(0,0,0,0.1);
                                cursor: pointer;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                transition: transform 0.1s ease, box-shadow 0.1s ease;
                                position: relative;
                                z-index: 10;
                                user-select: none;
                                -webkit-tap-highlight-color: transparent;
                            "
                            onmousedown="this.style.transform='scale(0.95)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                            onmouseup="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.15)'"
                            ontouchstart="this.style.transform='scale(0.95)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)'"
                            ontouchend="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.15)'">
                        <span style="font-size: 0.75rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">TAP</span>
                        <span id="counter-display" style="font-size: 4rem; font-weight: 700; font-family: 'Courier New', monospace; line-height: 1;">${this.engine.count}</span>
                        <span style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.25rem;">${trans.target || 'Objectif'}: ${this.engine.target}</span>
                    </button>
                </div>

                <!-- Stats Cards -->
                <div style="width: 100%; max-width: 380px; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <!-- Total Counter -->
                    <div class="card" style="padding: 1rem; text-align: center; border-left: 4px solid var(--primary-color);">
                        <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">Total</p>
                        <p id="total-count" style="font-size: 1.75rem; font-weight: 700; color: var(--primary-color); font-family: 'Courier New', monospace;">${this.engine.totalCount}</p>
                    </div>
                    <!-- Progress -->
                    <div class="card" style="padding: 1rem; text-align: center; border-left: 4px solid var(--accent-color);">
                        <p style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">Progrès</p>
                        <p style="font-size: 1.75rem; font-weight: 700; color: var(--accent-color); font-family: 'Courier New', monospace;">${Math.round(progress)}%</p>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="width: 100%; max-width: 380px; display: flex; gap: 0.75rem; margin-top: 0.5rem;">
                    <button data-action="reset-counter" class="btn" style="flex: 1; background: var(--card-bg); color: var(--text-color); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                            <path d="M21 3v5h-5"/>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                            <path d="M3 21v-5h5"/>
                        </svg>
                        ${trans.reset || 'Réinitialiser'}
                    </button>
                    <button data-action="view-presets" class="btn" style="flex: 1; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"/>
                            <rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/>
                        </svg>
                        ${trans.presets || 'Dhikr'}
                    </button>
                </div>
            </div>
        `;
    }

    renderHistoryList(trans) {
        const history = this.engine.getHistory();
        return `
            <div class="flex-1 overflow-y-auto" style="padding: 0 0.5rem; animation: fadeIn 0.3s ease-in;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                    <h2 class="text-2xl font-bold" style="color: var(--heading-color);">
                        📜 ${trans.history || 'Historique'}
                    </h2>
                    <span style="color: var(--text-muted); font-size: 0.875rem;">${history.length} session${history.length > 1 ? 's' : ''}</span>
                </div>
                
                ${history.length === 0 ? 
                    `<div class="card" style="padding: 3rem 2rem; text-align: center;">
                        <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;">📜</div>
                        <p style="color: var(--text-muted); font-size: 1rem;">${trans.noHistory || 'Aucune session enregistrée'}</p>
                        <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">Complétez un dhikr pour commencer</p>
                    </div>` : 
                    `<div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${history.map((h, index) => `
                            <div class="card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--primary-color); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default;"
                                 onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='var(--shadow-md)'"
                                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='var(--shadow-sm)'">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <span style="font-size: 1.25rem;">✨</span>
                                        <p style="font-weight: 700; color: var(--text-color); font-size: 1rem;">${h.dhikr}</p>
                                    </div>
                                    <p style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                        ${new Date(h.date).toLocaleDateString()} à ${new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <div style="text-align: center; padding: 0.5rem 1rem; border-radius: 12px; background: var(--primary-light);">
                                    <p style="font-size: 1.75rem; font-weight: 700; color: var(--primary-color); font-family: 'Courier New', monospace; line-height: 1;">${h.count}</p>
                                    <p style="font-size: 0.65rem; color: var(--primary-color); opacity: 0.8; text-transform: uppercase; letter-spacing: 0.05em;">dhikr</p>
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
        return `
            <div class="flex-1 overflow-y-auto" style="padding: 0 0.5rem; animation: fadeIn 0.3s ease-in;">
                <div style="margin-bottom: 1.5rem;">
                    <h2 class="text-2xl font-bold" style="color: var(--heading-color); margin-bottom: 0.5rem;">
                        ✨ ${trans.presets || 'Dhikr Prédéfinis'}
                    </h2>
                    <p style="color: var(--text-muted); font-size: 0.875rem;">Choisissez un dhikr pour commencer</p>
                </div>
                
                <div style="display: grid; gap: 1rem;">
                    ${presets.map((p, index) => {
                        const isActive = this.engine.currentDhikr?.id === p.id;
                        const colors = ['#00695c', '#d4af37', '#7b1fa2', '#1976d2', '#c2185b', '#f57c00'];
                        const color = colors[index % colors.length];
                        
                        return `
                        <button data-action="select-preset" data-id="${p.id}" 
                                class="preset-card"
                                style="
                                    text-align: left; 
                                    padding: 1.25rem; 
                                    border-radius: 16px; 
                                    border: 2px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'};
                                    background: ${isActive ? 'var(--primary-light)' : 'var(--card-bg)'};
                                    transition: all 0.2s ease;
                                    cursor: pointer;
                                    position: relative;
                                    overflow: hidden;
                                "
                                onmouseover="if(!${isActive}) { this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)'; }"
                                onmouseout="if(!${isActive}) { this.style.borderColor='var(--border-color)'; this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'; }">
                            
                            <!-- Décoration de fond -->
                            <div style="position: absolute; top: -20px; right: -20px; width: 100px; height: 100px; background: ${color}; opacity: 0.05; border-radius: 50%;"></div>
                            
                            <!-- Contenu -->
                            <div style="position: relative; z-index: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 40px; height: 40px; border-radius: 12px; background: ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; font-weight: 700;">
                                            ${index + 1}
                                        </div>
                                        <div>
                                            <p style="font-size: 1.125rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.125rem;">${p.transliteration}</p>
                                            <p style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
                                                🎯 ${trans.target || 'Objectif'}: <span style="font-weight: 600; color: var(--primary-color);">${p.target}x</span>
                                            </p>
                                        </div>
                                    </div>
                                    ${isActive ? `
                                        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem;">
                                            ✓
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <p class="font-arabic" style="font-size: 1.75rem; color: var(--primary-color); font-weight: 600; margin-bottom: 0.5rem; text-align: right; line-height: 1.4;" dir="rtl">${p.arabic}</p>
                                <p style="font-size: 0.875rem; color: var(--text-muted); font-style: italic; line-height: 1.4;">${p.meaning}</p>
                            </div>
                        </button>
                    `}).join('')}
                </div>
            </div>
        `;
    }

    renderBottomNav(trans) {
        return `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; background: var(--card-bg); border-top: 1px solid var(--border-color); box-shadow: 0 -4px 12px rgba(0,0,0,0.05); z-index: 100; backdrop-filter: blur(10px);">
                <div class="max-w-md mx-auto" style="display: flex; padding: 0.5rem;">
                    ${['counter', 'presets', 'history'].map(mode => {
                        const isActive = this.viewMode === mode;
                        const icons = { counter: '🔘', presets: '📋', history: '📜' };
                        const labels = { counter: 'Compteur', presets: 'Liste', history: 'Historique' };
                        
                        return `
                        <button data-action="view-${mode}" 
                                style="
                                    flex: 1; 
                                    padding: 0.75rem 0.5rem; 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center; 
                                    justify-content: center; 
                                    gap: 0.25rem;
                                    border-radius: 12px;
                                    background: ${isActive ? 'var(--primary-light)' : 'transparent'};
                                    color: ${isActive ? 'var(--primary-color)' : 'var(--text-muted)'};
                                    font-weight: ${isActive ? '600' : '500'};
                                    font-size: 0.75rem;
                                    transition: all 0.2s ease;
                                    cursor: pointer;
                                    border: none;
                                "
                                onmouseover="if(!${isActive}) this.style.background='var(--bg-color)'"
                                onmouseout="if(!${isActive}) this.style.background='transparent'">
                            <span style="font-size: 1.5rem;">${icons[mode]}</span>
                            <span style="letter-spacing: 0.02em;">${labels[mode]}</span>
                        </button>
                    `}).join('')}
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
        // Variable pour éviter les doubles clics
        let isProcessing = false;
        
        // Gestionnaire pour le bouton TAP (avec debounce)
        const handleTap = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (isProcessing) return;
            isProcessing = true;
            
            this.engine.increment();
            
            // Animation
            const tapBtn = e.currentTarget;
            tapBtn.style.animation = 'none';
            setTimeout(() => {
                tapBtn.style.animation = '';
            }, 10);
            
            setTimeout(() => {
                isProcessing = false;
            }, 100);
        };
        
        // Attacher l'événement au bouton TAP uniquement
        const tapButton = container.querySelector('[data-action="tap"]');
        if (tapButton) {
            tapButton.addEventListener('click', handleTap);
        }
        
        // Gestionnaire pour les autres actions
        container.addEventListener('click', (e) => {
            // Ignorer si c'est le bouton tap
            if (e.target.closest('[data-action="tap"]')) {
                return;
            }

            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch(action) {
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;
                case 'reset-counter':
                    const trans = this.translations.getAll();
                    if (this.engine.count > 0) {
                        if (confirm('Réinitialiser le compteur ? La session sera sauvegardée dans l\'historique.')) {
                            this.engine.reset();
                            this.render(container);
                        }
                    }
                    break;
                case 'view-counter':
                case 'view-presets':
                case 'view-history':
                    this.viewMode = action.replace('view-', '');
                    this.render(container);
                    break;
                case 'select-preset':
                    const id = target.dataset.id;
                    this.engine.setDhikr(id);
                    this.viewMode = 'counter';
                    this.render(container);
                    break;
            }
        });

        this.eventBus.on('tasbih:count-updated', () => {
            if (this.viewMode === 'counter') {
                this.updateProgressCircle();
            }
        });

        this.eventBus.on('tasbih:target-reached', () => {
            const btn = container.querySelector('[data-action="tap"]');
            if (btn) {
                btn.style.animation = 'pulse 0.4s ease-in-out';
                
                // Confetti effect (simple)
                const colors = ['#ffd700', '#00ff00', '#00bfff', '#ff69b4'];
                for(let i = 0; i < 20; i++) {
                    setTimeout(() => {
                        const confetti = document.createElement('div');
                        confetti.style.position = 'fixed';
                        confetti.style.left = Math.random() * 100 + '%';
                        confetti.style.top = '50%';
                        confetti.style.width = '10px';
                        confetti.style.height = '10px';
                        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                        confetti.style.borderRadius = '50%';
                        confetti.style.pointerEvents = 'none';
                        confetti.style.zIndex = '9999';
                        confetti.style.animation = 'confetti 1s ease-out forwards';
                        document.body.appendChild(confetti);
                        setTimeout(() => confetti.remove(), 1000);
                    }, i * 30);
                }
            }
        });
    }
}
