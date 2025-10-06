// feature-pillars-of-prayers.js - Pillars of Prayer Management

let pillarsData = null;

export async function loadPillarsData() {
    if (pillarsData) return pillarsData;
    
    try {
        const response = await fetch('assets/data/pillars_of_prayer.json');
        pillarsData = await response.json();
        return pillarsData;
    } catch (error) {
        console.error('Error loading pillars data:', error);
        return null;
    }
}

export function getPillars() {
    if (!pillarsData) return [];
    return pillarsData.items.sort((a, b) => a.order - b.order);
}

export function getPillarById(pillarId) {
    if (!pillarsData) return null;
    return pillarsData.items.find(pillar => pillar.id === pillarId);
}

export function getPillarLabel(pillar, language) {
    if (!pillar || !pillar.labels) return '';
    
    switch(language) {
        case 'ar':
            return pillar.labels.ar;
        case 'fr':
            return pillar.labels.fr;
        case 'en':
            return pillar.labels.en;
        default:
            return pillar.labels.fr;
    }
}

export function getPillarDescription(pillar, language) {
    if (!pillar || !pillar.description) return '';
    
    switch(language) {
        case 'ar':
            return pillar.description.ar;
        case 'fr':
            return pillar.description.fr;
        case 'en':
            return pillar.description.en;
        default:
            return pillar.description.fr;
    }
}

export function getPillarHowTo(pillar, language) {
    if (!pillar || !pillar.how_to) return '';
    
    switch(language) {
        case 'ar':
            return pillar.how_to.ar;
        case 'fr':
            return pillar.how_to.fr;
        case 'en':
            return pillar.how_to.en;
        default:
            return pillar.how_to.fr;
    }
}

export function getPillarIcon(pillarId) {
    const iconMap = {
        'rukn_01_qiyam': '🧍',
        'rukn_02_takbir': '🙌',
        'rukn_03_fatiha': '📖',
        'rukn_04_ruku': '🙇',
        'rukn_05_qawmah': '🧍',
        'rukn_06_sujud': '🤲',
        'rukn_07_sit_between_sujud': '🪑',
        'rukn_08_tumanina': '⏸️',
        'rukn_09_tartib': '📋',
        'rukn_10_final_tashahhud': '☝️',
        'rukn_11_sit_for_final_tashahhud': '🪑',
        'rukn_12_salat_alan_nabi': '💚',
        'rukn_13_niyyah': '💭',
        'rukn_14_salam': '👋'
    };
    
    return iconMap[pillarId] || '📿';
}
