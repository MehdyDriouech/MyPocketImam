// feature-api.js - API Calls

import { state } from './feature-state.js';
import { hadithConfig } from './feature-config.js';
import { render } from './feature-render.js';

export async function fetchPrayerTimes(city, country) {
    if (!city || !country) return;
    
    state.loadingPrayerTimes = true;
    render();
    
    try {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const dateString = `${day}-${month}-${year}`;
        
        const response = await fetch(`https://api.aladhan.com/v1/timingsByCity/${dateString}?city=${encodeURIComponent(city)}&country=${country.toUpperCase()}&method=${state.calculationMethod}`);
        const data = await response.json();
        
        if (data.code === 200 && data.data) {
            state.prayerTimes = data.data.timings;
            state.currentDate = data.data.date;
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
    } finally {
        state.loadingPrayerTimes = false;
        render();
    }
}

async function fetchWithFallback(apiLang, collection, hadithNum) {
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

export async function fetchDailyHadith(userLang) {
    state.loadingHadith = true;
    state.hadithError = null;
    render();
    
    try {
        const apiLang = hadithConfig.languageMap[userLang] || 'eng';
        const collection = hadithConfig.collections[Math.floor(Math.random() * hadithConfig.collections.length)];
        const totalHadiths = hadithConfig.collectionSizes[collection] || 1000;
        const randomNum = Math.floor(Math.random() * totalHadiths) + 1;
        
        try {
            const data = await fetchWithFallback(apiLang, collection, randomNum);
            
            if (data && data.hadiths && data.hadiths.length > 0) {
                state.dailyHadith = {
                    text: data.hadiths[0].text,
                    number: data.hadiths[0].hadithnumber || randomNum,
                    collection: data.metadata?.name || collection,
                    section: data.metadata?.section || '',
                    language: apiLang
                };
                state.loadingHadith = false;
                render();
                return;
            }
        } catch (error) {
            if (apiLang !== 'eng') {
                console.log('Trying English fallback...');
                const dataEng = await fetchWithFallback('eng', collection, randomNum);
                if (dataEng && dataEng.hadiths && dataEng.hadiths.length > 0) {
                    state.dailyHadith = {
                        text: dataEng.hadiths[0].text,
                        number: dataEng.hadiths[0].hadithnumber || randomNum,
                        collection: dataEng.metadata?.name || collection,
                        section: dataEng.metadata?.section || '',
                        language: 'eng'
                    };
                    state.loadingHadith = false;
                    render();
                    return;
                }
            }
            throw error;
        }
    } catch (error) {
        console.error('Error fetching hadith:', error);
        state.hadithError = 'Could not load hadith';
        state.loadingHadith = false;
        render();
    }
}
