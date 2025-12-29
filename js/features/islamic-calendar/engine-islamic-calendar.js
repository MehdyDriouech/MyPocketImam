export class IslamicCalendarEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.pluginManager = dependencies.pluginManager;
    
    // Cache pour stocker les résultats des appels API
    this.cache = {
      conversions: new Map(), // Stocke gToH et hToG
      calendars: new Map()    // Stocke les calendriers mensuels
    };
    
    this.monthCache = new Map();
    this.pendingRequests = new Map(); // Pour éviter les requêtes en double

    // Chargement des événements
    this.eventsData = null;
    
    // Constantes pour les clés localStorage
    this.STORAGE_KEYS = {
        EVENTS: 'mpi_islamic_events',
        CALENDAR_PREFIX: 'mpi_calendar_'
    };
  }

  async init() {
    await this.getIslamicEvents();
    
    // Initialiser avec la date d'aujourd'hui
    const today = new Date();
    // On fait une première conversion pour avoir le mois/année Hijri initial
    const dateStr = this._formatDateForApi(today);
    const hijriDate = await this.convertGregorianToHijri(dateStr);
    
    if (hijriDate) {
        this.state.set('currentHijriDate', hijriDate);
        this.state.set('calendarViewMonth', parseInt(hijriDate.month.number));
        this.state.set('calendarViewYear', parseInt(hijriDate.year));
    }
  }

  /**
   * Obtient la date Hijri actuelle
   * @returns {Promise<Object>} Date Hijri complète avec date grégorienne
   */
  async getCurrentHijriDate() {
    const today = new Date();
    const dateStr = this._formatDateForApi(today);
    
    // Récupérer les deux dates (Hijri et Grégorien) depuis l'API
    const cacheKey = `gToH_${dateStr}`;
    if (this.cache.conversions.has(cacheKey)) {
      const cached = this.cache.conversions.get(cacheKey);
      if (cached.gregorian) {
        this.state.set('currentHijriDate', cached);
        return cached;
      }
    }

    try {
      const response = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        // Combiner hijri et gregorian dans un seul objet
        const result = {
          ...data.data.hijri,
          gregorian: data.data.gregorian
        };
        
        this.cache.conversions.set(cacheKey, result);
        this.state.set('currentHijriDate', result);
        return result;
      }
    } catch (error) {
      console.error('Error getting current Hijri date:', error);
    }
    
    return null;
  }

  /**
   * Convertit une date grégorienne en date Hijri
   * @param {string} date - Date au format 'DD-MM-YYYY'
   */
  async convertGregorianToHijri(date) {
    const cacheKey = `gToH_${date}`;
    if (this.cache.conversions.has(cacheKey)) {
      return this.cache.conversions.get(cacheKey);
    }

    try {
      const response = await fetch(`https://api.aladhan.com/v1/gToH/${date}`);
      const data = await response.json();
      
      if (data.code === 200) {
        const hijriData = data.data.hijri;
        this.cache.conversions.set(cacheKey, hijriData);
        return hijriData;
      }
    } catch (error) {
      console.error('Error converting Gregorian to Hijri:', error);
    }
    return null;
  }

  /**
   * Convertit une date Hijri en date grégorienne
   * @param {string} date - Date au format 'DD-MM-YYYY'
   */
  async convertHijriToGregorian(date) {
    const cacheKey = `hToG_${date}`;
    if (this.cache.conversions.has(cacheKey)) {
      return this.cache.conversions.get(cacheKey);
    }

    try {
      const response = await fetch(`https://api.aladhan.com/v1/hToG/${date}`);
      const data = await response.json();
      
      if (data.code === 200) {
        const gregorianData = data.data.gregorian;
        this.cache.conversions.set(cacheKey, gregorianData);
        return gregorianData;
      }
    } catch (error) {
      console.error('Error converting Hijri to Gregorian:', error);
    }
    return null;
  }

  /**
   * Obtient le calendrier d'un mois Hijri
   * Utilise le localStorage pour cacher l'année entière progressivement
   * @param {number} month - Numéro du mois (1-12)
   * @param {number} year - Année Hijri
   */
  async getHijriMonthCalendar(month, year) {
    const storageKey = `${this.STORAGE_KEYS.CALENDAR_PREFIX}${year}`;
    
    // 1. Vérifier le localStorage
    let annualCache = {};
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            annualCache = JSON.parse(saved);
            // Si le mois est présent dans le cache annuel
            if (annualCache[month]) {
                return annualCache[month];
            }
        }
    } catch (e) {
        console.error('Error reading calendar cache:', e);
    }

    // 2. Vérifier les requêtes en cours (deduplication)
    const requestKey = `${month}-${year}`;
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    this.state.set('calendarLoading', true);

    // 3. Lancer la requête API
    const promise = (async () => {
        try {
            const response = await fetch(`https://api.aladhan.com/v1/hToGCalendar/${month}/${year}`);
            
            if (response.status === 429) {
                throw new Error('RATE_LIMIT');
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.code === 200 && data.data) {
                // Sauvegarder dans le cache annuel
                annualCache[month] = data.data;
                try {
                    localStorage.setItem(storageKey, JSON.stringify(annualCache));
                } catch (e) {
                    console.warn('LocalStorage full or error:', e);
                }
                
                this.state.set('calendarLoading', false);
                return data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching calendar:', error);
            this.state.set('calendarLoading', false);
            throw error;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    })();

    this.pendingRequests.set(requestKey, promise);
    return promise;
  }

  /**
   * Charge les événements islamiques
   * Source: API AlAdhan specialDays
   * Fallback: Local JSON
   */
  async getIslamicEvents() {
    if (this.eventsData) return this.eventsData;
    
    // 1. Vérifier LocalStorage
    try {
        const savedEvents = localStorage.getItem(this.STORAGE_KEYS.EVENTS);
        if (savedEvents) {
            this.eventsData = JSON.parse(savedEvents);
            return this.eventsData;
        }
    } catch (e) {
        console.error('Error reading events cache:', e);
    }

    // 2. Charger depuis l'API (si pas de cache)
    try {
      const response = await fetch('https://api.aladhan.com/v1/specialDays');
      const apiData = await response.json();
      
      if (apiData.code === 200 && Array.isArray(apiData.data) && apiData.data.length > 0) {
          // Mapping et enrichissement des données API
          // On charge d'abord la config locale pour avoir les icônes/couleurs
          const localConfig = await this.loadLocalEventsConfig();
          
          this.eventsData = apiData.data.map(evt => {
              // Essayer de trouver une correspondance locale pour l'UI
              // L'API renvoie "event": "Ashura" par exemple
              // On cherche une correspondance partielle insensible à la casse
              const match = localConfig.find(local => 
                  local.nameKey.toLowerCase() === evt.event.toLowerCase() || 
                  evt.event.toLowerCase().includes(local.nameKey.toLowerCase())
              );

              // Si match trouvé, on prend tout du local (plus riche) mais on pourrait update la date si l'API était plus précise
              // Si pas de match, on crée un objet par défaut
              if (match) return match;

              // Création d'un événement par défaut pour les données API non reconnues
              // L'API renvoie date: "10 Muharram 1445" -> on doit parser
              let month = 1; 
              let day = 1;
              
              // Parsing très basique de la date API (format "DD Month YYYY")
              // C'est risqué, donc on préfère le fallback local si possible
              // Pour éviter les bugs "undefined", on retourne un objet structurellement valide
              return {
                  id: evt.event.toLowerCase().replace(/\s/g, '-'),
                  nameKey: evt.event,
                  month: match ? match.month : 0, // Placeholder
                  day: match ? match.day : 0,     // Placeholder
                  icon: "📅",
                  color: "text-gray-600",
                  importance: "normal"
              };
          }).filter(e => e.month !== 0); // On garde que ceux qu'on a réussi à mapper ou parser

          // Si le mapping a donné un tableau vide ou trop court, on fallback sur le local pur
          if (this.eventsData.length < 5) {
             console.warn('API data mapping failed, using local config');
             this.eventsData = localConfig;
          }
      }
    } catch (error) {
      console.error('API events error, falling back to local:', error);
    }

    // Fallback / Chargement initial Local si API a échoué ou renvoyé vide
    if (!this.eventsData || this.eventsData.length === 0) {
        const response = await fetch('js/features/islamic-calendar/data/islamic-events.json');
        this.eventsData = await response.json();
    }
    
    // Sauvegarder dans LS uniquement si on a des données valides
    if (this.eventsData && this.eventsData.length > 0) {
        localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(this.eventsData));
    }
    
    return this.eventsData;
  }
  
  // Helper pour charger la config locale sans écraser eventsData
  async loadLocalEventsConfig() {
      try {
          const r = await fetch('js/features/islamic-calendar/data/islamic-events.json');
          return await r.json();
      } catch(e) { return []; }
  }

  /**
   * Force la mise à jour des données (API Refresh)
   */
  async refreshData() {
      // 1. Nettoyer le cache LocalStorage
      localStorage.removeItem(this.STORAGE_KEYS.EVENTS);
      
      // Nettoyer les calendriers (on doit trouver toutes les clés qui commencent par le prefixe)
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith(this.STORAGE_KEYS.CALENDAR_PREFIX)) {
              localStorage.removeItem(key);
          }
      });
      
      // 2. Nettoyer le cache mémoire
      this.eventsData = null;
      this.monthCache.clear(); // Pas utilisé dans la nlle version mais au cas où
      
      // 3. Recharger
      await this.getIslamicEvents();
      this.eventBus.emit('calendar:month-changed'); // Force refresh UI
      this.eventBus.emit('view:refresh');
      
      return true;
  }

  /**
   * Trouve les événements pour une date donnée
   * @param {Object} hijriDate - Objet date Hijri (doit contenir month.number et day)
   */
  findEventsForDate(hijriDate) {
    if (!this.eventsData || !hijriDate) return [];
    
    return this.eventsData.filter(event => 
      event.month === parseInt(hijriDate.month.number) && 
      event.day === parseInt(hijriDate.day)
    );
  }

  /**
   * Navigation : Mois suivant
   */
  nextMonth() {
    let currentMonth = parseInt(this.state.get('calendarViewMonth')) || 1;
    let currentYear = parseInt(this.state.get('calendarViewYear')) || 1445;

    if (currentMonth === 12) {
      currentMonth = 1;
      currentYear++;
    } else {
      currentMonth++;
    }
    
    // Sécurité : Reset si valeurs aberrantes
    if (isNaN(currentMonth) || currentMonth < 1 || currentMonth > 12) currentMonth = 1;
    if (isNaN(currentYear)) currentYear = 1445;

    this.state.update({
      calendarViewMonth: currentMonth,
      calendarViewYear: currentYear
    });
    
    this.eventBus.emit('calendar:month-changed');
  }

  /**
   * Navigation : Mois précédent
   */
  previousMonth() {
    let currentMonth = parseInt(this.state.get('calendarViewMonth')) || 1;
    let currentYear = parseInt(this.state.get('calendarViewYear')) || 1445;

    if (currentMonth === 1) {
      currentMonth = 12;
      currentYear--;
    } else {
      currentMonth--;
    }
    
    // Sécurité
    if (isNaN(currentMonth) || currentMonth < 1 || currentMonth > 12) currentMonth = 1;
    if (isNaN(currentYear)) currentYear = 1445;

    this.state.update({
      calendarViewMonth: currentMonth,
      calendarViewYear: currentYear
    });

    this.eventBus.emit('calendar:month-changed');
  }

  /**
   * Helper : Formater date JS en DD-MM-YYYY
   */
  _formatDateForApi(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
}
