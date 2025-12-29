export const ABLUTION_TYPES = [
    { id: 'wudu', nameKey: 'minorAblution', name: 'Wudu (Minor Ablution)', icon: '💧' },
    { id: 'ghusl', nameKey: 'majorAblution', name: 'Ghusl (Major Ablution)', icon: '🚿' },
    { id: 'tayammum', nameKey: 'tayammum', name: 'Tayammum (Dry Ablution)', icon: '🏜️' }
];

export class AblutionsEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.pluginManager = dependencies.pluginManager;
  }
  
  get translations() {
      return this.pluginManager.get('translations').engine;
  }

  init() {
    // Rien de spécial à initialiser
  }
  
  getAblutionTypes() {
      return ABLUTION_TYPES;
  }

  getAblutionSteps(type) {
    const t = this.translations.getAll() || {};
    // Helper to access translation safely
    const tr = (key) => t[key] || key;

    const wuduSteps = [
        { id: 'intention', name: tr('intention'), icon: '💭', description: tr('intentionDesc'), repetitions: null },
        { id: 'bismillah', name: tr('sayBismillah'), icon: '🤲', description: tr('bismillahDesc'), repetitions: null },
        { id: 'wash_hands', name: tr('washHands'), icon: '🤲', description: tr('washHandsDesc'), repetitions: '3x' },
        { id: 'rinse_mouth', name: tr('rinseMouth'), icon: '👄', description: tr('rinseMouthDesc'), repetitions: '3x' },
        { id: 'rinse_nose', name: tr('rinseNose'), icon: '👃', description: tr('rinseNoseDesc'), repetitions: '3x' },
        { id: 'wash_face', name: tr('washFace'), icon: '😊', description: tr('washFaceDesc'), repetitions: '3x' },
        { id: 'wash_arms', name: tr('washArms'), icon: '💪', description: tr('washArmsDesc'), repetitions: '3x' },
        { id: 'wipe_head', name: tr('wipeHead'), icon: '👤', description: tr('wipeHeadDesc'), repetitions: '1x' },
        { id: 'wipe_ears', name: tr('wipeEars'), icon: '👂', description: tr('wipeEarsDesc'), repetitions: '1x' },
        { id: 'wash_feet', name: tr('washFeet'), icon: '🦶', description: tr('washFeetDesc'), repetitions: '3x' }
    ];

    const ghuslSteps = [
        { id: 'intention', name: tr('intention'), icon: '💭', description: tr('intentionGhusl'), repetitions: null },
        { id: 'bismillah', name: tr('sayBismillah'), icon: '🤲', description: tr('bismillahDesc'), repetitions: null },
        { id: 'wash_hands', name: tr('washHands'), icon: '🤲', description: tr('washHandsGhuslDesc'), repetitions: '3x' },
        { id: 'wash_private', name: tr('cleanPrivateParts'), icon: '🚿', description: tr('cleanPrivatePartsDesc'), repetitions: null },
        { id: 'perform_wudu', name: tr('performWudhu'), icon: '💧', description: tr('performWudhuDesc'), repetitions: null },
        { id: 'wash_head', name: tr('washHead'), icon: '👤', description: tr('washHeadDesc'), repetitions: '3x' },
        { id: 'wash_right_side', name: tr('washRightSide'), icon: '🚿', description: tr('washRightSideDesc'), repetitions: '3x' },
        { id: 'wash_left_side', name: tr('washLeftSide'), icon: '🚿', description: tr('washLeftSideDesc'), repetitions: '3x' },
        { id: 'wash_feet_final', name: tr('washFeet'), icon: '🦶', description: tr('washFeetFinalDesc'), repetitions: null }
    ];

    const tayammumSteps = [
        { id: 'intention', name: tr('intention'), icon: '💭', description: tr('intentionTayammum'), repetitions: null },
        { id: 'bismillah', name: tr('sayBismillah'), icon: '🤲', description: tr('bismillahDesc'), repetitions: null },
        { id: 'strike_earth', name: tr('strikeEarth'), icon: '🏜️', description: tr('strikeEarthDesc'), repetitions: '1x' },
        { id: 'wipe_face_tayammum', name: tr('wipeFace'), icon: '😊', description: tr('wipeFaceTayammumDesc'), repetitions: '1x' },
        { id: 'wipe_hands', name: tr('wipeHands'), icon: '🤲', description: tr('wipeHandsDesc'), repetitions: '1x' }
    ];

    switch (type) {
        case 'wudu':
            return wuduSteps;
        case 'ghusl':
            return ghuslSteps;
        case 'tayammum':
            return tayammumSteps;
        default:
            return wuduSteps;
    }
  }

  selectAblutionType(typeId) {
      this.state.update({
          selectedAblutionType: typeId,
          currentAblutionStep: 0,
          currentView: 'ablution-guidance'
      });
  }

  nextStep() {
      const steps = this.getAblutionSteps(this.state.get('selectedAblutionType'));
      const currentStep = this.state.get('currentAblutionStep');
      
      if (currentStep < steps.length - 1) {
          this.state.set('currentAblutionStep', currentStep + 1);
          return true;
      }
      return false;
  }

  previousStep() {
      const currentStep = this.state.get('currentAblutionStep');
      if (currentStep > 0) {
          this.state.set('currentAblutionStep', currentStep - 1);
          return true;
      }
      return false;
  }
}

