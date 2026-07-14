/*********************************************************************
 * session.js
 *
 * Gère la session utilisateur dans le navigateur.
 *
 * Ici, on utilise sessionStorage :
 * - les données restent disponibles tant que l'onglet est ouvert ;
 * - elles disparaissent quand l'onglet est fermé.
 *********************************************************************/

const STORAGE_KEY = 'user';

/**
 * Récupère l'utilisateur connecté depuis sessionStorage.
 *
 * @returns {object|null} Utilisateur ou null si personne n'est connecté.
 */
export function getUser() {
  const rawUser = sessionStorage.getItem(STORAGE_KEY);

  // sessionStorage stocke uniquement du texte.
  // JSON.parse transforme le texte JSON en objet JavaScript.
  return rawUser ? JSON.parse(rawUser) : null;
}

/**
 * Récupère uniquement le token JWT de l'utilisateur.
 *
 * @returns {string|null} Token ou null.
 */
export function getToken() {
  const user = getUser();

  // Si user existe, on renvoie son token.
  // Sinon, on renvoie null.
  return user?.token ?? null;
}

/**
 * Sauvegarde l'utilisateur connecté.
 *
 * @param {object} user - Données de l'utilisateur.
 */
export function saveUser(user) {
  // JSON.stringify transforme un objet JavaScript en texte JSON.
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

/**
 * Supprime l'utilisateur de la session.
 */
export function clearUser() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Protège une page qui nécessite une connexion.
 *
 * @returns {boolean} true si l'utilisateur est connecté, false sinon.
 */
export function requireAuth() {
  if (!getUser()) {
    // Si personne n'est connecté, retour à la page de login.
    window.location.href = 'index.html';
    return false;
  }

  return true;
}
