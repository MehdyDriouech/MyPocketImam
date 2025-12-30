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
    // Vérifier si c'est une prière supplémentaire
    const selectedExtraPrayer = this.state.get('selectedExtraPrayer');
    if (selectedExtraPrayer) {
      return this.getExtraPrayerPositionImage(stepId, selectedExtraPrayer, avatarGender);
    }

    // Utiliser la méthode privée pour éviter la récursion
    return this._getStandardPositionImage(stepId, avatarGender);
  }

  /**
   * Méthode privée pour obtenir l'image de position standard
   * Ne vérifie PAS selectedExtraPrayer pour éviter la récursion
   * @param {string} stepId - ID de l'étape
   * @param {string} avatarGender - Genre de l'avatar ('boy' ou 'girl')
   * @returns {string} Chemin de l'image
   */
  _getStandardPositionImage(stepId, avatarGender = 'boy') {
    // Code existant pour les prières obligatoires
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
    // Vérifier si c'est une prière supplémentaire
    const selectedExtraPrayer = this.state.get('selectedExtraPrayer');
    if (selectedExtraPrayer) {
      return this.getExtraPrayerCurrentSteps();
    }
    
    // Code existant pour les prières obligatoires
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
    // Vérifier si c'est une prière supplémentaire
    const selectedExtraPrayer = this.state.get('selectedExtraPrayer');
    if (selectedExtraPrayer) {
      return this.getExtraPrayerAudioFile();
    }
    
    // Code existant pour les prières obligatoires
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
    // Vérifier si c'est une prière supplémentaire
    const selectedExtraPrayer = this.state.get('selectedExtraPrayer');
    if (selectedExtraPrayer) {
      const prayer = this.getExtraPrayerById(selectedExtraPrayer);
      if (!prayer) return false;
      
      const currentRakaat = this.state.get('currentRakaat');
      const extraPrayerConfig = this.state.get('extraPrayerConfig') || {};
      const totalRakaats = extraPrayerConfig.rakaats || prayer.defaultRakaat;
      
      if (currentRakaat < totalRakaats) {
        this.state.update({
          currentRakaat: currentRakaat + 1,
          currentStepIndex: 0
        });
        return true;
      }
      return false;
    }

    // Code existant pour les prières obligatoires
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
   * @param {string} prayerId - ID de la prière supplémentaire
   */
  startExtraPrayer(prayerId) {
    const prayer = this.getExtraPrayerById(prayerId);
    if (!prayer) {
      console.warn(`Extra prayer not found: ${prayerId}`);
      return;
    }

    this.state.set('selectedExtraPrayer', prayerId);
    this.state.set('currentView', 'prayer-extra-detail');
  }

  /**
   * Initialise le guidage pour une prière supplémentaire
   * @param {string} prayerId - ID de la prière supplémentaire
   */
  startExtraPrayerGuidance(prayerId) {
    const prayer = this.getExtraPrayerById(prayerId);
    if (!prayer) {
      console.warn(`Extra prayer not found: ${prayerId}`);
      return;
    }

    const SURAHS = this.config.getSurahs();
    
    // Utiliser la config existante si disponible, sinon utiliser les valeurs par défaut
    const extraPrayerConfig = this.state.get('extraPrayerConfig') || {};
    const rakaats = extraPrayerConfig.rakaats || prayer.defaultRakaat;
    let rakaatConfig = this.state.get('rakaatConfig') || [];
    
    // Cas spécial : Janazah n'a pas de rakaʿāt (defaultRakaat = 0)
    if (prayer.defaultRakaat === 0) {
      const updateData = {
        selectedExtraPrayer: prayerId,
        isExtraPrayer: true,
        currentView: 'prayer-extra-guidance',
        currentRakaat: 1, // On utilise 1 pour la logique, mais les étapes n'ont pas de rakaʿāt
        currentStepIndex: 0,
        rakaatConfig: [],
        extraPrayerConfig: {
          rakaats: 0
        }
      };
      
      this.state.update(updateData);
      return;
    }
    
    // Initialiser la config des rakaats si nécessaire
    if (rakaatConfig.length !== rakaats) {
      rakaatConfig = [];
      for (let i = 1; i <= rakaats; i++) {
        rakaatConfig.push({
          rakaat: i,
          secondarySurah: SURAHS.find(s => s.id === 'ikhlas') || SURAHS[1] // Default
        });
      }
    }

    const updateData = {
      selectedExtraPrayer: prayerId,
      isExtraPrayer: true,
      currentView: 'prayer-extra-guidance',
      currentRakaat: 1,
      currentStepIndex: 0,
      rakaatConfig: rakaatConfig,
      extraPrayerConfig: {
        rakaats: rakaats
      }
    };
    
    this.state.update(updateData);
  }

  /**
   * Génère les étapes pour une prière supplémentaire selon son type
   * @param {string} prayerId - ID de la prière supplémentaire
   * @returns {Array} Liste des étapes
   */
  getExtraPrayerSteps(prayerId) {
    const prayer = this.getExtraPrayerById(prayerId);
    if (!prayer) return [];

    // Router vers la méthode spécifique selon le type de prière
    switch (prayerId) {
      case 'extra_witr':
        return this.getWitrSteps();
      case 'extra_duha':
      case 'extra_tahiyyat_masjid':
      case 'extra_istikhara':
      case 'extra_haajah':
      case 'extra_nafilah':
        // Prières simples qui réutilisent le moteur standard
        return this.getPrayerSteps();
      case 'extra_jumuah':
        return this.getJumuahSteps();
      case 'extra_eid':
        return this.getEidSteps();
      case 'extra_tarawih':
        return this.getPrayerSteps();
      case 'extra_janazah':
        return this.getJanazahSteps();
      case 'extra_kusuf':
        return this.getKusufSteps();
      case 'extra_khawf':
        return this.getKhawfSteps();
      case 'extra_tasbih':
        return this.getTasbihSteps();
      default:
        // Par défaut, réutiliser le moteur standard
        return this.getPrayerSteps();
    }
  }

  /**
   * Génère les étapes finales pour une prière supplémentaire
   * @param {string} prayerId - ID de la prière supplémentaire
   * @returns {Array} Liste des étapes finales
   */
  getExtraPrayerFinalSteps(prayerId) {
    const prayer = this.getExtraPrayerById(prayerId);
    if (!prayer) return [];

    // Router vers la méthode spécifique selon le type de prière
    switch (prayerId) {
      case 'extra_witr':
        return this.getWitrFinalSteps();
      case 'extra_janazah':
        return []; // Janazah n'a pas d'étapes finales standard
      default:
        // Pour la plupart, réutiliser les étapes finales standard
        return this.getFinalSteps();
    }
  }

  /**
   * Filtre les étapes d'une prière supplémentaire selon la rakaat courante
   * @returns {Array} Liste des étapes filtrées
   */
  getExtraPrayerCurrentSteps() {
    const selectedExtraPrayer = this.state.get('selectedExtraPrayer');
    if (!selectedExtraPrayer) {
      return [];
    }

    const prayer = this.getExtraPrayerById(selectedExtraPrayer);
    if (!prayer) {
      return [];
    }

    // Cas spécial : Janazah n'a pas de rakaʿāt
    if (prayer.defaultRakaat === 0) {
      // Pour Janazah, retourner toutes les étapes directement
      return this.getExtraPrayerSteps(selectedExtraPrayer);
    }

    const currentRakaat = this.state.get('currentRakaat');
    const extraPrayerConfig = this.state.get('extraPrayerConfig') || {};
    const totalRakaats = extraPrayerConfig.rakaats || prayer.defaultRakaat;

    const isLastRakaat = currentRakaat === totalRakaats;
    const isFirstRakaat = currentRakaat === 1;
    const isFirstTwoRakaats = currentRakaat <= 2;

    // Obtenir les étapes de base
    let steps = this.getExtraPrayerSteps(selectedExtraPrayer);

    // Filtrer selon les flags
    steps = steps.filter(step => {
      if (step.firstRakaatOnly && !isFirstRakaat) return false;
      if (step.firstTwoRakaatsOnly && !isFirstTwoRakaats) return false;
      if (step.lastRakaatOnly && !isLastRakaat) return false;
      if (step.secondRakaatOnly && currentRakaat !== 2) return false;
      // Ignorer les étapes avec beforePrayer dans les rakaʿāt suivantes
      if (step.beforePrayer && currentRakaat > 1) return false;
      return true;
    });

    // Ajouter les étapes finales si dernière rakaat
    if (isLastRakaat) {
      const finalSteps = this.getExtraPrayerFinalSteps(selectedExtraPrayer);
      steps = [...steps, ...finalSteps];
    }

    return steps;
  }

  /**
   * Retourne le fichier audio pour l'étape courante d'une prière supplémentaire
   * @returns {string|null} Chemin du fichier audio ou null
   */
  getExtraPrayerAudioFile() {
    const steps = this.getExtraPrayerCurrentSteps();
    const currentStepIndex = this.state.get('currentStepIndex');
    const step = steps[currentStepIndex];
    
    if (!step) return null;

    // Vérifier si c'est un placeholder
    if (step.audioFile && step.audioFile.startsWith('[PLACEHOLDER]')) {
      return null; // Pas d'audio disponible
    }

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

  /**
   * Retourne l'image de position pour une étape d'une prière supplémentaire
   * @param {string} stepId - ID de l'étape
   * @param {string} prayerId - ID de la prière supplémentaire
   * @param {string} avatarGender - Genre de l'avatar
   * @returns {string} Chemin de l'image
   */
  getExtraPrayerPositionImage(stepId, prayerId, avatarGender = 'boy') {
    const prayer = this.getExtraPrayerById(prayerId);
    if (!prayer) {
      // Utiliser la méthode privée pour éviter la récursion
      return this._getStandardPositionImage(stepId, avatarGender);
    }

    // Cas spéciaux
    if (prayerId === 'extra_janazah') {
      // Janazah : toujours debout, utiliser position debout-main-coeur
      const suffix = avatarGender === 'girl' ? '-girl.png' : '.png';
      return `js/features/prayers/assets/images/position-debout-main-coeur${suffix}`;
    }

    // Par défaut, utiliser la méthode privée pour éviter la récursion
    return this._getStandardPositionImage(stepId, avatarGender);
  }

  // ========== MÉTHODES SPÉCIFIQUES PAR PRIÈRE ==========
  // Ces méthodes seront implémentées dans les phases suivantes

  /**
   * Étapes pour Witr (avec qunût)
   * @returns {Array} Liste des étapes
   */
  getWitrSteps() {
    // Witr réutilise les étapes standard
    return this.getPrayerSteps();
  }

  /**
   * Étapes finales pour Witr (avec qunût avant tashahhud)
   * @returns {Array} Liste des étapes finales
   */
  getWitrFinalSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    // Qunût avant tashahhud dans la dernière rakaʿa
    const qunûtStep = {
      id: 'qunût_witr',
      name: tr('qunûtInvocation') || '[PLACEHOLDER] Invocation du qunût',
      arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ',
      transliteration: 'Allahumma ihdini fi man hadayta',
      translation: tr('qunûtTranslation') || '[PLACEHOLDER] O Allah, guide me among those You have guided',
      position: 'standing',
      action: tr('qunûtAction') || '[PLACEHOLDER] Réciter l\'invocation du qunût',
      audioFile: '[PLACEHOLDER] qunût invocation',
      pauseAfter: 2000,
      lastRakaatOnly: true
    };

    // Étapes finales standard après le qunût
    const finalSteps = this.getFinalSteps();
    
    // Insérer le qunût avant le tashahhud
    const tashahhudIndex = finalSteps.findIndex(step => step.id === 'tashahhud');
    if (tashahhudIndex >= 0) {
      return [
        ...finalSteps.slice(0, tashahhudIndex),
        qunûtStep,
        ...finalSteps.slice(tashahhudIndex)
      ];
    }
    
    // Si tashahhud non trouvé, ajouter qunût au début
    return [qunûtStep, ...finalSteps];
  }

  /**
   * Étapes pour Joumou'a (avec mention khutbas)
   * @returns {Array} Liste des étapes
   */
  getJumuahSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    // Ajouter une étape pré-prière pour rappeler les khutbas
    const khutbaReminder = {
      id: 'khutba_reminder',
      name: tr('khutbaReminder') || '[PLACEHOLDER] Rappel des khutbas',
      arabic: '',
      transliteration: '',
      translation: tr('khutbaReminderText') || '[PLACEHOLDER] Écoutez les deux khutbas en silence avant de commencer la prière',
      position: 'standing',
      action: tr('khutbaReminderAction') || '[PLACEHOLDER] Écouter les prêches',
      audioFile: '[PLACEHOLDER] khutba reminder',
      pauseAfter: 2000,
      firstRakaatOnly: true,
      beforePrayer: true // Flag pour afficher avant la prière
    };

    // Réutiliser les étapes standard
    const standardSteps = this.getPrayerSteps();
    
    // Insérer le rappel des khutbas au début
    return [khutbaReminder, ...standardSteps];
  }

  /**
   * Étapes pour Aïd (avec takbīrs supplémentaires)
   * @returns {Array} Liste des étapes
   */
  getEidSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    // Takbīrs supplémentaires après le takbīr d'ouverture (rakaʿa 1 : 6 takbīrs)
    const extraTakbirsRakaat1 = {
      id: 'extra_takbirs_rakaat1',
      name: tr('extraTakbirs') || '[PLACEHOLDER] Takbīrs supplémentaires',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allahu Akbar',
      translation: tr('extraTakbirsText') || '[PLACEHOLDER] Réciter 6 takbīrs supplémentaires',
      position: 'standing',
      action: tr('extraTakbirsAction') || '[PLACEHOLDER] Réciter les takbīrs supplémentaires',
      audioFile: '[PLACEHOLDER] extra takbirs',
      pauseAfter: 2000,
      firstRakaatOnly: true
    };

    // Takbīrs supplémentaires après le takbīr rukūʿ (rakaʿa 2 : 5 takbīrs)
    // Dans la deuxième rakaʿa uniquement, après s'être relevé du rukūʿ
    const extraTakbirsRakaat2 = {
      id: 'extra_takbirs_rakaat2',
      name: tr('extraTakbirs') || '[PLACEHOLDER] Takbīrs supplémentaires',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allahu Akbar',
      translation: tr('extraTakbirsText2') || '[PLACEHOLDER] Réciter 5 takbīrs supplémentaires',
      position: 'standing',
      action: tr('extraTakbirsAction') || '[PLACEHOLDER] Réciter les takbīrs supplémentaires',
      audioFile: '[PLACEHOLDER] extra takbirs',
      pauseAfter: 2000,
      secondRakaatOnly: true // Uniquement dans la 2e rakaʿa
    };

    // Réutiliser les étapes standard
    const standardSteps = this.getPrayerSteps();
    
    // Insérer les takbīrs supplémentaires aux bons endroits
    const steps = [];
    for (const step of standardSteps) {
      steps.push(step);
      
      // Après takbīr ouverture (première rakaʿa uniquement)
      if (step.id === 'takbir_ouverture') {
        steps.push(extraTakbirsRakaat1);
      }
      
      // Après rukūʿ dans la deuxième rakaʿa uniquement
      // On insère après apres_qiyam, mais le flag secondRakaatOnly filtrera
      if (step.id === 'apres_qiyam') {
        steps.push(extraTakbirsRakaat2);
      }
    }
    
    return steps;
  }

  /**
   * Étapes pour Janazah (sans rukūʿ/sujūd)
   * @returns {Array} Liste des étapes
   */
  getJanazahSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    return [
      {
        id: 'takbir1_janazah',
        name: tr('takbir1Janazah') || '[PLACEHOLDER] Premier takbīr',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: tr('takbir1JanazahText') || '[PLACEHOLDER] Réciter Al-Fatiha',
        position: 'standing',
        action: tr('takbir1JanazahAction') || '[PLACEHOLDER] Réciter Al-Fatiha',
        audioFile: '[PLACEHOLDER] janazah takbir1',
        pauseAfter: 2000
      },
      {
        id: 'takbir2_janazah',
        name: tr('takbir2Janazah') || '[PLACEHOLDER] Deuxième takbīr',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: tr('takbir2JanazahText') || '[PLACEHOLDER] Réciter la prière sur le Prophète (Salāt Ibrāhīmiyya)',
        position: 'standing',
        action: tr('takbir2JanazahAction') || '[PLACEHOLDER] Réciter la prière sur le Prophète',
        audioFile: '[PLACEHOLDER] janazah takbir2',
        pauseAfter: 2000
      },
      {
        id: 'takbir3_janazah',
        name: tr('takbir3Janazah') || '[PLACEHOLDER] Troisième takbīr',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: tr('takbir3JanazahText') || '[PLACEHOLDER] Faire une invocation pour le défunt',
        position: 'standing',
        action: tr('takbir3JanazahAction') || '[PLACEHOLDER] Faire une invocation pour le défunt',
        audioFile: '[PLACEHOLDER] janazah takbir3',
        pauseAfter: 2000
      },
      {
        id: 'takbir4_janazah',
        name: tr('takbir4Janazah') || '[PLACEHOLDER] Quatrième takbīr',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: tr('takbir4JanazahText') || '[PLACEHOLDER] Faire une invocation brève puis salām',
        position: 'standing',
        action: tr('takbir4JanazahAction') || '[PLACEHOLDER] Invocation brève puis salām',
        audioFile: '[PLACEHOLDER] janazah takbir4',
        pauseAfter: 1000
      },
      {
        id: 'salam_janazah',
        name: tr('salamJanazah') || '[PLACEHOLDER] Salām',
        arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
        transliteration: 'As-salamu \'alaykum wa rahmatullah',
        translation: tr('salamJanazahText') || '[PLACEHOLDER] Paix et miséricorde d\'Allah',
        position: 'standing',
        action: tr('salamJanazahAction') || '[PLACEHOLDER] Tourner la tête à droite puis à gauche',
        audioFile: '[PLACEHOLDER] janazah salam',
        pauseAfter: 0
      }
    ];
  }

  /**
   * Étapes pour Éclipse (double rukūʿ)
   * @returns {Array} Liste des étapes
   */
  getKusufSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    // Structure spéciale : takbīr → récitation → rukūʿ 1 → qiyām → récitation → rukūʿ 2 → sujūd 1 → jalsa → sujūd 2
    return [
      { id: 'takbir_ouverture', name: tr('takbirOpening'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('raiseHands'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', firstRakaatOnly: true, pauseAfter: 1000 },
      { id: 'invocation_ouverture', name: tr('openingInvocation'), arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ', transliteration: 'Subhanakal-lahumma wa bihamdika', translation: 'Glory and praise to You, O Allah', position: 'standing', action: tr('reciteOpening'), audioFiles: ['js/features/prayers/assets/audio/guidance/ouverture1.mp3', 'js/features/prayers/assets/audio/guidance/ouverture2.mp3', 'js/features/prayers/assets/audio/guidance/ouverture3.mp3'], firstRakaatOnly: true, hasOptions: true, pauseAfter: 1000 },
      { id: 'refuge', name: tr('seekingRefuge'), arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', transliteration: 'A\'oudhou billahi mina shaytani rajim', translation: 'I seek refuge in Allah from Satan the accursed', position: 'standing', action: tr('seekProtection'), audioFiles: ['js/features/prayers/assets/audio/guidance/refuge1.mp3', 'js/features/prayers/assets/audio/guidance/refuge2.mp3', 'js/features/prayers/assets/audio/guidance/refuge3.mp3'], firstRakaatOnly: true, hasOptions: true, pauseAfter: 500 },
      { id: 'bismillah', name: tr('bismillah'), arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillah ir-Rahman ir-Rahim', translation: 'In the name of Allah, Most Gracious, Most Merciful', position: 'standing', action: tr('beginWithName'), audioFile: 'js/features/prayers/assets/audio/guidance/bismilah.mp3', firstRakaatOnly: true, pauseAfter: 500 },
      { id: 'fatiha', name: tr('reciteFatiha'), arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', transliteration: 'Alhamdulillahi rabbil \'alamin', translation: 'Praise be to Allah, Lord of the worlds', position: 'standing', action: tr('reciteFatihaAction'), surahType: 'fatiha', pauseAfter: 1000 },
      { id: 'second_surah', name: tr('secondarySurahStep'), arabic: '...', transliteration: '...', translation: 'Recite the chosen surah', position: 'standing', action: tr('reciteSecondary'), surahType: 'secondary', pauseAfter: 1000, firstTwoRakaatsOnly: true },
      { id: 'takbir_ruku1', name: tr('takbirRuku') || '[PLACEHOLDER] Takbīr pour premier rukūʿ', arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('sayTakbirBowing'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
      { id: 'ruku1', name: tr('ruku') || '[PLACEHOLDER] Premier rukūʿ', arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', transliteration: 'Subhana Rabbiyal Adheem', translation: 'Glory to my Lord the Great', position: 'bowing', action: tr('stayBowing'), audioFiles: ['js/features/prayers/assets/audio/guidance/ruku1.mp3'], pauseAfter: 1000 },
      { id: 'qiyam1', name: tr('qiyam') || '[PLACEHOLDER] Se relever', arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', transliteration: 'Sami Allahu liman hamidah', translation: 'Allah hears those who praise Him', position: 'standing', action: tr('standUpSaying'), audioFile: 'js/features/prayers/assets/audio/guidance/en ce levant1.mp3', pauseAfter: 500 },
      { id: 'apres_qiyam1', name: tr('afterQiyam') || '[PLACEHOLDER] Après s\'être relevé', arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ', transliteration: 'Rabbana wa lakal hamd', translation: 'Our Lord, to You be praise', position: 'standing', action: tr('onceStanding'), audioFiles: ['js/features/prayers/assets/audio/guidance/unefoislevé1.mp3'], pauseAfter: 1000 },
      { id: 'second_surah2', name: tr('secondarySurahStep') || '[PLACEHOLDER] Réciter une sourate', arabic: '...', transliteration: '...', translation: 'Recite the chosen surah', position: 'standing', action: tr('reciteSecondary'), surahType: 'secondary', pauseAfter: 1000 },
      { id: 'takbir_ruku2', name: tr('takbirRuku') || '[PLACEHOLDER] Takbīr pour deuxième rukūʿ', arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('sayTakbirBowing'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
      { id: 'ruku2', name: tr('ruku') || '[PLACEHOLDER] Deuxième rukūʿ', arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', transliteration: 'Subhana Rabbiyal Adheem', translation: 'Glory to my Lord the Great', position: 'bowing', action: tr('stayBowing'), audioFiles: ['js/features/prayers/assets/audio/guidance/ruku1.mp3'], pauseAfter: 1000 },
      { id: 'qiyam2', name: tr('qiyam'), arabic: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ', transliteration: 'Sami Allahu liman hamidah', translation: 'Allah hears those who praise Him', position: 'standing', action: tr('standUpSaying'), audioFile: 'js/features/prayers/assets/audio/guidance/en ce levant1.mp3', pauseAfter: 500 },
      { id: 'apres_qiyam2', name: tr('afterQiyam'), arabic: 'رَبَّنَا وَلَكَ الْحَمْدُ', transliteration: 'Rabbana wa lakal hamd', translation: 'Our Lord, to You be praise', position: 'standing', action: tr('onceStanding'), audioFiles: ['js/features/prayers/assets/audio/guidance/unefoislevé1.mp3'], pauseAfter: 1000 },
      { id: 'takbir_sujud1', name: tr('takbirSujud'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'standing', action: tr('sayTakbirProstrating'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
      { id: 'sujud1', name: tr('sujud1'), arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana Rabbiyal A\'la', translation: 'Glory to my Lord the Most High', position: 'prostrating', action: tr('stayProstrating'), audioFiles: ['js/features/prayers/assets/audio/guidance/durantprosternation1.mp3', 'js/features/prayers/assets/audio/guidance/durantprosternation2.mp3'], hasOptions: true, pauseAfter: 2000 },
      { id: 'takbir_jalsa', name: tr('takbirSit'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'prostrating', action: tr('sayTakbirSitting'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
      { id: 'jalsa', name: tr('jalsa'), arabic: 'رَبِّ اغْفِرْ لِي', transliteration: 'Rabbi ghfir li', translation: 'Lord, forgive me', position: 'sitting', action: tr('sitBriefly'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 2000 },
      { id: 'takbir_sujud2', name: tr('takbirSujud2'), arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'God is the Greatest', position: 'sitting', action: tr('sayTakbirProstrating2'), audioFile: 'js/features/prayers/assets/audio/guidance/takbir.mp3', pauseAfter: 1000 },
      { id: 'sujud2', name: tr('sujud2'), arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana Rabbiyal A\'la', translation: 'Glory to my Lord the Most High', position: 'prostrating', action: tr('prostrateAgain'), audioFiles: ['js/features/prayers/assets/audio/guidance/durantprosternation1.mp3', 'js/features/prayers/assets/audio/guidance/durantprosternation2.mp3'], hasOptions: true, pauseAfter: 2000 }
    ];
  }

  /**
   * Étapes pour Khawf (mode danger)
   * @returns {Array} Liste des étapes
   */
  getKhawfSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    // Ajouter une étape pré-prière pour expliquer le mode danger
    const khawfInstructions = {
      id: 'khawf_instructions',
      name: tr('khawfInstructions') || '[PLACEHOLDER] Instructions pour la prière en cas de danger',
      arabic: '',
      transliteration: '',
      translation: tr('khawfInstructionsText') || '[PLACEHOLDER] L\'assemblée se divise en deux groupes. Un groupe prie avec l\'imam pendant que l\'autre surveille, puis ils alternent.',
      position: 'standing',
      action: tr('khawfInstructionsAction') || '[PLACEHOLDER] Lire les instructions',
      audioFile: '[PLACEHOLDER] khawf instructions',
      pauseAfter: 3000,
      firstRakaatOnly: true,
      beforePrayer: true
    };

    // Réutiliser les étapes standard
    const standardSteps = this.getPrayerSteps();
    
    // Insérer les instructions au début
    return [khawfInstructions, ...standardSteps];
  }

  /**
   * Étapes pour Tasbih (dhikr spécial)
   * @returns {Array} Liste des étapes
   */
  getTasbihSteps() {
    const t = this.translations.getAll() || {};
    const tr = (key) => t[key] || key;

    // Le tasbīh spécial à répéter
    const tasbihText = tr('tasbihText') || '[PLACEHOLDER] Subḥānallāh wal-ḥamdu lillāh wa lā ilāha illallāh wa Allāhu akbar';
    
    // Étape de tasbīh à ajouter après chaque position
    const tasbihDhikr = {
      id: 'tasbih_dhikr',
      name: tr('tasbihDhikr') || '[PLACEHOLDER] Réciter le tasbīh',
      arabic: 'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ',
      transliteration: 'Subhanallahi wal-hamdu lillah',
      translation: tasbihText,
      position: 'standing',
      action: tr('tasbihDhikrAction') || '[PLACEHOLDER] Réciter 75 fois le tasbīh (réparti sur la rakaʿa)',
      audioFile: '[PLACEHOLDER] tasbih dhikr',
      pauseAfter: 2000
    };

    // Réutiliser les étapes standard et ajouter le tasbīh après chaque position importante
    const standardSteps = this.getPrayerSteps();
    const steps = [];
    
    for (const step of standardSteps) {
      steps.push(step);
      
      // Ajouter tasbīh après certaines positions (simplifié : après chaque étape principale)
      if (['fatiha', 'second_surah', 'apres_qiyam', 'sujud1', 'sujud2'].includes(step.id)) {
        steps.push({ ...tasbihDhikr, id: `tasbih_${step.id}`, position: step.position });
      }
    }
    
    return steps;
  }
}

