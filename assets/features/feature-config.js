// feature-config.js - Configuration and Constants

export const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
];

export const RECITERS = [
    { id: 'saad-el-ghamidi', name: 'Saad El Ghamidi', arabicName: 'سعد الغامدي' },
    { id: 'abdul-basit', name: 'Abdul Basit', arabicName: 'عبد الباسط عبد الصمد' },
    { id: 'mishary-rashid', name: 'Mishary Rashid', arabicName: 'مشاري العفاسي' }
];

export const CALCULATION_METHODS = [
    { id: 3, name: 'Muslim World League', nameAr: 'رابطة العالم الإسلامي', regions: '🌍' },
    { id: 2, name: 'ISNA (North America)', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية', regions: '🇺🇸🇨🇦' },
    { id: 5, name: 'Egyptian Authority', nameAr: 'الهيئة المصرية العامة للمساحة', regions: '🇪🇬' },
    { id: 4, name: 'Umm Al-Qura (Makkah)', nameAr: 'أم القرىØŒ مكة', regions: '🇸🇦' },
    { id: 1, name: 'University of Karachi', nameAr: 'جامعة كراتشي', regions: '🇵🇰' },
    { id: 0, name: 'Shia Ithna-Ashari', nameAr: 'الشيعة الإثنا عشرية', regions: '🌙' },
    { id: 7, name: 'Tehran', nameAr: 'طهران', regions: '🇮🇷' },
    { id: 8, name: 'Gulf Region', nameAr: 'منطقة الخليج', regions: '🇦🇪🇧🇭🇴🇲' },
    { id: 9, name: 'Kuwait', nameAr: 'الكويت', regions: '🇰🇼' },
    { id: 10, name: 'Qatar', nameAr: 'قطر', regions: '🇶🇦' },
    { id: 11, name: 'Singapore', nameAr: 'سنغافورة', regions: '🇸🇬' },
    { id: 12, name: 'France (UOIF)', nameAr: 'فرنسا', regions: '🇫🇷' },
    { id: 13, name: 'Turkey (Diyanet)', nameAr: 'تركيا', regions: '🇹🇷' },
    { id: 14, name: 'Russia', nameAr: 'روسيا', regions: '🇷🇺' },
    { id: 16, name: 'Dubai', nameAr: 'دبي', regions: '🇦🇪' },
    { id: 17, name: 'Malaysia (JAKIM)', nameAr: 'ماليزيا', regions: '🇲🇾' },
    { id: 18, name: 'Tunisia', nameAr: 'تونس', regions: '🇹🇳' },
    { id: 19, name: 'Algeria', nameAr: 'الجزائر', regions: '🇩🇿' },
    { id: 20, name: 'Indonesia (KEMENAG)', nameAr: 'إندونيسيا', regions: '🇮🇩' },
    { id: 21, name: 'Morocco', nameAr: 'المغرب', regions: '🇲🇦' },
    { id: 22, name: 'Portugal', nameAr: 'البرتغال', regions: '🇵🇹' },
    { id: 23, name: 'Jordan', nameAr: 'الأردن', regions: '🇯🇴' }
];

export const PRAYERS = {
    fajr: { name: 'Fajr', rakaats: 2, icon: '🌅', apiKey: 'Fajr' },
    dohr: { name: 'Dohr', rakaats: 4, icon: '☀️', apiKey: 'Dhuhr' },
    asr: { name: 'Asr', rakaats: 4, icon: '🌤️', apiKey: 'Asr' },
    maghreb: { name: 'Maghreb', rakaats: 3, icon: '🌆', apiKey: 'Maghrib' },
    isha: { name: 'Isha', rakaats: 4, icon: '🌙', apiKey: 'Isha' }
};

export const SURAHS = [
    { 
        id: 'fatiha', 
        name: 'Al-Fatiha', 
        number: 1, 
        arabic: 'الفاتحة', 
        mandatory: true, 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-001-al-fatiha-204-9244.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-001-al-fatiha-204-9244.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-001-al-fatiha-204-9244.mp3'
        }
    },
    { 
        id: 'ikhlas', 
        name: 'Al-Ikhlas', 
        number: 112, 
        arabic: 'الإخلاص', 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-112-al-ikhlas-201-1223.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-112-al-ikhlas-201-1223.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-112-al-ikhlas-201-1223.mp3'
        }
    },
    { 
        id: 'falaq', 
        name: 'Al-Falaq', 
        number: 113, 
        arabic: 'الفلق', 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-113-al-falaq-202-7322.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-113-al-falaq-202-7322.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-113-al-falaq-202-7322.mp3'
        }
    },
    { 
        id: 'nas', 
        name: 'An-Nas', 
        number: 114, 
        arabic: 'الناس', 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-114-an-nas-203-5140.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-114-an-nas-203-5140.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-114-an-nas-203-5140.mp3'
        }
    },
    { 
        id: 'kafirun', 
        name: 'Al-Kafirun', 
        number: 109, 
        arabic: 'الكافرون', 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-109-al-kafiroon-198-3820.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-109-al-kafiroon-198-3820.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-109-al-kafiroon-198-3820.mp3'
        }
    },
    { 
        id: 'asr', 
        name: 'Al-Asr', 
        number: 103, 
        arabic: 'العصر', 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-103-al-asr-192-2834.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-103-al-asr-192-2834.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-103-al-asr-192-2834.mp3'
        }
    },
    { 
        id: 'qadr', 
        name: 'Al-Qadr', 
        number: 97, 
        arabic: 'القدر', 
        audioFiles: {
            'saad-el-ghamidi': 'assets/audio/saad-el-ghamidi-097-al-qadr-186-6793.mp3',
            'abdul-basit': 'assets/audio/Abdul-Basit-097-al-qadr-186-6793.mp3',
            'mishary-rashid': 'assets/audio/Mishary-Rashid-097-al-qadr-186-6793.mp3'
        }
    }
];

export const hadithConfig = {
    collections: ['bukhari', 'muslim', 'nawawi'],
    languageMap: {
        'fr': 'fra',
        'en': 'eng',
        'ar': 'ara',
        'es': 'eng',
        'it': 'eng',
        'tr': 'tur',
        'nl': 'eng',
        'de': 'eng',
        'hi': 'urd'
    },
    collectionSizes: {
        'bukhari': 7563,
        'muslim': 7563,
        'nawawi': 42
    }
};
