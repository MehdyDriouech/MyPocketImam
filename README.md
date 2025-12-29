# 🕌 My Pocket Imam - Application Complète d'Apprentissage de la Prière

## بسم الله الرحمن الرحيم

Cette application a été développée comme une **sadaqa jariya** (charité continue) pour aider la communauté musulmane à apprendre et pratiquer la prière correctement.

## 📖 À Propos

**My Pocket Imam** est une application web complète et interactive qui guide les utilisateurs à travers toutes les étapes de la pratique islamique avec une architecture modulaire et extensible.

## ✨ Fonctionnalités Actuelles

### 🕌 Prières (Prayers)
- **Guidage complet des 5 prières quotidiennes** avec images et audio
- **Mode scénario automatique** pour un apprentissage fluide
- **Configuration personnalisée** : choix du récitateur, sourate secondaire, avatar
- **Images animées** pour chaque position (debout, inclinaison, prosternation, assis)
- **3 récitateurs disponibles** : Saad El Ghamidi, Abdul Basit, Mishary Rashid
- **7 sourates courantes** incluses (Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas, Al-Kafirun, Al-Asr, Al-Qadr)

### ⏰ Horaires de Prière
- **Horaires automatiques** via l'API Aladhan
- **23 méthodes de calcul** différentes disponibles
- **Localisation personnalisée** (ville et pays)
- **Affichage des 5 prières quotidiennes**

### 💧 Ablutions (Wudu)
- **Guide complet étape par étape** des ablutions
- **Instructions détaillées** avec images
- **Support multilingue**

### 📐 Piliers de la Prière
- **Guide complet** des piliers et conditions de la prière
- **Contenu éducatif** structuré

### 🏰 Citadelle du Musulman (Dhikr/Invocations)
- **Plus de 20 catégories d'invocations** :
  - Matin/Soir
  - Avant/Après les repas
  - Avant/Après les ablutions
  - En entrant/sortant de la mosquée
  - Protection des enfants
  - Voyage
  - Et bien plus...
- **Navigation par swipe** entre les invocations
- **Affichage trilingue** : Arabe, Translittération, Traduction

### 📖 Le Saint Coran
- **Accès à toutes les 114 sourates** via l'API AlQuran
- **Lecteur verset par verset**
- **Navigation intuitive** entre les versets
- **Affichage multilingue** (Arabe, Translittération, Traduction)

### 📅 Calendrier Islamique
- **Calendrier hijri complet**
- **Événements islamiques importants** marqués
- **Conversion grégorien/hijri**

### 📿 Compteur de Dhikr (Tasbih)
- **Presets de dhikr** (Subhanallah, Alhamdulillah, Allahu Akbar, etc.)
- **Compteur personnalisable** avec objectifs
- **Séquences de dhikr** (par exemple : 33x Subhanallah, 33x Alhamdulillah, 33x Allahu Akbar)
- **Historique des sessions**
- **Dhikr personnalisés** créables par l'utilisateur

### 🧭 Direction de la Qibla (Qibla)
- **Détection automatique** de la direction de la Mecque
- **Boussole interactive**
- **Utilisation de la géolocalisation**

### 📚 Exégèse (Tafsir)
- **Accès au tafsir** pour chaque verset du Coran
- **Navigation intégrée** avec le lecteur du Coran

### 🕋 99 Noms d'Allah
- **Liste complète des 99 noms**
- **Mode apprentissage** avec significations
- **Recherche et favoris**
- **Affichage détaillé** avec explications

### 💰 Calcul de la Zakat
- **Calculateur complet** de la zakat
- **Support de différents types** de biens
- **Calculs conformes** aux règles islamiques

### 🌙 Outils Ramadan
- **Duas spéciales** pour le Ramadan
- **Conseils et rappels** pour le mois sacré

### 🎨 Thème Clair/Sombre
- **Support du mode sombre**
- **Préférences sauvegardées**

### 🚀 Onboarding
- **Premier lancement guidé**
- **Configuration initiale** de la localisation
- **Présentation des fonctionnalités**

### 🌍 Multilingue
- **Support complet** : Français, English, العربية, Español, Deutsch, Nederlands, Italiano, हिन्दी, Türkçe
- **Interface RTL** pour l'arabe
- **Traductions complètes** de toutes les fonctionnalités

## 🎯 Objectif

Cette application vise à faciliter l'apprentissage et la pratique de l'islam pour :
- Les nouveaux musulmans
- Les enfants apprenant la prière
- Toute personne souhaitant perfectionner sa pratique
- La communauté musulmane mondiale

## 💻 Installation

1. Clonez ou téléchargez le dépôt
2. Lancez un serveur web local (Apache, Nginx, ou serveur de développement)
3. Placez le contenu du dossier dans le répertoire du serveur
4. Ouvrez `index.html` dans votre navigateur
5. L'application fonctionne également en mode offline pour les fonctionnalités de base

## 🔧 Technologies Utilisées

- **HTML5** - Structure
- **JavaScript (Vanilla ES6+)** - Logique métier
- **CSS3 avec variables CSS** - Styles et thèmes
- **Architecture modulaire** basée sur des plugins
- **API Aladhan** - Horaires de prière
- **API AlQuran** - Versets du Coran
- **API Hadith** (fawazahmed0) - Hadiths du jour

## 🏗️ Architecture Logicielle

### Architecture Modulaire par Plugins

L'application utilise une **architecture modulaire basée sur des plugins** qui respecte les principes SOLID :

- **Open/Closed Principle (OCP)** : Extension sans modification du code existant
- **Dependency Inversion** : Injection de dépendances via le DependencyContainer
- **Separation of Concerns** : Séparation claire entre Engine (logique) et View (présentation)

### Structure du Projet

```
MyPocketImam/
├── index.html                 # Point d'entrée
├── style.css                  # Styles globaux et thème
├── assets/
│   └── lang/                  # Fichiers de traduction (fr.json, en.json, ar.json, etc.)
└── js/
    ├── app.js                 # Configuration principale et initialisation
    └── core/                  # Infrastructure
        ├── state-manager.js           # Gestion de l'état global
        ├── event-bus.js               # Système d'événements
        ├── plugin-manager.js          # Gestionnaire de plugins
        ├── router.js                  # Routage des vues
        ├── view-registry.js           # Registre des vues
        ├── persistence-manager.js     # Sauvegarde/chargement (localStorage)
        ├── dependency-container.js    # Injection de dépendances
        ├── asset-resolver.js          # Résolution des assets
        └── interfaces/                # Interfaces TypeScript-like
            ├── engine-interface.js
            ├── view-interface.js
            └── plugin-interface.js
    └── features/              # Modules fonctionnels (plugins)
        ├── prayers/
        │   ├── engine-prayers.js      # Logique métier
        │   ├── view-prayers.js        # Interface utilisateur
        │   └── assets/                # Images, audio
        ├── ablutions/
        ├── citadel/
        ├── coran/
        ├── tasbih/
        └── ... (chaque fonctionnalité suit le même pattern)
```

### Composants Principaux

#### 1. **Engine (Moteur)**
- Contient toute la **logique métier**
- Implémente l'interface `IEngine` (méthode `init()`)
- Accès aux dépendances via le constructeur : `state`, `eventBus`, `pluginManager`

#### 2. **View (Vue)**
- Contient toute la **logique de présentation**
- Implémente l'interface `IView` (méthode `render(container)`)
- Génère le HTML et gère les interactions utilisateur

#### 3. **Plugin Manager**
- Enregistre et initialise les plugins
- Gère les dépendances entre plugins
- Ordonne l'initialisation selon les dépendances

#### 4. **State Manager**
- Gère l'état global de l'application
- Pattern Observer pour les changements d'état
- Intégration avec le PersistenceManager

#### 5. **Event Bus**
- Système de communication découplé
- Les composants communiquent via des événements
- Pattern Pub/Sub

#### 6. **Router**
- Gère le routage des vues
- Mappe les routes aux plugins correspondants
- Exemple : `'home'` → plugin `'prayers'`

---

## 🤝 Comment Participer au Développement

### Prérequis

- Connaissances de base en JavaScript (ES6+)
- Compréhension du HTML/CSS
- Un éditeur de code (VS Code recommandé)
- Un serveur web local

### Guide : Implémenter une Nouvelle Fonctionnalité

Ce guide vous montre comment ajouter une nouvelle fonctionnalité en suivant l'architecture existante. Nous allons créer un exemple : un **module de récitations de Adhan (Appel à la prière)**.

#### Étape 1 : Créer la Structure de Fichiers

Créez un nouveau dossier dans `js/features/` :

```bash
js/features/adhan/
├── engine-adhan.js
└── view-adhan.js
```

#### Étape 2 : Créer l'Engine (Logique Métier)

```javascript
// js/features/adhan/engine-adhan.js

export class AdhanEngine {
    constructor(dependencies) {
        // Injecter les dépendances nécessaires
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.pluginManager = dependencies.pluginManager;
        
        // État interne
        this.currentAdhan = null;
        this.audio = null;
    }
    
    // Méthode obligatoire : initialisation
    async init() {
        // Initialisation si nécessaire
        // Par exemple : charger des données, configurer des listeners
        console.log('Adhan engine initialized');
    }
    
    // Getter pour accéder facilement aux traductions
    get translations() {
        return this.pluginManager.get('translations')?.engine;
    }
    
    // Méthodes métier
    getAdhanList() {
        return [
            { id: 'fajr', name: 'Fajr', audio: 'assets/audio/adhan-fajr.mp3' },
            { id: 'dhuhr', name: 'Dhuhr', audio: 'assets/audio/adhan-dhuhr.mp3' },
            // ... autres adhans
        ];
    }
    
    playAdhan(adhanId) {
        const adhan = this.getAdhanList().find(a => a.id === adhanId);
        if (adhan && this.audio) {
            this.audio.src = adhan.audio;
            this.audio.play();
        }
    }
    
    stopAdhan() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    }
}
```

#### Étape 3 : Créer la View (Interface Utilisateur)

```javascript
// js/features/adhan/view-adhan.js

export class AdhanView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
    }
    
    // Getter pour les traductions
    get translations() {
        return this.pluginManager.get('translations')?.engine;
    }
    
    // Méthode obligatoire : rendu
    render(container) {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();
        
        // Générer le HTML
        container.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <div class="flex items-center justify-between mb-6">
                    <button data-action="go-home" class="btn-secondary">
                        ${trans.back || 'Retour'}
                    </button>
                    <h1 class="text-2xl font-bold">${trans.adhan || 'Adhan'}</h1>
                    <div></div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this.engine.getAdhanList().map(adhan => `
                        <div class="card">
                            <h3 class="text-xl mb-4">${adhan.name}</h3>
                            <button 
                                data-action="play-adhan" 
                                data-id="${adhan.id}"
                                class="btn-primary w-full"
                            >
                                ${trans.play || 'Jouer'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Attacher les event listeners
        this.attachEventListeners(container);
    }
    
    attachEventListeners(container) {
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            
            switch (action) {
                case 'go-home':
                    // Navigation via state et eventBus
                    this.state.set('currentView', 'home');
                    this.eventBus.emit('view:change', 'home');
                    break;
                    
                case 'play-adhan':
                    const adhanId = target.dataset.id;
                    this.engine.playAdhan(adhanId);
                    break;
            }
        });
    }
}
```

#### Étape 4 : Enregistrer le Plugin dans `app.js`

Ouvrez `js/app.js` et ajoutez :

1. **Import des classes** (en haut du fichier avec les autres imports) :

```javascript
import { AdhanEngine } from './features/adhan/engine-adhan.js';
import { AdhanView } from './features/adhan/view-adhan.js';
```

2. **Ajouter la configuration dans `getPluginConfigurations()`** :

```javascript
getPluginConfigurations() {
    // ... configurations existantes ...
    
    return [
        // ... autres plugins ...
        {
            name: 'adhan',
            engineClass: AdhanEngine,
            viewClass: AdhanView,
            metadata: {
                dependencies: ['translations'],  // Dépendances nécessaires
                routes: ['adhan']                // Route(s) pour ce plugin
            }
        }
    ];
}
```

#### Étape 5 : Ajouter les Traductions

Ajoutez les clés de traduction dans les fichiers JSON correspondants :

**`assets/lang/fr.json`** :
```json
{
  "adhan": "Adhan",
  "play": "Jouer",
  "stop": "Arrêter",
  "adhanTitle": "Appels à la prière"
}
```

**`assets/lang/en.json`** :
```json
{
  "adhan": "Adhan",
  "play": "Play",
  "stop": "Stop",
  "adhanTitle": "Prayer Calls"
}
```

Répétez pour toutes les langues supportées.

#### Étape 6 : Ajouter la Navigation (Optionnel)

Si vous voulez que cette fonctionnalité soit accessible depuis le menu principal, modifiez la vue concernée (par exemple `view-settings.js`) :

```javascript
// Dans view-settings.js, dans la méthode render()
<button data-action="go-adhan" class="tool-button">
    ${trans.adhan || 'Adhan'}
</button>

// Dans attachEventListeners()
case 'go-adhan':
    this.state.set('currentView', 'adhan');
    this.eventBus.emit('view:change', 'adhan');
    break;
```

#### Étape 7 : Tester

1. Rechargez l'application
2. Naviguez vers votre nouvelle fonctionnalité
3. Vérifiez que tout fonctionne correctement
4. Testez avec différentes langues

### Bonnes Pratiques

#### 1. **Utilisation du State Manager**
```javascript
// ✅ BON : Stocker l'état dans le state manager
this.state.set('currentAdhan', adhanId);

// ❌ MAUVAIS : Variable globale
window.currentAdhan = adhanId;
```

#### 2. **Communication via Event Bus**
```javascript
// ✅ BON : Émettre des événements pour la communication
this.eventBus.emit('adhan:played', { adhanId });

// ❌ MAUVAIS : Appels directs entre composants
otherComponent.onAdhanPlayed(adhanId);
```

#### 3. **Accès aux Autres Plugins**
```javascript
// ✅ BON : Via le pluginManager
const audioEngine = this.pluginManager.get('audio')?.engine;
if (audioEngine) {
    audioEngine.play('path/to/audio.mp3');
}

// ❌ MAUVAIS : Import direct
import { AudioEngine } from '../audio/engine-audio.js';
```

#### 4. **Gestion des Traductions**
```javascript
// ✅ BON : Utiliser le translations engine
const trans = this.translations.getAll();
const text = trans.myKey || 'Fallback';

// ❌ MAUVAIS : Hardcoder du texte
const text = 'Mon texte en français';
```

#### 5. **Structure des Routes**
- Utilisez des noms descriptifs : `'adhan'`, `'adhan-list'`, `'adhan-detail'`
- Les routes avec `*` matchent plusieurs variantes : `'prayer*'` matche `'prayer-fajr'`, `'prayer-config'`, etc.

#### 6. **Gestion des Dépendances**
```javascript
// Déclarez toujours vos dépendances dans metadata
{
    name: 'my-feature',
    metadata: {
        dependencies: ['translations', 'audio'],  // Les plugins doivent exister
        routes: ['my-feature']
    }
}

// L'ordre d'initialisation sera automatiquement géré
```

### Patterns d'Architecture

#### Pattern Engine/View
- **Engine** : Logique pure, pas de DOM, réutilisable
- **View** : Présentation uniquement, appelle les méthodes de l'engine

#### Pattern Observer (State Manager)
```javascript
// S'abonner aux changements
this.stateManager.subscribe((key, value) => {
    if (key === 'currentAdhan') {
        this.updateUI(value);
    }
});
```

#### Pattern Pub/Sub (Event Bus)
```javascript
// Émettre un événement
this.eventBus.emit('adhan:finished', { duration: 120 });

// Écouter un événement
this.eventBus.on('adhan:finished', (data) => {
    console.log('Adhan terminé après', data.duration, 'secondes');
});
```

### Checklist pour une Nouvelle Fonctionnalité

- [ ] Structure de fichiers créée (`engine-*.js`, `view-*.js`)
- [ ] Engine implémente `IEngine` avec méthode `init()`
- [ ] View implémente `IView` avec méthode `render(container)`
- [ ] Plugin enregistré dans `app.js`
- [ ] Dépendances déclarées dans `metadata`
- [ ] Routes configurées
- [ ] Traductions ajoutées (toutes les langues)
- [ ] Navigation ajoutée (si nécessaire)
- [ ] Tests effectués (fonctionnel, multilingue, navigation)
- [ ] Code conforme aux bonnes pratiques

### Exemples de Contribution

Voici des idées de fonctionnalités que vous pourriez ajouter :

1. **Module de récitations du Coran** avec différents récitateurs
2. **Calendrier des événements islamiques** avec rappels
3. **Guide du Hajj/Omra** avec étapes détaillées
4. **Module de révision des sourates** avec système de progression
5. **Statistiques de prière** avec graphiques
6. **Mode apprentissage interactif** avec quiz
7. **Intégration avec API de hadiths** pour recherche avancée
8. **Module de conversion de dates** grégorien/hijri amélioré

---

## 📜 Licence et Utilisation

### ✅ AUTORISÉ :
- Utiliser l'application gratuitement
- Modifier le code pour vos besoins personnels
- Partager l'application avec d'autres
- Contribuer à l'amélioration du code
- L'héberger sur votre propre site web

### ❌ INTERDIT :
- **VENDRE** cette application ou une version modifiée
- **COMMERCIALISER** ce projet sous quelque forme que ce soit
- Retirer les mentions de l'auteur original
- Prétendre en être l'auteur original

### 📋 Conditions d'Utilisation

Ce projet est offert comme une **œuvre pour Allah ﷻ** et doit rester **100% gratuit** pour tous. 

Si vous utilisez ou modifiez ce code :
1. Gardez-le gratuit et accessible à tous
2. Mentionnez qu'il s'agit d'une sadaqa jariya
3. N'en tirez aucun profit financier direct
4. Faites du'a pour l'auteur et tous les contributeurs

## 💚 Soutien et Dons

Les dons servent **uniquement** à couvrir les frais d'hébergement. Tout surplus est reversé à des œuvres de charité musulmanes vérifiées.

PayPal : https://www.paypal.com/paypalme/MDRIOUECH

## 🤲 Du'a

Qu'Allah accepte cette œuvre, la rende bénéfique pour la communauté, et en fasse une sadaqa jariya pour tous ceux qui y ont contribué.

اللهم تقبل منا هذا العمل واجعله في ميزان حسناتنا

---

## 👨‍💻 Auteurs Originaux

**Mehdy DRIOUECH & Sanel DRIOUECH**
- Entièrement Vibecodé (Pas merci ChatGPT et la manie de vouloir tout remodifier à chaque release alors que c'est pas nécessaire)
- Créé comme une œuvre pour Allah ﷻ
- Remerciements spéciaux à **fawazahmed0** pour l'API hadith (https://github.com/fawazahmed0/hadith-api)
- Remerciements spéciaux à **quran.com** pour l'API Coran (https://github.com/quran)

## 🌟 Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez améliorer l'application :
- Ajoutez de nouvelles fonctionnalités (voir guide ci-dessus)
- Corrigez des bugs
- Améliorez les traductions
- Ajoutez d'autres récitateurs
- Optimisez les performances
- Améliorez l'accessibilité

Gardez toujours à l'esprit que ce projet doit rester gratuit et accessible à tous.

### Workflow de Contribution

1. **Fork** le projet
2. **Créez une branche** pour votre fonctionnalité (`git checkout -b feature/ma-nouvelle-fonctionnalite`)
3. **Commitez** vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
4. **Pushez** vers la branche (`git push origin feature/ma-nouvelle-fonctionnalite`)
5. **Ouvrez une Pull Request**

---

## 📞 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

**"Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne"** - Prophète Muhammad ﷺ

**جزاكم الله خيرا** - Qu'Allah vous récompense en bien
