/*********************************************************************
 * formations.js
 *
 * Gère la page de gestion des formations.
 *********************************************************************/

import { clearUser, requireAuth, requireAdmin } from '../auth/session.js';
import { getFormData } from '../utils/form.js';
import { hide, qs, show, escapeHtml } from '../utils/dom.js';
import { request } from '../api/request.js';

export async function initFormations() {
  // Si l'utilisateur n'est pas connecté, requireAuth() le renvoie au login.
  if (!requireAuth()) {
    return;
  }

  // Si l'utilisateur n'est pas admin, requireAdmin() le renvoie aux visites en cours.
  if (!requireAdmin()) {
    return;
  }

  // On récupère une seule fois les éléments HTML importants.

  // On connecte les événements de la page.
  bindSessionActions()

  // On charge les données de départ.

}

/**
 * Gère le bouton de déconnexion.
 */
function bindSessionActions() {
  const logoutButton = qs('#deconnexion');

  logoutButton.addEventListener('click', function (event) {
    event.preventDefault();

    // On supprime l'utilisateur stocké dans sessionStorage.
    clearUser();

    // On retourne à la page de connexion.
    window.location.href = 'index.html';
  });
}