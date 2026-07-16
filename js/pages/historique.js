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
let historiqueRecherche = null
let renderedHistorique = null
const historiqueExportData = []

export async function initHistorique() {
  // Si l'utilisateur n'est pas connecté, requireAuth() le renvoie au login.
  if (!requireAuth()) {
    return;
  }

  // On récupère une seule fois les éléments HTML importants.
  const loader = qs('#loader');
  const listing = qs('#listing-historique');
  const historiqueFrom = qs('#historique-form');

  // On connecte les événements de la page.
  bindSessionActions()
  bindExport()
  rechercheHistorique(historiqueFrom, loader, listing)

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
 * Gère le bouton d'export.
 */
function bindExport() {
  const exportButton = qs('#exportBtn');

  exportButton.addEventListener('click', function (event) {
    event.preventDefault();

    // On lance la fonction d'export
    exporterEnCSV(historiqueExportData, "historique.csv");
  });
}

/**
 * Gère l'export.
 * 
 * Généré par IA
 */
function exporterEnCSV(donnees, nomFichier = 'export.csv') {
    // 1. Extraire les en-têtes (keys) et les lignes (values)
    const enAbrege = Object.keys(donnees[0]);
    const lignes = donnees.map(obj => enAbrege.map(key => JSON.stringify(obj[key])).join(','));

    // 2. Fusionner en une seule chaîne CSV
    const csvContenu = [enAbrege.join(','), ...lignes].join('\n');

    // 3. Créer le Blob et le lien de téléchargement
    const blob = new Blob([csvContenu], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    
    lien.setAttribute('href', url);
    lien.setAttribute('download', nomFichier);
    lien.style.visibility = 'hidden';
    
    // 4. Déclencher le téléchargement
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
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

  historiqueExportData.length = 0

  if (historique === null) {
    getHistorique()
  }

  if (historiqueRecherche != null) {
    renderedHistorique = historiqueRecherche
  }
  else {
    renderedHistorique = historique
  }

  //console.log(historique)

  if (!renderedHistorique.length) {
    container.innerHTML = '<li>Aucune visite</li>';
    return;
  }

  try {
    const html = await Promise.all(
      renderedHistorique.map(async function (visite, index) {

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
          type: visite.acf['visite-type'][0],
          detail: detail,
          local: local,
          date: visite.acf['visite-date'],
          entree: visite.acf['visite-heure_entree'],
          sortie: visite.acf['visite-heure_sortie'],
        };

        historiqueExportData.push(infos)

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

    container.innerHTML = html.join('');
  }

  finally {
    hide(loader);
    console.log(historiqueExportData)
  }
}

/**
 * Event pour rechercher dans l'historique avec une date
 */
async function rechercheHistorique(form, loader, listing) {
  form.addEventListener('submit', async function (event) {
    event.preventDefault()

    // On affiche le loader pendant la requête.
    show(loader);

    try {
      const dateForm = new FormData(form);
      const dateRecherchee = Object.fromEntries(dateForm.entries())
      const date = new Date(dateRecherchee['visite-date']).toLocaleDateString('fr-BE');
      
      //console.log(date)
      //console.log(historique)

      if(date === "Invalid Date") {
        historiqueRecherche = null
        await renderHistorique(loader, listing);
        return;
      }

      historiqueRecherche = historique.filter((visite) => visite.acf['visite-date'] === date);

      //console.log(historiqueRecherche)

      await renderHistorique(loader, listing);

    }
    catch (error) {
      // En cas d'erreur, on affiche un message simple.
      alert(error.message || 'Erreur.');
    }
    finally {
      // finally s'exécute toujours, succès ou erreur.
      hide(loader);
    }
  })
}