# Checklist de Test - Migration Architecture Complète

## 1. Fonctionnalités Principales

### Prières (Prayers)
- [ ] L'accueil affiche les 5 prières
- [ ] Clic sur une prière -> Config -> Guidage
- [ ] Le guidage fonctionne (Étapes, Images, Audio)
- [ ] Le mode Scénario (Auto-play) fonctionne

### Paramètres & Outils (Settings)
- [ ] Menu "Outils" affiche 4 entrées (Ablutions, Citadelle, Piliers, Coran)
- [ ] Changement de langue (FR/EN/AR) instantané
- [ ] Changement de Ville/Pays recharge les horaires

### Ablutions & Piliers
- [ ] Guide des Ablutions complet
- [ ] Guide des Piliers complet

## 2. Nouveaux Modules Migrés (Phase 3)

### Citadelle du Musulman (Citadel)
- [ ] Clic sur "Citadelle" dans Outils
- [ ] Affichage de la grille des catégories
- [ ] Clic sur une catégorie (ex: Matin/Soir) -> Liste des invocations
- [ ] Swipe/Clic entre les invocations (Précédent/Suivant)
- [ ] Affichage correct (Arabe / Translittération / Traduction)

### Le Saint Coran (Coran)
- [ ] Clic sur "Coran" dans Outils
- [ ] Chargement de la liste des 114 sourates (API)
- [ ] Clic sur une sourate (ex: Al-Fatiha)
- [ ] Lecteur verset par verset s'affiche
- [ ] Navigation entre les versets

### Onboarding (Premier Lancement)
- [ ] Si local storage vide : Modale s'affiche au démarrage
- [ ] Étape 1 : Bienvenue
- [ ] Étape 2 : Info Horaires
- [ ] Étape 3 : Saisie Ville/Pays
- [ ] Bouton "Commencer" ferme la modale et charge les horaires

## 3. Technique & Performance

### Architecture
- [ ] Aucun appel à `window.render()` (Fonction globale supprimée)
- [ ] `app.js` initialise 11 plugins
- [ ] Console propre (Pas d'erreurs rouges au démarrage)

### Réseau
- [ ] Les appels API (Aladhan, AlQuran) sont effectués uniquement quand nécessaire
- [ ] Les fichiers JSON (Citadelle, Piliers) sont chargés à la demande

## 4. Validation Finale
- [ ] L'application est utilisable de A à Z sans recharger la page
- [ ] L'état est conservé (Langue, Ville) après rechargement page
