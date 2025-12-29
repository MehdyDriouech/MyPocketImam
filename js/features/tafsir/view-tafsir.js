export class TafsirView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        this.currentContainer = null;
        this.isLoading = false;
        
        // Écouter les événements de navigation une seule fois
        this.eventBus.on('tafsir:navigate', ({ surah, ayah }) => {
            if (this.currentContainer) {
                this.loadVerseContent(this.currentContainer, surah, ayah);
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
            <div class="container" dir="${rtl ? 'rtl' : 'ltr'}" style="position: relative;">
                    ${this.renderHeader(trans, rtl)}
                    
                    <!-- Zone de recherche flottante -->
                    <div class="card mb-6" style="animation: fadeIn 0.3s ease-out;">
                        <div style="display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end;">
                            <div style="flex: 2; min-width: 200px;">
                                <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">Sourate</label>
                                <div style="position: relative;">
                                    <select id="surahSelect" style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-color); font-size: 1rem; appearance: none; cursor: pointer; transition: all 0.2s ease;">
                                        <option value="">${trans.loading || 'Chargement...'}</option>
                                    </select>
                                    <div style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted);">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="flex: 1; min-width: 100px;">
                                <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">Verset</label>
                                <input type="number" id="ayahInput" min="1" value="1" 
                                       style="width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-color); font-size: 1rem; transition: all 0.2s ease;">
                            </div>

                            <div>
                                <button data-action="load-verse" class="btn" style="background: var(--primary-color); color: white; padding: 0.85rem 2rem; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.1s ease;">
                                    <span>📖</span>
                                    <span>${trans.read || 'Lire'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Zone de contenu principal -->
                    <div id="tafsirContent" style="min-height: 400px; animation: fadeIn 0.5s ease-out;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; text-align: center; opacity: 0.5;">
                            <div style="font-size: 5rem; margin-bottom: 1rem; background: var(--primary-light); width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: var(--primary-color);">📖</div>
                            <p style="font-size: 1.25rem; color: var(--text-muted); max-width: 300px; line-height: 1.5;">
                                ${trans.selectVerseToRead || 'Sélectionnez une sourate et un verset pour commencer votre lecture'}
                            </p>
                        </div>
                    </div>
                </div>
        `;

        this.attachEventListeners(container);
        this.populateSurahSelect(container);
    }

    renderHeader(trans, rtl) {
        return `
            <div class="app-header mb-8 rounded-xl" dir="${rtl ? 'rtl' : 'ltr'}">
                <button data-action="go-tools" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <h1 class="app-title">${trans.tafsirTitle || 'Tafsir du Coran'}</h1>
                <div style="width: 24px;"></div>
            </div>
        `;
    }

    async populateSurahSelect(container) {
        const select = container.querySelector('#surahSelect');
        if (!select) return;

        const renderOptions = (list) => {
            select.innerHTML = list.map(s => 
                `<option value="${s.number}">${s.number}. ${s.englishName} - ${s.name}</option>`
            ).join('');
            
            // Pré-sélectionner la première sourate pour faciliter l'utilisation
            if (list.length > 0 && !select.value) {
                select.value = list[0].number;
            }
        };

        try {
            const coranEngine = this.pluginManager.get('coran').engine;
            let surahs = coranEngine.getSurahsList();
            
            if (!surahs || surahs.length === 0) {
                surahs = await coranEngine.fetchSurahsList();
            }
            
            if (surahs && surahs.length > 0) {
                renderOptions(surahs);
            } else {
                select.innerHTML = `<option value="">Erreur de chargement</option>`;
            }
        } catch (e) {
            console.error("Erreur chargement sourates", e);
            select.innerHTML = `<option value="">Erreur de chargement</option>`;
        }
    }

    async loadVerseContent(container, surah, ayah) {
        // Éviter les doubles chargements avec timeout de sécurité
        if (this.isLoading) {
            console.log('Chargement déjà en cours, ignoré');
            return;
        }
        this.isLoading = true;

        // Timeout de sécurité pour éviter les blocages
        let loadingTimeout = setTimeout(() => {
            if (this.isLoading) {
                console.warn('Timeout de chargement, réinitialisation du flag');
                this.isLoading = false;
            }
        }, 30000); // 30 secondes max

        const contentDiv = container.querySelector('#tafsirContent');
        if (!contentDiv) {
            clearTimeout(loadingTimeout);
            this.isLoading = false;
            return;
        }

        contentDiv.innerHTML = `
            <div style="display: flex; justify-content: center; padding: 4rem;">
                <div class="loading-spinner" style="width: 48px; height: 48px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
        `;

        try {
            const data = await this.engine.loadSurahAndAyah(surah, ayah);
            const trans = this.translations.getAll();
            const rtl = this.translations.isRTL();
            
            if (!data || !data.verseArabic) {
                throw new Error('Données non disponibles');
            }
            
            // Générer la barre de navigation avant le template string
            const navigationBar = await this.renderNavigationBar(container, surah, ayah, trans, rtl);
            
            contentDiv.innerHTML = `
                <div style="animation: fadeIn 0.5s ease-out;">
                    
                    <!-- Carte Verset Arabe -->
                    <div class="card" style="position: relative; padding: 2.5rem; background: linear-gradient(135deg, var(--card-bg) 0%, var(--primary-light) 150%); border-radius: 24px; border: 1px solid var(--primary-light); box-shadow: 0 10px 30px rgba(0,0,0,0.08); margin-bottom: 2rem; overflow: hidden;">
                        <!-- Badge Numéro -->
                        <div style="position: absolute; top: 1.5rem; left: 1.5rem; background: var(--primary-color); color: white; padding: 0.25rem 1rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                            ${data.surah.arabic?.englishName || data.surah.englishName || 'Sourate'} ${surah}:${ayah}
                        </div>

                        <!-- Texte Arabe -->
                        <h2 class="font-arabic" style="font-size: 2.5rem; line-height: 2; text-align: right; color: var(--heading-color); margin: 2rem 0 1.5rem; font-weight: 600;" dir="rtl">
                            ${data.verseArabic.text}
                        </h2>

                        <!-- Traduction -->
                        <div style="position: relative; padding-left: 1.5rem; margin-top: 2rem;">
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--primary-color); border-radius: 4px;"></div>
                            <p style="font-size: 1.125rem; line-height: 1.6; color: var(--text-color); font-style: italic;">
                                "${data.verseTranslation.text}"
                            </p>
                        </div>
                    </div>

                    <!-- Carte Tafsir -->
                    <div class="card" style="padding: 2.5rem; background: var(--card-bg); border-radius: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid var(--border-color); margin-bottom: 2rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <span style="font-size: 1.5rem;">📚</span>
                                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--heading-color); margin: 0;">${trans.tafsir || 'Exégèse'}</h3>
                            </div>
                            <span style="font-size: 0.75rem; font-weight: 600; color: var(--primary-color); background: var(--primary-light); padding: 0.25rem 0.75rem; border-radius: 8px;">
                                ${data.tafsir.source}
                            </span>
                        </div>
                        
                        <div style="font-size: 1.05rem; line-height: 1.8; color: var(--text-color); text-align: justify;">
                            ${data.tafsir.text}
                        </div>
                    </div>
                    
                    <!-- Barre de navigation -->
                    ${navigationBar}
                </div>
            `;

            // Mise à jour des inputs
            const select = container.querySelector('#surahSelect');
            const input = container.querySelector('#ayahInput');
            if (select) select.value = surah;
            if (input) input.value = ayah;

        } catch (error) {
            console.error('Erreur chargement tafsir:', error);
            contentDiv.innerHTML = `
                <div style="background: #fef2f2; color: #991b1b; padding: 2rem; border-radius: 16px; text-align: center; border: 1px solid #fecaca;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Une erreur est survenue</p>
                    <p style="font-size: 0.875rem; opacity: 0.8;">Impossible de charger le verset. Veuillez réessayer.</p>
                </div>
            `;
        } finally {
            clearTimeout(loadingTimeout);
            this.isLoading = false;
        }
    }

    attachEventListeners(container) {
        // Nettoyer les anciens listeners avant d'en créer de nouveaux
        if (this._clickHandler) {
            container.removeEventListener('click', this._clickHandler);
            document.removeEventListener('click', this._clickHandler);
        }

        // Utiliser la délégation d'événements sur document pour capturer les boutons fixes
        const handleClick = async (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const currentContainer = this.currentContainer || container;
            
            // Vérifier que le clic vient bien d'un élément tafsir
            // Soit dans le container, soit un bouton de navigation fixe (qui est toujours visible pour tafsir)
            const isInContainer = currentContainer.contains(target);
            const isNavButton = action === 'prev-ayah' || action === 'next-ayah';
            const hasTafsirContent = currentContainer.querySelector('#tafsirContent') !== null;
            
            // Si ce n'est ni dans le container ni un bouton de nav tafsir, ignorer
            if (!isInContainer && !isNavButton) return;
            
            // Pour les boutons de navigation, vérifier qu'on est bien dans le contexte tafsir
            if (isNavButton && !hasTafsirContent) return;

            switch (action) {
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;
                    
                case 'load-verse':
                    e.preventDefault();
                    e.stopPropagation();
                    const surah = currentContainer.querySelector('#surahSelect')?.value;
                    const ayah = currentContainer.querySelector('#ayahInput')?.value || 1;
                    if (surah) {
                        await this.loadVerseContent(currentContainer, parseInt(surah), parseInt(ayah));
                    } else {
                        // Si aucune sourate n'est sélectionnée, essayer de charger la première
                        const select = currentContainer.querySelector('#surahSelect');
                        if (select && select.options.length > 1) {
                            select.value = select.options[1].value;
                            await this.loadVerseContent(currentContainer, parseInt(select.value), parseInt(ayah));
                        }
                    }
                    break;
                    
                case 'next-ayah':
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handleNextAyah(currentContainer);
                    break;
                    
                case 'prev-ayah':
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handlePrevAyah(currentContainer);
                    break;
                    
                case 'go-next-verse':
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handleNextAyah(currentContainer);
                    break;
                    
                case 'go-prev-verse':
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handlePrevAyah(currentContainer);
                    break;
            }
        };

        // Attacher l'event listener uniquement sur document avec délégation d'événements
        // Cela capture à la fois les éléments du container et les boutons fixes
        document.addEventListener('click', handleClick);
        
        // Stocker la référence pour pouvoir la retirer plus tard si nécessaire
        this._clickHandler = handleClick;
    }

    async handleNextAyah(container) {
        // Récupérer la sourate et le verset actuels depuis les inputs (source de vérité)
        const surahSelect = container.querySelector('#surahSelect');
        const ayahInput = container.querySelector('#ayahInput');
        
        if (!surahSelect || !surahSelect.value) {
            // Si aucune sourate n'est sélectionnée, charger la première
            await this.loadVerseContent(container, 1, 1);
            return;
        }
        
        const currentSurah = parseInt(surahSelect.value);
        const currentAyah = parseInt(ayahInput?.value || 1);
        
        // Charger les données de la sourate pour connaître le nombre de versets
        const coranEngine = this.pluginManager.get('coran').engine;
        
        // S'assurer que la liste des sourates est chargée
        let surahsList = coranEngine.getSurahsList();
        if (!surahsList || surahsList.length === 0) {
            surahsList = await coranEngine.fetchSurahsList();
        }
        
        let surahData = coranEngine.getCurrentSurahData();
        if (!surahData || surahData.number !== currentSurah) {
            surahData = await coranEngine.fetchSurah(currentSurah);
        }
        
        if (!surahData) {
            console.error('Impossible de charger les données de la sourate');
            return;
        }
        
        const maxAyahs = surahData.arabic?.numberOfAyahs || surahData.numberOfAyahs || 7;
        
        if (currentAyah < maxAyahs) {
            // Verset suivant dans la même sourate
            const nextAyah = currentAyah + 1;
            await this.loadVerseContent(container, currentSurah, nextAyah);
        } else {
            // Dernier verset atteint, passer à la sourate suivante
            if (surahsList && surahsList.length > 0) {
                const currentIndex = surahsList.findIndex(s => s.number === currentSurah);
                if (currentIndex >= 0 && currentIndex < surahsList.length - 1) {
                    const nextSurah = surahsList[currentIndex + 1];
                    await this.loadVerseContent(container, nextSurah.number, 1);
                }
            } else {
                // Fallback : incrémenter le numéro de sourate
                if (currentSurah < 114) {
                    await this.loadVerseContent(container, currentSurah + 1, 1);
                }
            }
        }
    }

    async handlePrevAyah(container) {
        // Récupérer la sourate et le verset actuels depuis les inputs (source de vérité)
        const surahSelect = container.querySelector('#surahSelect');
        const ayahInput = container.querySelector('#ayahInput');
        
        if (!surahSelect || !surahSelect.value) {
            return;
        }
        
        const currentSurah = parseInt(surahSelect.value);
        const currentAyah = parseInt(ayahInput?.value || 1);
        
        if (currentAyah > 1) {
            // Verset précédent dans la même sourate
            const prevAyah = currentAyah - 1;
            await this.loadVerseContent(container, currentSurah, prevAyah);
        } else {
            // Premier verset atteint, passer à la sourate précédente
            const coranEngine = this.pluginManager.get('coran').engine;
            
            // S'assurer que la liste des sourates est chargée
            let surahsList = coranEngine.getSurahsList();
            if (!surahsList || surahsList.length === 0) {
                surahsList = await coranEngine.fetchSurahsList();
            }
            
            if (surahsList && surahsList.length > 0) {
                const currentIndex = surahsList.findIndex(s => s.number === currentSurah);
                if (currentIndex > 0) {
                    const prevSurahData = surahsList[currentIndex - 1];
                    // Charger la sourate précédente pour connaître son nombre de versets
                    const prevSurahFullData = await coranEngine.fetchSurah(prevSurahData.number);
                    if (prevSurahFullData) {
                        const prevMaxAyahs = prevSurahFullData.arabic?.numberOfAyahs || prevSurahFullData.numberOfAyahs || 7;
                        await this.loadVerseContent(container, prevSurahData.number, prevMaxAyahs);
                    }
                }
            } else {
                // Fallback : décrémenter le numéro de sourate
                if (currentSurah > 1) {
                    const prevSurahFullData = await coranEngine.fetchSurah(currentSurah - 1);
                    if (prevSurahFullData) {
                        const prevMaxAyahs = prevSurahFullData.arabic?.numberOfAyahs || prevSurahFullData.numberOfAyahs || 7;
                        await this.loadVerseContent(container, currentSurah - 1, prevMaxAyahs);
                    }
                }
            }
        }
    }

    async renderNavigationBar(container, currentSurah, currentAyah, trans, rtl) {
        const coranEngine = this.pluginManager.get('coran').engine;
        
        // Charger les données de la sourate actuelle pour connaître le nombre de versets
        let surahData = coranEngine.getCurrentSurahData();
        if (!surahData || surahData.number !== currentSurah) {
            surahData = await coranEngine.fetchSurah(currentSurah);
        }

        if (!surahData) {
            return '<div style="height: 80px;"></div>';
        }

        const maxAyahs = surahData.arabic?.numberOfAyahs || surahData.numberOfAyahs || 7;
        const hasNextVerse = currentAyah < maxAyahs;
        
        // Si on est au dernier verset, vérifier s'il y a une sourate suivante
        let hasNext = hasNextVerse;
        let nextInfo = null;
        
        if (!hasNextVerse) {
            // Obtenir la liste des sourates pour vérifier s'il y a une sourate suivante
            let surahsList = coranEngine.getSurahsList();
            if (!surahsList || surahsList.length === 0) {
                surahsList = await coranEngine.fetchSurahsList();
            }
            
            if (surahsList && surahsList.length > 0) {
                const currentIndex = surahsList.findIndex(s => s.number === currentSurah);
                if (currentIndex >= 0 && currentIndex < surahsList.length - 1) {
                    hasNext = true;
                    nextInfo = {
                        surah: surahsList[currentIndex + 1],
                        ayah: 1
                    };
                }
            }
        } else {
            nextInfo = {
                surah: currentSurah,
                ayah: currentAyah + 1
            };
        }

        const hasPrev = currentAyah > 1;
        let prevInfo = null;
        
        if (hasPrev) {
            prevInfo = {
                surah: currentSurah,
                ayah: currentAyah - 1
            };
        } else {
            // Si on est au premier verset, vérifier s'il y a une sourate précédente
            let surahsList = coranEngine.getSurahsList();
            if (!surahsList || surahsList.length === 0) {
                surahsList = await coranEngine.fetchSurahsList();
            }
            
            if (surahsList && surahsList.length > 0) {
                const currentIndex = surahsList.findIndex(s => s.number === currentSurah);
                if (currentIndex > 0) {
                    const prevSurah = surahsList[currentIndex - 1];
                    const prevSurahData = await coranEngine.fetchSurah(prevSurah.number);
                    if (prevSurahData) {
                        const prevMaxAyahs = prevSurahData.arabic?.numberOfAyahs || prevSurahData.numberOfAyahs || 7;
                        prevInfo = {
                            surah: prevSurah.number,
                            ayah: prevMaxAyahs
                        };
                    }
                }
            }
        }

        const hasPrevVerse = prevInfo !== null;

        return `
            <div class="card" style="position: sticky; bottom: 1rem; padding: 1.5rem; background: var(--card-bg); border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); border: 1px solid var(--border-color); margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    ${hasPrevVerse ? `
                        <button data-action="go-prev-verse" class="btn" style="flex: 1; min-width: 150px; padding: 1rem 1.5rem; background: var(--card-bg); color: var(--text-color); border: 2px solid var(--border-color); border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease; cursor: pointer;">
                            <span>${rtl ? '▶' : '◀'}</span>
                            <span>${trans.previousVerse || 'Verset précédent'}</span>
                        </button>
                    ` : '<div style="flex: 1; min-width: 150px;"></div>'}
                    
                    ${hasNext ? `
                        <button data-action="go-next-verse" class="btn" style="flex: 1; min-width: 150px; padding: 1rem 1.5rem; background: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                            <span>${trans.nextVerse || 'Verset suivant'}</span>
                            <span>${rtl ? '◀' : '▶'}</span>
                        </button>
                    ` : '<div style="flex: 1; min-width: 150px;"></div>'}
                </div>
                ${hasNext && nextInfo ? `
                    <div style="text-align: center; margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-muted);">
                        ${nextInfo.surah !== currentSurah ? `Sourate ${nextInfo.surah} - ` : ''}Verset ${nextInfo.ayah}
                    </div>
                ` : ''}
            </div>
        `;
    }
}
