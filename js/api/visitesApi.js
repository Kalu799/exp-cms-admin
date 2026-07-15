/*********************************************************************
 * visitesApi.js
 *
 * Regroupe les appels API liés aux visites.
 *********************************************************************/

import { request } from './request.js';

export const visitesApi = {
  /**
   * Récupère toutes les visites.
   */
  getAll() {
    return request('/wp/v2/visite?_fields=id,title,status,acf');
  },
};