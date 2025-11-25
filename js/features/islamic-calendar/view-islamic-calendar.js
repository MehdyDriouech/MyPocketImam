export class IslamicCalendarView {
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
        // Charger les données initiales si nécessaire
        if (!this.state.get('currentHijriDate')) {
            this.engine.getCurrentHijriDate().then(() => {
                this.eventBus.emit('view:refresh');
            });
        }

        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();

        container.innerHTML = `
            <div class="islamic-calendar-container" style="min-height: 100vh; background: var(--bg-color); position: relative; overflow: hidden;">
                <!-- Pattern de fond subtil -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background-image: repeating-linear-gradient(45deg, var(--primary-color) 0, var(--primary-color) 1px, transparent 0, transparent 50%); background-size: 10px 10px; pointer-events: none;"></div>
                
                <div class="max-w-md mx-auto" style="padding: 1rem 1rem 2rem; margin-left: 15%; margin-right: 15%;">
                    ${this.renderHeader(trans, rtl)}
                    ${this.renderCurrentDateCard(trans)}
                    ${this.renderMonthCalendar(trans, rtl)}
                    ${this.renderUpcomingEvents(trans, rtl)}
                    ${this.renderDateConverter(trans, rtl)}
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        this.loadCalendarGrid(container);
    }

    renderHeader(trans, rtl) {
        return `
            <div class="app-header mb-6 rounded-xl" dir="${rtl ? 'rtl' : 'ltr'}">
                <button data-action="go-tools" class="btn btn-secondary">
                    <span>${rtl ? '◀' : '▶'}</span>
                    <span>${trans.back || 'Retour'}</span>
                </button>
                <h1 class="app-title">${trans.islamicCalendar || 'Calendrier Islamique'}</h1>
                <button data-action="refresh-calendar" class="btn btn-secondary" title="${trans.refresh || 'Actualiser'}">
                    🔄
                </button>
            </div>
        `;
    }

    renderCurrentDateCard(trans) {
        const current = this.state.get('currentHijriDate');
        if (!current || !current.day || !current.month) {
            return `
                <div class="card mb-6" style="height: 200px; display: flex; align-items: center; justify-content: center;">
                    <div class="loading-spinner" style="width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            `;
        }

        const lang = this.state.get('language');
        const monthName = trans.hijriMonths?.[current.month.number] || current.month.en || '';
        const dayName = (current.weekday && current.weekday[lang]) || (current.weekday && current.weekday.en) || '';
        const gregorianDate = current.gregorian || {};
        const gregorianDay = gregorianDate.day || '';
        const gregorianMonth = gregorianDate.month ? gregorianDate.month.en : '';
        const gregorianYear = gregorianDate.year || '';
        
        // Construire la date grégorienne si disponible
        const gregorianDisplay = (gregorianDay && gregorianMonth && gregorianYear) 
            ? `${dayName ? dayName + ' • ' : ''}${gregorianDay} ${gregorianMonth} ${gregorianYear}`
            : '';

        return `
            <div class="card mb-6" style="padding: 0; overflow: hidden; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%); border: none; box-shadow: 0 8px 20px rgba(0,0,0,0.12); animation: fadeIn 0.5s ease-in;">
                <!-- Icônes décoratives -->
                <div style="position: absolute; width: 100%; height: 100%; pointer-events: none; overflow: hidden;">
                    <div style="position: absolute; right: -15px; top: -15px; font-size: 5rem; opacity: 0.1; transform: rotate(-15deg);">🌙</div>
                    <div style="position: absolute; left: -15px; bottom: -15px; font-size: 4rem; opacity: 0.1; transform: rotate(15deg);">🕌</div>
                </div>

                <!-- Contenu principal -->
                <div style="position: relative; padding: 1.5rem 1.25rem; text-align: center; color: white;">
                    <div style="display: inline-block; padding: 0.2rem 0.75rem; border-radius: 16px; background: rgba(255,255,255,0.2); margin-bottom: 1rem;">
                        <p style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; opacity: 0.95;">
                            ${trans.currentDate || 'DATE ACTUELLE'}
                        </p>
                    </div>

                    <!-- Grande date en arabe -->
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 3.5rem; font-weight: 700; line-height: 1; margin-bottom: 0.375rem; text-shadow: 0 3px 6px rgba(0,0,0,0.2);">
                            ${current.day || ''}
                        </div>
                        <div class="font-arabic" style="font-size: 1.75rem; font-weight: 600; margin-bottom: 0.125rem; opacity: 0.95;">
                            ${current.month.ar || current.month.en || ''}
                        </div>
                        <div style="font-size: 1.25rem; font-weight: 500; opacity: 0.9;">
                            ${current.year || ''} ${current.designation?.abbreviated || 'AH'}
                        </div>
                    </div>

                    ${gregorianDisplay ? `
                        <!-- Séparateur -->
                        <div style="width: 50%; height: 1.5px; background: rgba(255,255,255,0.3); margin: 1rem auto;"></div>

                        <!-- Date grégorienne -->
                        <div style="font-size: 0.875rem; font-weight: 500; opacity: 0.95;">
                            ${gregorianDisplay}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderMonthCalendar(trans, rtl) {
        const month = this.state.get('calendarViewMonth') || 1;
        const year = this.state.get('calendarViewYear') || 1445;

        const monthNamesEn = [
            'Muharram', 'Safar', "Rabi' al-awwal", "Rabi' al-thani",
            'Jumada al-awwal', 'Jumada al-thani', 'Rajab', "Sha'ban",
            'Ramadan', 'Shawwal', "Dhu al-Qi'dah", "Dhu al-Hijjah"
        ];

        let displayMonth = monthNamesEn[month - 1];
        if (trans.hijriMonths && trans.hijriMonths[month]) {
            displayMonth = trans.hijriMonths[month];
        }

        return `
            <div class="card mb-6" style="padding: 1.5rem; animation: fadeIn 0.3s ease-in;" dir="${rtl ? 'rtl' : 'ltr'}">
                <!-- Header du calendrier -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
                    <button data-action="prev-month" class="btn btn-icon" style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--bg-color); border: 2px solid var(--border-color); transition: all 0.2s ease;"
                            onmouseover="this.style.borderColor='var(--primary-color)'; this.style.background='var(--primary-light)'"
                            onmouseout="this.style.borderColor='var(--border-color)'; this.style.background='var(--bg-color)'">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                    </button>
                    
                    <div style="text-align: center;">
                        <h3 id="calendarTitle" style="font-size: 1.25rem; font-weight: 700; color: var(--heading-color); margin-bottom: 0.125rem;">
                            ${displayMonth} ${year}
                        </h3>
                        <p class="font-arabic" style="font-size: 0.875rem; color: var(--text-muted);">
                            ${trans.hijriMonthsArabic?.[month] || ''}
                        </p>
                    </div>
                    
                    <button data-action="next-month" class="btn btn-icon" style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--bg-color); border: 2px solid var(--border-color); transition: all 0.2s ease;"
                            onmouseover="this.style.borderColor='var(--primary-color)'; this.style.background='var(--primary-light)'"
                            onmouseout="this.style.borderColor='var(--border-color)'; this.style.background='var(--bg-color)'">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>

                <!-- Grille du calendrier -->
                <div id="calendarGrid" style="min-height: 280px;">
                    <div style="display: flex; justify-content: center; align-items: center; height: 280px;">
                        <div class="loading-spinner" style="width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    </div>
                </div>

                <!-- Note API -->
                <div style="margin-top: 1rem; padding: 0.75rem; border-radius: 10px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 3px solid #f59e0b;">
                    <div style="display: flex; align-items: start; gap: 0.625rem;">
                        <div style="font-size: 1.25rem; flex-shrink: 0;">ℹ️</div>
                        <div>
                            <p style="font-weight: 700; color: #92400e; margin-bottom: 0.125rem; font-size: 0.75rem;">Limitation API</p>
                            <p style="color: #92400e; font-size: 0.7rem; line-height: 1.3;">
                                ${trans.calendarLimitWarning || "L'affichage est limité aux 4 mois proches en raison des restrictions de l'API gratuite."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadCalendarGrid(container) {
        const gridContainer = container.querySelector('#calendarGrid');
        if (!gridContainer) return;

        const month = this.state.get('calendarViewMonth');
        const year = this.state.get('calendarViewYear');

        try {
            const calendarData = await this.engine.getHijriMonthCalendar(month, year);

            if (!calendarData) throw new Error('No data');

            const daysHeader = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

            let html = `
                <!-- En-têtes des jours -->
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.375rem; margin-bottom: 0.625rem; text-align: center;">
                    ${daysHeader.map(d => `
                        <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); padding: 0.375rem;">
                            ${d}
                        </div>
                    `).join('')}
                </div>

                <!-- Grille des jours -->
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.375rem;">
            `;

            // Calcul du décalage
            const firstDay = calendarData[0];
            const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const startOffset = weekdays.indexOf(firstDay.gregorian.weekday.en);

            // Cases vides
            for (let i = 0; i < startOffset; i++) {
                html += `<div style="aspect-ratio: 1; padding: 0.375rem;"></div>`;
            }

            // Jours du mois
            const currentHijri = this.state.get('currentHijriDate');

            calendarData.forEach(dayData => {
                const isToday = currentHijri &&
                    dayData.hijri.day === currentHijri.day &&
                    parseInt(dayData.hijri.month.number) === parseInt(currentHijri.month.number) &&
                    dayData.hijri.year === currentHijri.year;

                const events = this.engine.findEventsForDate(dayData.hijri);
                const hasEvent = events.length > 0;

                let cellStyle = 'position: relative; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; padding: 0.375rem;';

                if (isToday) {
                    cellStyle += 'background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%); color: white; font-weight: 700; box-shadow: 0 3px 8px rgba(0,0,0,0.12); transform: scale(1.03);';
                } else if (hasEvent) {
                    cellStyle += 'background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b;';
                } else {
                    cellStyle += 'background: var(--card-bg); border: 1px solid var(--border-color);';
                }

                const hoverStyle = !isToday ? `onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"` : '';

                html += `
                    <div style="${cellStyle}" ${hoverStyle} title="${dayData.gregorian.date}${hasEvent ? ' - ' + events[0].nameKey : ''}">
                        <span style="font-size: ${isToday ? '1.125rem' : '0.9375rem'}; font-weight: ${isToday ? '700' : '600'}; ${isToday ? 'color: white;' : 'color: var(--text-color);'} margin-bottom: 0.0625rem;">
                            ${dayData.hijri.day}
                        </span>
                        <span style="font-size: 0.6rem; ${isToday ? 'color: rgba(255,255,255,0.8);' : 'color: var(--text-muted);'}">
                            ${dayData.gregorian.day}
                        </span>
                        ${hasEvent ? `<span style="position: absolute; bottom: 3px; font-size: 0.875rem;">${events[0].icon}</span>` : ''}
                    </div>
                `;
            });

            html += `</div>`;
            gridContainer.innerHTML = html;

        } catch (error) {
            let message = 'Erreur de chargement du calendrier.';
            let icon = '⚠️';
            
            if (error.message === 'RATE_LIMIT') {
                message = 'Trop de requêtes. Veuillez patienter quelques secondes...';
                icon = '⏱️';
            }

            gridContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 280px; text-align: center; padding: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.6;">${icon}</div>
                    <p style="color: var(--text-muted); font-weight: 600; margin-bottom: 1.5rem; font-size: 1rem;">${message}</p>
                    <button data-action="retry-calendar" class="btn" style="background: var(--primary-color); color: white; padding: 0.75rem 1.5rem; font-weight: 600;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }

    renderUpcomingEvents(trans, rtl) {
        const viewMonth = this.state.get('calendarViewMonth');
        const viewYear = this.state.get('calendarViewYear');

        if (!this.engine.eventsData) this.engine.getIslamicEvents();

        const events = this.engine.eventsData || [];

        const monthEvents = events.filter(evt => {
            const evtMonth = parseInt(evt.month);
            return evtMonth === parseInt(viewMonth);
        }).sort((a, b) => parseInt(a.day) - parseInt(b.day));

        const eventNamesFr = {
            "islamicNewYear": "Nouvel An Islamique",
            "ashura": "Achoura",
            "mawlid": "Mawlid (Naissance du Prophète)",
            "israMiraj": "Isra & Miraj",
            "shaban15": "Nuit de la mi-Sha'ban",
            "ramadanStart": "Début du Ramadan",
            "laylatAlQadr": "Nuit du Destin (Laylat al-Qadr)",
            "eidAlFitr": "Aïd al-Fitr",
            "arafat": "Jour d'Arafat",
            "eidAlAdha": "Aïd al-Adha"
        };

        const hijriMonthsFr = [
            "", "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
            "Jumada al-awwal", "Jumada al-thani", "Rajab", "Sha'ban",
            "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
        ];

        const displayMonthName = trans.hijriMonths?.[viewMonth] || hijriMonthsFr[viewMonth] || viewMonth;

        return `
            <div id="upcoming-events-section" class="card mb-6" style="padding: 1.5rem; animation: fadeIn 0.3s ease-in;" dir="${rtl ? 'rtl' : 'ltr'}">
                <div style="display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 3px 8px rgba(0,0,0,0.1);">
                        📅
                    </div>
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--heading-color); margin-bottom: 0.125rem;">
                            ${trans.eventsFor || 'Événements en'} ${displayMonthName}
                        </h3>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">${viewYear} AH</p>
                    </div>
                </div>
                
                <div style="display: grid; gap: 0.625rem;">
                    ${monthEvents.length > 0 ? monthEvents.map(evt => {
                        if (!evt) return '';

                        const rawName = evt.nameKey || evt.event || 'Événement';
                        const displayName = trans.islamicEvents?.[rawName] || eventNamesFr[rawName] || rawName;
                        const icon = evt.icon || '▫️';

                        return `
                            <div class="card" style="padding: 1rem; background: var(--bg-color); border-left: 3px solid var(--primary-color); transition: all 0.2s ease; cursor: default;"
                                 onmouseover="this.style.transform='translateX(3px)'; this.style.boxShadow='var(--shadow-md)'"
                                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='var(--shadow-sm)'">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div style="font-size: 2rem; flex-shrink: 0;">${icon}</div>
                                    <div style="flex: 1;">
                                        <h4 style="font-weight: 700; font-size: 0.875rem; color: var(--text-color); margin-bottom: 0.125rem;">${displayName}</h4>
                                        <p style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.375rem;">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                <line x1="16" y1="2" x2="16" y2="6"/>
                                                <line x1="8" y1="2" x2="8" y2="6"/>
                                                <line x1="3" y1="10" x2="21" y2="10"/>
                                            </svg>
                                            ${evt.day || '?'} ${displayMonthName} ${viewYear}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('') : `
                        <div style="text-align: center; padding: 2rem 1.5rem; border: 2px dashed var(--border-color); border-radius: 12px; background: var(--bg-color);">
                            <div style="font-size: 3rem; opacity: 0.3; margin-bottom: 0.75rem;">📅</div>
                            <p style="color: var(--text-muted); font-style: italic; font-size: 0.75rem;">
                                ${trans.noEventsThisMonth || 'Aucun événement majeur ce mois-ci'}
                            </p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderDateConverter(trans, rtl) {
        return `
            <div class="card" style="padding: 1.5rem; animation: fadeIn 0.3s ease-in;" dir="${rtl ? 'rtl' : 'ltr'}">
                <div style="display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1rem;">
                    <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--accent-color) 0%, #d4af37 100%); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 3px 8px rgba(0,0,0,0.1);">
                        🔄
                    </div>
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--heading-color);">
                            ${trans.dateConverter || 'Convertisseur de Dates'}
                        </h3>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">Grégorien ⇄ Hijri</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                    <!-- Grégorien vers Hijri -->
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.375rem;">
                            📅 ${trans.gregorianToHijri || 'Grégorien → Hijri'}
                        </label>
                        <div style="display: flex; gap: 0.625rem;">
                            <input type="date" id="gregorianInput" class="input-field" style="flex: 1; padding: 0.625rem; border-radius: 10px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color); font-size: 0.8125rem; transition: all 0.2s ease;"
                                   onfocus="this.style.borderColor='var(--primary-color)'; this.style.boxShadow='0 0 0 3px var(--primary-light)'"
                                   onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none'">
                            <button data-action="convert-g-to-h" class="btn" style="background: var(--primary-color); color: white; padding: 0.625rem 1.25rem; border-radius: 10px; font-weight: 600; white-space: nowrap; font-size: 0.8125rem;">
                                ${trans.convert || 'Convertir'}
                            </button>
                        </div>
                        <div id="gToHResult" style="margin-top: 0.625rem; padding: 0.75rem; border-radius: 10px; background: var(--primary-light); color: var(--primary-color); font-weight: 700; text-align: center; min-height: 2rem; display: flex; align-items: center; justify-content: center; font-size: 0.875rem;"></div>
                    </div>

                    <!-- Hijri vers Grégorien -->
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-color); margin-bottom: 0.375rem;">
                            🌙 ${trans.hijriToGregorian || 'Hijri → Grégorien'}
                        </label>
                        <div style="display: flex; gap: 0.625rem;">
                            <input type="text" id="hijriInput" placeholder="DD-MM-YYYY" class="input-field" style="flex: 1; padding: 0.625rem; border-radius: 10px; border: 2px solid var(--border-color); background: var(--card-bg); color: var(--text-color); font-size: 0.8125rem; transition: all 0.2s ease;"
                                   onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 0 3px rgba(212, 175, 55, 0.2)'"
                                   onblur="this.style.borderColor='var(--border-color)'; this.style.boxShadow='none'">
                            <button data-action="convert-h-to-g" class="btn" style="background: var(--accent-color); color: white; padding: 0.625rem 1.25rem; border-radius: 10px; font-weight: 600; white-space: nowrap; font-size: 0.8125rem;">
                                ${trans.convert || 'Convertir'}
                            </button>
                        </div>
                        <div id="hToGResult" style="margin-top: 0.625rem; padding: 0.75rem; border-radius: 10px; background: var(--accent-light); color: var(--accent-color); font-weight: 700; text-align: center; min-height: 2rem; display: flex; align-items: center; justify-content: center; font-size: 0.875rem;"></div>
                    </div>
                </div>
            </div>
        `;
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
                case 'refresh-calendar':
                    const btn = target;
                    btn.style.transform = 'rotate(360deg)';
                    this.engine.refreshData().then(() => {
                        setTimeout(() => {
                            btn.style.transform = 'rotate(0deg)';
                        }, 300);
                    });
                    break;
                case 'prev-month':
                    this.engine.previousMonth();
                    break;
                case 'next-month':
                    this.engine.nextMonth();
                    break;
                case 'convert-g-to-h':
                    const gDate = container.querySelector('#gregorianInput').value;
                    if (gDate) {
                        const [y, m, d] = gDate.split('-');
                        this.engine.convertGregorianToHijri(`${d}-${m}-${y}`).then(res => {
                            const resultEl = container.querySelector('#gToHResult');
                            resultEl.innerHTML = res ? 
                                `🌙 ${res.day} ${res.month.en} ${res.year} AH` : 
                                '⚠️ Erreur de conversion';
                        });
                    }
                    break;
                case 'convert-h-to-g':
                    const hDate = container.querySelector('#hijriInput').value;
                    if (hDate) {
                        this.engine.convertHijriToGregorian(hDate).then(res => {
                            const resultEl = container.querySelector('#hToGResult');
                            resultEl.innerHTML = res ? 
                                `📅 ${res.day} ${res.month.en} ${res.year}` : 
                                '⚠️ Erreur de conversion';
                        });
                    }
                    break;
                case 'retry-calendar':
                    this.loadCalendarGrid(container);
                    break;
            }
        });

        // Écouteur pour les changements de mois
        this.eventBus.on('calendar:month-changed', () => {
            const month = this.state.get('calendarViewMonth');
            const year = this.state.get('calendarViewYear');
            const trans = this.translations.getAll();

            const monthNamesEn = [
                'Muharram', 'Safar', "Rabi' al-awwal", "Rabi' al-thani",
                'Jumada al-awwal', 'Jumada al-thani', 'Rajab', "Sha'ban",
                'Ramadan', 'Shawwal', "Dhu al-Qi'dah", "Dhu al-Hijjah"
            ];

            let displayMonth = monthNamesEn[month - 1];
            if (trans.hijriMonths && trans.hijriMonths[month]) {
                displayMonth = trans.hijriMonths[month];
            }

            const titleEl = container.querySelector('#calendarTitle');
            if (titleEl) {
                titleEl.innerText = `${displayMonth} ${year}`;
                const subtitleEl = titleEl.nextElementSibling;
                if (subtitleEl && trans.hijriMonthsArabic) {
                    subtitleEl.innerText = trans.hijriMonthsArabic[month] || '';
                }
            }

            this.loadCalendarGrid(container);

            const eventsSection = container.querySelector('#upcoming-events-section');
            if (eventsSection) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = this.renderUpcomingEvents(trans, this.translations.isRTL());
                eventsSection.outerHTML = tempDiv.firstElementChild.outerHTML;
            }
        });
    }
}
