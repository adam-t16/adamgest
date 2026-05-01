import { supabase } from '../supabase.js'
import { showModal, closeModal } from '../modal.js'
import { toast } from '../toast.js'

let allVehicles = []
let allClients = []

export async function mount(container) {
  container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`
  const { data: clients } = await supabase.from('clients').select('id, name').order('name')
  allClients = clients || []
  await load(container)
}

async function load(container) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, brand, model, plate_number, created_at, clients(id, name)')
    .order('created_at', { ascending: false })

  if (error) { container.innerHTML = `<p class="text-muted">Erreur de chargement</p>`; return }
  allVehicles = data || []
  render(container, allVehicles)
}

function render(container, vehicles) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Véhicules</h2>
        <p>${vehicles.length} véhicule${vehicles.length !== 1 ? 's' : ''} enregistré${vehicles.length !== 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" id="btn-add-vehicle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter véhicule
      </button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="vehicle-search" placeholder="Rechercher plaque, marque, client..." />
        </div>
        <span class="text-muted text-small" id="vehicle-count">${vehicles.length} résultat${vehicles.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Plaque</th>
              <th>Marque / Modèle</th>
              <th>Année</th>
              <th>Propriétaire</th>
              <th>VIN</th>
              <th>Date ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="vehicles-tbody">
            ${renderRows(vehicles)}
          </tbody>
        </table>
      </div>
    </div>
  `

  container.querySelector('#btn-add-vehicle').onclick = () => openAddModal(container)

  container.querySelector('#vehicle-search').oninput = (e) => {
    const q = e.target.value.toLowerCase()
    const filtered = allVehicles.filter(v =>
      v.plate.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.clients?.name || '').toLowerCase().includes(q)
    )
    container.querySelector('#vehicles-tbody').innerHTML = renderRows(filtered)
    container.querySelector('#vehicle-count').textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
    bindRowActions(container)
  }

  bindRowActions(container)
}

function renderRows(vehicles) {
  if (!vehicles.length) {
    return `<tr><td colspan="7" class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/></svg>
      Aucun véhicule trouvé
    </td></tr>`
  }
  return vehicles.map(v => `
    <tr>
      <td class="font-mono" style="font-weight:600;font-size:13px">${v.plate_number || '<span class="text-muted">—</span>'}</td>
      <td><div style="font-weight:500">${v.brand} ${v.model}</div></td>
      <td>—</td>
      <td>${v.clients?.name || '<span class="text-muted">—</span>'}</td>
      <td class="font-mono text-muted">—</td>
      <td class="text-muted text-small">${new Date(v.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn" data-edit="${v.id}" title="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-delete="${v.id}" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('')
}

function bindRowActions(container) {
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const v = allVehicles.find(x => x.id === btn.dataset.edit)
      if (v) openEditModal(container, v)
    }
  })
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => confirmDelete(container, btn.dataset.delete)
  })
}

function vehicleForm(v = {}) {
  const clientOptions = allClients.map(c =>
    `<option value="${c.id}" ${v.clients?.id === c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('')
  return `
    <div class="form-group">
      <label>Propriétaire *</label>
      <select class="form-control" id="f-client">
        <option value="">Sélectionner un client...</option>
        ${clientOptions}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Marque *</label>
        <input class="form-control" id="f-brand" value="${v.brand || ''}" placeholder="Ex: Peugeot" required />
      </div>
      <div class="form-group">
        <label>Modèle *</label>
        <input class="form-control" id="f-model" value="${v.model || ''}" placeholder="Ex: 308" required />
      </div>
    </div>
    <div class="form-group">
      <label>Plaque</label>
      <input class="form-control" id="f-plate" value="${v.plate_number || ''}" placeholder="12345-67-89" />
    </div>
  `
}

function openAddModal(container) {
  showModal('Nouveau véhicule', `
    ${vehicleForm()}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const brand = document.getElementById('f-brand').value.trim()
    const model = document.getElementById('f-model').value.trim()
    const client_id = document.getElementById('f-client').value
    if (!brand || !model || !client_id) { toast('Remplissez les champs obligatoires', 'error'); return }
    const { error } = await supabase.from('vehicles').insert({
      client_id,
      brand,
      model,
      plate_number: document.getElementById('f-plate').value.trim(),
    })
    if (error) { toast('Erreur lors de la création', 'error'); return }
    closeModal()
    toast('Véhicule ajouté')
    await load(container)
  }
}

function openEditModal(container, v) {
  showModal('Modifier véhicule', `
    ${vehicleForm(v)}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const brand = document.getElementById('f-brand').value.trim()
    const model = document.getElementById('f-model').value.trim()
    const client_id = document.getElementById('f-client').value
    if (!brand || !model || !client_id) { toast('Remplissez les champs obligatoires', 'error'); return }
    const { error } = await supabase.from('vehicles').update({
      client_id,
      brand,
      model,
      plate_number: document.getElementById('f-plate').value.trim(),
    }).eq('id', v.id)
    if (error) { toast('Erreur lors de la modification', 'error'); return }
    closeModal()
    toast('Véhicule modifié')
    await load(container)
  }
}

function confirmDelete(container, id) {
  const v = allVehicles.find(x => x.id === id)
  showModal('Supprimer ce véhicule ?', `
    <p class="info-text">Supprimer <strong>${v?.brand} ${v?.model}</strong> (${v?.plate_number || 'sans plaque'}) ?<br>
    Toutes les réparations associées seront également supprimées.</p>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-danger" id="m-confirm">Supprimer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-confirm').onclick = async () => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) { toast('Erreur lors de la suppression', 'error'); return }
    closeModal()
    toast('Véhicule supprimé', 'info')
    await load(container)
  }
}
