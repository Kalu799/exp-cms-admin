/*********************************************************************
 * historique.js
 *
 * Gère la page de l'historique des visites.
 *********************************************************************/

import { clearUser, requireAuth } from '../auth/session.js';
import { getFormData } from '../utils/form.js';
import { hide, qs, show, escapeHtml } from '../utils/dom.js';
import { request } from '../api/request.js';

let historique = null

export async function initHistorique() {
  // Si l'utilisateur n'est pas connecté, requireAuth() le renvoie au login.
  if (!requireAuth()) {
    return;
  }
  // On récupère une seule fois les éléments HTML importants.
  const loader = qs('#loader');
  const listing = qs('#listing-historique');

  // On connecte les événements de la page.
  bindSessionActions()

  // On charge les données de départ.
  await renderHistorique(loader, listing);
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

/**
 * Récupère l'historique depuis sessionStorage.
 *
 * @returns {object|null} historique ou null si il n'y en a pas
 */
function getHistorique() {
  const rawHistorique = sessionStorage.getItem("historique");

  // sessionStorage stocke uniquement du texte.
  // JSON.parse transforme le texte JSON en objet JavaScript.
  historique = JSON.parse(rawHistorique);
}

/**
 * Affiche l'historique des visites
 */
async function renderHistorique(loader, container) {
  show(loader);

  getHistorique()

  console.log(historique)

  if (!historique.length) {
    container.innerHTML = '<li>Aucune visite</li>';
    return;
  }

  try {
    const html = await Promise.all(
      historique.map(async function (visite, index) {

        const visiteur = await request(
          `/wp/v2/visiteur/${visite.acf['visite-visiteur']}?_fields=id,title,status,acf`,
          {
            method: 'GET',
          }
        );

        let infos = {}
        let detail = null
        let local = null

        if (visite.acf['visite-type'] == "visite") {
          const newDetail = await request(
            `/wp/v2/personnel/${visite.acf['visite-details']}?_fields=id,title,status,acf`,
            {
              method: 'GET',
            }
          );
          //console.log(newDetail)
          detail = `${newDetail.acf['personnels-nom']} ${newDetail.acf['personnels-prenom']}`
          local = `${newDetail.acf['personnels-local']}`
        }

        if (visite.acf['visite-type'] == "formation") {
          const newDetail = await request(
            `/wp/v2/formation/${visite.acf['visite-details']}?_fields=id,title,status,acf`,
            {
              method: 'GET',
            }
          );
          //console.log(newDetail)
          detail = `${newDetail.acf['formations-intitule']}`
          local = `${newDetail.acf['formations-local']}`
        }

        infos = {
          nomVisiteur: visiteur.acf['visiteurs-nom'],
          prenomVisiteur: visiteur.acf['visiteurs-prenom'],
          type: visite.acf['visite-type'],
          detail: detail,
          local: local,
          date: visite.acf['visite-date'],
          entree: visite.acf['visite-heure_entree'],
          sortie: visite.acf['visite-heure_sortie'],
        };

        return `
        <tr data-id="${visite.id}" data-key="${index}">
          <td>${infos.nomVisiteur}</td>
          <td>${infos.prenomVisiteur}</td>
          <td>${infos.type}</td>
          <td>${infos.detail}</td>
          <td>${infos.local}</td>
          <td>${infos.date}</td>
          <td>${infos.entree}</td>
          <td>${infos.sortie}</td>
        </tr>
      `;
      })
    );

    container.innerHTML += html.join('');
  }

  finally {
    hide(loader);
  }
}