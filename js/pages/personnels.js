/*********************************************************************
 * personnels.js
 *
 * Gère la page de gestion du personnel.
 *********************************************************************/

import { clearUser, requireAuth, requireAdmin } from '../auth/session.js';
import { getFormData } from '../utils/form.js';
import { hide, qs, show, escapeHtml } from '../utils/dom.js';
import { request } from '../api/request.js';
import { personnelsApi } from '../api/personnelsApi.js';

let personnels = null
let fonctions = null

export async function initPersonnels() {
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
  const listing = qs('#listing-personnels');
  const listingFonctions = document.querySelectorAll('.personnel-fonction');
  const addForm = qs('#personnel-form_add');
  const editForm = qs('#personnel-form_edit');
  const cancelBtn = qs('.cancel-btn')

  // On connecte les événements de la page.
  bindSessionActions()
  bindCreateForm(addForm, loader, listing)
  bindDetailActions(listing, editForm, addForm, loader)
  bindEditForm(editForm, addForm, loader, listing, cancelBtn)

  // On charge les données de départ.
  await renderPersonnels(loader, listing)
  await optionFonctions(listingFonctions[0])
  await optionFonctions(listingFonctions[1])

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
      await deletePersonnel(deleteButton, listing, loader);
    }

    if (editButton) {
      //console.log('click edit')
      const index = Number(editButton.dataset.key);
      const personnel = personnels[index];

      // On pré-remplit le formulaire de modification.
      fillPersonnelForm(editForm, personnel, index);

      hide(addForm)
      show(editForm)
    }
  });
}

/**
 * Remplit le formulaire de modification avec les données existantes.
 *
 * @param {HTMLFormElement} form - Formulaire de modification.
 * @param {object} entreprise - Personnel à modifier.
 * @param {number} index - Position du personnel dans le tableau.
 */
export function fillPersonnelForm(form, personnel, index) {
  const acf = personnel.acf || {};

  form.elements['personnels-nom'].value = acf['personnels-nom'] || '';
  form.elements['personnels-prenom'].value = acf['personnels-prenom'] || '';
  form.elements['personnels-email'].value = acf['personnels-email'] || '';
  form.elements['personnels-telephone'].value = acf['personnels-telephone'] || '';
  form.elements['personnels-local'].value = acf['personnels-local'] || '';
  form.elements['personnel-fonction'].value = personnel['personnel-fonction'] || '';

  // Champs cachés utiles au moment de sauvegarder.
  form.elements.id.value = personnel.id;
  form.elements.key.value = index;
}

/**
 * Gère le formulaire de modification d'un membre du personnel.
 */
function bindEditForm(editForm, addForm, loader, listing, cancelBtn) {
  editForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    show(loader);

    try {
      // Données du formulaire de modification.
      const formData = getFormData(editForm);

      // Objet final envoyé à WordPress.
      const payload = buildPersonnelPayload(formData);

      // Modification dans WordPress.
      await personnelsApi.update(formData.id, payload);

      // Mise à jour de l'affichage.
      renderPersonnels(loader, listing);

      editForm.reset();
      hide(editForm)
      show(addForm)

    } catch (error) {
      alert(error.message || 'Impossible de modifier ce membre.');

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
 * Gère l'affichage des fonction dans le select.
 */
async function optionFonctions(container) {

  if (fonctions === null) {
    fonctions = await request(
      `/wp/v2/personnel-fonction?_fields=id,name`,
      {
        method: 'GET',
      }
    );
  }

    //console.log(fonctions)

    if (!fonctions.length) {
      container.innerHTML = '<li>Aucune fonction</li>';
      return;
    }

    try {
      const html = await Promise.all(
        fonctions.map(async function (fonction, index) {

          //console.log(formation)

          let infos = {}

          infos = {
            fonctionNom: fonction.name,
            fonctionId: fonction.id,
          };

          return `
        <option value="${infos.fonctionId}" data-key="${index}">${infos.fonctionNom}</option>
      `;
        })
      );

      container.innerHTML += html.join('');
    }
    catch (error) {
      alert(error.message || 'Impossible de charger les fonctions.');
    }
  }

/**
 * Va chercher les membres du personnel depuis WordPress.
 */
async function getPersonnels() {
  try {
    // Appel GET vers /wp/v2/personnel.
    personnels = await personnelsApi.getAll();
  }
  catch (error) {
    alert(error.message || 'Impossible de charger les membres.');
  }
}

/**
 * Gère l'affichage des membres du personnel.
 */
async function renderPersonnels(loader, container) {
  show(loader);

  await getPersonnels()

  //console.log(formations)

  if (!personnels.length) {
    container.innerHTML = '<li>Aucun membre du personnel</li>';
    return;
  }

  try {
    const html = await Promise.all(
      personnels.map(async function (personnel, index) {

        //console.log(formation)

        const fonction = await request(
          `/wp/v2/personnel-fonction/${personnel['personnel-fonction'][0]}?_fields=id,name`,
          {
            method: 'GET',
          }
        );

        let infos = {}

        infos = {
          nom: personnel.acf['personnels-nom'],
          prenom: personnel.acf['personnels-prenom'],
          email: personnel.acf['personnels-email'],
          telephone: personnel.acf['personnels-telephone'],
          local: personnel.acf['personnels-local'],
          fonction: fonction.name,
        };

        return `
        <tr>
          <td>${infos.nom}</td>
          <td>${infos.prenom}</td>
          <td>${infos.email}</td>
          <td>+${infos.telephone}</td>
          <td>${infos.local}</td>
          <td>${infos.fonction}</td>
          <td>
            <a href="" data-key="${index}" id="edit">Edit</a>
            <a href="" data-id="${personnel.id}" id="delete">Delete</a>
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
 * Gère le formulaire d'ajout d'un membre du personnel.
 */
function bindCreateForm(form, loader, listing) {
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    show(loader);

    try {
      // 1. Récupérer les données du formulaire.
      const formData = getFormData(form);

      // 2. Construire l'objet attendu par WordPress.
      const payload = buildPersonnelPayload(formData);

      // 3. Créer l'entreprise dans WordPress.
      const personnel = await personnelsApi.create(payload);

      // 4. Ajouter l'entreprise dans notre état local.
      personnels.push(personnel);

      // 5. Mettre à jour la liste à l'écran.
      renderPersonnels(loader, listing);

      // 6. Nettoyer le formulaire et fermer la modale.
      form.reset();

    } catch (error) {
      alert(error.message || 'Impossible de créer ce membre.');

    } finally {
      hide(loader);
    }
  });
}

/**
 * Prépare les données attendues par WordPress pour créer ou modifier
 * un membre.
 *
 * @param {object} formData - Données venant du formulaire.
 * @returns {object} Objet compatible avec l'API REST WordPress.
 */
export function buildPersonnelPayload(formData) {
  const payload = {
    // title est le titre natif de WordPress.
    title: formData['personnels-nom'] + formData['personnels-prenom'],

    ['personnel-fonction']: formData['personnel-fonction'],

    // publish signifie que le contenu est publié directement.
    status: 'publish',

    // fields correspond aux champs ACF.
    fields: { ...formData },
  };

  // Ces champs servent uniquement côté front.
  // On ne veut pas les envoyer dans les champs ACF.
  delete payload.fields.id;
  delete payload.fields.key;
  delete payload.fields['personnel-fonction']

  return payload;
}

/**
 * Supprime un membre.
 */
async function deletePersonnel(button, listing, loader) {
  const id = button.dataset.id;
  const index = Number(button.dataset.key);

  // confirm renvoie true si l'utilisateur clique sur OK.
  const userConfirmed = confirm('Voulez-vous vraiment supprimer ce membre ?');

  if (!userConfirmed) {
    return;
  }

  show(loader);

  try {
    // Suppression dans WordPress.
    await personnelsApi.delete(id);

    // Mise à jour de la liste.
    renderPersonnels(loader, listing);

  } catch (error) {
    alert(error.message || 'Impossible de supprimer ce membre.');

  } finally {
    hide(loader);
  }
}