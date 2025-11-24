export class ApiEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    // Nous accédons à la config via le PluginManager s'il est dispo, ou on s'attend à ce qu'elle soit passée
    // Dans l'architecture actuelle, ConfigEngine est un plugin.
    this.pluginManager = dependencies.pluginManager;
  }
  
  get hadithConfig() {
      const configEngine = this.pluginManager.get('config')?.engine;
      return configEngine ? configEngine.getHadithConfig() : null;
  }
  
  init() {
    // Charger les horaires de prière si configuré
    const city = this.state.get('city');
    const country = this.state.get('country');
    
    if (city && country) {
      this.fetchPrayerTimes(city, country);
    }
    
    // Charger le hadith du jour
    this.fetchDailyHadith();
  }
  
  async fetchPrayerTimes(city, country) {
    if (!city || !country) return;

    this.state.set('prayerTimesLoading', true);
    const method = this.state.get('calculationMethod') || '3';
    
    try {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${day}-${month}-${year}`;

      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity/${dateString}?city=${encodeURIComponent(city)}&country=${country.toUpperCase()}&method=${method}`
      );
      const data = await response.json();
      
      if (data.code === 200 && data.data) {
        this.state.set('prayerTimes', data.data.timings);
        this.state.set('currentDate', data.data.date); // Conserver la date aussi
        this.eventBus.emit('api:prayerTimes:loaded', data.data.timings);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      this.eventBus.emit('api:prayerTimes:error', error);
    } finally {
      this.state.set('prayerTimesLoading', false);
    }
  }
  
  // Helper interne pour le fallback
  async fetchWithFallback(apiLang, collection, hadithNum) {
    const baseUrl = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
    
    try {
        const minUrl = `${baseUrl}/${apiLang}-${collection}/${hadithNum}.min.json`;
        const response = await fetch(minUrl);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Failed to fetch .min.json, trying .json');
    }
    
    try {
        const jsonUrl = `${baseUrl}/${apiLang}-${collection}/${hadithNum}.json`;
        const response = await fetch(jsonUrl);
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('Failed to fetch .json');
    }
    
    throw new Error(`Failed to fetch hadith ${hadithNum} from ${collection}`);
  }

  async fetchDailyHadith() {
    this.state.set('hadithLoading', true);
    const userLang = this.state.get('language') || 'fr';
    const hadithConfig = this.hadithConfig;

    if (!hadithConfig) {
        console.error("Hadith config not found");
        this.state.set('hadithLoading', false);
        return;
    }
    
    try {
        const apiLang = hadithConfig.languageMap[userLang] || 'eng';
        const collection = hadithConfig.collections[Math.floor(Math.random() * hadithConfig.collections.length)];
        const totalHadiths = hadithConfig.collectionSizes[collection] || 1000;
        const randomNum = Math.floor(Math.random() * totalHadiths) + 1;
        
        try {
            const data = await this.fetchWithFallback(apiLang, collection, randomNum);
            
            if (data && data.hadiths && data.hadiths.length > 0) {
                 const hadithData = {
                    text: data.hadiths[0].text,
                    number: data.hadiths[0].hadithnumber || randomNum,
                    collection: data.metadata?.name || collection,
                    section: data.metadata?.section || '',
                    language: apiLang
                };
                this.state.set('hadith', hadithData);
                this.eventBus.emit('api:hadith:loaded', hadithData);
                return;
            }
        } catch (error) {
             // Fallback English
            if (apiLang !== 'eng') {
                console.log('Trying English fallback...');
                const dataEng = await this.fetchWithFallback('eng', collection, randomNum);
                if (dataEng && dataEng.hadiths && dataEng.hadiths.length > 0) {
                    const hadithData = {
                        text: dataEng.hadiths[0].text,
                        number: dataEng.hadiths[0].hadithnumber || randomNum,
                        collection: dataEng.metadata?.name || collection,
                        section: dataEng.metadata?.section || '',
                        language: 'eng'
                    };
                    this.state.set('hadith', hadithData);
                    this.eventBus.emit('api:hadith:loaded', hadithData);
                    return;
                }
            }
            throw error;
        }

    } catch (error) {
      console.error('Error fetching hadith:', error);
      this.eventBus.emit('api:hadith:error', error);
    } finally {
      this.state.set('hadithLoading', false);
    }
  }
}

