export class TafsirView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();

        container.innerHTML = `
            <div class="max-w-4xl mx-auto p-6 pb-24 font-sans">
                ${this.renderHeader(trans, rtl)}
                
                <!-- Contrôles de navigation -->
                <div class="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                    <div class="flex gap-2 items-center flex-1 min-w-[200px]">
                        <select id="surahSelect" class="p-2 border rounded-lg bg-gray-50 flex-1 outline-none focus:ring-2 focus:ring-teal-500">
                            <option value="">${trans.loading || 'Chargement...'}</option>
                        </select>
                        <input type="number" id="ayahInput" min="1" class="w-20 p-2 border rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500" placeholder="Verset">
                    </div>
                    <button data-action="load-verse" class="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                        ${trans.read || 'Lire'}
                    </button>
                </div>

                <!-- Zone de contenu principal -->
                <div id="tafsirContent" class="space-y-6 min-h-[400px]">
                    <div class="flex flex-col items-center justify-center h-64 text-gray-400">
                        <span class="text-4xl mb-4">📖</span>
                        <p>${trans.selectVerseToRead || 'Sélectionnez une sourate et un verset pour commencer'}</p>
                    </div>
                </div>

                <!-- Navigation bas de page -->
                <div class="fixed bottom-6 left-0 right-0 px-6 pointer-events-none">
                    <div class="max-w-4xl mx-auto flex justify-between pointer-events-auto">
                        <button data-action="prev-ayah" class="bg-white shadow-lg border border-gray-200 text-teal-800 px-4 py-3 rounded-full hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                            ◀ ${trans.previous || 'Précédent'}
                        </button>
                        <button data-action="next-ayah" class="bg-white shadow-lg border border-gray-200 text-teal-800 px-4 py-3 rounded-full hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                            ${trans.next || 'Suivant'} ▶
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
            <div class="flex items-center justify-between mb-8" dir="${rtl ? 'rtl' : 'ltr'}">
                <button data-action="go-tools" class="flex items-center gap-2 text-teal-700 hover:text-teal-900 transition-colors">
                    <span class="text-lg">${rtl ? '◀' : '▶'}</span>
                    <span class="font-medium">${trans.back || 'Retour'}</span>
                </button>
                <h1 class="text-3xl font-bold text-teal-800">${trans.tafsirTitle || 'Tafsir du Coran'}</h1>
                <div class="w-24"></div> <!-- Spacer -->
            </div>
        `;
    }

    async populateSurahSelect(container) {
        const select = container.querySelector('#surahSelect');
        const surahs = this.engine.getSurahsList();
        
        if (surahs && surahs.length > 0) {
            select.innerHTML = surahs.map(s => 
                `<option value="${s.number}">${s.number}. ${s.englishName} (${s.name})</option>`
            ).join('');
        } else {
            // Si pas chargé, on essaye de charger via le plugin Coran
            const coranEngine = this.pluginManager.get('coran').engine;
            const loadedSurahs = await coranEngine.fetchSurahsList();
            if (loadedSurahs) {
                select.innerHTML = loadedSurahs.map(s => 
                    `<option value="${s.number}">${s.number}. ${s.englishName} (${s.name})</option>`
                ).join('');
            }
        }
    }

    async loadVerseContent(container, surah, ayah) {
        const contentDiv = container.querySelector('#tafsirContent');
        contentDiv.innerHTML = `<div class="flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div></div>`;

        try {
            const data = await this.engine.loadSurahAndAyah(surah, ayah);
            
            const trans = this.translations.getAll();
            
            contentDiv.innerHTML = `
                <!-- Carte Verset -->
                <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-teal-50 mb-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-5 text-6xl font-arabic">۝</div>
                    
                    <div class="mb-8 text-right">
                        <h2 class="font-arabic text-4xl leading-loose text-gray-800 mb-4" dir="rtl">
                            ${data.verseArabic.text}
                        </h2>
                        <div class="flex items-center justify-end gap-2 text-sm text-teal-600 bg-teal-50 inline-flex px-3 py-1 rounded-full">
                            <span>Sourate ${data.surah.englishName}</span>
                            <span>•</span>
                            <span>Verset ${data.ayah}</span>
                        </div>
                    </div>

                    <div class="text-lg text-gray-600 italic border-l-4 border-teal-200 pl-4 py-2">
                        ${data.verseTranslation.text}
                    </div>
                </div>

                <!-- Carte Tafsir -->
                <div class="bg-white rounded-2xl shadow-lg p-8 border-2 border-amber-50">
                    <div class="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                        <span class="text-2xl">📚</span>
                        <h3 class="text-xl font-bold text-gray-800">${trans.tafsir || 'Exégèse (Tafsir)'}</h3>
                        <span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md ml-auto">
                            ${data.tafsir.source}
                        </span>
                    </div>
                    
                    <div class="prose max-w-none text-gray-700 leading-relaxed">
                        ${data.tafsir.text}
                    </div>
                </div>
            `;

            // Mettre à jour les inputs
            container.querySelector('#surahSelect').value = surah;
            container.querySelector('#ayahInput').value = ayah;

        } catch (error) {
            console.error(error);
            contentDiv.innerHTML = `
                <div class="bg-red-50 text-red-600 p-6 rounded-xl text-center">
                    <p>Erreur lors du chargement du verset. Veuillez réessayer.</p>
                </div>
            `;
        }
    }

    attachEventListeners(container) {
        container.addEventListener('click', (e) => {
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
                    const ayah = container.querySelector('#ayahInput').value;
                    if (surah && ayah) {
                        this.loadVerseContent(container, surah, ayah);
                    }
                    break;
                case 'next-ayah':
                    this.engine.nextAyah();
                    break;
                case 'prev-ayah':
                    this.engine.previousAyah();
                    break;
            }
        });

        // Écouter les événements de navigation de l'engine
        this.eventBus.on('tafsir:navigate', ({ surah, ayah }) => {
            this.loadVerseContent(container, surah, ayah);
        });
    }
}
