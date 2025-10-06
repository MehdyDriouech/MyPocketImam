// feature-prayers.js - Prayer Logic

import { state } from './feature-state.js';
import { PRAYERS, SURAHS } from './feature-config.js';

export function getPositionImage(stepId, avatarGender = 'boy') {
    const suffix = avatarGender === 'girl' ? '-girl.png' : '.png';
    const imageMap = {
        'takbir_ouverture': 'position-debout-main-tete',
        'invocation_ouverture': 'position-debout-main-coeur',
        'refuge': 'position-debout-main-coeur',
        'bismillah': 'position-debout-main-coeur',
        'fatiha': 'position-debout-main-coeur',
        'second_surah': 'position-debout-main-coeur',
        'takbir_ruku': 'position-debout-bras-corps',
        'ruku': 'position-demi-prosternation',
        'qiyam': 'position-debout-bras-corps',
        'apres_qiyam': 'position-debout-bras-corps',
        'takbir_sujud1': 'position-debout-bras-corps',
        'sujud1': 'position-prosternation',
        'takbir_jalsa': 'position-prosternation',
        'jalsa': 'position-assise',
        'takbir_sujud2': 'position-assise',
        'sujud2': 'position-prosternation',
        'takbir_tashahhud': 'position-prosternation',
        'tashahhud': 'position-assise-tahiatou',
        'salat_ibrahimiya': 'position-assise',
        'invocation_finale': 'position-assise',
        'salam_droite': 'position-assise-salam',
        'salam_gauche': 'position-assise-salam'
    };
    const baseName = imageMap[stepId] || 'position-debout-bras-corps';
    return 'assets/images/' + baseName + suffix;
}

export function getPrayerSteps(t) {
    return [
        { id: 'takbir_ouverture', name: t.takbirOpening, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: t.raiseHands, audioFile: 'assets/audio/takbir.mp3', firstRakaatOnly: true, pauseAfter: 1000 },
        { id: 'invocation_ouverture', name: t.openingInvocation, arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ', transliteration: 'Subhanakal-lahumma wa bihamdika', translation: 'Glory and praise to You, O Allah', position: 'standing', action: t.reciteOpening, audioFiles: ['assets/audio/ouverture1.mp3', 'assets/audio/ouverture2.mp3', 'assets/audio/ouverture3.mp3'], firstRakaatOnly: true, hasOptions: true, pauseAfter: 1000 },
        { id: 'refuge', name: t.seekingRefuge, arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', transliteration: 'A\'oudhou billahi mina shaytani rajim', translation: 'I seek refuge in Allah from Satan the accursed', position: 'standing', action: t.seekProtection, audioFiles: ['assets/audio/refuge1.mp3', 'assets/audio/refuge2.mp3', 'assets/audio/refuge3.mp3'], firstRakaatOnly: true, hasOptions: true, pauseAfter: 500 },
        { id: 'bismillah', name: t.bismillah, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillah ir-Rahman ir-Rahim', translation: 'In the name of Allah, Most Gracious, Most Merciful', position: 'standing', action: t.beginWithName, audioFile: 'assets/audio/bismilah.mp3', firstRakaatOnly: true, pauseAfter: 500 },
        { id: 'fatiha', name: t.reciteFatiha, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', transliteration: 'Alhamdulillahi rabbil \'alamin', translation: 'Praise be to Allah, Lord of the worlds', position: 'standing', action: t.reciteFatihaAction, surahType: 'fatiha', pauseAfter: 1000 },
        { id: 'second_surah', name: t.secondarySurahStep, arabic: '...', transliteration: '...', translation: 'Recite the chosen surah', position: 'standing', action: t.reciteSecondary, surahType: 'secondary', pauseAfter: 1000, firstTwoRakaatsOnly: true },
        { id: 'takbir_ruku', name: t.takbirRuku, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: t.sayTakbirBowing, audioFile: 'assets/audio/takbir.mp3', pauseAfter: 1000 },
        { id: 'ruku', name: t.ruku, arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', transliteration: 'Subhana Rabbiyal Adheem', translation: 'Glory to my Lord the Great', position: 'bowing', action: t.stayBowing, audioFiles: ['assets/audio/ruku1.mp3', 'assets/audio/Durant_l_inclinaison1.mp3', 'assets/audio/Durant_l_inclinaison2.mp3', 'assets/audio/Durant_l_inclinaison3.mp3', 'assets/audio/Durant_l_inclinaison4.mp3', 'assets/audio/Durant_l_inclinaison5.mp3', 'assets/audio/Durant_l_inclinaison6.mp3', 'assets/audio/Durant_l_inclinaison7.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'qiyam', name: t.qiyam, arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', transliteration: 'Sami Allahu liman hamidah', translation: 'Allah hears those who praise Him', position: 'standing', action: t.standUpSaying, audioFile: 'assets/audio/en_ce_levant1.mp3', pauseAfter: 500 },
        { id: 'apres_qiyam', name: t.afterQiyam, arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ', transliteration: 'Rabbana wa lakal hamd', translation: 'Our Lord, to You be praise', position: 'standing', action: t.onceStanding, audioFiles: ['assets/audio/unefoislevé1.mp3', 'assets/audio/unefoislevé2.mp3', 'assets/audio/unefoislevé3.mp3', 'assets/audio/unefoislevé4.mp3', 'assets/audio/unefoislevé5.mp3', 'assets/audio/unefoislevé6.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'takbir_sujud1', name: t.takbirSujud, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: t.sayTakbirProstrating, audioFile: 'assets/audio/takbir.mp3', pauseAfter: 1000 },
        { id: 'sujud1', name: t.sujud1, arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana Rabbiyal A\'la', translation: 'Glory to my Lord the Most High', position: 'prostrating', action: t.stayProstrating, audioFiles: ['assets/audio/durantprosternation1.mp3', 'assets/audio/durantprosternation2.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'takbir_jalsa', name: t.takbirSit, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'prostrating', action: t.sayTakbirSitting, audioFile: 'assets/audio/takbir.mp3', pauseAfter: 1000 },
        { id: 'jalsa', name: t.jalsa, arabic: 'رَبِّ اغْفِرْ لِي', transliteration: 'Rabbi ghfir li', translation: 'Lord, forgive me', position: 'sitting', action: t.sitBriefly, audioFile: 'assets/audio/takbir.mp3', pauseAfter: 2000 },
        { id: 'takbir_sujud2', name: t.takbirSujud2, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'sitting', action: t.sayTakbirProstrating2, audioFile: 'assets/audio/takbir.mp3', pauseAfter: 1000 },
        { id: 'sujud2', name: t.sujud2, arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana Rabbiyal A\'la', translation: 'Glory to my Lord the Most High', position: 'prostrating', action: t.prostrateAgain, audioFiles: ['assets/audio/durantprosternation1.mp3', 'assets/audio/durantprosternation2.mp3'], hasOptions: true, pauseAfter: 1000 }
    ];
}

export function getFinalSteps(t) {
    return [
        { id: 'takbir_tashahhud', name: t.takbirSit, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'prostrating', action: t.standAndSit, audioFile: 'assets/audio/takbir.mp3', pauseAfter: 1000 },
        { id: 'tashahhud', name: t.tashahhud, arabic: 'التَّحِيَّاتُ لِلَّهِ', transliteration: 'At-tahiyyatu lillah', translation: 'Salutations are for Allah', position: 'sitting', action: t.reciteTashahhud, audioFile: 'assets/audio/tashaoud1.mp3', pauseAfter: 1000 },
        { id: 'salat_ibrahimiya', name: t.ibrahimicPrayer, arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', transliteration: 'Allahumma salli \'ala Muhammad', translation: 'O Allah, bless Muhammad', position: 'sitting', action: t.reciteIbrahimic, audioFiles: ['assets/audio/ibrahamique_apres_tashaoud1.mp3', 'assets/audio/ibrahamique_apres_tashaou2.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'invocation_finale', name: t.finalInvocation, arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً', transliteration: 'Rabbana atina fid-dunya hasanah', translation: 'Lord, grant us good in this world', position: 'sitting', action: t.makeInvocations, audioFile: 'assets/audio/invocation_apres_ibrahimique.mp3', pauseAfter: 1000 },
        { id: 'salam_droite', name: t.salamRight, arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', transliteration: 'As-salamu \'alaykum wa rahmatullah', translation: 'Peace and mercy of Allah be upon you', position: 'sitting', action: t.turnRightGreet, audioFile: 'assets/audio/salam_final_part1.mp3', pauseAfter: 500 },
        { id: 'salam_gauche', name: t.salamLeft, arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', transliteration: 'As-salamu \'alaykum wa rahmatullah', translation: 'Peace and mercy of Allah be upon you', position: 'sitting', action: t.turnLeftGreet, audioFile: 'assets/audio/salam_final_part2.mp3', pauseAfter: 0 }
    ];
}

export function getCurrentSteps(t) {
    if (!state.selectedPrayer) return [];
    const isLastRakaat = state.currentRakaat === PRAYERS[state.selectedPrayer].rakaats;
    const isFirstRakaat = state.currentRakaat === 1;
    const isFirstTwoRakaats = state.currentRakaat <= 2;
    
    let steps = getPrayerSteps(t).filter(step => {
        if (step.firstRakaatOnly && !isFirstRakaat) return false;
        if (step.firstTwoRakaatsOnly && !isFirstTwoRakaats) return false;
        return true;
    });
    
    if (isLastRakaat) {
        steps = [...steps, ...getFinalSteps(t)];
    }
    return steps;
}

export function getCurrentAudioFile() {
    const steps = getCurrentSteps(() => {});
    const step = steps[state.currentStepIndex];
    
    if (!step) return null;
    
    if (step.surahType === 'fatiha') {
        return SURAHS[0].audioFiles[state.selectedReciter];
    } else if (step.surahType === 'secondary') {
        const secondarySurah = state.rakaatConfig[state.currentRakaat - 1]?.secondarySurah;
        return secondarySurah?.audioFiles[state.selectedReciter];
    } else if (step.audioFile) {
        return step.audioFile;
    } else if (step.audioFiles && step.audioFiles.length > 0) {
        return step.audioFiles[state.audioOption % step.audioFiles.length];
    }
    return null;
}
