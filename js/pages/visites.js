/*********************************************************************
 * visites.js
 *
 * Gère la page de visites en cours.
 *********************************************************************/

import { visitesApi } from '../api/visitesApi.js';
import { clearUser, requireAuth } from '../auth/session.js';
import { getFormData } from '../utils/form.js';
import { hide, qs, show, escapeHtml } from '../utils/dom.js';
import { request } from '../api/request.js';

const state = {
  visites: [],
  enCours: [],
  historique: [],
};

export async function initVisites() {
  // Si l'utilisateur n'est pas connecté, requireAuth() le renvoie au login.
  if (!requireAuth()) {
    return;
  }

  // On récupère une seule fois les éléments HTML importants.
  const loader = qs('#loader');
  const listing = qs('#listing-visites_en_cours');

  // On connecte les événements de la page.
  bindSessionActions()

  // On charge les données de départ.
  await loadVisites(loader, listing);
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
 * Charge la liste des visites depuis WordPress.
 */
async function loadVisites(loader, listing) {
  show(loader);

  try {
    // Appel GET vers /wp/v2/entreprises.
    state.visites = await visitesApi.getAll();

    state.enCours = []
    state.historique = []

    let date = new Date().toLocaleDateString()
    //console.log(date)

    // On check pour les visites en cours
    state.visites.forEach((visite) => {
      // On check pour les visites en cours
      if(visite.acf['visite-status'] === true && visite.acf['visite-date'] === date) {
        state.enCours.push(visite)
      }
      // On check pour les visites terminées
      if(visite.acf['visite-status'] === false) {
        state.historique.push(visite)
      }
    });

    //console.log("enCours : " + JSON.stringify(state.enCours))
    //console.log("historique : " + JSON.stringify(state.historique))

    // met l'historique dans visites dans sessionStorage pour pouvoir les récup sur la page "historique"
    sessionStorage.setItem("historique", JSON.stringify(state.historique));




    // Affichage dans la colonne de gauche.
    await renderVisitesList(listing, state.enCours);

  } catch (error) {
    alert(error.message || 'Impossible de charger les visites.');

  } finally {
    hide(loader);
  }
}

/**
 * Affiche la liste des visites
 */
async function renderVisitesList(container, visites) {
  if (!visites.length) {
    container.innerHTML = '<li>Aucune visite</li>';
    return;
  }

  const html = await Promise.all(
    visites.map(async function (visite, index) {

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
        </tr>
      `;
    })
  );

  container.innerHTML += html.join('');

}