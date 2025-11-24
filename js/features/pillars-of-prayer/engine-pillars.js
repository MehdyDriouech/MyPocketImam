export class PillarsEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.pluginManager = dependencies.pluginManager;
    this.pillarsData = null;
  }
  
  async init() {
    await this.loadPillarsData();
  }

  async loadPillarsData() {
    if (this.pillarsData) return this.pillarsData;
    
    try {
        const response = await fetch('assets/data/pillars_of_prayer.json');
        this.pillarsData = await response.json();
        return this.pillarsData;
    } catch (error) {
        console.error('Error loading pillars data:', error);
        return null;
    }
  }

  getPillars() {
    if (!this.pillarsData) return [];
    return this.pillarsData.items.sort((a, b) => a.order - b.order);
  }

  getPillarById(pillarId) {
    if (!this.pillarsData) return null;
    return this.pillarsData.items.find(pillar => pillar.id === pillarId);
  }

  selectPillar(pillarId) {
      this.state.set('selectedPillar', pillarId);
      this.state.set('currentView', 'pillar-detail');
  }
  
  navigatePillar(direction) {
      const currentPillarId = this.state.get('selectedPillar');
      const pillars = this.getPillars();
      const currentIndex = pillars.findIndex(p => p.id === currentPillarId);
      
      if (currentIndex === -1) return;
      
      const newIndex = currentIndex + direction;
      if (newIndex >= 0 && newIndex < pillars.length) {
          this.selectPillar(pillars[newIndex].id);
      }
  }

  // Helpers for content
  getPillarLabel(pillar, language) {
    if (!pillar || !pillar.labels) return '';
    return pillar.labels[language] || pillar.labels.fr;
  }

  getPillarDescription(pillar, language) {
    if (!pillar || !pillar.description) return '';
    return pillar.description[language] || pillar.description.fr;
  }

  getPillarHowTo(pillar, language) {
    if (!pillar || !pillar.how_to) return '';
    return pillar.how_to[language] || pillar.how_to.fr;
  }

  getPillarIcon(pillarId) {
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
}

