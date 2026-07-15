/*********************************************************************
 * formationsApi.js
 *
 * Regroupe les appels API liés aux formations.
 *********************************************************************/

import { request } from './request.js';

export const formationsApi = {
  /**
   * Récupère toutes les formations.
   */
  getAll() {
    return request('/wp/v2/formation?_fields=id,title,status,acf');
  },

  /**
   * Crée une nouvelle formation.
   *
   * @param {object} payload - Données envoyées à WordPress.
   */
  create(payload) {
    return request('/wp/v2/formation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Modifie une formation existante.
   *
   * @param {number|string} id - ID WordPress de la formation.
   * @param {object} payload - Nouvelles données.
   */
  update(id, payload) {
    return request(`/wp/v2/formation/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Supprime une formation.
   *
   * @param {number|string} id - ID WordPress de la formation.
   */
  delete(id) {
    return request(`/wp/v2/formation/${id}`, {
      method: 'DELETE',
    });
  },
};