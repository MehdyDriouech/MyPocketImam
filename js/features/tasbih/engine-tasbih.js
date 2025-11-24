export class TasbihEngine {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        
        // État interne du Tasbih
        this.count = 0;
        this.totalCount = 0;
        this.sessionCount = 0; // Pour l'historique
        this.target = 33;
        this.currentDhikr = null;
        this.presets = [];
        this.history = [];
        
        // Audio context pour le son "click" (optionnel)
        this.clickSound = null;
    }

    async init() {
        await this.loadPresets();
        this.loadState();
    }

    async loadPresets() {
        try {
            const response = await fetch('js/features/tasbih/data/tasbih-presets.json');
            this.presets = await response.json();
            // Par défaut le premier
            if (!this.currentDhikr && this.presets.length > 0) {
                this.setDhikr(this.presets[0].id);
            }
        } catch (e) {
            console.error('Erreur chargement presets tasbih:', e);
            // Fallback
            this.presets = [{
                id: "subhanallah",
                transliteration: "Subhanallah",
                target: 33
            }];
        }
    }

    loadState() {
        const saved = localStorage.getItem('mpi_tasbih_state');
        if (saved) {
            const data = JSON.parse(saved);
            this.count = data.count || 0;
            this.totalCount = data.totalCount || 0;
            this.target = data.target || 33;
            this.history = data.history || [];
            
            if (data.currentDhikrId) {
                this.setDhikr(data.currentDhikrId, false); // false = ne pas reset le count si c'est le chargement
            }
        }
    }

    saveState() {
        const data = {
            count: this.count,
            totalCount: this.totalCount,
            target: this.target,
            currentDhikrId: this.currentDhikr ? this.currentDhikr.id : null,
            history: this.history
        };
        localStorage.setItem('mpi_tasbih_state', JSON.stringify(data));
    }

    setDhikr(id, reset = true) {
        const dhikr = this.presets.find(p => p.id === id);
        if (dhikr) {
            this.currentDhikr = dhikr;
            this.target = dhikr.target;
            if (reset) {
                this.count = 0;
            }
            this.saveState();
            return true;
        }
        return false;
    }

    setTarget(newTarget) {
        this.target = parseInt(newTarget);
        this.saveState();
    }

    increment() {
        this.count++;
        this.totalCount++;
        
        // Feedback haptique
        if (navigator.vibrate) {
            navigator.vibrate(15); // Vibration courte
        }

        // Vérifier l'objectif
        if (this.target > 0 && this.count === this.target) {
            this.handleTargetReached();
        } else if (this.target > 0 && this.count > this.target) {
            // Cycle recommence ou continue
            // Optionnel : reset automatique ou continue
            // Ici on continue mais on vibre à chaque multiple ? 
            // Simple implementation: just continue
        }

        this.saveState();
        this.eventBus.emit('tasbih:count-updated', this.count);
    }

    decrement() {
        if (this.count > 0) {
            this.count--;
            this.totalCount--; // On décrémente aussi le total ? Discutable. Gardons logique simple.
            this.saveState();
            this.eventBus.emit('tasbih:count-updated', this.count);
        }
    }

    reset() {
        // Sauvegarder la session avant reset si significative (> 0)
        if (this.count > 0) {
            this.addToHistory(this.count);
        }
        
        this.count = 0;
        this.saveState();
        this.eventBus.emit('tasbih:count-updated', this.count);
    }

    handleTargetReached() {
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]); // Vibration distincte
        }
        this.eventBus.emit('tasbih:target-reached');
    }

    addToHistory(count) {
        const entry = {
            date: new Date().toISOString(),
            dhikr: this.currentDhikr ? this.currentDhikr.transliteration : 'Libre',
            count: count
        };
        
        // Garder les 50 dernières sessions
        this.history.unshift(entry);
        if (this.history.length > 50) {
            this.history.pop();
        }
    }

    getHistory() {
        return this.history;
    }

    getPresets() {
        return this.presets;
    }
}
