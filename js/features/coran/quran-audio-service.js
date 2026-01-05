/**
 * Gestionnaire de cache audio avec IndexedDB
 * Permet de stocker les fichiers audio localement pour une utilisation hors-ligne
 */
export class AudioCacheManager {
  constructor() {
    this.dbName = 'QuranAudioCache';
    this.dbVersion = 1;
    this.storeName = 'audioFiles';
    this.metaStoreName = 'metadata';
    this.db = null;
    this.initPromise = null;
  }

  /**
   * Initialise la base de données IndexedDB
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('AudioCacheManager: Failed to open IndexedDB', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('AudioCacheManager: IndexedDB initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store pour les fichiers audio (Blob)
        if (!db.objectStoreNames.contains(this.storeName)) {
          const audioStore = db.createObjectStore(this.storeName, { keyPath: 'key' });
          audioStore.createIndex('surah', 'surah', { unique: false });
          audioStore.createIndex('reciter', 'reciter', { unique: false });
        }
        
        // Store pour les métadonnées (sourates téléchargées, etc.)
        if (!db.objectStoreNames.contains(this.metaStoreName)) {
          db.createObjectStore(this.metaStoreName, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Génère une clé de cache unique
   */
  _getCacheKey(surah, ayah, reciterId) {
    return `audio_${surah}_${ayah}_${reciterId}`;
  }

  /**
   * Vérifie si un fichier audio est en cache
   */
  async hasAudio(surah, ayah, reciterId) {
    await this.init();
    const key = this._getCacheKey(surah, ayah, reciterId);
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });
  }

  /**
   * Récupère un fichier audio du cache
   * @returns {Promise<Blob|null>} Le Blob audio ou null si non trouvé
   */
  async getAudio(surah, ayah, reciterId) {
    await this.init();
    const key = this._getCacheKey(surah, ayah, reciterId);
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Stocke un fichier audio dans le cache
   */
  async saveAudio(surah, ayah, reciterId, blob, url) {
    await this.init();
    const key = this._getCacheKey(surah, ayah, reciterId);
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const data = {
        key,
        surah,
        ayah,
        reciter: reciterId,
        blob,
        url,
        timestamp: Date.now()
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Télécharge et met en cache un fichier audio depuis une URL
   */
  async downloadAndCache(surah, ayah, reciterId, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      await this.saveAudio(surah, ayah, reciterId, blob, url);
      
      return blob;
    } catch (error) {
      console.error('AudioCacheManager: Download failed', error);
      throw error;
    }
  }

  /**
   * Vérifie si une sourate complète est en cache
   */
  async isSurahCached(surah, reciterId, totalAyahs) {
    await this.init();
    const metaKey = `surah_cached_${surah}_${reciterId}`;
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.metaStoreName], 'readonly');
      const store = transaction.objectStore(this.metaStoreName);
      const request = store.get(metaKey);
      
      request.onsuccess = () => {
        const meta = request.result;
        if (meta && meta.totalAyahs === totalAyahs && meta.downloadedAyahs === totalAyahs) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      request.onerror = () => resolve(false);
    });
  }

  /**
   * Marque une sourate comme complètement téléchargée
   */
  async markSurahCached(surah, reciterId, totalAyahs) {
    await this.init();
    const metaKey = `surah_cached_${surah}_${reciterId}`;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.metaStoreName], 'readwrite');
      const store = transaction.objectStore(this.metaStoreName);
      
      const data = {
        key: metaKey,
        surah,
        reciter: reciterId,
        totalAyahs,
        downloadedAyahs: totalAyahs,
        timestamp: Date.now()
      };
      
      const request = store.put(data);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Supprime le cache d'une sourate
   */
  async clearSurahCache(surah, reciterId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName, this.metaStoreName], 'readwrite');
      const audioStore = transaction.objectStore(this.storeName);
      const metaStore = transaction.objectStore(this.metaStoreName);
      
      // Supprimer les fichiers audio
      const index = audioStore.index('surah');
      const request = index.openCursor(IDBKeyRange.only(surah));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.reciter === reciterId) {
            audioStore.delete(cursor.value.key);
          }
          cursor.continue();
        }
      };
      
      // Supprimer les métadonnées
      const metaKey = `surah_cached_${surah}_${reciterId}`;
      metaStore.delete(metaKey);
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Récupère la liste des sourates en cache
   */
  async getCachedSurahs() {
    await this.init();
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.metaStoreName], 'readonly');
      const store = transaction.objectStore(this.metaStoreName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const cached = (request.result || [])
          .filter(item => item.key.startsWith('surah_cached_'))
          .map(item => ({
            surah: item.surah,
            reciter: item.reciter,
            totalAyahs: item.totalAyahs
          }));
        resolve(cached);
      };
      request.onerror = () => resolve([]);
    });
  }

  /**
   * Calcule l'espace utilisé par le cache
   */
  async getCacheSize() {
    await this.init();
    
    return new Promise((resolve) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        let totalSize = 0;
        (request.result || []).forEach(item => {
          if (item.blob) {
            totalSize += item.blob.size;
          }
        });
        resolve(totalSize);
      };
      request.onerror = () => resolve(0);
    });
  }

  /**
   * Vide tout le cache
   */
  async clearAll() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName, this.metaStoreName], 'readwrite');
      
      transaction.objectStore(this.storeName).clear();
      transaction.objectStore(this.metaStoreName).clear();
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

/**
 * Service pour la récupération des fichiers audio
 * depuis l'API Quran Foundation via le backend PHP sécurisé
 * Les credentials sont gérés côté serveur et ne sont jamais exposés
 */
export class QuranAudioService {
  constructor() {
    // URL du backend PHP (proxy sécurisé)
    this.proxyUrl = 'api/quran-audio-proxy.php';
    
    // Cache pour les URLs audio
    this.audioUrlCache = new Map();
    
    // Gestionnaire de cache IndexedDB
    this.cacheManager = new AudioCacheManager();
  }

  /**
   * Appelle le backend PHP proxy
   * @private
   */
  async _callProxy(action, params = {}) {
    // Construire l'URL en utilisant le chemin de base de l'application
    // On utilise window.location pour obtenir le chemin de base
    const currentUrl = new URL(window.location.href);
    let basePath = currentUrl.pathname;
    
    // Si le chemin se termine par un nom de fichier (avec extension), on l'enlève
    if (basePath.includes('.')) {
      const lastSlash = basePath.lastIndexOf('/');
      if (lastSlash >= 0) {
        basePath = basePath.substring(0, lastSlash + 1);
      }
    } else if (!basePath.endsWith('/')) {
      basePath += '/';
    }
    
    // Construire le chemin complet du proxy
    const proxyPath = basePath + this.proxyUrl;
    
    // Construire l'URL complète
    const url = new URL(proxyPath, currentUrl.origin);
    url.searchParams.set('action', action);
    
    // Ajouter les paramètres
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key]);
      }
    });
    
    // Debug: afficher l'URL construite (à retirer en production)
    console.log('QuranAudioService: Calling proxy at', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      // Afficher le message d'erreur détaillé du serveur
      const errorMessage = errorData.message || errorData.error || `Proxy request failed: HTTP ${response.status}`;
      console.error('QuranAudioService: Proxy error:', errorData);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Unknown error from proxy');
    }
    
    return data;
  }

  /**
   * Récupère la liste des récitations disponibles
   * @returns {Promise<Array>} Liste des récitations avec {id, name, style, displayName}
   */
  async getRecitations() {
    try {
      const result = await this._callProxy('getRecitations');
      // Le proxy retourne directement le tableau dans result.data
      return result.data || [];
    } catch (error) {
      console.error('QuranAudioService: Error fetching recitations:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL audio pour un verset spécifique
   * @param {number} surahNumber - Numéro de la sourate (1-114)
   * @param {number} ayahNumber - Numéro du verset dans la sourate
   * @param {number} recitationId - ID de la récitation (par défaut: 1)
   * @returns {Promise<string>} URL du fichier audio
   */
  async getVerseAudioUrl(surahNumber, ayahNumber, recitationId = 1) {
    const cacheKey = `verse_${surahNumber}_${ayahNumber}_${recitationId}`;
    
    // Vérifier le cache
    if (this.audioUrlCache.has(cacheKey)) {
      return this.audioUrlCache.get(cacheKey);
    }

    try {
      const result = await this._callProxy('getVerseAudio', {
        surah: surahNumber,
        ayah: ayahNumber,
        recitation: recitationId
      });
      
      const audioUrl = result.audioUrl;
      
      if (!audioUrl) {
        throw new Error('No audio URL found in response');
      }

      // Mettre en cache
      this.audioUrlCache.set(cacheKey, audioUrl);
      
      return audioUrl;
    } catch (error) {
      console.error(`QuranAudioService: Error fetching audio for verse ${surahNumber}:${ayahNumber}:`, error);
      throw error;
    }
  }

  /**
   * Récupère l'URL audio pour une sourate complète
   * @param {number} surahNumber - Numéro de la sourate (1-114)
   * @param {number} recitationId - ID de la récitation (par défaut: 1)
   * @returns {Promise<string>} URL du fichier audio de la sourate complète
   */
  async getSurahAudioUrl(surahNumber, recitationId = 1) {
    const cacheKey = `surah_${surahNumber}_${recitationId}`;
    
    // Vérifier le cache
    if (this.audioUrlCache.has(cacheKey)) {
      return this.audioUrlCache.get(cacheKey);
    }

    try {
      const result = await this._callProxy('getSurahAudio', {
        surah: surahNumber,
        recitation: recitationId
      });
      
      const audioUrl = result.audioUrl;
      
      if (!audioUrl) {
        throw new Error('No audio URL found in response');
      }

      // Mettre en cache
      this.audioUrlCache.set(cacheKey, audioUrl);
      
      return audioUrl;
    } catch (error) {
      console.error(`QuranAudioService: Error fetching audio for surah ${surahNumber}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les fichiers audio pour tous les versets d'une sourate
   * @param {number} surahNumber - Numéro de la sourate (1-114)
   * @param {number} recitationId - ID de la récitation (par défaut: 1)
   * @returns {Promise<Array>} Tableau d'objets {ayahNumber, audioUrl}
   */
  async getSurahVersesAudio(surahNumber, recitationId = 1) {
    const cacheKey = `surah_verses_${surahNumber}_${recitationId}`;
    
    if (this.audioUrlCache.has(cacheKey)) {
      return this.audioUrlCache.get(cacheKey);
    }
    
    try {
      const response = await this._callProxy('getSurahVersesAudio', {
        surah: surahNumber,
        recitation: recitationId
      });
      
      // Le proxy retourne { success: true, data: [...] }
      const audioFiles = response.data || [];
      
      // Transformer les données en format attendu
      const result = audioFiles.map(file => ({
        ayahNumber: file.verse_number || parseInt(file.verse_key?.split(':')[1]) || null,
        audioUrl: file.url
      })).filter(item => item.audioUrl && item.ayahNumber);
      
      this.audioUrlCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`QuranAudioService: Error fetching verses audio for surah ${surahNumber}:`, error);
      throw error;
    }
  }

  /**
   * Vide le cache des URLs audio (mémoire uniquement)
   */
  clearCache() {
    this.audioUrlCache.clear();
  }

  /**
   * Récupère l'audio d'un verset depuis le cache ou le télécharge
   * @param {number} surahNumber - Numéro de la sourate
   * @param {number} ayahNumber - Numéro du verset
   * @param {number} recitationId - ID du récitateur
   * @returns {Promise<string>} URL blob locale ou URL distante
   */
  async getVerseAudioWithCache(surahNumber, ayahNumber, recitationId = 1) {
    // Vérifier le cache IndexedDB d'abord
    const cachedBlob = await this.cacheManager.getAudio(surahNumber, ayahNumber, recitationId);
    
    if (cachedBlob) {
      console.log(`QuranAudioService: Using cached audio for ${surahNumber}:${ayahNumber}`);
      return URL.createObjectURL(cachedBlob);
    }
    
    // Sinon, récupérer l'URL et télécharger
    const audioUrl = await this.getVerseAudioUrl(surahNumber, ayahNumber, recitationId);
    return audioUrl;
  }

  /**
   * Télécharge tous les versets d'une sourate pour utilisation hors-ligne
   * @param {number} surahNumber - Numéro de la sourate
   * @param {number} totalAyahs - Nombre total de versets dans la sourate
   * @param {number} recitationId - ID du récitateur
   * @param {Function} onProgress - Callback de progression (current, total)
   * @returns {Promise<boolean>} Succès du téléchargement
   */
  async downloadSurahForOffline(surahNumber, totalAyahs, recitationId = 1, onProgress = null) {
    try {
      // Récupérer toutes les URLs audio de la sourate
      const versesAudio = await this.getSurahVersesAudio(surahNumber, recitationId);
      
      if (!versesAudio || versesAudio.length === 0) {
        throw new Error('No audio files found for this surah');
      }
      
      let downloaded = 0;
      const total = versesAudio.length;
      
      // Télécharger chaque verset
      for (const verse of versesAudio) {
        // Vérifier si déjà en cache
        const isCached = await this.cacheManager.hasAudio(surahNumber, verse.ayahNumber, recitationId);
        
        if (!isCached) {
          await this.cacheManager.downloadAndCache(
            surahNumber,
            verse.ayahNumber,
            recitationId,
            verse.audioUrl
          );
        }
        
        downloaded++;
        if (onProgress) {
          onProgress(downloaded, total);
        }
      }
      
      // Marquer la sourate comme complètement téléchargée
      await this.cacheManager.markSurahCached(surahNumber, recitationId, total);
      
      return true;
    } catch (error) {
      console.error('QuranAudioService: Error downloading surah', error);
      throw error;
    }
  }

  /**
   * Vérifie si une sourate est disponible hors-ligne
   */
  async isSurahAvailableOffline(surahNumber, recitationId, totalAyahs) {
    return this.cacheManager.isSurahCached(surahNumber, recitationId, totalAyahs);
  }

  /**
   * Supprime le cache d'une sourate
   */
  async deleteSurahCache(surahNumber, recitationId) {
    return this.cacheManager.clearSurahCache(surahNumber, recitationId);
  }

  /**
   * Récupère la liste des sourates en cache
   */
  async getCachedSurahs() {
    return this.cacheManager.getCachedSurahs();
  }

  /**
   * Récupère la taille totale du cache
   */
  async getCacheSize() {
    const bytes = await this.cacheManager.getCacheSize();
    // Convertir en format lisible
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Vide tout le cache IndexedDB
   */
  async clearAllCache() {
    return this.cacheManager.clearAll();
  }
}

