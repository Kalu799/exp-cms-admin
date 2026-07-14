/*********************************************************************
 * index.js
 *
 * Gère la page de connexion.
 *********************************************************************/

import { authApi } from '../api/authApi.js';
import { saveUser } from '../auth/session.js';
import { getFormData } from '../utils/form.js';
import { hide, qs, show } from '../utils/dom.js';

/**
 * Initialise la page de connexion.
 *
 * Cette fonction est appelée par main.js uniquement sur index.html.
 */
export function initIndex() {
  // On récupère les éléments HTML dont on a besoin.
  const loader = qs('#loader');
  const loginForm = qs('#login-form');

  // On écoute la soumission du formulaire.
  loginForm.addEventListener('submit', async function (event) {
    // Empêche le navigateur de recharger la page.
    event.preventDefault();

    // On affiche le loader pendant la requête.
    show(loader);

    try {
      // On transforme le formulaire en objet :
      // { username: "...", password: "..." }
      const credentials = getFormData(loginForm);

      // On envoie les identifiants à WordPress.
      const data = await authApi.login(credentials);

      // Si WordPress ne renvoie pas de token, la connexion a échoué.
      if (!data.token) {
        throw new Error('Login ou mot de passe incorrect.');
      }

      // On garde seulement les informations utiles dans la session.
      saveUser({
        token: data.token,
        email: data.user_email,
        name: data.user_display_name,
      });

      // Connexion réussie : direction le backoffice.
      window.location.href = 'visites.html';

    } catch (error) {
      // En cas d'erreur, on affiche un message simple.
      alert(error.message || 'Erreur de connexion.');

    } finally {
      // finally s'exécute toujours, succès ou erreur.
      hide(loader);
    }
  });
}
