/*********************************************************************
 * personnelsApi.js
 *
 * Regroupe les appels API liés aux personnels.
 *********************************************************************/

import { request } from './request.js';

export const personnelsApi = {
  /**
   * Récupère tous le membres du personnel.
   */
  getAll() {
    return request('/wp/v2/personnel?_fields=id,title,status,acf,personnel-fonction');
  },

  /**
   * Crée un nouveau membre.
   *
   * @param {object} payload - Données envoyées à WordPress.
   */
  create(payload) {
    return request('/wp/v2/personnel', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Modifie un membre existante.
   *
   * @param {number|string} id - ID WordPress du membre.
   * @param {object} payload - Nouvelles données.
   */
  update(id, payload) {
    return request(`/wp/v2/personnel/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Supprime un membre.
   *
   * @param {number|string} id - ID WordPress du membre.
   */
  delete(id) {
    return request(`/wp/v2/personnel/${id}`, {
      method: 'DELETE',
    });
  },
};