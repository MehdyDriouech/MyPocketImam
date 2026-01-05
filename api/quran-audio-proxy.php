<?php
/**
 * Backend PHP sécurisé pour l'API Quran Foundation
 * Gère l'authentification OAuth2 et les requêtes à l'API
 * Les credentials sont stockés dans .env et ne sont jamais exposés au client
 */

// Désactiver l'affichage des erreurs pour éviter le HTML dans la réponse
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Définir les headers JSON en premier pour éviter tout output HTML
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Fonction pour retourner une erreur JSON
function returnJsonError($message, $code = 500, $details = null) {
    http_response_code($code);
    $response = ['error' => $message, 'success' => false];
    if ($details !== null) {
        $response['details'] = $details;
    }
    echo json_encode($response);
    exit;
}

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Gestionnaire d'erreur global pour capturer toutes les erreurs PHP
set_error_handler(function($severity, $message, $file, $line) {
    // Convertir les erreurs en exceptions pour qu'elles soient capturées par le try-catch
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Gestionnaire d'exception pour les erreurs fatales
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        returnJsonError('Fatal error: ' . $error['message'], 500, [
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
    }
});

// Charger les variables d'environnement depuis .env
function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        return false;
    }
    
    if (!is_readable($filePath)) {
        return false;
    }
    
    $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return false;
    }
    
    foreach ($lines as $line) {
        $line = trim($line);
        // Ignorer les lignes vides et les commentaires
        if (empty($line) || strpos($line, '#') === 0) {
            continue;
        }
        
        // Parser les variables
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Supprimer les guillemets si présents
            $value = trim($value, '"\'');
            if (!empty($key)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
    return true;
}

try {
    // Charger le fichier .env (depuis la racine du projet)
    $envPath = dirname(__DIR__) . '/.env';
    
    if (!file_exists($envPath)) {
        returnJsonError('Configuration error: .env file not found', 500, [
            'path' => $envPath,
            'current_dir' => __DIR__,
            'parent_dir' => dirname(__DIR__)
        ]);
    }

    if (!is_readable($envPath)) {
        returnJsonError('Configuration error: .env file is not readable', 500, ['path' => $envPath]);
    }

    if (!loadEnv($envPath)) {
        returnJsonError('Configuration error: Failed to load .env file', 500, ['path' => $envPath]);
    }

    // Récupérer les variables d'environnement
    $clientId = $_ENV['QURAN_CLIENT_ID'] ?? getenv('QURAN_CLIENT_ID');
    $clientSecret = $_ENV['QURAN_CLIENT_SECRET'] ?? getenv('QURAN_CLIENT_SECRET');
    $oauthEndpoint = $_ENV['QURAN_OAUTH_ENDPOINT'] ?? getenv('QURAN_OAUTH_ENDPOINT') ?: 'https://oauth2.quran.foundation/oauth2/token';
    $apiBaseUrl = $_ENV['QURAN_API_BASE_URL'] ?? getenv('QURAN_API_BASE_URL') ?: 'https://apis.quran.foundation';

    // Vérifier que les credentials sont configurés
    if (empty($clientId) || empty($clientSecret)) {
        returnJsonError('Configuration error: Missing credentials', 500, [
            'clientId_set' => !empty($clientId),
            'clientSecret_set' => !empty($clientSecret),
            'env_vars' => [
                'QURAN_CLIENT_ID' => isset($_ENV['QURAN_CLIENT_ID']),
                'QURAN_CLIENT_SECRET' => isset($_ENV['QURAN_CLIENT_SECRET'])
            ]
        ]);
    }

    // Cache du token en session
    if (session_status() === PHP_SESSION_NONE) {
        if (!session_start()) {
            returnJsonError('Session error: Failed to start session', 500);
        }
    }

// Fonction pour obtenir un token d'accès
function getAccessToken($clientId, $clientSecret, $oauthEndpoint) {
    // Vérifier le cache en session
    if (isset($_SESSION['quran_access_token']) && isset($_SESSION['quran_token_expiry'])) {
        if (time() < $_SESSION['quran_token_expiry']) {
            return $_SESSION['quran_access_token'];
        }
    }
    
    // Obtenir un nouveau token
    $credentials = base64_encode("$clientId:$clientSecret");
    
    $ch = curl_init($oauthEndpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded',
            "Authorization: Basic $credentials"
        ],
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials&scope=content',
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL error: $error");
    }
    
    if ($httpCode !== 200) {
        throw new Exception("Authentication failed: HTTP $httpCode");
    }
    
    $data = json_decode($response, true);
    
    if (!isset($data['access_token'])) {
        throw new Exception("No access token in response");
    }
    
    // Mettre en cache le token (valide 1h, on renouvelle 5 min avant)
    $expiresIn = isset($data['expires_in']) ? (int)$data['expires_in'] : 3600;
    $_SESSION['quran_access_token'] = $data['access_token'];
    $_SESSION['quran_token_expiry'] = time() + $expiresIn - 300; // 5 min de marge
    
    return $data['access_token'];
}

// Fonction pour faire une requête authentifiée à l'API
function makeAuthenticatedRequest($url, $clientId, $clientSecret, $oauthEndpoint) {
    $token = getAccessToken($clientId, $clientSecret, $oauthEndpoint);
    
    // Log l'URL pour débogage
    error_log("QuranAudioProxy: Requesting URL: $url");
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "x-auth-token: $token",
            "x-client-id: $clientId",
            "Accept: application/json"
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL error: $error");
    }
    
    // Log la réponse pour débogage
    error_log("QuranAudioProxy: Response HTTP $httpCode for $url");
    
    // Si token expiré, réessayer une fois
    if ($httpCode === 401) {
        unset($_SESSION['quran_access_token']);
        unset($_SESSION['quran_token_expiry']);
        $token = getAccessToken($clientId, $clientSecret, $oauthEndpoint);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "x-auth-token: $token",
                "x-client-id: $clientId",
                "Accept: application/json"
            ],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    }
    
    if ($httpCode !== 200) {
        throw new Exception("API request failed: HTTP $httpCode - URL: $url");
    }
    
    return json_decode($response, true);
}

// Fonction pour faire une requête à l'API publique (sans authentification)
function makePublicRequest($url) {
    error_log("QuranAudioProxy: Public request to: $url");
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Accept: application/json"
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_FOLLOWLOCATION => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("CURL error: $error");
    }
    
    error_log("QuranAudioProxy: Public response HTTP $httpCode");
    
    if ($httpCode !== 200) {
        throw new Exception("Public API request failed: HTTP $httpCode - URL: $url");
    }
    
    return json_decode($response, true);
}

// CDN pour les fichiers audio de versets
define('QURAN_AUDIO_CDN', 'https://verses.quran.com/');

// Fonction pour normaliser une URL audio (ajouter le CDN si URL relative)
function normalizeAudioUrl($url) {
    if (empty($url)) {
        return null;
    }
    
    // Si l'URL commence par http:// ou https://, c'est déjà une URL complète
    if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
        return $url;
    }
    
    // Sinon, ajouter le préfixe CDN
    return QURAN_AUDIO_CDN . ltrim($url, '/');
}

    // Récupérer l'action demandée
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'getToken':
            // Obtenir un token d'accès (pour debug/test uniquement)
            $token = getAccessToken($clientId, $clientSecret, $oauthEndpoint);
            echo json_encode([
                'success' => true,
                'token' => $token,
                'expires_in' => $_SESSION['quran_token_expiry'] - time()
            ]);
            break;
            
        case 'debug':
            // Endpoint de debug pour tester l'API publique directement
            $testUrl = "https://api.quran.com/api/v4/recitations/1/by_ayah/1:1";
            try {
                $data = makePublicRequest($testUrl);
                
                // Extraire et normaliser l'URL audio
                $rawUrl = $data['audio_files'][0]['url'] ?? null;
                $normalizedUrl = normalizeAudioUrl($rawUrl);
                
                echo json_encode([
                    'success' => true,
                    'test_url' => $testUrl,
                    'raw_audio_url' => $rawUrl,
                    'normalized_audio_url' => $normalizedUrl,
                    'cdn_base' => QURAN_AUDIO_CDN,
                    'response' => $data
                ]);
            } catch (Exception $e) {
                echo json_encode([
                    'success' => false,
                    'test_url' => $testUrl,
                    'error' => $e->getMessage()
                ]);
            }
            break;
            
        case 'getRecitations':
            // Liste des récitations disponibles - utiliser l'API publique
            $publicApiUrl = 'https://api.quran.com/api/v4/resources/recitations';
            $data = makePublicRequest($publicApiUrl);
            
            // Formater les données pour faciliter l'affichage dans un dropdown
            $recitations = [];
            if (isset($data['recitations']) && is_array($data['recitations'])) {
                foreach ($data['recitations'] as $recitation) {
                    $name = $recitation['reciter_name'] ?? 'Unknown';
                    $style = $recitation['style'] ?? null;
                    
                    // Ajouter le style au nom si présent
                    $displayName = $style ? "$name ($style)" : $name;
                    
                    $recitations[] = [
                        'id' => $recitation['id'],
                        'name' => $name,
                        'style' => $style,
                        'displayName' => $displayName
                    ];
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => $recitations,
                'count' => count($recitations)
            ]);
            break;
            
        case 'getVerseAudio':
            // URL audio pour un verset spécifique
            $surah = isset($_GET['surah']) ? (int)$_GET['surah'] : 0;
            $ayah = isset($_GET['ayah']) ? (int)$_GET['ayah'] : 0;
            $recitation = isset($_GET['recitation']) ? (int)$_GET['recitation'] : 1;
            
            if ($surah < 1 || $surah > 114 || $ayah < 1) {
                throw new Exception("Invalid surah or ayah number");
            }
            
            $verseKey = "$surah:$ayah";
            
            // Utiliser l'API publique: https://api.quran.com/api/v4/recitations/{id}/by_ayah/{verse_key}
            $publicApiUrl = "https://api.quran.com/api/v4/recitations/$recitation/by_ayah/$verseKey";
            $data = makePublicRequest($publicApiUrl);
            
            // Chercher le verset spécifique dans la réponse
            $audioUrl = null;
            if (isset($data['audio_files']) && is_array($data['audio_files'])) {
                foreach ($data['audio_files'] as $audioFile) {
                    // Vérifier par verse_key (format "surah:ayah")
                    if (isset($audioFile['verse_key']) && $audioFile['verse_key'] === $verseKey) {
                        $audioUrl = $audioFile['url'] ?? $audioFile['audio_url'] ?? null;
                        break;
                    }
                    // Vérifier aussi par verse_number ou ayah_number
                    $fileAyah = $audioFile['verse_number'] ?? $audioFile['ayah_number'] ?? null;
                    if ($fileAyah !== null && (int)$fileAyah === $ayah) {
                        $audioUrl = $audioFile['url'] ?? $audioFile['audio_url'] ?? null;
                        break;
                    }
                }
            }
            
            if (!$audioUrl) {
                throw new Exception("No audio URL found for verse $verseKey");
            }
            
            // Normaliser l'URL (ajouter le CDN si nécessaire)
            $audioUrl = normalizeAudioUrl($audioUrl);
            
            echo json_encode([
                'success' => true,
                'audioUrl' => $audioUrl,
                'verseKey' => $verseKey
            ]);
            break;
            
        case 'getSurahAudio':
            // URL audio pour une sourate complète
            $surah = isset($_GET['surah']) ? (int)$_GET['surah'] : 0;
            $recitation = isset($_GET['recitation']) ? (int)$_GET['recitation'] : 1;
            
            if ($surah < 1 || $surah > 114) {
                throw new Exception("Invalid surah number");
            }
            
            // Utiliser l'API publique: https://api.quran.com/api/v4/chapter_recitations/{recitation_id}/{chapter_number}
            $publicApiUrl = "https://api.quran.com/api/v4/chapter_recitations/$recitation/$surah";
            $data = makePublicRequest($publicApiUrl);
            
            // Extraire l'URL audio du chapitre complet
            $audioUrl = null;
            
            // Format attendu: { "audio_file": { "audio_url": "..." } }
            if (isset($data['audio_file'])) {
                if (is_array($data['audio_file'])) {
                    $audioUrl = $data['audio_file']['audio_url'] ?? $data['audio_file']['url'] ?? null;
                } else {
                    $audioUrl = $data['audio_file'];
                }
            } elseif (isset($data['audio_url'])) {
                $audioUrl = $data['audio_url'];
            } elseif (isset($data['url'])) {
                $audioUrl = $data['url'];
            }
            
            if (!$audioUrl) {
                throw new Exception("No audio URL found for surah $surah");
            }
            
            // Normaliser l'URL (ajouter le CDN si nécessaire)
            $audioUrl = normalizeAudioUrl($audioUrl);
            
            echo json_encode([
                'success' => true,
                'audioUrl' => $audioUrl,
                'surah' => $surah
            ]);
            break;
            
        case 'getSurahVersesAudio':
            // Tous les fichiers audio d'une sourate (un par verset)
            $surah = isset($_GET['surah']) ? (int)$_GET['surah'] : 0;
            $recitation = isset($_GET['recitation']) ? (int)$_GET['recitation'] : 1;
            
            if ($surah < 1 || $surah > 114) {
                throw new Exception("Invalid surah number");
            }
            
            // Utiliser l'API publique: https://api.quran.com/api/v4/recitations/{id}/by_chapter/{chapter}
            $publicApiUrl = "https://api.quran.com/api/v4/recitations/$recitation/by_chapter/$surah";
            $data = makePublicRequest($publicApiUrl);
            
            // Retourner tous les fichiers audio avec URLs normalisées
            $audioFiles = [];
            if (isset($data['audio_files']) && is_array($data['audio_files'])) {
                foreach ($data['audio_files'] as $audioFile) {
                    $url = $audioFile['url'] ?? $audioFile['audio_url'] ?? null;
                    $audioFiles[] = [
                        'verse_key' => $audioFile['verse_key'] ?? null,
                        'verse_number' => $audioFile['verse_number'] ?? $audioFile['ayah_number'] ?? null,
                        'url' => normalizeAudioUrl($url)
                    ];
                }
            }
            
            if (empty($audioFiles)) {
                throw new Exception("No audio files found for surah $surah");
            }
            
            echo json_encode([
                'success' => true,
                'data' => $audioFiles,
                'surah' => $surah,
                'count' => count($audioFiles)
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    // Toujours retourner du JSON, même en cas d'erreur
    $errorMessage = $e->getMessage();
    $errorFile = $e->getFile();
    $errorLine = $e->getLine();
    
    // Log l'erreur complète côté serveur (pour le débogage)
    error_log("QuranAudioProxy Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    
    // Retourner une erreur JSON structurée
    returnJsonError('An error occurred: ' . $errorMessage, 500, [
        'file' => basename($errorFile),
        'line' => $errorLine,
        'type' => get_class($e)
    ]);
} catch (Error $e) {
    // Capturer aussi les erreurs fatales PHP 7+
    $errorMessage = $e->getMessage();
    $errorFile = $e->getFile();
    $errorLine = $e->getLine();
    
    error_log("QuranAudioProxy Fatal Error: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine());
    
    returnJsonError('Fatal error: ' . $errorMessage, 500, [
        'file' => basename($errorFile),
        'line' => $errorLine,
        'type' => get_class($e)
    ]);
}
?>

