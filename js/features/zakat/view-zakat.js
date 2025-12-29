export class ZakatView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        
        // État de la vue
        this.currentTab = 'intro'; // intro, calculator, result, history
        this.showResult = false;
        this.isProcessing = false; // Protection contre les clics multiples
        this.currentCalculationSaved = false; // Marquer si le calcul actuel a été sauvegardé
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';
        const lang = this.state.get('language') || 'fr';

        container.innerHTML = `
        <div class="container" dir="${dirAttr}">
            ${this.renderHeader(trans, rtl)}
            
            <div class="zakat-content">
                ${this.renderTabs(trans)}
                
                <div class="zakat-tab-content">
                    ${this.currentTab === 'intro' ? this.renderIntro(trans, lang) : ''}
                    ${this.currentTab === 'calculator' ? this.renderCalculator(trans, lang) : ''}
                    ${this.currentTab === 'result' ? this.renderResult(trans, lang) : ''}
                    ${this.currentTab === 'history' ? this.renderHistory(trans, lang) : ''}
                </div>
            </div>
        </div>
        `;

        this.attachEventListeners(container);
    }

    renderHeader(trans, rtl) {
        return `
        <div class="app-header mb-8 rounded-xl">
            <button data-action="go-tools" class="btn btn-secondary">
                <span>${rtl ? '◀' : '▶'}</span>
                <span>${trans.back}</span>
            </button>
            <h1 class="app-title">${trans.zakatCalculator || 'Calculateur de Zakat'}</h1>
            <div style="width: 24px;"></div>
        </div>
        `;
    }

    renderTabs(trans) {
        const tabs = [
            { id: 'intro', label: trans.zakatIntro || 'Introduction', icon: '📖' },
            { id: 'calculator', label: trans.zakatCalc || 'Calculer', icon: '🧮' },
            { id: 'result', label: trans.zakatResult || 'Résultat', icon: '📊' },
            { id: 'history', label: trans.history || 'Historique', icon: '📜' }
        ];

        return `
        <div class="zakat-tabs">
            ${tabs.map(tab => `
                <button 
                    data-action="change-tab" 
                    data-tab="${tab.id}"
                    class="zakat-tab ${this.currentTab === tab.id ? 'active' : ''}"
                >
                    <span class="zakat-tab-icon">${tab.icon}</span>
                    <span class="zakat-tab-label">${tab.label}</span>
                </button>
            `).join('')}
        </div>
        `;
    }

    renderIntro(trans, lang) {
        const intro = this.engine.getIntro(lang);
        const disclaimer = this.engine.getDisclaimer(lang);
        const nisab = this.engine.getNisabValue();
        const prices = this.engine.getMetalPrices();
        const currency = this.engine.getCurrency();

        return `
        <div class="zakat-intro">
            <!-- Avertissement pédagogique -->
            <div class="zakat-disclaimer">
                <div class="zakat-disclaimer-icon">⚠️</div>
                <p>${disclaimer}</p>
            </div>

            <!-- Introduction -->
            <div class="zakat-card">
                <div class="zakat-card-header">
                    <span class="zakat-card-icon">🕌</span>
                    <h3>${trans.zakatAbout || 'Qu\'est-ce que la Zakat ?'}</h3>
                </div>
                <p class="zakat-intro-text">${intro}</p>
            </div>

            <!-- Nisab -->
            <div class="zakat-card">
                <div class="zakat-card-header">
                    <span class="zakat-card-icon">📏</span>
                    <h3>${trans.zakatNisab || 'Le Nisab (Seuil Minimum)'}</h3>
                </div>
                <div class="zakat-nisab-grid">
                    <div class="zakat-nisab-item gold">
                        <span class="nisab-icon">🥇</span>
                        <div class="nisab-info">
                            <span class="nisab-label">${trans.zakatGoldNisab || 'Nisab Or'}</span>
                            <span class="nisab-value">${nisab.goldGrams}g = ${this.engine.formatCurrency(nisab.gold)}</span>
                        </div>
                    </div>
                    <div class="zakat-nisab-item silver">
                        <span class="nisab-icon">🥈</span>
                        <div class="nisab-info">
                            <span class="nisab-label">${trans.zakatSilverNisab || 'Nisab Argent'}</span>
                            <span class="nisab-value">${nisab.silverGrams}g = ${this.engine.formatCurrency(nisab.silver)}</span>
                        </div>
                    </div>
                </div>
                <p class="zakat-nisab-note">
                    💡 ${trans.zakatNisabNote || 'Le nisab recommandé (le plus bas) est utilisé : '} 
                    <strong>${this.engine.formatCurrency(nisab.recommended)}</strong>
                </p>
            </div>

            <!-- Configuration des prix -->
            <div class="zakat-card">
                <div class="zakat-card-header">
                    <span class="zakat-card-icon">💰</span>
                    <h3>${trans.zakatPrices || 'Prix des métaux précieux'}</h3>
                </div>
                <p class="text-sm text-muted mb-4">${trans.zakatPricesNote || 'Ajustez les prix selon le marché actuel pour un calcul précis.'}</p>
                
                <div class="zakat-prices-form">
                    <div class="zakat-input-group">
                        <label>🥇 ${trans.zakatGoldPrice || 'Prix de l\'or (par gramme)'}</label>
                        <div class="zakat-input-wrapper">
                            <input type="number" id="gold-price" value="${prices.gold}" step="0.01" min="0" />
                            <span class="zakat-currency">${currency}</span>
                        </div>
                    </div>
                    <div class="zakat-input-group">
                        <label>🥈 ${trans.zakatSilverPrice || 'Prix de l\'argent (par gramme)'}</label>
                        <div class="zakat-input-wrapper">
                            <input type="number" id="silver-price" value="${prices.silver}" step="0.01" min="0" />
                            <span class="zakat-currency">${currency}</span>
                        </div>
                    </div>
                    <button data-action="update-prices" class="btn btn-secondary w-full">
                        💾 ${trans.zakatSavePrices || 'Mettre à jour les prix'}
                    </button>
                </div>
            </div>

            <!-- Bouton commencer -->
            <button data-action="start-calculator" class="btn btn-primary w-full zakat-start-btn">
                🧮 ${trans.zakatStartCalc || 'Commencer le calcul'}
            </button>
        </div>
        `;
    }

    renderCalculator(trans, lang) {
        const categories = this.engine.getCategories();
        const deductions = this.engine.getDeductions();
        const currency = this.engine.getCurrency();

        return `
        <div class="zakat-calculator">
            <!-- Rappel avertissement -->
            <div class="zakat-mini-disclaimer">
                ⚠️ ${trans.zakatMiniDisclaimer || 'Outil pédagogique - Estimation uniquement'}
            </div>

            <!-- Catégories d'actifs -->
            ${categories.map(cat => this.renderCategory(cat, lang, currency)).join('')}

            <!-- Déductions -->
            ${deductions ? `
            <div class="zakat-category deductions">
                <div class="zakat-category-header">
                    <span class="zakat-category-icon">${deductions.icon}</span>
                    <div class="zakat-category-info">
                        <h3>${deductions.label[lang] || deductions.label.fr}</h3>
                        <p>${deductions.description[lang] || deductions.description.fr}</p>
                    </div>
                </div>
                <div class="zakat-fields">
                    ${deductions.fields.map(field => `
                        <div class="zakat-field">
                            <label>${field.label[lang] || field.label.fr}</label>
                            <div class="zakat-input-wrapper">
                                <input 
                                    type="number" 
                                    data-field="${field.id}"
                                    value="${this.engine.getFieldValue(field.id) || ''}"
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                />
                                <span class="zakat-currency">${currency}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Boutons d'action -->
            <div class="zakat-actions">
                <button data-action="clear-form" class="btn btn-secondary">
                    🗑️ ${trans.zakatClear || 'Effacer'}
                </button>
                <button data-action="calculate" class="btn btn-primary">
                    🧮 ${trans.zakatCalculate || 'Calculer ma Zakat'}
                </button>
            </div>
        </div>
        `;
    }

    renderCategory(category, lang, currency) {
        return `
        <div class="zakat-category">
            <div class="zakat-category-header">
                <span class="zakat-category-icon">${category.icon}</span>
                <div class="zakat-category-info">
                    <h3>${category.label[lang] || category.label.fr}</h3>
                    <p>${category.description[lang] || category.description.fr}</p>
                </div>
            </div>
            <div class="zakat-fields">
                ${category.fields.map(field => `
                    <div class="zakat-field">
                        <label>${field.label[lang] || field.label.fr}</label>
                        <div class="zakat-input-wrapper">
                            <input 
                                type="number" 
                                data-field="${field.id}"
                                value="${this.engine.getFieldValue(field.id) || ''}"
                                placeholder="0"
                                step="0.01"
                                min="0"
                            />
                            <span class="zakat-currency">${currency}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    }

    renderResult(trans, lang) {
        const result = this.engine.getLastCalculation();
        
        if (!result) {
            return `
            <div class="zakat-no-result">
                <div class="zakat-no-result-icon">📊</div>
                <h3>${trans.zakatNoResult || 'Aucun calcul effectué'}</h3>
                <p>${trans.zakatNoResultDesc || 'Remplissez le formulaire pour voir votre estimation de Zakat.'}</p>
                <button data-action="go-calculator" class="btn btn-primary">
                    🧮 ${trans.zakatGoCalc || 'Aller au calculateur'}
                </button>
            </div>
            `;
        }

        const nisabStatus = result.isAboveNisab;

        return `
        <div class="zakat-result">
            <!-- Rappel avertissement -->
            <div class="zakat-mini-disclaimer">
                ⚠️ ${trans.zakatMiniDisclaimer || 'Outil pédagogique - Estimation uniquement'}
            </div>

            <!-- Résumé principal -->
            <div class="zakat-result-summary ${nisabStatus ? 'above-nisab' : 'below-nisab'}">
                <div class="zakat-result-icon">
                    ${nisabStatus ? '✅' : '❌'}
                </div>
                <div class="zakat-result-status">
                    ${nisabStatus 
                        ? `<h3>${trans.zakatAboveNisab || 'Zakat obligatoire'}</h3>
                           <p>${trans.zakatAboveNisabDesc || 'Votre patrimoine dépasse le nisab.'}</p>`
                        : `<h3>${trans.zakatBelowNisab || 'Zakat non obligatoire'}</h3>
                           <p>${trans.zakatBelowNisabDesc || 'Votre patrimoine est inférieur au nisab.'}</p>`
                    }
                </div>
            </div>

            <!-- Montant de la Zakat -->
            ${nisabStatus ? `
            <div class="zakat-amount-card">
                <span class="zakat-amount-label">${trans.zakatDue || 'Zakat à verser'}</span>
                <span class="zakat-amount-value">${this.engine.formatCurrency(result.zakatDue)}</span>
                <span class="zakat-amount-rate">(${result.rate}% ${trans.zakatOfNetWorth || 'du patrimoine net'})</span>
            </div>
            ` : ''}

            <!-- Décomposition -->
            <div class="zakat-breakdown">
                <h4>${trans.zakatBreakdown || 'Détail du calcul'}</h4>
                
                <div class="zakat-breakdown-items">
                    ${result.categories.map(cat => `
                        <div class="zakat-breakdown-item">
                            <span class="breakdown-icon">${cat.icon}</span>
                            <span class="breakdown-label">${cat.label[lang] || cat.label.fr}</span>
                            <span class="breakdown-value">${this.engine.formatCurrency(cat.total)}</span>
                        </div>
                    `).join('')}
                    
                    <div class="zakat-breakdown-subtotal">
                        <span>${trans.zakatTotalAssets || 'Total des actifs'}</span>
                        <span>${this.engine.formatCurrency(result.totalAssets)}</span>
                    </div>
                    
                    ${result.totalDeductions > 0 ? `
                    <div class="zakat-breakdown-item deduction">
                        <span class="breakdown-icon">➖</span>
                        <span class="breakdown-label">${trans.zakatDeductions || 'Dettes à déduire'}</span>
                        <span class="breakdown-value">-${this.engine.formatCurrency(result.totalDeductions)}</span>
                    </div>
                    ` : ''}
                    
                    <div class="zakat-breakdown-total">
                        <span>${trans.zakatNetWorth || 'Patrimoine net'}</span>
                        <span>${this.engine.formatCurrency(result.netWorth)}</span>
                    </div>
                    
                    <div class="zakat-breakdown-nisab">
                        <span>${trans.zakatNisabUsed || 'Nisab utilisé'}</span>
                        <span>${this.engine.formatCurrency(result.nisab.recommended)}</span>
                    </div>
                </div>
            </div>

            <!-- Actions -->
            <div class="zakat-result-actions">
                <button data-action="save-to-history" class="btn btn-secondary" ${this.currentCalculationSaved ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    ${this.currentCalculationSaved ? '✅' : '💾'} ${this.currentCalculationSaved ? (trans.zakatSaved || 'Sauvegardé') : (trans.zakatSave || 'Sauvegarder')}
                </button>
                <button data-action="recalculate" class="btn btn-primary">
                    🔄 ${trans.zakatRecalculate || 'Modifier'}
                </button>
            </div>
        </div>
        `;
    }

    renderHistory(trans, lang) {
        const history = this.engine.getHistory();

        if (history.length === 0) {
            return `
            <div class="zakat-no-history">
                <div class="zakat-no-history-icon">📜</div>
                <h3>${trans.zakatNoHistory || 'Aucun historique'}</h3>
                <p>${trans.zakatNoHistoryDesc || 'Vos calculs sauvegardés apparaîtront ici.'}</p>
            </div>
            `;
        }

        return `
        <div class="zakat-history">
            <div class="zakat-history-header">
                <h3>${trans.zakatHistoryTitle || 'Historique des calculs'}</h3>
                <button data-action="clear-history" class="btn btn-secondary btn-sm">
                    🗑️ ${trans.zakatClearHistory || 'Effacer tout'}
                </button>
            </div>
            
            <div class="zakat-history-list">
                ${history.map(entry => `
                    <div class="zakat-history-item" data-id="${entry.id}">
                        <div class="zakat-history-date">
                            <span class="history-icon">📅</span>
                            <span>${this.engine.formatDate(entry.date)}</span>
                        </div>
                        <div class="zakat-history-details">
                            <div class="history-row">
                                <span>${trans.zakatNetWorth || 'Patrimoine net'}</span>
                                <span>${this.engine.formatCurrency(entry.netWorth)}</span>
                            </div>
                            <div class="history-row highlight">
                                <span>${trans.zakatDue || 'Zakat due'}</span>
                                <span class="history-zakat">${this.engine.formatCurrency(entry.zakatDue)}</span>
                            </div>
                        </div>
                        <div class="zakat-history-actions">
                            <button data-action="load-from-history" data-id="${entry.id}" class="btn btn-sm">
                                📂 ${trans.zakatLoad || 'Charger'}
                            </button>
                            <button data-action="delete-from-history" data-id="${entry.id}" class="btn btn-sm btn-danger">
                                🗑️
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        `;
    }

    attachEventListeners(container) {
        // Navigation et actions
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch (action) {
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;

                case 'change-tab':
                    this.currentTab = target.dataset.tab;
                    this.eventBus.emit('view:refresh');
                    break;

                case 'start-calculator':
                case 'go-calculator':
                    this.currentTab = 'calculator';
                    this.eventBus.emit('view:refresh');
                    break;

                case 'update-prices':
                    this.handleUpdatePrices(container);
                    break;

                case 'clear-form':
                    this.engine.clearInputs();
                    this.eventBus.emit('view:refresh');
                    break;

                case 'calculate':
                    this.handleCalculate(container);
                    break;

                case 'recalculate':
                    this.currentTab = 'calculator';
                    this.eventBus.emit('view:refresh');
                    break;

                case 'save-to-history':
                    // Protection contre les clics multiples et les doublons
                    if (this.isProcessing || this.currentCalculationSaved) return;
                    this.isProcessing = true;
                    this.currentCalculationSaved = true;
                    
                    this.engine.saveToHistory();
                    this.currentTab = 'history';
                    
                    setTimeout(() => {
                        this.isProcessing = false;
                        this.eventBus.emit('view:refresh');
                    }, 100);
                    break;

                case 'load-from-history':
                    this.engine.loadFromHistory(target.dataset.id);
                    this.currentTab = 'calculator';
                    this.eventBus.emit('view:refresh');
                    break;

                case 'delete-from-history':
                    this.engine.deleteFromHistory(target.dataset.id);
                    this.eventBus.emit('view:refresh');
                    break;

                case 'clear-history':
                    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
                        this.engine.clearHistory();
                        this.eventBus.emit('view:refresh');
                    }
                    break;
            }
        });

        // Gestion des inputs
        container.addEventListener('input', (e) => {
            const input = e.target.closest('input[data-field]');
            if (input) {
                this.engine.setFieldValue(input.dataset.field, input.value);
            }
        });
    }

    handleUpdatePrices(container) {
        const goldInput = container.querySelector('#gold-price');
        const silverInput = container.querySelector('#silver-price');
        
        if (goldInput && silverInput) {
            this.engine.setMetalPrices(goldInput.value, silverInput.value);
            this.eventBus.emit('view:refresh');
        }
    }

    handleCalculate(container) {
        // Sauvegarder toutes les valeurs des inputs
        const inputs = container.querySelectorAll('input[data-field]');
        inputs.forEach(input => {
            this.engine.setFieldValue(input.dataset.field, input.value);
        });

        // Calculer
        this.engine.calculateZakat();
        
        // Réinitialiser le flag de sauvegarde pour le nouveau calcul
        this.currentCalculationSaved = false;
        
        // Afficher le résultat
        this.currentTab = 'result';
        this.eventBus.emit('view:refresh');
    }
}

