export class NamesOfAllahView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;

        this.currentViewMode = 'home'; // home, list, detail, learning, favorites
        this.currentDetailId = 1;
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        this.container = container;

        // Lazy loading : Si les données sont vides (0 noms), on force le chargement
        if (this.engine.namesList.length === 0) {
            this.engine.loadNames().then(() => {
                // Une fois chargé, on rafraîchit la vue
                this.render(container);
            });
            // On affiche un loader en attendant
            container.innerHTML = '<div class="flex justify-center items-center h-64"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>';
            return;
        }

        const lang = this.state.get('language') || 'fr';
        const rtl = this.translations.isRTL();

        let content = '';

        switch (this.currentViewMode) {
            case 'list':
                content = this.renderList();
                break;
            case 'detail':
                content = this.renderDetail();
                break;
            case 'learning':
                content = this.renderLearning();
                break;
            case 'favorites':
                content = this.renderFavorites();
                break;
            case 'home':
            default:
                content = this.renderHome();
                break;
        }

        container.innerHTML = `
      <div class="names-of-allah-plugin pb-24" dir="${rtl ? 'rtl' : 'ltr'}">
        ${content}
      </div>
    `;

        this.attachEventListeners(container);
    }

    renderHome() {
        const t = this.translations.getAll();
        const total = this.engine.namesList.length;
        const learned = this.engine.learned.size;
        const favorites = this.engine.favorites.size;
        const rtl = this.translations.isRTL();

        return `
      <div class="container space-y-6">
        <!-- Top Nav -->
        <div class="app-header mb-8 rounded-xl">
            <button data-action="go-tools" class="btn btn-secondary">
                <span>${rtl ? '◀' : '▶'}</span>
                <span>${t.back || 'Retour'}</span>
            </button>
            <h1 class="app-title">${t.namesOfAllah || "Les 99 Noms d'Allah"}</h1>
            <div style="width: 24px;"></div>
        </div>

        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold mb-2" style="color: var(--primary-dark);">Asmā' Allāh al-Husnā</h1>
          <p class="text-xl font-arabic" style="color: var(--primary-color);">الأسماء الحسنى</p>
          <p class="text-muted mt-2">${t.namesOfAllah || "Les 99 Noms d'Allah"}</p>
        </div>

        <div class="flex flex-col gap-6">
            <button data-action="nav-list" class="card w-full p-6 hover:shadow-lg transition-all flex items-center justify-between group text-left" style="border-left: 8px solid var(--primary-color); margin-top: 1%; margin-bottom: 1%;">
              <div>
                <h3 class="text-xl font-bold group-hover:text-primary transition-colors">🔢 ${t.allNames || 'Tous les Noms'}</h3>
                <p class="text-muted">${t.viewAll || 'Voir la liste complète'} (${total})</p>
              </div>
              <span class="text-2xl text-muted group-hover:text-primary">➔</span>
            </button>
    
            <button data-action="nav-learning" class="card w-full p-6 hover:shadow-lg transition-all flex items-center justify-between group text-left" style="border-left: 8px solid #f59e0b; margin-top: 1%; margin-bottom: 1%;">
              <div>
                <h3 class="text-xl font-bold group-hover:text-amber-600 transition-colors">📚 ${t.learningMode || 'Mode Apprentissage'}</h3>
                <div class="flex items-center gap-2 mt-1">
                    <div class="w-24 h-2 rounded-full overflow-hidden" style="background: var(--bg-color);">
                        <div class="h-full bg-amber-500" style="width: ${(learned / total) * 100}%"></div>
                    </div>
                    <span class="text-sm text-muted">${learned}/${total}</span>
                </div>
              </div>
              <span class="text-2xl text-muted group-hover:text-amber-500">➔</span>
            </button>
    
            <button data-action="nav-favorites" class="card w-full p-6 hover:shadow-lg transition-all flex items-center justify-between group text-left" style="border-left: 8px solid #ef4444; margin-top: 1%; margin-bottom: 1%;">
              <div>
                <h3 class="text-xl font-bold group-hover:text-red-600 transition-colors">❤️ ${t.myFavorites || 'Mes Favoris'}</h3>
                <p class="text-muted">${favorites} ${t.namesSaved || 'noms sauvegardés'}</p>
              </div>
              <span class="text-2xl text-muted group-hover:text-red-500">➔</span>
            </button>
        </div>
        
        <div class="mt-8">
            <input type="text" 
                data-action="search-input" 
                placeholder="${t.searchPlaceholder || 'Rechercher un nom...'}" 
                class="input-field w-full p-4 text-lg"
            >
        </div>
      </div>
    `;
    }

    renderList() {
        const t = this.translations.getAll();
        const names = this.engine.getNames();
        const lang = this.state.get('language') || 'fr';
        const isRTL = this.translations.isRTL();

        return `
      <div class="container p-4">
        <div class="app-header mb-8 rounded-xl">
            <button data-action="nav-home" class="btn btn-secondary">
                <span>${isRTL ? '◀' : '▶'}</span>
                <span>${t.back || 'Retour'}</span>
            </button>
            <h1 class="app-title">${t.allNames || 'Tous les Noms'}</h1>
            <div style="width: 24px;"></div>
        </div>

        <input type="text" 
            id="list-search"
            value="${this.engine.searchQuery}"
            placeholder="${t.searchPlaceholder || 'Rechercher...'}" 
            class="input-field w-full p-3 mb-6"
        >

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${names.map(name => this.renderNameCard(name, lang)).join('')}
        </div>
        
        ${names.length === 0 ? `<p class="text-center text-muted py-12">${t.noResults || 'Aucun résultat'}</p>` : ''}
      </div>
    `;
    }

    renderNameCard(name, lang) {
        const isFav = this.engine.isFavorite(name.number);
        const isLearned = this.engine.isLearned(name.number);

        return `
      <div class="card hover:shadow-md transition-all cursor-pointer overflow-hidden group relative"
           data-action="open-detail" data-id="${name.number}">
          
          <div class="absolute top-2 left-2 text-xs font-bold text-muted">#${name.number}</div>
          ${isFav ? '<div class="absolute top-2 right-2 text-red-500">❤️</div>' : ''}
          ${isLearned ? '<div class="absolute bottom-2 left-2 text-emerald-500">✅</div>' : ''}

          <div class="p-4 text-center">
              <div class="text-3xl font-arabic mb-2 group-hover:scale-110 transition-transform" style="color: var(--primary-dark);">${name.arabic}</div>
              <div class="font-bold text-sm mb-1" style="color: var(--text-color);">${name.transliteration}</div>
              <div class="text-xs text-muted line-clamp-1">${name.translation[lang]}</div>
          </div>
      </div>
    `;
    }

    renderDetail() {
        const t = this.translations.getAll();
        const lang = this.state.get('language') || 'fr';
        const rtl = this.translations.isRTL();
        const name = this.engine.getName(this.currentDetailId);
        if (!name) return this.renderList();

        const isFav = this.engine.isFavorite(name.number);
        const isLearned = this.engine.isLearned(name.number);
        const next = this.engine.getNextName(name.number);
        const prev = this.engine.getPreviousName(name.number);

        return `
      <div class="container p-4 min-h-screen flex flex-col">
        <div class="app-header mb-8 rounded-xl">
            <button data-action="nav-back" class="btn btn-secondary">
                <span>${rtl ? '◀' : '▶'}</span>
                <span>${t.back || 'Retour'}</span>
            </button>
            <h1 class="app-title">${t.namesOfAllah || "Les 99 Noms d'Allah"}</h1>
            <div class="flex gap-2">
                <button data-action="toggle-fav" data-id="${name.number}" class="btn btn-icon ${isFav ? 'text-red-500' : 'text-muted'}">
                    ${isFav ? '❤️' : '🤍'}
                </button>
            </div>
        </div>

        <div class="card overflow-hidden flex-1 flex flex-col p-0">
            <div class="p-8 text-center relative" style="background: var(--bg-color);">
                <span class="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm" style="color: var(--primary-dark);">#${name.number}</span>
                ${isLearned ? '<span class="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">✅ Appris</span>' : ''}
                
                <h1 class="text-6xl md:text-8xl font-arabic my-8 drop-shadow-sm" style="color: var(--primary-dark);">${name.arabic}</h1>
                <h2 class="text-2xl font-bold mb-2" style="color: var(--text-color);">${name.transliteration}</h2>
                <p class="text-xl italic" style="color: var(--primary-color);">${name.translation[lang]}</p>
            </div>

            <div class="p-8 space-y-6 flex-1">
                <div>
                    <h3 class="text-sm uppercase tracking-wider font-bold mb-2 text-muted">${t.meaning || 'Signification'}</h3>
                    <p class="leading-relaxed text-lg" style="color: var(--text-color);">
                        ${name.meaning[lang]}
                    </p>
                </div>

                <div class="flex items-center justify-center gap-4 pt-6 border-t" style="border-color: var(--bg-color);">
                    <!-- Audio (placeholder) -->
                    <button class="btn btn-primary flex items-center gap-2" title="Audio coming soon">
                        <span>🔊</span> <span class="text-sm font-bold">${t.listen || 'Écouter'}</span>
                    </button>
                    
                    <button data-action="mark-learned" data-id="${name.number}" class="btn ${isLearned ? 'bg-emerald-100 text-emerald-700' : 'btn-secondary'} transition-colors">
                        ${isLearned ? '✅ Appris' : '☑️ Marquer comme appris'}
                    </button>
                </div>
            </div>

            <!-- Navigation Footer -->
            <div class="p-4 flex justify-between items-center border-t" style="background: var(--bg-color); border-color: var(--bg-color);">
                ${prev ? `
                    <button data-action="open-detail" data-id="${prev.number}" class="btn btn-secondary flex items-center gap-2 text-left">
                        <span>◀</span>
                        <div class="text-left">
                            <div class="text-xs text-muted">Précédent</div>
                            <div class="font-bold text-sm">${prev.transliteration}</div>
                        </div>
                    </button>
                ` : '<div></div>'}

                ${next ? `
                    <button data-action="open-detail" data-id="${next.number}" class="btn btn-secondary flex items-center gap-2 text-right">
                        <div class="text-right">
                            <div class="text-xs text-muted">Suivant</div>
                            <div class="font-bold text-sm">${next.transliteration}</div>
                        </div>
                        <span>▶</span>
                    </button>
                ` : '<div></div>'}
            </div>
        </div>
      </div>
    `;
    }

    renderFavorites() {
        const t = this.translations.getAll();
        const lang = this.state.get('language') || 'fr';
        const rtl = this.translations.isRTL();
        const favorites = this.engine.getFavorites();

        return `
      <div class="container p-4">
        <div class="app-header mb-8 rounded-xl">
            <button data-action="nav-home" class="btn btn-secondary">
                <span>${rtl ? '◀' : '▶'}</span>
                <span>${t.back || 'Retour'}</span>
            </button>
            <h1 class="app-title">${t.myFavorites || 'Mes Favoris'}</h1>
            <div style="width: 24px;"></div>
        </div>

        ${favorites.length === 0 ? `
            <div class="text-center py-16 card border-2 border-dashed" style="border-color: var(--bg-color);">
                <div class="text-4xl mb-4">💔</div>
                <p class="text-muted mb-2">${t.noFavoritesYet || 'Aucun favori pour le moment'}</p>
                <button data-action="nav-list" class="text-teal-600 font-bold hover:underline">${t.browseNames || 'Parcourir les noms'}</button>
            </div>
        ` : `
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                ${favorites.map(name => this.renderNameCard(name, lang)).join('')}
            </div>
        `}
      </div>
    `;
    }

    renderLearning() {
        const t = this.translations.getAll();
        const lang = this.state.get('language') || 'fr';
        const rtl = this.translations.isRTL();
        const nextToLearn = this.engine.getNextToLearn();
        const learnedCount = this.engine.learned.size;
        const total = this.engine.namesList.length;

        if (!nextToLearn) {
            return `
            <div class="container text-center pt-20">
                <div class="text-6xl mb-6">🎉</div>
                <h2 class="text-3xl font-bold mb-4" style="color: var(--primary-dark);">Māshā'Allāh !</h2>
                <p class="text-xl text-muted mb-8">Vous avez appris tous les noms disponibles.</p>
                <button data-action="nav-home" class="btn btn-primary px-8 py-3 text-lg">
                    Retour à l'accueil
                </button>
            </div>
        `;
        }

        return `
      <div class="container p-4 min-h-screen flex flex-col">
        <div class="app-header mb-8 rounded-xl">
            <button data-action="nav-home" class="btn btn-secondary">
                <span>${rtl ? '◀' : '▶'}</span>
                <span>${t.quit || 'Quitter'}</span>
            </button>
            <h1 class="app-title">${t.learningMode || 'Mode Apprentissage'}</h1>
            <div style="width: 24px;"></div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-2 rounded-full mb-8 overflow-hidden" style="background: var(--bg-color);">
            <div class="h-full bg-amber-500 transition-all duration-500" style="width: ${(learnedCount / total) * 100}%"></div>
        </div>

        <!-- Card -->
        <div class="flex-1 flex flex-col items-center justify-center">
            <div class="card w-full p-8 text-center relative overflow-hidden border-2 border-amber-100">
                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                
                <span class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold mb-6 inline-block">
                    Nouveau nom à apprendre
                </span>

                <h1 class="text-7xl font-arabic mb-6 mt-4" style="color: var(--primary-dark);">${nextToLearn.arabic}</h1>
                <h2 class="text-3xl font-bold mb-2" style="color: var(--text-color);">${nextToLearn.transliteration}</h2>
                <p class="text-xl italic mb-8" style="color: var(--primary-color);">${nextToLearn.translation[lang]}</p>
                
                <p class="text-muted leading-relaxed mb-8 border-t pt-6" style="border-color: var(--bg-color);">
                    ${nextToLearn.meaning[lang]}
                </p>

                <button data-action="mark-learned-continue" data-id="${nextToLearn.number}" 
                    class="w-full bg-amber-500 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:bg-amber-600 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                    <span>✅</span> ${t.learnedNext || "Je l'ai retenu !"}
                </button>
            </div>
        </div>
      </div>
    `;
    }

    attachEventListeners(container) {
        // Input recherche (debounce simple)
        const searchInput = container.querySelector('#list-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.engine.search(e.target.value);
            });
        }

        const homeSearch = container.querySelector('[data-action="search-input"]');
        if (homeSearch) {
            homeSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.engine.search(e.target.value);
                    this.currentViewMode = 'list';
                    this.render(this.container);
                }
            });
        }

        // Navigation clicks
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            switch (action) {
                case 'go-tools':
                    this.state.set('currentView', 'muslim-tools');
                    this.eventBus.emit('view:change', 'muslim-tools');
                    break;
                case 'nav-home':
                    this.currentViewMode = 'home';
                    this.render(container);
                    break;
                case 'nav-list':
                    this.currentViewMode = 'list';
                    this.render(container);
                    break;
                case 'nav-learning':
                    this.currentViewMode = 'learning';
                    this.render(container);
                    break;
                case 'nav-favorites':
                    this.currentViewMode = 'favorites';
                    this.render(container);
                    break;
                case 'open-detail':
                    this.currentDetailId = id;
                    this.currentViewMode = 'detail';
                    this.render(container);
                    break;
                case 'nav-back':
                    // Retour intelligent : si on vient de favoris, retour favoris, sinon liste
                    this.currentViewMode = 'list';
                    this.render(container);
                    break;
                case 'toggle-fav':
                    this.engine.toggleFavorite(id);
                    this.render(container); // Re-render pour update icône
                    break;
                case 'mark-learned':
                    this.engine.markAsLearned(id);
                    this.render(container);
                    break;
                case 'mark-learned-continue':
                    this.engine.markAsLearned(id);
                    // Reste en mode learning, le render va prendre le prochain
                    this.render(container);
                    break;
            }
        });

        // Ecoute des events engine si besoin de rafraichir
        this.eventBus.on('names:search-results', () => {
            if (this.currentViewMode === 'list') {
                this.render(container);
            }
        });
    }
}

