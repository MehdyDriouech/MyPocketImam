export class ZakatEngine {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        
        // Configuration
        this.config = null;
        this.nisabGold = 85; // grammes
        this.nisabSilver = 595; // grammes
        this.rate = 2.5; // %
        
        // Données utilisateur
        this.userInputs = {};
        this.lastCalculation = null;
        this.history = [];
        
        // Prix des métaux (valeurs par défaut, peuvent être mises à jour)
        this.goldPricePerGram = 70; // EUR par défaut
        this.silverPricePerGram = 0.85; // EUR par défaut
        this.currency = 'EUR';
    }

    async init() {
        await this.loadConfig();
        this.loadState();
    }

    async loadConfig() {
        try {
            const response = await fetch('assets/data/zakat-config.json');
            this.config = await response.json();
            this.nisabGold = this.config.nisab.gold.grams;
            this.nisabSilver = this.config.nisab.silver.grams;
            this.rate = this.config.rate;
        } catch (e) {
            console.error('Erreur chargement config zakat:', e);
        }
    }

    loadState() {
        const saved = localStorage.getItem('mpi_zakat_state');
        if (saved) {
            const data = JSON.parse(saved);
            this.userInputs = data.userInputs || {};
            this.history = data.history || [];
            this.goldPricePerGram = data.goldPricePerGram || 70;
            this.silverPricePerGram = data.silverPricePerGram || 0.85;
            this.currency = data.currency || 'EUR';
        }
    }

    saveState() {
        const data = {
            userInputs: this.userInputs,
            history: this.history,
            goldPricePerGram: this.goldPricePerGram,
            silverPricePerGram: this.silverPricePerGram,
            currency: this.currency
        };
        localStorage.setItem('mpi_zakat_state', JSON.stringify(data));
    }

    // === Configuration ===
    
    getConfig() {
        return this.config;
    }

    getCategories() {
        return this.config?.categories || [];
    }

    getDeductions() {
        return this.config?.deductions || null;
    }

    getDisclaimer(lang = 'fr') {
        return this.config?.disclaimer?.[lang] || this.config?.disclaimer?.fr || '';
    }

    getIntro(lang = 'fr') {
        return this.config?.intro?.[lang] || this.config?.intro?.fr || '';
    }

    // === Prix des métaux ===
    
    setMetalPrices(goldPrice, silverPrice) {
        this.goldPricePerGram = parseFloat(goldPrice) || 70;
        this.silverPricePerGram = parseFloat(silverPrice) || 0.85;
        this.saveState();
    }

    getMetalPrices() {
        return {
            gold: this.goldPricePerGram,
            silver: this.silverPricePerGram
        };
    }

    setCurrency(currency) {
        this.currency = currency;
        this.saveState();
    }

    getCurrency() {
        return this.currency;
    }

    // === Nisab ===
    
    getNisabValue() {
        // On utilise le nisab de l'argent (le plus bas) par défaut
        // car c'est plus favorable aux pauvres
        const goldNisab = this.nisabGold * this.goldPricePerGram;
        const silverNisab = this.nisabSilver * this.silverPricePerGram;
        
        return {
            gold: goldNisab,
            silver: silverNisab,
            recommended: Math.min(goldNisab, silverNisab),
            goldGrams: this.nisabGold,
            silverGrams: this.nisabSilver
        };
    }

    // === Saisie utilisateur ===
    
    setUserInputs(formData) {
        this.userInputs = { ...formData };
        this.saveState();
    }

    getUserInputs() {
        return this.userInputs;
    }

    setFieldValue(fieldId, value) {
        this.userInputs[fieldId] = parseFloat(value) || 0;
        this.saveState();
    }

    getFieldValue(fieldId) {
        return this.userInputs[fieldId] || 0;
    }

    clearInputs() {
        this.userInputs = {};
        this.saveState();
    }

    // === Calcul de la Zakat ===
    
    calculateZakat() {
        const breakdown = {
            categories: [],
            totalAssets: 0,
            totalDeductions: 0,
            netWorth: 0,
            nisab: this.getNisabValue(),
            isAboveNisab: false,
            zakatDue: 0,
            rate: this.rate
        };

        // Calculer les actifs par catégorie
        if (this.config?.categories) {
            for (const category of this.config.categories) {
                let categoryTotal = 0;
                const fieldValues = [];

                for (const field of category.fields) {
                    const value = this.getFieldValue(field.id);
                    categoryTotal += value;
                    fieldValues.push({
                        id: field.id,
                        label: field.label,
                        value: value
                    });
                }

                breakdown.categories.push({
                    id: category.id,
                    icon: category.icon,
                    label: category.label,
                    total: categoryTotal,
                    fields: fieldValues
                });

                breakdown.totalAssets += categoryTotal;
            }
        }

        // Calculer les déductions
        if (this.config?.deductions) {
            for (const field of this.config.deductions.fields) {
                const value = this.getFieldValue(field.id);
                breakdown.totalDeductions += value;
            }
        }

        // Calculer la valeur nette
        breakdown.netWorth = breakdown.totalAssets - breakdown.totalDeductions;

        // Vérifier si au-dessus du nisab
        breakdown.isAboveNisab = breakdown.netWorth >= breakdown.nisab.recommended;

        // Calculer la Zakat due
        if (breakdown.isAboveNisab) {
            breakdown.zakatDue = (breakdown.netWorth * this.rate) / 100;
        }

        this.lastCalculation = breakdown;
        return breakdown;
    }

    getLastCalculation() {
        return this.lastCalculation;
    }

    // === Historique ===
    
    saveToHistory() {
        if (!this.lastCalculation) return;

        const entry = {
            id: 'calc_' + Date.now(),
            date: new Date().toISOString(),
            totalAssets: this.lastCalculation.totalAssets,
            totalDeductions: this.lastCalculation.totalDeductions,
            netWorth: this.lastCalculation.netWorth,
            zakatDue: this.lastCalculation.zakatDue,
            nisabUsed: this.lastCalculation.nisab.recommended,
            currency: this.currency,
            inputs: { ...this.userInputs }
        };

        this.history.unshift(entry);
        
        // Garder seulement les 20 derniers calculs
        if (this.history.length > 20) {
            this.history.pop();
        }

        this.saveState();
        this.eventBus.emit('zakat:saved-to-history', entry);
        
        return entry;
    }

    getHistory() {
        return this.history;
    }

    deleteFromHistory(id) {
        const index = this.history.findIndex(h => h.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            this.saveState();
            return true;
        }
        return false;
    }

    clearHistory() {
        this.history = [];
        this.saveState();
    }

    loadFromHistory(id) {
        const entry = this.history.find(h => h.id === id);
        if (entry && entry.inputs) {
            this.userInputs = { ...entry.inputs };
            this.saveState();
            return true;
        }
        return false;
    }

    // === Utilitaires ===
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    formatDate(isoDate) {
        return new Date(isoDate).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

