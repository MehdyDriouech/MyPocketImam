// feature-ablutions.js - Ablution Logic

export const ABLUTION_TYPES = [
    { id: 'wudu', nameKey: 'minorAblution', name: 'Wudu (Minor Ablution)', icon: '💧' },
    { id: 'ghusl', nameKey: 'majorAblution', name: 'Ghusl (Major Ablution)', icon: '🚿' },
    { id: 'tayammum', nameKey: 'tayammum', name: 'Tayammum (Dry Ablution)', icon: '🏜️' }
];

export function getAblutionSteps(type, trans) {
    const wuduSteps = [
        { id: 'intention', name: trans.intention || 'Intention', icon: '💭', description: trans.intentionDesc || 'Formulez l\'intention de faire le wudhu pour Allah', repetitions: null },
        { id: 'bismillah', name: trans.sayBismillah || 'Dire Bismillah', icon: '🤲', description: trans.bismillahDesc || 'Commencez en disant "Bismillah" (Au nom d\'Allah)', repetitions: null },
        { id: 'wash_hands', name: trans.washHands || 'Se laver les mains', icon: '🤲', description: trans.washHandsDesc || 'Lavez vos deux mains jusqu\'aux poignets', repetitions: '3x' },
        { id: 'rinse_mouth', name: trans.rinseMouth || 'Rincer la bouche', icon: '👄', description: trans.rinseMouthDesc || 'Rincez votre bouche soigneusement', repetitions: '3x' },
        { id: 'rinse_nose', name: trans.rinseNose || 'Rincer le nez', icon: '👃', description: trans.rinseNoseDesc || 'Aspirez de l\'eau dans vos narines et expirez-la', repetitions: '3x' },
        { id: 'wash_face', name: trans.washFace || 'Laver le visage', icon: '😊', description: trans.washFaceDesc || 'Lavez tout votre visage du front au menton et d\'une oreille à l\'autre', repetitions: '3x' },
        { id: 'wash_arms', name: trans.washArms || 'Laver les bras', icon: '💪', description: trans.washArmsDesc || 'Lavez les deux bras du bout des doigts jusqu\'aux coudes, en commençant par le droit', repetitions: '3x' },
        { id: 'wipe_head', name: trans.wipeHead || 'Essuyer la tête', icon: '👤', description: trans.wipeHeadDesc || 'Passez vos mains mouillées sur votre tête de l\'avant vers l\'arrière', repetitions: '1x' },
        { id: 'wipe_ears', name: trans.wipeEars || 'Essuyer les oreilles', icon: '👂', description: trans.wipeEarsDesc || 'Essuyez l\'intérieur et l\'extérieur des deux oreilles', repetitions: '1x' },
        { id: 'wash_feet', name: trans.washFeet || 'Laver les pieds', icon: '🦶', description: trans.washFeetDesc || 'Lavez les deux pieds jusqu\'aux chevilles, en commençant par le droit', repetitions: '3x' }
    ];

    const ghuslSteps = [
        { id: 'intention', name: trans.intention || 'Intention', icon: '💭', description: trans.intentionGhusl || 'Formulez l\'intention de faire le ghusl pour la purification', repetitions: null },
        { id: 'bismillah', name: trans.sayBismillah || 'Dire Bismillah', icon: '🤲', description: trans.bismillahDesc || 'Commencez en disant "Bismillah" (Au nom d\'Allah)', repetitions: null },
        { id: 'wash_hands', name: trans.washHands || 'Se laver les mains', icon: '🤲', description: trans.washHandsGhuslDesc || 'Lavez vos deux mains soigneusement', repetitions: '3x' },
        { id: 'wash_private', name: trans.cleanPrivateParts || 'Nettoyer les parties intimes', icon: '🚿', description: trans.cleanPrivatePartsDesc || 'Nettoyez les parties intimes soigneusement', repetitions: null },
        { id: 'perform_wudu', name: trans.performWudhu || 'Faire le wudhu', icon: '💧', description: trans.performWudhuDesc || 'Réalisez un wudhu complet comme vous le feriez normalement', repetitions: null },
        { id: 'wash_head', name: trans.washHead || 'Laver la tête', icon: '👤', description: trans.washHeadDesc || 'Versez de l\'eau sur votre tête trois fois, en vous assurant qu\'elle atteigne les racines des cheveux', repetitions: '3x' },
        { id: 'wash_right_side', name: trans.washRightSide || 'Laver le côté droit', icon: '🚿', description: trans.washRightSideDesc || 'Versez de l\'eau sur tout le côté droit de votre corps', repetitions: '3x' },
        { id: 'wash_left_side', name: trans.washLeftSide || 'Laver le côté gauche', icon: '🚿', description: trans.washLeftSideDesc || 'Versez de l\'eau sur tout le côté gauche de votre corps', repetitions: '3x' },
        { id: 'wash_feet_final', name: trans.washFeet || 'Laver les pieds', icon: '🦶', description: trans.washFeetFinalDesc || 'Enfin, lavez les deux pieds si ce n\'est pas déjà fait pendant le wudhu', repetitions: null }
    ];

    const tayammumSteps = [
        { id: 'intention', name: trans.intention || 'Intention', icon: '💭', description: trans.intentionTayammum || 'Formulez l\'intention de faire le tayammum', repetitions: null },
        { id: 'bismillah', name: trans.sayBismillah || 'Dire Bismillah', icon: '🤲', description: trans.bismillahDesc || 'Commencez en disant "Bismillah" (Au nom d\'Allah)', repetitions: null },
        { id: 'strike_earth', name: trans.strikeEarth || 'Frapper la terre', icon: '🏜️', description: trans.strikeEarthDesc || 'Frappez légèrement la terre (sable propre, terre ou pierre) avec vos deux paumes', repetitions: '1x' },
        { id: 'wipe_face_tayammum', name: trans.wipeFace || 'Essuyer le visage', icon: '😊', description: trans.wipeFaceTayammumDesc || 'Essuyez votre visage avec vos deux paumes de haut en bas', repetitions: '1x' },
        { id: 'wipe_hands', name: trans.wipeHands || 'Essuyer les mains', icon: '🤲', description: trans.wipeHandsDesc || 'Essuyez votre main droite avec votre paume gauche et vice versa jusqu\'aux poignets', repetitions: '1x' }
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
