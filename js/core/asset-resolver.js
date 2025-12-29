/**
 * AssetResolver - Helper pour résoudre les chemins d'assets de manière centralisée
 * Permet de gérer les chemins relatifs aux features de manière cohérente
 */
class AssetResolver {
  constructor() {
    this.basePath = '';
  }

  /**
   * Obtient le chemin complet d'un asset pour une feature donnée
   * @param {string} featureName - Nom de la feature (ex: 'prayers', 'citadel')
   * @param {string} relativePath - Chemin relatif depuis le dossier assets de la feature
   * @returns {string} - Chemin complet de l'asset
   */
  getAssetPath(featureName, relativePath) {
    // Normaliser le chemin relatif (enlever le slash initial s'il existe)
    const normalizedPath = relativePath.startsWith('/') 
      ? relativePath.substring(1) 
      : relativePath;
    
    return `js/features/${featureName}/assets/${normalizedPath}`;
  }

  /**
   * Obtient le chemin d'une image pour une feature
   * @param {string} featureName - Nom de la feature
   * @param {string} imageName - Nom du fichier image
   * @returns {string} - Chemin complet de l'image
   */
  getImagePath(featureName, imageName) {
    return this.getAssetPath(featureName, `images/${imageName}`);
  }

  /**
   * Obtient le chemin d'un fichier audio pour une feature
   * @param {string} featureName - Nom de la feature
   * @param {string} audioName - Nom du fichier audio
   * @param {string} subfolder - Sous-dossier optionnel (ex: 'guidance', 'surahs')
   * @returns {string} - Chemin complet de l'audio
   */
  getAudioPath(featureName, audioName, subfolder = '') {
    const path = subfolder ? `audio/${subfolder}/${audioName}` : `audio/${audioName}`;
    return this.getAssetPath(featureName, path);
  }

  /**
   * Obtient le chemin d'un fichier data pour une feature
   * @param {string} featureName - Nom de la feature
   * @param {string} dataName - Nom du fichier data
   * @returns {string} - Chemin complet du fichier data
   */
  getDataPath(featureName, dataName) {
    return this.getAssetPath(featureName, `data/${dataName}`);
  }
}

export { AssetResolver };

