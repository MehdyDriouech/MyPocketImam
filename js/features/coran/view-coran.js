export class CoranView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        this.setupAudioListeners();
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
        const isPlaying = this.state.get('isPlaying');
        const loadingAudio = this.state.get('loadingAudio');
        const audioError = this.state.get('audioError');
        const currentAudio = this.state.get('currentAudio');
        
        // Récitateurs et cache
        const recitations = this.state.get('recitationsList') || [];
        const selectedReciterId = this.engine.getRecitationId();
        const isOfflineAvailable = this.state.get('surahOfflineAvailable') || false;
        const downloadProgress = this.state.get('downloadProgress');
        const isDownloading = this.state.get('isDownloading') || false;

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
            
            <!-- Sélection du récitateur -->
            <div class="card p-4 mb-4">
                <div class="flex items-center gap-3 flex-wrap">
                    <label class="text-sm font-medium" style="color: var(--text-color);">
                        🎙️ ${trans.selectReciter || 'Récitateur'}:
                    </label>
                    <select data-action="change-reciter" class="flex-1 min-w-[200px] p-2 rounded-lg border" style="background: var(--bg-color); border-color: var(--border-color); color: var(--text-color);">
                        ${recitations.length === 0 ? `
                            <option value="1">AbdulBaset AbdulSamad (Mujawwad)</option>
                        ` : recitations.map(r => `
                            <option value="${r.id}" ${r.id === selectedReciterId ? 'selected' : ''}>${r.displayName}</option>
                        `).join('')}
                    </select>
                    ${recitations.length === 0 ? `
                        <button data-action="load-reciters" class="btn btn-secondary text-sm px-3 py-2">
                            ${trans.loadReciters || 'Charger'}
                        </button>
                    ` : ''}
                </div>
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
            
            ${audioError ? `
                <div class="mb-4 p-4 rounded-lg" style="background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b;">
                    <p class="text-sm">${trans.audioError || 'Erreur audio'}: ${audioError}</p>
                </div>
            ` : ''}
            
            <!-- Contrôles audio -->
            <div class="mb-4 flex flex-col gap-3">
                <div class="flex justify-center">
                    <button data-action="play-audio" 
                        ${loadingAudio ? 'disabled' : ''}
                        class="btn ${isPlaying && currentAudio ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2 px-6 py-3">
                        ${loadingAudio ? `
                            <span class="animate-spin">⏳</span>
                            <span>${trans.audioLoading || 'Chargement...'}</span>
                        ` : isPlaying && currentAudio ? `
                            <span>⏸</span>
                            <span>${trans.pauseAudio || 'Pause'}</span>
                        ` : `
                            <span>▶</span>
                            <span>${trans.playAudio || 'Écouter'}</span>
                        `}
                    </button>
                </div>
                
                <!-- Téléchargement et indicateur hors-ligne -->
                <div class="flex justify-center items-center gap-3 flex-wrap">
                    ${isDownloading ? `
                        <div class="flex items-center gap-2 px-4 py-2 rounded-lg" style="background: var(--primary-light);">
                            <span class="animate-spin">⏳</span>
                            <span class="text-sm">${trans.downloading || 'Téléchargement'}: ${downloadProgress || 0}%</span>
                        </div>
                    ` : isOfflineAvailable ? `
                        <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style="background: #d1fae5; color: #065f46;">
                            <span>✓</span>
                            <span>${trans.offlineAvailable || 'Disponible hors-ligne'}</span>
                        </div>
                        <button data-action="delete-cache" class="btn btn-secondary text-sm px-3 py-2" title="${trans.deleteCache || 'Supprimer du cache'}">
                            🗑️
                        </button>
                    ` : `
                        <button data-action="download-surah" class="btn btn-secondary flex items-center gap-2 text-sm px-4 py-2">
                            <span>📥</span>
                            <span>${trans.downloadSurah || 'Télécharger le fichier audio de cette sourate'}</span>
                        </button>
                    `}
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
        // Gestionnaire de changement pour le select du récitateur
        container.addEventListener('change', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            if (target.dataset.action === 'change-reciter') {
                const reciterId = parseInt(target.value, 10);
                this.handleChangeReciter(reciterId);
            }
        });
        
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
                        // Vérifier si la sourate est en cache
                        this.checkSurahOfflineStatus();
                    });
                    this.eventBus.emit('view:change', 'coran-reader'); // Switch to reader (shows loader)
                    break;
                case 'prev-ayah':
                    if (this.engine.previousAyah()) {
                        // Arrêter l'audio si en cours de lecture
                        if (this.state.get('isPlaying')) {
                            this.eventBus.emit('audio:stop');
                        }
                        // Nettoyer l'erreur audio précédente
                        this.state.set('audioError', null);
                        this.state.set('currentAudio', null);
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'next-ayah':
                    if (this.engine.nextAyah()) {
                        // Arrêter l'audio si en cours de lecture
                        if (this.state.get('isPlaying')) {
                            this.eventBus.emit('audio:stop');
                        }
                        // Nettoyer l'erreur audio précédente
                        this.state.set('audioError', null);
                        this.state.set('currentAudio', null);
                        this.eventBus.emit('view:refresh');
                    }
                    break;
                case 'play-audio':
                    this.handlePlayAudio();
                    break;
                case 'load-reciters':
                    this.handleLoadReciters();
                    break;
                case 'download-surah':
                    this.handleDownloadSurah();
                    break;
                case 'delete-cache':
                    this.handleDeleteCache();
                    break;
            }
        });
    }

    /**
     * Configure les listeners pour les événements audio
     */
    setupAudioListeners() {
        // Écouter les événements audio pour mettre à jour l'UI
        this.eventBus.on('audio:playing', () => {
            this.state.set('isPlaying', true);
            this.eventBus.emit('view:refresh');
        });
        
        this.eventBus.on('audio:paused', () => {
            this.state.set('isPlaying', false);
            this.eventBus.emit('view:refresh');
        });
        
        this.eventBus.on('audio:ended', () => {
            this.state.set('isPlaying', false);
            this.state.set('currentAudio', null);
            this.eventBus.emit('view:refresh');
        });
        
        this.eventBus.on('audio:error', () => {
            const trans = this.translations.getAll();
            this.state.set('isPlaying', false);
            this.state.set('audioError', trans.audioError || 'Erreur de lecture audio');
            this.eventBus.emit('view:refresh');
        });
    }

    async handlePlayAudio() {
        const isPlaying = this.state.get('isPlaying');
        const currentAudio = this.state.get('currentAudio');
        
        // Si déjà en cours de lecture, mettre en pause
        if (isPlaying && currentAudio) {
            this.eventBus.emit('audio:pause');
            return;
        }
        
        // Sinon, récupérer l'URL audio et lancer la lecture
        try {
            this.state.set('audioError', null);
            this.state.set('loadingAudio', true);
            this.eventBus.emit('view:refresh');
            
            const audioUrl = await this.engine.getAudioUrl();
            
            if (!audioUrl) {
                const trans = this.translations.getAll();
                this.state.set('audioError', trans.audioNotAvailable || 'Audio non disponible');
                this.state.set('loadingAudio', false);
                this.eventBus.emit('view:refresh');
                return;
            }
            
            // Lancer la lecture
            this.state.set('currentAudio', audioUrl);
            this.state.set('loadingAudio', false);
            this.eventBus.emit('audio:play', audioUrl);
        } catch (error) {
            console.error('Error playing audio:', error);
            const trans = this.translations.getAll();
            this.state.set('audioError', error.message || trans.audioError || 'Erreur lors de la lecture audio');
            this.state.set('loadingAudio', false);
            this.eventBus.emit('view:refresh');
        }
    }

    /**
     * Charge la liste des récitateurs
     */
    async handleLoadReciters() {
        try {
            const recitations = await this.engine.getRecitations();
            this.state.set('recitationsList', recitations);
            this.eventBus.emit('view:refresh');
        } catch (error) {
            console.error('Error loading reciters:', error);
            const trans = this.translations.getAll();
            this.state.set('audioError', trans.errorLoadingReciters || 'Erreur de chargement des récitateurs');
            this.eventBus.emit('view:refresh');
        }
    }

    /**
     * Change le récitateur sélectionné
     */
    handleChangeReciter(reciterId) {
        // Arrêter l'audio en cours
        if (this.state.get('isPlaying')) {
            this.eventBus.emit('audio:stop');
        }
        
        // Changer le récitateur
        this.engine.setRecitationId(reciterId);
        this.state.set('currentAudio', null);
        this.state.set('audioError', null);
        
        // Vérifier le statut hors-ligne pour ce récitateur
        this.checkSurahOfflineStatus();
        
        this.eventBus.emit('view:refresh');
    }

    /**
     * Télécharge la sourate actuelle pour utilisation hors-ligne
     */
    async handleDownloadSurah() {
        const surahData = this.engine.getCurrentSurahData();
        if (!surahData) return;

        const surahNumber = surahData.arabic.number;
        const totalAyahs = surahData.arabic.numberOfAyahs;
        const reciterId = this.engine.getRecitationId();

        try {
            this.state.set('isDownloading', true);
            this.state.set('downloadProgress', 0);
            this.eventBus.emit('view:refresh');

            await this.engine.downloadSurahForOffline(
                surahNumber,
                totalAyahs,
                reciterId,
                (current, total) => {
                    const progress = Math.round((current / total) * 100);
                    this.state.set('downloadProgress', progress);
                    this.eventBus.emit('view:refresh');
                }
            );

            this.state.set('isDownloading', false);
            this.state.set('surahOfflineAvailable', true);
            this.eventBus.emit('view:refresh');
        } catch (error) {
            console.error('Error downloading surah:', error);
            const trans = this.translations.getAll();
            this.state.set('isDownloading', false);
            this.state.set('audioError', trans.downloadError || 'Erreur lors du téléchargement');
            this.eventBus.emit('view:refresh');
        }
    }

    /**
     * Supprime le cache de la sourate actuelle
     */
    async handleDeleteCache() {
        const surahData = this.engine.getCurrentSurahData();
        if (!surahData) return;

        const surahNumber = surahData.arabic.number;
        const reciterId = this.engine.getRecitationId();

        try {
            await this.engine.deleteSurahCache(surahNumber, reciterId);
            this.state.set('surahOfflineAvailable', false);
            this.eventBus.emit('view:refresh');
        } catch (error) {
            console.error('Error deleting cache:', error);
        }
    }

    /**
     * Vérifie si la sourate actuelle est disponible hors-ligne
     */
    async checkSurahOfflineStatus() {
        const surahData = this.engine.getCurrentSurahData();
        if (!surahData) {
            this.state.set('surahOfflineAvailable', false);
            return;
        }

        const surahNumber = surahData.arabic.number;
        const totalAyahs = surahData.arabic.numberOfAyahs;
        const reciterId = this.engine.getRecitationId();

        try {
            const isAvailable = await this.engine.isSurahAvailableOffline(surahNumber, reciterId, totalAyahs);
            this.state.set('surahOfflineAvailable', isAvailable);
            this.eventBus.emit('view:refresh');
        } catch (error) {
            console.error('Error checking offline status:', error);
            this.state.set('surahOfflineAvailable', false);
        }
    }
}

