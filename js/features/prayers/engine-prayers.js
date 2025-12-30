export class PrayersEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.pluginManager = dependencies.pluginManager;
  }
  
  get config() {
      return this.pluginManager.get('config').engine;
  }

  get translations() {
      return this.pluginManager.get('translations').engine;
  }

  async init() {
    // Charger les prières supplémentaires
    await this.loadExtraPrayers();
  }
  
  getPositionImage(stepId, avatarGender = 'boy') {
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
    return `js/features/prayers/assets/images/${baseName}${suffix}`;
  }
  
  getPrayerSteps() {
    const t = this.translations.getAll() || {}; // Access raw translations object
    // Helper to access translation safely
    const tr = (key) => t[key] || key;

    return [
        { id: 'takbir_ouverture', name: tr('takbirOpening'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('raiseHands'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', firstRakaatOnly: true, pauseAfter: 1000 },
        { id: 'invocation_ouverture', name: tr('openingInvocation'), arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ', transliteration: 'Subhanakal-lahumma wa bihamdika', translation: 'Glory and praise to You, O Allah', position: 'standing', action: tr('reciteOpening'), audioFiles: ['js/features/prayers/assets/audio/guidance/ouverture1.mp3', 'js/features/prayers/assets/audio/guidance/ouverture2.mp3', 'js/features/prayers/assets/audio/guidance/ouverture3.mp3'], firstRakaatOnly: true, hasOptions: true, pauseAfter: 1000 },
        { id: 'refuge', name: tr('seekingRefuge'), arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', transliteration: 'A\'oudhou billahi mina shaytani rajim', translation: 'I seek refuge in Allah from Satan the accursed', position: 'standing', action: tr('seekProtection'), audioFiles: ['js/features/prayers/assets/audio/guidance/refuge1.mp3', 'js/features/prayers/assets/audio/guidance/refuge2.mp3', 'js/features/prayers/assets/audio/guidance/refuge3.mp3'], firstRakaatOnly: true, hasOptions: true, pauseAfter: 500 },
        { id: 'bismillah', name: tr('bismillah'), arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillah ir-Rahman ir-Rahim', translation: 'In the name of Allah, Most Gracious, Most Merciful', position: 'standing', action: tr('beginWithName'), audioFile: 'js/features/prayers/assets/audio/guidance/bismilah.mp3', firstRakaatOnly: true, pauseAfter: 500 },
        { id: 'fatiha', name: tr('reciteFatiha'), arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', transliteration: 'Alhamdulillahi rabbil \'alamin', translation: 'Praise be to Allah, Lord of the worlds', position: 'standing', action: tr('reciteFatihaAction'), surahType: 'fatiha', pauseAfter: 1000 },
        { id: 'second_surah', name: tr('secondarySurahStep'), arabic: '...', transliteration: '...', translation: 'Recite the chosen surah', position: 'standing', action: tr('reciteSecondary'), surahType: 'secondary', pauseAfter: 1000, firstTwoRakaatsOnly: true },
        { id: 'takbir_ruku', name: tr('takbirRuku'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('sayTakbirBowing'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
        { id: 'ruku', name: tr('ruku'), arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', transliteration: 'Subhana Rabbiyal Adheem', translation: 'Glory to my Lord the Great', position: 'bowing', action: tr('stayBowing'), audioFiles: ['js/features/prayers/assets/audio/guidance/ruku1.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison1.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison2.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison3.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison4.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison5.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison6.mp3', 'js/features/prayers/assets/audio/guidance/Durant_l_inclinaison7.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'qiyam', name: tr('qiyam'), arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', transliteration: 'Sami Allahu liman hamidah', translation: 'Allah hears those who praise Him', position: 'standing', action: tr('standUpSaying'), audioFile: 'js/features/prayers/assets/audio/guidance/en ce levant1.mp3', pauseAfter: 500 },
        { id: 'apres_qiyam', name: tr('afterQiyam'), arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ', transliteration: 'Rabbana wa lakal hamd', translation: 'Our Lord, to You be praise', position: 'standing', action: tr('onceStanding'), audioFiles: ['js/features/prayers/assets/audio/guidance/unefoislevé1.mp3', 'js/features/prayers/assets/audio/guidance/unefoislevé2.mp3', 'js/features/prayers/assets/audio/guidance/unefoislevé3.mp3', 'js/features/prayers/assets/audio/guidance/unefoislevé4.mp3', 'js/features/prayers/assets/audio/guidance/unefoislevé5.mp3', 'js/features/prayers/assets/audio/guidance/unefoislevé6.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'takbir_sujud1', name: tr('takbirSujud'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('sayTakbirProstrating'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
        { id: 'sujud1', name: tr('sujud1'), arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana Rabbiyal A\'la', translation: 'Glory to my Lord the Most High', position: 'prostrating', action: tr('stayProstrating'), audioFiles: ['js/features/prayers/assets/audio/guidance/durantprosternation1.mp3', 'js/features/prayers/assets/audio/guidance/durantprosternation2.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'takbir_jalsa', name: tr('takbirSit'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'prostrating', action: tr('sayTakbirSitting'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
        { id: 'jalsa', name: tr('jalsa'), arabic: 'رَبِّ اغْفِرْ لِي', transliteration: 'Rabbi ghfir li', translation: 'Lord, forgive me', position: 'sitting', action: tr('sitBriefly'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 2000 },
        { id: 'takbir_sujud2', name: tr('takbirSujud2'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'sitting', action: tr('sayTakbirProstrating2'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
        { id: 'sujud2', name: tr('sujud2'), arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana Rabbiyal A\'la', translation: 'Glory to my Lord the Most High', position: 'prostrating', action: tr('prostrateAgain'), audioFiles: ['js/features/prayers/assets/audio/guidance/durantprosternation1.mp3', 'js/features/prayers/assets/audio/guidance/durantprosternation2.mp3'], hasOptions: true, pauseAfter: 1000 }
    ];
  }
  
  getFinalSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    return [
        { id: 'takbir_tashahhud', name: tr('takbirSit'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'prostrating', action: tr('standAndSit'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
        { id: 'tashahhud', name: tr('tashahhud'), arabic: 'التَّحِيَّاتُ لِلَّهِ', transliteration: 'At-tahiyyatu lillah', translation: 'Salutations are for Allah', position: 'sitting', action: tr('reciteTashahhud'), audioFile: 'js/features/prayers/assets/audio/guidance/tashaoud1.mp3', pauseAfter: 1000 },
        { id: 'salat_ibrahimiya', name: tr('ibrahimicPrayer'), arabic: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', transliteration: 'Allahumma salli \'ala Muhammad', translation: 'O Allah, bless Muhammad', position: 'sitting', action: tr('reciteIbrahimic'), audioFiles: ['js/features/prayers/assets/audio/guidance/ibrahamique apres tashaoud1.mp3', 'js/features/prayers/assets/audio/guidance/ibrahamique apres tashaou2.mp3'], hasOptions: true, pauseAfter: 1000 },
        { id: 'invocation_finale', name: tr('finalInvocation'), arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً', transliteration: 'Rabbana atina fid-dunya hasanah', translation: 'Lord, grant us good in this world', position: 'sitting', action: tr('makeInvocations'), audioFile: 'js/features/prayers/assets/audio/guidance/invocation apres ibrahimique.mp3', pauseAfter: 1000 },
        { id: 'salam_droite', name: tr('salamRight'), arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', transliteration: 'As-salamu \'alaykum wa rahmatullah', translation: 'Peace and mercy of Allah be upon you', position: 'sitting', action: tr('turnRightGreet'), audioFile: 'js/features/prayers/assets/audio/guidance/salam final part1.mp3', pauseAfter: 500 },
        { id: 'salam_gauche', name: tr('salamLeft'), arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', transliteration: 'As-salamu \'alaykum wa rahmatullah', translation: 'Peace and mercy of Allah be upon you', position: 'sitting', action: tr('turnLeftGreet'), audioFile: 'js/features/prayers/assets/audio/guidance/salam final part2.mp3', pauseAfter: 0 }
    ];
  }
  
  getCurrentSteps() {
    const selectedPrayer = this.state.get('selectedPrayer');
    const currentRakaat = this.state.get('currentRakaat');
    const PRAYERS = this.config.getPrayers();
    
    if (!selectedPrayer) return [];
    
    const isLastRakaat = currentRakaat === PRAYERS[selectedPrayer].rakaats;
    const isFirstRakaat = currentRakaat === 1;
    const isFirstTwoRakaats = currentRakaat <= 2;
    
    let steps = this.getPrayerSteps().filter(step => {
      if (step.firstRakaatOnly && !isFirstRakaat) return false;
      if (step.firstTwoRakaatsOnly && !isFirstTwoRakaats) return false;
      return true;
    });
    
    if (isLastRakaat) {
      steps = [...steps, ...this.getFinalSteps()];
    }
    
    return steps;
  }
  
  getCurrentAudioFile() {
    const steps = this.getCurrentSteps();
    const currentStepIndex = this.state.get('currentStepIndex');
    const step = steps[currentStepIndex];
    
    if (!step) return null;
    
    const SURAHS = this.config.getSurahs();
    const selectedReciter = this.state.get('selectedReciter');
    const audioOption = this.state.get('audioOption') || 0;
    
    if (step.surahType === 'fatiha') {
      return SURAHS[0].audioFiles[selectedReciter];
    } else if (step.surahType === 'secondary') {
      const rakaatConfig = this.state.get('rakaatConfig');
      const currentRakaat = this.state.get('currentRakaat');
      const secondarySurah = rakaatConfig[currentRakaat - 1]?.secondarySurah;
      return secondarySurah?.audioFiles[selectedReciter];
    } else if (step.audioFile) {
      return step.audioFile;
    } else if (step.audioFiles && step.audioFiles.length > 0) {
      return step.audioFiles[audioOption % step.audioFiles.length];
    }
    
    return null;
  }
  
  nextStep() {
    const steps = this.getCurrentSteps();
    const currentStepIndex = this.state.get('currentStepIndex');
    
    if (currentStepIndex < steps.length - 1) {
      this.state.set('currentStepIndex', currentStepIndex + 1);
      return true;
    }
    return false;
  }
  
  previousStep() {
    const currentStepIndex = this.state.get('currentStepIndex');
    if (currentStepIndex > 0) {
      this.state.set('currentStepIndex', currentStepIndex - 1);
      return true;
    }
    return false;
  }
  
  nextRakaat() {
    const selectedPrayer = this.state.get('selectedPrayer');
    const currentRakaat = this.state.get('currentRakaat');
    const PRAYERS = this.config.getPrayers();
    
    if (currentRakaat < PRAYERS[selectedPrayer].rakaats) {
      this.state.update({
        currentRakaat: currentRakaat + 1,
        currentStepIndex: 0
      });
      return true;
    }
    return false;
  }
  
  startPrayer(prayerKey) {
    // Initialiser la config des rakaats
    const PRAYERS = this.config.getPrayers();
    const SURAHS = this.config.getSurahs();
    const rakaats = PRAYERS[prayerKey].rakaats;
    
    const rakaatConfig = [];
    for (let i = 1; i <= rakaats; i++) {
        rakaatConfig.push({
            rakaat: i,
            secondarySurah: SURAHS.find(s => s.id === 'ikhlas') || SURAHS[1] // Default
        });
    }

    this.state.update({
      selectedPrayer: prayerKey,
      currentView: 'prayer-config',
      currentRakaat: 1,
      currentStepIndex: 0,
      rakaatConfig: rakaatConfig
    });
  }

  setRakaatSurah(index, surahId) {
      const rakaatConfig = [...this.state.get('rakaatConfig')];
      const SURAHS = this.config.getSurahs();
      const surah = SURAHS.find(s => s.id === surahId);
      
      if (rakaatConfig[index] && surah) {
          rakaatConfig[index] = { ...rakaatConfig[index], secondarySurah: surah };
          this.state.set('rakaatConfig', rakaatConfig);
      }
  }
  
  completePrayer() {
    // Pas de vue 'prayer-complete' explicite dans le render original (c'était une modale ou juste fin)
    // Mais le prompt suggère une vue de fin
    this.state.set('currentView', 'prayer-complete');
  }

  // ========== PRIÈRES SUPPLÉMENTAIRES ==========

  /**
   * Charge les données des prières supplémentaires depuis le JSON
   */
  async loadExtraPrayers() {
    try {
      const response = await fetch('js/features/prayers/assets/data/extra-prayers.json');
      if (!response.ok) {
        console.warn('Could not load extra-prayers.json');
        this.state.set('extraPrayersData', null);
        return;
      }
      const data = await response.json();
      this.state.set('extraPrayersData', data);
    } catch (error) {
      console.error('Error loading extra prayers:', error);
      this.state.set('extraPrayersData', null);
    }
  }

  /**
   * Retourne toutes les prières supplémentaires
   * @returns {Array} Liste des prières supplémentaires
   */
  getExtraPrayers() {
    const data = this.state.get('extraPrayersData');
    if (!data || !data.prayers) return [];
    return data.prayers.sort((a, b) => a.order - b.order);
  }

  /**
   * Retourne les prières supplémentaires groupées par catégorie
   * @returns {Object} Objet avec les groupes comme clés
   */
  getExtraPrayersByGroup() {
    const data = this.state.get('extraPrayersData');
    if (!data || !data.prayers || !data.groups) return {};

    const groups = {};
    data.groups.forEach(group => {
      groups[group.id] = {
        ...group,
        prayers: []
      };
    });

    data.prayers.forEach(prayer => {
      if (groups[prayer.groupId]) {
        groups[prayer.groupId].prayers.push(prayer);
      }
    });

    // Trier les prières par order dans chaque groupe
    Object.keys(groups).forEach(groupId => {
      groups[groupId].prayers.sort((a, b) => a.order - b.order);
    });

    // Trier les groupes par order
    const sortedGroups = {};
    data.groups.sort((a, b) => a.order - b.order).forEach(group => {
      sortedGroups[group.id] = groups[group.id];
    });

    return sortedGroups;
  }

  /**
   * Retourne une prière supplémentaire par son ID
   * @param {string} prayerId - ID de la prière
   * @returns {Object|null} Prière ou null
   */
  getExtraPrayerById(prayerId) {
    const prayers = this.getExtraPrayers();
    return prayers.find(p => p.id === prayerId) || null;
  }

  /**
   * Retourne le statut d'une prière par son ID
   * @param {string} statusId - ID du statut
   * @returns {Object|null} Statut ou null
   */
  getExtraPrayerStatus(statusId) {
    const data = this.state.get('extraPrayersData');
    if (!data || !data.statuses) return null;
    return data.statuses.find(s => s.id === statusId) || null;
  }

  /**
   * Retourne le groupe d'une prière par son ID
   * @param {string} groupId - ID du groupe
   * @returns {Object|null} Groupe ou null
   */
  getExtraPrayerGroup(groupId) {
    const data = this.state.get('extraPrayersData');
    if (!data || !data.groups) return null;
    return data.groups.find(g => g.id === groupId) || null;
  }

  /**
   * Mapping des badges vers emoji et libellé
   * @param {string} badgeKey - Clé du badge
   * @returns {Object} { emoji, label }
   */
  getBadgeLabel(badgeKey) {
    const badges = {
      'friday_fard': { emoji: '🕌', label: 'Obligatoire' },
      'sunnah_muakkada': { emoji: '⭐', label: 'Sunnah fortement recommandée' },
      'fard_kifaya': { emoji: '👥', label: 'Obligatoire collective' },
      'eid_prayer': { emoji: '🎉', label: 'Prière de fête' },
      'special_event': { emoji: '🌙', label: 'Événement spécial' },
      'day_nafl': { emoji: '☀️', label: 'Surérogatoire' },
      'generic_nafl': { emoji: '📿', label: 'Surérogatoire' },
      'mosque_entry': { emoji: '🕌', label: 'Sunnah' },
      'decision': { emoji: '🤲', label: 'Consultation' },
      'need': { emoji: '🙏', label: 'Besoin' },
      'ramadan': { emoji: '🌙', label: 'Ramadan' },
      'danger': { emoji: '⚠️', label: 'Situation de danger' },
      'dhikr': { emoji: '📿', label: 'Dhikr' },
      'travel': { emoji: '✈️', label: 'Voyage' }
    };
    return badges[badgeKey] || { emoji: '📿', label: 'Prière' };
  }

  /**
   * Mapping des icônes vers emoji
   * @param {string} iconKey - Clé de l'icône
   * @returns {string} Emoji
   */
  getIconEmoji(iconKey) {
    const icons = {
      'extra_friday': '🕌',
      'extra_witr': '🌙',
      'extra_eid': '🎉',
      'extra_janazah': '⚰️',
      'extra_eclipse': '🌙',
      'extra_duha': '☀️',
      'extra_nafl': '📿',
      'extra_mosque': '🕌',
      'extra_istikhara': '🤲',
      'extra_need': '🙏',
      'extra_tarawih': '🌙',
      'extra_khawf': '⚠️',
      'extra_tasbih': '📿',
      'extra_travel': '✈️'
    };
    return icons[iconKey] || '📿';
  }

  /**
   * Prépare le démarrage d'une prière supplémentaire
   * Structure préparée pour l'intégration future du guidage pas-à-pas
   * @param {string} prayerId - ID de la prière supplémentaire
   */
  startExtraPrayer(prayerId) {
    const prayer = this.getExtraPrayerById(prayerId);
    if (!prayer) {
      console.warn(`Extra prayer not found: ${prayerId}`);
      return;
    }

    // TODO: Intégration future avec le moteur de guidage pas-à-pas
    // Pour l'instant, on stocke simplement la prière sélectionnée
    // et on affiche la vue de détail
    this.state.set('selectedExtraPrayer', prayerId);
    this.state.set('currentView', 'prayer-extra-detail');

    // Structure préparée pour le guidage :
    // - Certaines prières supplémentaires pourront utiliser le moteur existant
    // - D'autres nécessiteront des étapes spéciales (ex: Janazah sans rukūʿ/sujūd)
    // - Le champ behaviorFlags indique les particularités à gérer
  }
}

