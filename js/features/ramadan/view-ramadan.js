export class RamadanView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        
        // État de la vue
        this.currentView = 'dashboard'; // dashboard, day-detail
        this.selectedDay = null;
        this.countdownInterval = null;
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        // Nettoyer l'intervalle précédent
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        const dirAttr = rtl ? 'rtl' : 'ltr';
        const lang = this.state.get('language') || 'fr';

        container.innerHTML = `
        <div class="ramadan-container" dir="${dirAttr}">
            ${this.renderHeader(trans, rtl)}
            
            <div class="ramadan-content">
                ${this.currentView === 'dashboard' ? this.renderDashboard(trans, lang) : ''}
                ${this.currentView === 'day-detail' ? this.renderDayDetail(trans, lang) : ''}
            </div>
        </div>
        `;

        this.attachEventListeners(container);
        
        // Démarrer le countdown si on est sur le dashboard
        if (this.currentView === 'dashboard' && this.engine.isRamadan()) {
            this.startCountdown(container);
        }
    }

    renderHeader(trans, rtl) {
        const isDetail = this.currentView === 'day-detail';
        
        return `
        <div class="app-header mb-6 rounded-xl">
            <button data-action="${isDetail ? 'go-dashboard' : 'go-tools'}" class="btn btn-secondary">
                <span>${rtl ? '◀' : '▶'}</span>
                <span>${trans.back}</span>
            </button>
            <h1 class="app-title">${isDetail ? `${trans.ramadanDay || 'Jour'} ${this.selectedDay}` : (trans.ramadanTracker || 'Tracker Ramadan')}</h1>
            <div style="width: 24px;"></div>
        </div>
        `;
    }

    renderDashboard(trans, lang) {
        const ramadanInfo = this.engine.getRamadanInfo();
        const isRamadan = this.engine.isRamadan();
        const stats = this.engine.getRamadanStats();
        
        return `
        <div class="ramadan-dashboard">
            <!-- Status Card -->
            ${this.renderStatusCard(trans, lang, ramadanInfo, isRamadan)}
            
            <!-- Countdown Iftar (si Ramadan) -->
            ${isRamadan ? this.renderIftarCountdown(trans) : ''}
            
            <!-- Calendrier 30 jours -->
            ${this.renderCalendar(trans, isRamadan)}
            
            <!-- Statistiques -->
            ${this.renderStats(trans, stats)}
            
            <!-- Dua du jour -->
            ${this.renderDuaCard(trans, lang)}
            
            <!-- Conseil du jour -->
            ${this.renderTipCard(trans, lang)}
        </div>
        `;
    }

    renderStatusCard(trans, lang, ramadanInfo, isRamadan) {
        if (isRamadan) {
            const currentDay = this.engine.getCurrentRamadanDay();
            const isLastTen = this.engine.isLastTenNights(currentDay);
            const isPotentialQadr = this.engine.isPotentialLaylatulQadr(currentDay);
            
            return `
            <div class="ramadan-status-card active">
                <div class="status-icon">🌙</div>
                <div class="status-content">
                    <h2>${trans.ramadanMubarak || 'Ramadan Moubarak !'}</h2>
                    <p class="status-day">${trans.ramadanDay || 'Jour'} <strong>${currentDay}</strong> / 30</p>
                    ${isLastTen ? `
                    <div class="last-ten-badge ${isPotentialQadr ? 'qadr' : ''}">
                        ✨ ${isPotentialQadr ? (trans.potentialQadr || 'Nuit potentielle de Laylat al-Qadr !') : (trans.lastTenNights || 'Les 10 dernières nuits')}
                    </div>
                    ` : ''}
                </div>
            </div>
            `;
        } else {
            const daysTo = this.engine.getDaysToRamadan();
            
            return `
            <div class="ramadan-status-card waiting">
                <div class="status-icon">🕌</div>
                <div class="status-content">
                    <h2>${trans.ramadanComing || 'Ramadan arrive bientôt'}</h2>
                    ${daysTo !== null ? `
                    <p class="status-countdown">
                        <strong>${daysTo}</strong> ${trans.daysRemaining || 'jours restants'}
                    </p>
                    ` : `
                    <p class="status-info">${trans.ramadanPrepare || 'Préparez-vous pour le mois béni'}</p>
                    `}
                </div>
            </div>
            `;
        }
    }

    renderIftarCountdown(trans) {
        const countdown = this.engine.getIftarCountdown();
        
        if (!countdown) {
            return `
            <div class="iftar-countdown-card no-data">
                <p>${trans.iftarNoData || 'Configurez votre localisation pour voir le compte à rebours'}</p>
            </div>
            `;
        }
        
        if (countdown.passed) {
            return `
            <div class="iftar-countdown-card passed">
                <div class="iftar-icon">🍽️</div>
                <div class="iftar-content">
                    <h3>${trans.iftarTime || 'Heure de l\'Iftar'}</h3>
                    <p class="iftar-passed">${trans.iftarPassed || 'L\'Iftar est passé pour aujourd\'hui'}</p>
                    <p class="iftar-was">${trans.iftarWasAt || 'Iftar était à'} ${countdown.iftarTime}</p>
                </div>
            </div>
            `;
        }
        
        return `
        <div class="iftar-countdown-card active">
            <div class="iftar-icon">⏰</div>
            <div class="iftar-content">
                <h3>${trans.iftarCountdown || 'Compte à rebours Iftar'}</h3>
                <div class="countdown-display" id="iftar-countdown">
                    <div class="countdown-unit">
                        <span class="countdown-value" id="countdown-hours">${String(countdown.hours).padStart(2, '0')}</span>
                        <span class="countdown-label">${trans.hours || 'h'}</span>
                    </div>
                    <span class="countdown-separator">:</span>
                    <div class="countdown-unit">
                        <span class="countdown-value" id="countdown-minutes">${String(countdown.minutes).padStart(2, '0')}</span>
                        <span class="countdown-label">${trans.minutes || 'm'}</span>
                    </div>
                    <span class="countdown-separator">:</span>
                    <div class="countdown-unit">
                        <span class="countdown-value" id="countdown-seconds">${String(countdown.seconds).padStart(2, '0')}</span>
                        <span class="countdown-label">${trans.seconds || 's'}</span>
                    </div>
                </div>
                <p class="iftar-at">${trans.iftarAt || 'Iftar à'} ${countdown.iftarTime}</p>
            </div>
        </div>
        `;
    }

    renderCalendar(trans, isRamadan) {
        const currentDay = isRamadan ? this.engine.getCurrentRamadanDay() : 0;
        
        let calendarHtml = '';
        for (let day = 1; day <= 30; day++) {
            const status = this.engine.getDayStatus(day);
            const isToday = day === currentDay;
            const isPast = day < currentDay;
            const isFuture = day > currentDay;
            const isLastTen = this.engine.isLastTenNights(day);
            const isPotentialQadr = this.engine.isPotentialLaylatulQadr(day);
            
            let dayClass = 'calendar-day';
            if (isToday) dayClass += ' today';
            if (isPast) dayClass += ' past';
            if (isFuture && isRamadan) dayClass += ' future';
            if (status === 'completed') dayClass += ' completed';
            else if (status === 'partial') dayClass += ' partial';
            if (isLastTen) dayClass += ' last-ten';
            if (isPotentialQadr) dayClass += ' potential-qadr';
            
            calendarHtml += `
            <button data-action="select-day" data-day="${day}" class="${dayClass}">
                <span class="day-number">${day}</span>
                ${status === 'completed' ? '<span class="day-check">✓</span>' : ''}
                ${isPotentialQadr ? '<span class="day-star">✨</span>' : ''}
            </button>
            `;
        }
        
        return `
        <div class="ramadan-calendar-card">
            <h3>${trans.ramadan30Days || 'Les 30 jours du Ramadan'}</h3>
            <div class="calendar-legend">
                <span class="legend-item"><span class="legend-dot completed"></span> ${trans.completed || 'Complété'}</span>
                <span class="legend-item"><span class="legend-dot partial"></span> ${trans.partial || 'Partiel'}</span>
                <span class="legend-item"><span class="legend-dot empty"></span> ${trans.notStarted || 'Non commencé'}</span>
            </div>
            <div class="ramadan-calendar">
                ${calendarHtml}
            </div>
        </div>
        `;
    }

    renderStats(trans, stats) {
        return `
        <div class="ramadan-stats-card">
            <h3>${trans.ramadanStats || 'Vos statistiques'}</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-icon">🌅</span>
                    <span class="stat-value">${stats.fpikedDays}</span>
                    <span class="stat-label">${trans.fastingDays || 'Jours de jeûne'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🕌</span>
                    <span class="stat-value">${stats.tapiawihDays}</span>
                    <span class="stat-label">${trans.tapiawihPrayers || 'Tarawih'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">📖</span>
                    <span class="stat-value">${stats.totalQuranPages}</span>
                    <span class="stat-label">${trans.quranPages || 'Pages Coran'}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🔥</span>
                    <span class="stat-value">${stats.streakBest}</span>
                    <span class="stat-label">${trans.bestStreak || 'Meilleure série'}</span>
                </div>
            </div>
            <div class="stats-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${stats.completionPercentage}%"></div>
                </div>
                <span class="progress-label">${stats.completedDays}/30 ${trans.daysCompleted || 'jours complétés'} (${stats.completionPercentage}%)</span>
            </div>
        </div>
        `;
    }

    renderDuaCard(trans, lang) {
        const dua = this.engine.getRandomDua('iftar');
        if (!dua) return '';
        
        return `
        <div class="ramadan-dua-card">
            <div class="dua-header">
                <span class="dua-icon">🤲</span>
                <h3>${trans.duaIftar || 'Invocation de l\'Iftar'}</h3>
            </div>
            <p class="dua-arabic">${dua.arabic}</p>
            <p class="dua-transliteration">${dua.transliteration}</p>
            <p class="dua-translation">${dua.translation[lang] || dua.translation.fr}</p>
        </div>
        `;
    }

    renderTipCard(trans, lang) {
        const tip = this.engine.getRandomTip(lang);
        if (!tip) return '';
        
        return `
        <div class="ramadan-tip-card">
            <div class="tip-icon">💡</div>
            <p class="tip-text">${tip}</p>
        </div>
        `;
    }

    renderDayDetail(trans, lang) {
        const day = this.selectedDay;
        const dayData = this.engine.getDayData(day);
        if (!dayData) return '<p>Erreur: Jour non trouvé</p>';
        
        const isLastTen = this.engine.isLastTenNights(day);
        const isPotentialQadr = this.engine.isPotentialLaylatulQadr(day);
        
        return `
        <div class="ramadan-day-detail">
            ${isPotentialQadr ? `
            <div class="qadr-banner">
                ✨ ${trans.potentialQadrNight || 'Nuit potentielle de Laylat al-Qadr - Multipliez vos adorations !'}
            </div>
            ` : ''}
            
            <!-- Jeûne -->
            <div class="day-section">
                <h3><span>🌅</span> ${trans.fasting || 'Jeûne'}</h3>
                <label class="checkbox-item">
                    <input type="checkbox" data-field="fpiked" ${dayData.fpiked ? 'checked' : ''} />
                    <span class="checkbox-label">${trans.fastingCompleted || 'Jeûne accompli'}</span>
                </label>
            </div>
            
            <!-- Prières -->
            <div class="day-section">
                <h3><span>🕌</span> ${trans.prayers || 'Prières'}</h3>
                <div class="prayers-grid">
                    ${['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map(prayer => `
                    <label class="checkbox-item prayer-item">
                        <input type="checkbox" data-field="prayer" data-prayer="${prayer}" ${dayData.prayers[prayer] ? 'checked' : ''} />
                        <span class="checkbox-label">${trans.prayers?.[prayer] || trans[prayer] || prayer}</span>
                    </label>
                    `).join('')}
                </div>
            </div>
            
            <!-- Tarawih -->
            <div class="day-section">
                <h3><span>🌙</span> ${trans.tapiawih || 'Tarawih'}</h3>
                <label class="checkbox-item">
                    <input type="checkbox" data-field="tapiawih" ${dayData.tapiawih ? 'checked' : ''} />
                    <span class="checkbox-label">${trans.tapiawihCompleted || 'Tarawih accompli'}</span>
                </label>
            </div>
            
            <!-- Coran -->
            <div class="day-section">
                <h3><span>📖</span> ${trans.quran || 'Coran'}</h3>
                <div class="quran-input-group">
                    <label>${trans.pagesRead || 'Pages lues'}</label>
                    <div class="quran-counter">
                        <button data-action="decrement-pages" class="counter-btn">−</button>
                        <input type="number" data-field="quranPages" value="${dayData.quranPages}" min="0" max="604" />
                        <button data-action="increment-pages" class="counter-btn">+</button>
                    </div>
                </div>
            </div>
            
            <!-- Notes -->
            <div class="day-section">
                <h3><span>📝</span> ${trans.notes || 'Notes'}</h3>
                <textarea data-field="notes" placeholder="${trans.notesPlaceholder || 'Vos réflexions, duas, objectifs...'}">${dayData.notes}</textarea>
            </div>
            
            <!-- Status -->
            <div class="day-status ${dayData.completed ? 'completed' : 'incomplete'}">
                ${dayData.completed 
                    ? `✅ ${trans.dayCompleted || 'Journée complète - Qu\'Allah accepte vos adorations !'}`
                    : `⏳ ${trans.dayIncomplete || 'Continuez vos efforts !'}`
                }
            </div>
        </div>
        `;
    }

    startCountdown(container) {
        const updateCountdown = () => {
            const countdown = this.engine.getIftarCountdown();
            if (!countdown || countdown.passed) {
                clearInterval(this.countdownInterval);
                return;
            }
            
            const hoursEl = container.querySelector('#countdown-hours');
            const minutesEl = container.querySelector('#countdown-minutes');
            const secondsEl = container.querySelector('#countdown-seconds');
            
            if (hoursEl) hoursEl.textContent = String(countdown.hours).padStart(2, '0');
            if (minutesEl) minutesEl.textContent = String(countdown.minutes).padStart(2, '0');
            if (secondsEl) secondsEl.textContent = String(countdown.seconds).padStart(2, '0');
        };
        
        this.countdownInterval = setInterval(updateCountdown, 1000);
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

                case 'go-dashboard':
                    this.currentView = 'dashboard';
                    this.selectedDay = null;
                    this.eventBus.emit('view:refresh');
                    break;

                case 'select-day':
                    this.selectedDay = parseInt(target.dataset.day);
                    this.currentView = 'day-detail';
                    this.eventBus.emit('view:refresh');
                    break;

                case 'increment-pages':
                    this.handlePagesChange(container, 1);
                    break;

                case 'decrement-pages':
                    this.handlePagesChange(container, -1);
                    break;
            }
        });

        // Gestion des checkboxes et inputs
        container.addEventListener('change', (e) => {
            const input = e.target;
            
            if (input.dataset.field === 'fpiked') {
                this.engine.updateDay(this.selectedDay, { fpiked: input.checked });
                this.updateDayStatus(container);
            }
            else if (input.dataset.field === 'tapiawih') {
                this.engine.updateDay(this.selectedDay, { tapiawih: input.checked });
                this.updateDayStatus(container);
            }
            else if (input.dataset.field === 'prayer') {
                const prayer = input.dataset.prayer;
                const prayers = { [prayer]: input.checked };
                this.engine.updateDay(this.selectedDay, { prayers });
                this.updateDayStatus(container);
            }
            else if (input.dataset.field === 'quranPages') {
                this.engine.updateDay(this.selectedDay, { quranPages: input.value });
            }
        });

        // Gestion du textarea notes
        container.addEventListener('input', (e) => {
            if (e.target.dataset.field === 'notes') {
                this.engine.updateDay(this.selectedDay, { notes: e.target.value });
            }
        });
    }

    handlePagesChange(container, delta) {
        const input = container.querySelector('input[data-field="quranPages"]');
        if (input) {
            let value = parseInt(input.value) || 0;
            value = Math.max(0, Math.min(604, value + delta));
            input.value = value;
            this.engine.updateDay(this.selectedDay, { quranPages: value });
        }
    }

    updateDayStatus(container) {
        const dayData = this.engine.getDayData(this.selectedDay);
        const statusEl = container.querySelector('.day-status');
        if (statusEl && dayData) {
            const trans = this.translations.getAll();
            statusEl.className = `day-status ${dayData.completed ? 'completed' : 'incomplete'}`;
            statusEl.innerHTML = dayData.completed 
                ? `✅ ${trans.dayCompleted || 'Journée complète - Qu\'Allah accepte vos adorations !'}`
                : `⏳ ${trans.dayIncomplete || 'Continuez vos efforts !'}`;
        }
    }
}

