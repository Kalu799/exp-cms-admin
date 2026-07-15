/*********************************************************************
 * main.js
 *
 * Point d'entrée du JavaScript.
 *
 * Son rôle est simple :
 * - regarder sur quelle page on se trouve ;
 * - lancer le bon fichier JavaScript.
 *********************************************************************/

import { initIndex } from './pages/index.js';
import { initVisites } from './pages/visites.js';
import { initHistorique } from './pages/historique.js';
//import { initFormations } from './pages/formations.js';
//import { initPersonnels } from './pages/personnels.js';

// Dans le HTML, le body contient par exemple : data-page="index"
// dataset.page permet de récupérer cette valeur.
const page = document.body.dataset.page;

// Si on est sur la page index, on initialise la page index.
if (page === 'index') {
  initIndex();
}

// Si on est sur la page visites, on initialise les visites.
if (page === 'visites') {
  initVisites();
}

// Si on est sur la page historique, on initialise l'historique.
if (page === 'historique') {
  initHistorique();
}

// Si on est sur la page formations, on initialise les formations.
if (page === 'formations') {
  initFormations();
}

// Si on est sur la page personnels, on initialise les personnels.
if (page === 'personnels') {
  initPersonnels();
}