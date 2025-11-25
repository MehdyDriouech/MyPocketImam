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
            <div class="tafsir-container" style="min-height: 100vh; background: var(--bg-color); position: relative; overflow: hidden;">
                <!-- Pattern de fond subtil -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.03; background-image: radial-gradient(var(--primary-color) 1px, transparent 1px); background-size: 20px 20px; pointer-events: none;"></div>
                
                <div class="max-w-4xl mx-auto" style="padding: 1.5rem 1rem 6rem; position: relative; z-index: 1;">
                    ${this.renderHeader(trans, rtl)}
                    
                    <!-- Zone de recherche flottante -->
                    <div class="card mb-8" style="padding: 1.5rem; border-radius: 20px; background: var(--card-bg); border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.05); animation: fadeIn 0.3s ease-out;">
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

                <!-- Navigation Fixe en bas -->
                <div style="position: fixed; bottom: 0; left: 0; right: 0; padding: 1.5rem; background: linear-gradient(to top, var(--bg-color) 80%, transparent); pointer-events: none; z-index: 100;">
                    <div class="max-w-4xl mx-auto flex justify-between pointer-events-auto gap-4">
                        <button data-action="prev-ayah" style="flex: 1; max-width: 160px; background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-color); padding: 1rem; border-radius: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: all 0.2s ease; cursor: pointer;">
                            <span>◀</span>
                            <span>${trans.previous || 'Précédent'}</span>
                        </button>
                        
                        <button data-action="next-ayah" style="flex: 1; max-width: 160px; background: var(--primary-color); color: white; padding: 1rem; border-radius: 16px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s ease; cursor: pointer;">
                            <span>${trans.next || 'Suivant'}</span>
                            <span>▶</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        this.populateSurahSelect(container);
    }

    renderHeader(trans, rtl) {
        return `
            <div class="card mb-6" style="padding: 1rem 1.5rem; border-radius: 16px; background: var(--card-bg); border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; justify-content: space-between;" dir="${rtl ? 'rtl' : 'ltr'}">
                    <button data-action="go-tools" style="
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
                        transition: all 0.2s ease;
                    ">
                        <span>${rtl ? '▶' : '◀'}</span>
                        <span>${trans.back || 'Retour'}</span>
                    </button>
                    <h1 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-color); margin: 0; text-align: center;">
                        📖 ${trans.tafsirTitle || 'Tafsir du Coran'}
                    </h1>
                    <div style="width: 90px;"></div>
                </div>
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
        // Éviter les doubles chargements
        if (this.isLoading) return;
        this.isLoading = true;

        const contentDiv = container.querySelector('#tafsirContent');
        if (!contentDiv) {
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
            
            if (!data || !data.verseArabic) {
                throw new Error('Données non disponibles');
            }
            
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
                    <div class="card" style="padding: 2.5rem; background: var(--card-bg); border-radius: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border: 1px solid var(--border-color);">
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
                    
                    <!-- Espace pour la nav -->
                    <div style="height: 100px;"></div>
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
            this.isLoading = false;
        }
    }

    attachEventListeners(container) {
        container.addEventListener('click', async (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch (action) {
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;
                    
                case 'load-verse':
                    const surah = container.querySelector('#surahSelect').value;
                    const ayah = container.querySelector('#ayahInput').value || 1;
                    if (surah) {
                        await this.loadVerseContent(container, parseInt(surah), parseInt(ayah));
                    }
                    break;
                    
                case 'next-ayah':
                    e.preventDefault();
                    // Si aucun verset n'est chargé, charger le premier
                    if (!this.engine.currentSurah || this.engine.currentSurah === 0) {
                        const surahVal = container.querySelector('#surahSelect').value || 1;
                        await this.loadVerseContent(container, parseInt(surahVal), 1);
                    } else {
                        // Incrémenter directement et charger
                        const coranEngine = this.pluginManager.get('coran').engine;
                        const surahData = coranEngine.getCurrentSurahData();
                        const maxAyahs = surahData?.arabic?.numberOfAyahs || 7;
                        
                        if (this.engine.currentAyah < maxAyahs) {
                            const nextAyah = this.engine.currentAyah + 1;
                            await this.loadVerseContent(container, this.engine.currentSurah, nextAyah);
                        }
                    }
                    break;
                    
                case 'prev-ayah':
                    e.preventDefault();
                    if (this.engine.currentSurah && this.engine.currentAyah > 1) {
                        const prevAyah = this.engine.currentAyah - 1;
                        await this.loadVerseContent(container, this.engine.currentSurah, prevAyah);
                    }
                    break;
            }
        });
    }
}
