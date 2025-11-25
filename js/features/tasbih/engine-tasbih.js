export class TasbihEngine {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        
        // État interne du Tasbih
        this.count = 0;
        this.totalCount = 0;
        this.target = 33;
        this.currentDhikr = null;
        this.presets = [];
        this.customDhikrs = [];
        this.sequences = [];
        this.history = [];
        
        // État de la séquence en cours
        this.activeSequence = null;
        this.currentSequenceStep = 0;
    }

    async init() {
        await this.loadPresets();
        this.loadCustomDhikrs();
        this.loadSequences();
        this.loadState();
    }

    async loadPresets() {
        try {
            const response = await fetch('js/features/tasbih/data/tasbih-presets.json');
            this.presets = await response.json();
            if (!this.currentDhikr && this.presets.length > 0) {
                this.setDhikr(this.presets[0].id);
            }
        } catch (e) {
            console.error('Erreur chargement presets tasbih:', e);
            this.presets = [{
                id: "subhanallah",
                transliteration: "SubhanAllah",
                arabic: "سُبْحَانَ اللّٰه",
                meaning: "Gloire à Allah",
                target: 33
            }];
        }
    }

    loadCustomDhikrs() {
        const saved = localStorage.getItem('mpi_custom_dhikrs');
        if (saved) {
            this.customDhikrs = JSON.parse(saved);
        }
    }

    saveCustomDhikrs() {
        localStorage.setItem('mpi_custom_dhikrs', JSON.stringify(this.customDhikrs));
    }

    loadSequences() {
        const saved = localStorage.getItem('mpi_tasbih_sequences');
        if (saved) {
            this.sequences = JSON.parse(saved);
        }
    }

    saveSequences() {
        localStorage.setItem('mpi_tasbih_sequences', JSON.stringify(this.sequences));
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
                this.setDhikr(data.currentDhikrId, false);
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

    // === Gestion des Dhikrs ===
    
    getAllDhikrs() {
        return [...this.customDhikrs, ...this.presets];
    }

    getCustomDhikrs() {
        return this.customDhikrs;
    }

    getPresets() {
        return this.presets;
    }

    addCustomDhikr(dhikr) {
        const newDhikr = {
            id: 'custom_' + Date.now(),
            transliteration: dhikr.transliteration,
            arabic: dhikr.arabic,
            meaning: dhikr.meaning || dhikr.transliteration,
            target: dhikr.target || 33,
            isCustom: true
        };
        
        this.customDhikrs.push(newDhikr);
        this.saveCustomDhikrs();
        return newDhikr;
    }

    deleteCustomDhikr(id) {
        const index = this.customDhikrs.findIndex(d => d.id === id);
        if (index !== -1) {
            this.customDhikrs.splice(index, 1);
            this.saveCustomDhikrs();
            
            if (this.currentDhikr && this.currentDhikr.id === id) {
                if (this.presets.length > 0) {
                    this.setDhikr(this.presets[0].id);
                }
            }
            return true;
        }
        return false;
    }

    setDhikr(id, reset = true) {
        let dhikr = this.customDhikrs.find(p => p.id === id);
        if (!dhikr) {
            dhikr = this.presets.find(p => p.id === id);
        }
        
        if (dhikr) {
            // Arrêter toute séquence en cours
            this.activeSequence = null;
            this.currentSequenceStep = 0;
            
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

    // === Gestion des Séquences ===
    
    getSequences() {
        return this.sequences;
    }

    addSequence(sequence) {
        const newSequence = {
            id: 'seq_' + Date.now(),
            name: sequence.name,
            steps: sequence.steps.map(step => ({
                dhikrId: step.dhikrId,
                transliteration: step.transliteration,
                arabic: step.arabic,
                meaning: step.meaning,
                count: step.count
            })),
            createdAt: new Date().toISOString()
        };
        
        this.sequences.push(newSequence);
        this.saveSequences();
        return newSequence;
    }

    deleteSequence(id) {
        const index = this.sequences.findIndex(s => s.id === id);
        if (index !== -1) {
            this.sequences.splice(index, 1);
            this.saveSequences();
            
            // Si c'était la séquence active, l'arrêter
            if (this.activeSequence && this.activeSequence.id === id) {
                this.stopSequence();
            }
            return true;
        }
        return false;
    }

    startSequence(id) {
        const sequence = this.sequences.find(s => s.id === id);
        if (sequence && sequence.steps.length > 0) {
            this.activeSequence = sequence;
            this.currentSequenceStep = 0;
            this.loadSequenceStep(0);
            return true;
        }
        return false;
    }

    loadSequenceStep(stepIndex) {
        if (!this.activeSequence || stepIndex >= this.activeSequence.steps.length) {
            return false;
        }
        
        const step = this.activeSequence.steps[stepIndex];
        this.currentDhikr = {
            id: step.dhikrId,
            transliteration: step.transliteration,
            arabic: step.arabic,
            meaning: step.meaning,
            target: step.count
        };
        this.target = step.count;
        this.count = 0;
        this.currentSequenceStep = stepIndex;
        
        return true;
    }

    nextSequenceStep() {
        if (!this.activeSequence) return false;
        
        const nextStep = this.currentSequenceStep + 1;
        if (nextStep < this.activeSequence.steps.length) {
            this.loadSequenceStep(nextStep);
            return true;
        } else {
            // Séquence terminée
            this.stopSequence();
            this.eventBus.emit('tasbih:sequence-complete');
            return false;
        }
    }

    skipToNextStep() {
        if (!this.activeSequence) return false;
        return this.nextSequenceStep();
    }

    stopSequence() {
        this.activeSequence = null;
        this.currentSequenceStep = 0;
        
        // Revenir au premier preset
        if (this.presets.length > 0) {
            this.setDhikr(this.presets[0].id);
        }
    }

    isInSequence() {
        return this.activeSequence !== null;
    }

    getSequenceInfo() {
        if (!this.activeSequence) {
            return null;
        }
        
        return {
            id: this.activeSequence.id,
            name: this.activeSequence.name,
            steps: this.activeSequence.steps,
            currentStep: this.currentSequenceStep,
            totalSteps: this.activeSequence.steps.length
        };
    }

    // === Compteur ===
    
    setTarget(newTarget) {
        this.target = parseInt(newTarget);
        this.saveState();
    }

    increment() {
        this.count++;
        this.totalCount++;
        
        if (navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (this.target > 0 && this.count === this.target) {
            this.handleTargetReached();
        }

        this.saveState();
        this.eventBus.emit('tasbih:count-updated', this.count);
    }

    decrement() {
        if (this.count > 0) {
            this.count--;
            this.totalCount--;
            this.saveState();
            this.eventBus.emit('tasbih:count-updated', this.count);
        }
    }

    reset() {
        if (this.count > 0) {
            this.addToHistory(this.count);
        }
        
        this.count = 0;
        this.saveState();
        this.eventBus.emit('tasbih:count-updated', this.count);
    }

    handleTargetReached() {
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
        this.eventBus.emit('tasbih:target-reached');
    }

    addToHistory(count) {
        const entry = {
            date: new Date().toISOString(),
            dhikr: this.currentDhikr ? this.currentDhikr.transliteration : 'Libre',
            count: count,
            isSequence: this.isInSequence(),
            sequenceName: this.activeSequence ? this.activeSequence.name : null
        };
        
        this.history.unshift(entry);
        if (this.history.length > 50) {
            this.history.pop();
        }
    }

    getHistory() {
        return this.history;
    }
}
