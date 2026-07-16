/*********************************************************************
 * formations.js
 *
 * Gère la page de gestion des formations.
 *********************************************************************/

import { clearUser, requireAuth, requireAdmin } from '../auth/session.js';
import { getFormData } from '../utils/form.js';
import { hide, qs, show, escapeHtml } from '../utils/dom.js';
import { request } from '../api/request.js';
import { formationsApi } from '../api/formationsApi.js';

let formations = null
let formateurs = []
let personnels = null

export async function initFormations() {
  // Si l'utilisateur n'est pas connecté, requireAuth() le renvoie au login.
  if (!requireAuth()) {
    return;
  }

  // Si l'utilisateur n'est pas admin, requireAdmin() le renvoie aux visites en cours.
  if (!requireAdmin()) {
    return;
  }

  // On récupère une seule fois les éléments HTML importants.
  const loader = qs('#loader');
  const listing = qs('#listing-formations');
  const listingFormateurs = document.querySelectorAll('.formations-formateur');
  const addForm = qs('#formations-form_add');
  const editForm = qs('#formations-form_edit');
  const cancelBtn = qs('.cancel-btn')

  // On connecte les événements de la page.
  bindSessionActions()
  bindCreateForm(addForm, loader, listing)
  bindDetailActions(listing, editForm, addForm, loader)
  bindEditForm(editForm, addForm, loader, listing, cancelBtn)

  // On charge les données de départ.
  await renderFormations(loader, listing)
  await optionFormateurs(listingFormateurs[1])
  await optionFormateurs(listingFormateurs[0])
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
 * Gère les boutons du détail : supprimer et modifier.
 */
function bindDetailActions(listing, editForm, addForm, loader) {
  listing.addEventListener('click', async function (event) {
    event.preventDefault()
    const deleteButton = event.target.closest('#delete');
    const editButton = event.target.closest('#edit');

    if (deleteButton) {
      await deleteFormation(deleteButton, listing, loader);
    }

    if (editButton) {
      //console.log('click edit')
      const index = Number(editButton.dataset.key);
      const formation = formations[index];

      // On pré-remplit le formulaire de modification.
      fillFormationForm(editForm, formation, index);

      hide(addForm)
      show(editForm)
    }
  });
}

/**
 * Remplit le formulaire de modification avec les données existantes.
 *
 * @param {HTMLFormElement} form - Formulaire de modification.
 * @param {object} entreprise - Formation à modifier.
 * @param {number} index - Position de la formation dans le tableau.
 */
export function fillFormationForm(form, formation, index) {
  const acf = formation.acf || {};
  const date = acf['formations-date']

  // On sépare le jour, le mois et l'année
  const [jour, mois, annee] = date.split('/');

  // On réassemble au format ISO
  const dateISO = `${annee}-${mois}-${jour}`;

  form.elements['formations-intitule'].value = acf['formations-intitule'] || '';
  form.elements['formations-date'].value = dateISO || '';
  form.elements['formations-local'].value = acf['formations-local'] || '';
  form.elements['formations-formateur'].value = acf['formations-formateur'][0].ID || '';

  // Champs cachés utiles au moment de sauvegarder.
  form.elements.id.value = formation.id;
  form.elements.key.value = index;
}

/**
 * Gère le formulaire de modification d'une entreprise.
 */
function bindEditForm(editForm, addForm, loader, listing, cancelBtn) {
  editForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    show(loader);

    try {
      // Données du formulaire de modification.
      const formData = getFormData(editForm);

      // Objet final envoyé à WordPress.
      const payload = buildFormationPayload(formData);

      // Modification dans WordPress.
      await formationsApi.update(formData.id, payload);

      // Mise à jour de l'affichage.
      renderFormations(loader, listing);

      editForm.reset();
      hide(editForm)
      show(addForm)

    } catch (error) {
      alert(error.message || 'Impossible de modifier cette formation.');

    } finally {
      hide(loader);
    }
  });

  cancelBtn.addEventListener('click', async function (event) {
    event.preventDefault();
    //console.log('cancel')
    editForm.reset();
    hide(editForm)
    show(addForm)
  })
}

/**
 * Gère l'affichage des formateurs dans le select.
 */
async function optionFormateurs(container) {

  if(personnels === null) {
    personnels = await request(
    `/wp/v2/personnel/?_fields=id,title,personnel-fonction,acf`,
    {
      method: 'GET',
    }
  );

  // On check pour récupérer uniquement les formateurs
  personnels.forEach((personne) => {
    //console.log(personne['personnel-fonction'][0])
    if (personne['personnel-fonction'][0] === 6) {
      //console.log(formateurs)
      formateurs.push(personne)
    }
  });
  }

  //console.log(formations)

  if (!formateurs.length) {
    container.innerHTML = '<li>Aucun formateurs</li>';
    return;
  }

  try {
    const html = await Promise.all(
      formateurs.map(async function (formateur, index) {

        //console.log(formation)

        let infos = {}

        infos = {
          formateurNom: formateur.acf['personnels-nom'],
          formateurPrenom: formateur.acf['personnels-prenom'],
          formateurId: formateur.id,
        };

        return `
        <option value="${infos.formateurId}" data-key="${index}">${infos.formateurNom} ${infos.formateurPrenom}</option>
      `;
      })
    );

    container.innerHTML += html.join('');
  }
  catch (error) {
    alert(error.message || 'Impossible de charger les formateurs.');
  }
}

/**
 * Va chercher les formations depuis WordPress.
 */
async function getFormations() {
  try {
    // Appel GET vers /wp/v2/formation.
    formations = await formationsApi.getAll();
  }
  catch (error) {
    alert(error.message || 'Impossible de charger les formations.');
  }
}

/**
 * Gère l'affichage des formations.
 */
async function renderFormations(loader, container) {
  show(loader);

  await getFormations()

  //console.log(formations)

  if (!formations.length) {
    container.innerHTML = '<li>Aucune formation</li>';
    return;
  }

  try {
    const html = await Promise.all(
      formations.map(async function (formation, index) {

        //console.log(formation)

        const formateur = await request(
          `/wp/v2/personnel/${formation.acf['formations-formateur'][0].ID}?_fields=id,title,personnel-fonction,acf`,
          {
            method: 'GET',
          }
        );

        let infos = {}

        infos = {
          intitule: formation.acf['formations-intitule'],
          date: formation.acf['formations-date'],
          local: formation.acf['formations-local'],
          formateurNom: formateur.acf['personnels-nom'],
          formateurPrenom: formateur.acf['personnels-prenom'],
        };

        return `
        <tr>
          <td>${infos.intitule}</td>
          <td>${infos.date}</td>
          <td>${infos.local}</td>
          <td>${infos.formateurNom} ${infos.formateurPrenom}</td>
          <td>
            <a href="" data-key="${index}" id="edit">Edit</a>
            <a href="" data-id="${formation.id}" id="delete">Delete</a>
          </td>
        </tr>
      `;
      })
    );

    container.innerHTML = html.join('');
  }

  finally {
    hide(loader);
  }
}

/**
 * Gère le formulaire d'ajout d'une entreprise.
 */
function bindCreateForm(form, loader, listing) {
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    show(loader);

    try {
      // 1. Récupérer les données du formulaire.
      const formData = getFormData(form);

      // 2. Construire l'objet attendu par WordPress.
      const payload = buildFormationPayload(formData);

      // 3. Créer l'entreprise dans WordPress.
      const formation = await formationsApi.create(payload);

      // 4. Ajouter l'entreprise dans notre état local.
      formations.push(formation);

      // 5. Mettre à jour la liste à l'écran.
      renderFormations(loader, listing);

      // 6. Nettoyer le formulaire et fermer la modale.
      form.reset();

    } catch (error) {
      alert(error.message || 'Impossible de créer cette formation.');

    } finally {
      hide(loader);
    }
  });
}

/**
 * Prépare les données attendues par WordPress pour créer ou modifier
 * une formation.
 *
 * @param {object} formData - Données venant du formulaire.
 * @returns {object} Objet compatible avec l'API REST WordPress.
 */
export function buildFormationPayload(formData) {
  const payload = {
    // title est le titre natif de WordPress.
    title: formData['formations-intitule'],

    // publish signifie que le contenu est publié directement.
    status: 'publish',

    // fields correspond aux champs ACF.
    fields: { ...formData },
  };

  // Ces champs servent uniquement côté front.
  // On ne veut pas les envoyer dans les champs ACF.
  delete payload.fields.id;
  delete payload.fields.key;

  return payload;
}

/**
 * Supprime une formation.
 */
async function deleteFormation(button, listing, loader) {
  const id = button.dataset.id;
  const index = Number(button.dataset.key);

  // confirm renvoie true si l'utilisateur clique sur OK.
  const userConfirmed = confirm('Voulez-vous vraiment supprimer cette formation ?');

  if (!userConfirmed) {
    return;
  }

  show(loader);

  try {
    // Suppression dans WordPress.
    await formationsApi.delete(id);

    // Mise à jour de la liste.
    renderFormations(loader, listing);

  } catch (error) {
    alert(error.message || 'Impossible de supprimer cette formation.');

  } finally {
    hide(loader);
  }
}