/*********************************************************************
 * authApi.js
 *
 * Regroupe les appels API liés à l'authentification.
 *********************************************************************/

import { request } from './request.js';

export const authApi = {
  /**
   * Envoie le login et le mot de passe à WordPress.
   *
   * @param {object} credentials - Objet contenant username et password.
   * @returns {Promise<object>} Réponse de WordPress contenant notamment le token.
   */
  login(credentials) {
    return request('/jwt-auth/v1/token', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};