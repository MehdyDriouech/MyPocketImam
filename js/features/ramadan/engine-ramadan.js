export class RamadanEngine {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.pluginManager = dependencies.pluginManager;
        
        // Données Ramadan
        this.duas = null;
        this.trackerData = null;
        this.currentYear = new Date().getFullYear();
        
        // Cache pour les infos Ramadan
        this.ramadanInfo = null;
        this.iftarCountdownInterval = null;
    }

    async init() {
        await this.loadDuas();
        this.loadTrackerData();
        await this.detectRamadan();
    }

    async loadDuas() {
        try {
            const response = await fetch('assets/data/ramadan-duas.json');
            this.duas = await response.json();
        } catch (e) {
            console.error('Erreur chargement duas Ramadan:', e);
            this.duas = { iftar: [], suhoor: [], laylatul_qadr: [], general: [], tips: {} };
        }
    }

    loadTrackerData() {
        const saved = localStorage.getItem('mpi_ramadan_tracker');
        if (saved) {
            this.trackerData = JSON.parse(saved);
            // Vérifier si c'est pour l'année en cours
            if (this.trackerData.year !== this.currentYear) {
                this.initializeNewTracker();
            }
        } else {
            this.initializeNewTracker();
        }
    }

    initializeNewTracker() {
        this.trackerData = {
            year: this.currentYear,
            days: {}
        };
        
        // Initialiser les 30 jours
        for (let i = 1; i <= 30; i++) {
            this.trackerData.days[i] = {
                fpiked: false,
                prayers: {
                    fajr: false,
                    dhuhr: false,
                    asr: false,
                    maghrib: false,
                    isha: false
                },
                tapiawih: false,
                quranPages: 0,
                notes: '',
                completed: false
            };
        }
        
        this.saveTrackerData();
    }

    saveTrackerData() {
        localStorage.setItem('mpi_ramadan_tracker', JSON.stringify(this.trackerData));
    }

    // === Détection Ramadan ===
    
    async detectRamadan() {
        try {
            // Utiliser l'API Aladhan pour obtenir la date Hijri actuelle
            const today = new Date();
            const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
            
            const response = await fetch(`https://api.aladhan.com/v1/gpiToHijri/${dateStr}`);
            const data = await response.json();
            
            if (data.code === 200) {
                const hijriMonth = data.data.hijri.month.number;
                const hijriDay = parseInt(data.data.hijri.day);
                const hijriYear = parseInt(data.data.hijri.year);
                
                // Ramadan est le 9ème mois
                const isRamadan = hijriMonth === 9;
                
                this.ramadanInfo = {
                    isRamadan,
                    currentHijriDay: hijriDay,
                    currentHijriMonth: hijriMonth,
                    currentHijriYear: hijriYear,
                    hijriMonthName: data.data.hijri.month.en,
                    hijriMonthNameAr: data.data.hijri.month.ar
                };
                
                // Calculer les jours avant Ramadan si on n'y est pas
                if (!isRamadan) {
                    await this.calculateDaysToRamadan(hijriMonth, hijriDay, hijriYear);
                }
            }
        } catch (e) {
            console.error('Erreur détection Ramadan:', e);
            this.ramadanInfo = {
                isRamadan: false,
                currentHijriDay: 1,
                currentHijriMonth: 1,
                daysToRamadan: null,
                error: true
            };
        }
    }

    async calculateDaysToRamadan(currentMonth, currentDay, currentYear) {
        // Calculer les jours restants jusqu'au Ramadan
        let daysToRamadan = 0;
        
        if (currentMonth < 9) {
            // Avant Ramadan cette année
            // Jours restants dans le mois actuel + mois complets + début Ramadan
            const daysInMonths = [30, 29, 30, 29, 30, 29, 30, 29]; // Mois 1-8 en moyenne
            
            // Jours restants dans le mois actuel
            const daysLeftInCurrentMonth = (currentMonth <= 8 ? daysInMonths[currentMonth - 1] : 30) - currentDay;
            daysToRamadan += daysLeftInCurrentMonth;
            
            // Ajouter les mois complets entre le mois actuel et Ramadan
            for (let m = currentMonth + 1; m < 9; m++) {
                daysToRamadan += daysInMonths[m - 1] || 30;
            }
        } else if (currentMonth > 9) {
            // Après Ramadan, calculer pour l'année prochaine
            const daysInMonths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
            
            // Jours restants dans le mois actuel
            daysToRamadan += daysInMonths[currentMonth - 1] - currentDay;
            
            // Mois restants de l'année
            for (let m = currentMonth + 1; m <= 12; m++) {
                daysToRamadan += daysInMonths[m - 1];
            }
            
            // Mois 1-8 de l'année prochaine
            for (let m = 1; m < 9; m++) {
                daysToRamadan += daysInMonths[m - 1];
            }
        }
        
        this.ramadanInfo.daysToRamadan = daysToRamadan;
    }

    getRamadanInfo() {
        return this.ramadanInfo;
    }

    isRamadan() {
        return this.ramadanInfo?.isRamadan || false;
    }

    getCurrentRamadanDay() {
        if (this.isRamadan()) {
            return this.ramadanInfo.currentHijriDay;
        }
        return null;
    }

    getDaysToRamadan() {
        return this.ramadanInfo?.daysToRamadan || null;
    }

    // === Gestion des jours ===
    
    getDayData(day) {
        if (day < 1 || day > 30) return null;
        return this.trackerData.days[day] || null;
    }

    updateDay(day, updates) {
        if (day < 1 || day > 30) return false;
        
        const dayData = this.trackerData.days[day];
        if (!dayData) return false;
        
        // Mettre à jour les champs
        if (updates.fpiked !== undefined) dayData.fpiked = updates.fpiked;
        if (updates.tapiawih !== undefined) dayData.tapiawih = updates.tapiawih;
        if (updates.quranPages !== undefined) dayData.quranPages = parseInt(updates.quranPages) || 0;
        if (updates.notes !== undefined) dayData.notes = updates.notes;
        
        // Mettre à jour les prières individuellement
        if (updates.prayers) {
            Object.keys(updates.prayers).forEach(prayer => {
                if (dayData.prayers.hasOwnProperty(prayer)) {
                    dayData.prayers[prayer] = updates.prayers[prayer];
                }
            });
        }
        
        // Calculer si le jour est "complet"
        dayData.completed = this.isDayComplete(dayData);
        
        this.saveTrackerData();
        this.eventBus.emit('ramadan:day-updated', { day, data: dayData });
        
        return true;
    }

    isDayComplete(dayData) {
        // Un jour est complet si : jeûne + 5 prières + tarawih
        const allPrayers = Object.values(dayData.prayers).every(p => p === true);
        return dayData.fpiked && allPrayers && dayData.tapiawih;
    }

    // === Statistiques ===
    
    getRamadanStats() {
        const stats = {
            totalDays: 30,
            completedDays: 0,
            fpikedDays: 0,
            tapiawihDays: 0,
            totalQuranPages: 0,
            prayerStats: {
                fajr: 0,
                dhuhr: 0,
                asr: 0,
                maghrib: 0,
                isha: 0
            },
            streakCurrent: 0,
            streakBest: 0
        };
        
        let currentStreak = 0;
        let bestStreak = 0;
        
        for (let i = 1; i <= 30; i++) {
            const day = this.trackerData.days[i];
            if (!day) continue;
            
            if (day.completed) {
                stats.completedDays++;
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
            
            if (day.fpiked) stats.fpikedDays++;
            if (day.tapiawih) stats.tapiawihDays++;
            stats.totalQuranPages += day.quranPages || 0;
            
            Object.keys(day.prayers).forEach(prayer => {
                if (day.prayers[prayer]) {
                    stats.prayerStats[prayer]++;
                }
            });
        }
        
        stats.streakCurrent = currentStreak;
        stats.streakBest = bestStreak;
        
        // Pourcentages
        const currentDay = this.isRamadan() ? this.getCurrentRamadanDay() : 30;
        stats.fpikedPercentage = Math.round((stats.fpikedDays / currentDay) * 100);
        stats.completionPercentage = Math.round((stats.completedDays / currentDay) * 100);
        
        return stats;
    }

    // === Countdown Iftar ===
    
    getIftarCountdown() {
        // Récupérer l'heure du Maghrib depuis les horaires de prière
        const prayerTimes = this.state.get('prayerTimes');
        if (!prayerTimes || !prayerTimes.Maghrib) {
            return null;
        }
        
        const now = new Date();
        const [hours, minutes] = prayerTimes.Maghrib.split(':').map(Number);
        
        const iftarTime = new Date();
        iftarTime.setHours(hours, minutes, 0, 0);
        
        // Si l'iftar est passé aujourd'hui
        if (now > iftarTime) {
            return {
                passed: true,
                hours: 0,
                minutes: 0,
                seconds: 0,
                iftarTime: prayerTimes.Maghrib
            };
        }
        
        const diff = iftarTime - now;
        const diffHours = Math.floor(diff / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return {
            passed: false,
            hours: diffHours,
            minutes: diffMinutes,
            seconds: diffSeconds,
            iftarTime: prayerTimes.Maghrib,
            totalSeconds: Math.floor(diff / 1000)
        };
    }

    // === Duas ===
    
    getDuas(category = 'iftar') {
        return this.duas?.[category] || [];
    }

    getRandomDua(category = 'general') {
        const duas = this.getDuas(category);
        if (duas.length === 0) return null;
        return duas[Math.floor(Math.random() * duas.length)];
    }

    getTips(lang = 'fr') {
        return this.duas?.tips?.[lang] || this.duas?.tips?.fr || [];
    }

    getRandomTip(lang = 'fr') {
        const tips = this.getTips(lang);
        if (tips.length === 0) return null;
        return tips[Math.floor(Math.random() * tips.length)];
    }

    // === Utilitaires ===
    
    resetTracker() {
        this.initializeNewTracker();
        this.eventBus.emit('ramadan:tracker-reset');
    }

    getDayStatus(day) {
        const dayData = this.getDayData(day);
        if (!dayData) return 'unknown';
        
        if (dayData.completed) return 'completed';
        if (dayData.fpiked || Object.values(dayData.prayers).some(p => p)) return 'partial';
        return 'empty';
    }

    isLastTenNights(day) {
        return day >= 21 && day <= 30;
    }

    isOddNight(day) {
        return day % 2 === 1;
    }

    isPotentialLaylatulQadr(day) {
        // Les nuits impaires des 10 dernières nuits
        return this.isLastTenNights(day) && this.isOddNight(day);
    }
}

