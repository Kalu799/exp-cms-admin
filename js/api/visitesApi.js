/*********************************************************************
 * visitesApi.js
 *
 * Regroupe les appels API liés aux visites.
 *********************************************************************/

import { request } from './request.js';

export const visitesApi = {
  /**
   * Récupère toutes les visites.
   *
   * Dans ce projet, les contacts sont ensuite filtrés côté JavaScript
   * pour afficher ceux qui sont liés à l'entreprise sélectionnée.
   */
  getAll() {
    return request('/wp/v2/visite?_fields=id,title,status,acf');
  },
};