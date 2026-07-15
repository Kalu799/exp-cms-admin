/*********************************************************************
 * session.js
 *
 * Gère la session utilisateur dans le navigateur.
 *
 * Ici, on utilise sessionStorage :
 * - les données restent disponibles tant que l'onglet est ouvert ;
 * - elles disparaissent quand l'onglet est fermé.
 *********************************************************************/

import { request } from '../api/request.js';

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
 * Récupère le role de l'utilisateur connecté
 *
 * @returns {object|null} role ou null si personne n'est connecté.
 */
export async function getRole() {
  const rawRole = await request('/wp/v2/users/me?context=edit&_fields=roles', {method: 'GET',})
  //console.log(rawRole.roles)

  return rawRole.roles[0] ? rawRole.roles[0] : null;
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
export async function requireAuth() {
  if (await !getUser()) {
    // Si personne n'est connecté, retour à la page de login.
    alert("Vous n'êtes pas connecté")
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

/**
 * Protège une page qui nécessite un droit d'admin.
 *
 * @returns {boolean} true si l'utilisateur est connecté, false sinon.
 */
export async function requireAdmin() {
  if (await getRole() != "administrator") {
    // Si personne n'est connecté, retour à la page de visites.
    alert("Vous n'avez pas le role requis")
    window.location.href = 'visites.html';
    return false;
  }

  return true;
}
