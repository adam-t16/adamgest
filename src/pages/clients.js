import { supabase } from '../supabase.js'
import { showModal, closeModal } from '../modal.js'
import { toast } from '../toast.js'

let allClients = []

export async function mount(container) {
  container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`
  await load(container)
}

async function load(container) {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, created_at, vehicles(count)')
    .order('created_at', { ascending: false })

  if (error) { container.innerHTML = `<p class="text-muted">Erreur de chargement</p>`; return }

  allClients = data || []
  render(container, allClients)
}

function render(container, clients) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Clients</h2>
        <p>${clients.length} client${clients.length !== 1 ? 's' : ''} enregistré${clients.length !== 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" id="btn-add-client">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter client
      </button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="client-search" placeholder="Rechercher un client..." />
        </div>
        <span class="text-muted text-small" id="client-count">${clients.length} résultat${clients.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Véhicules</th>
              <th>Date ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="clients-tbody">
            ${renderRows(clients)}
          </tbody>
        </table>
      </div>
    </div>
  `

  container.querySelector('#btn-add-client').onclick = () => openAddModal(container)

  container.querySelector('#client-search').oninput = (e) => {
    const q = e.target.value.toLowerCase()
    const filtered = allClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
    container.querySelector('#clients-tbody').innerHTML = renderRows(filtered)
    container.querySelector('#client-count').textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
    bindRowActions(container)
  }

  bindRowActions(container)
}

function renderRows(clients) {
  if (!clients.length) {
    return `<tr><td colspan="6" class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      Aucun client trouvé
    </td></tr>`
  }
  return clients.map(c => `
    <tr>
      <td><div style="font-weight:600">${c.name}</div></td>
      <td>${c.phone || '<span class="text-muted">—</span>'}</td>
      <td><span class="text-muted">—</span></td>
      <td><span class="badge badge-in_progress">${c.vehicles?.[0]?.count ?? 0}</span></td>
      <td class="text-muted text-small">${new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn" data-edit="${c.id}" title="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-delete="${c.id}" title="Supprimer">
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
      const client = allClients.find(c => c.id === btn.dataset.edit)
      if (client) openEditModal(container, client)
    }
  })
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => confirmDelete(container, btn.dataset.delete)
  })
}

function clientForm(c = {}) {
  return `
    <div class="form-group">
      <label>Nom complet *</label>
      <input class="form-control" id="f-name" value="${c.name || ''}" placeholder="Ex: Ahmed Benali" required />
    </div>
    <div class="form-group">
      <label>Téléphone</label>
      <input class="form-control" id="f-phone" value="${c.phone || ''}" placeholder="0555 000 000" />
    </div>
  `
}

function openAddModal(container) {
  showModal('Nouveau client', `
    ${clientForm()}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const name = document.getElementById('f-name').value.trim()
    if (!name) return
    const { error } = await supabase.from('clients').insert({
      name,
      phone: document.getElementById('f-phone').value.trim(),
    })
    if (error) { toast('Erreur lors de la création', 'error'); return }
    closeModal()
    toast('Client ajouté avec succès')
    await load(container)
  }
}

function openEditModal(container, c) {
  showModal('Modifier client', `
    ${clientForm(c)}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const name = document.getElementById('f-name').value.trim()
    if (!name) return
    const { error } = await supabase.from('clients').update({
      name,
      phone: document.getElementById('f-phone').value.trim(),
    }).eq('id', c.id)
    if (error) { toast('Erreur lors de la modification', 'error'); return }
    closeModal()
    toast('Client modifié')
    await load(container)
  }
}

function confirmDelete(container, id) {
  const client = allClients.find(c => c.id === id)
  showModal('Supprimer ce client ?', `
    <p class="info-text">Voulez-vous vraiment supprimer <strong>${client?.name}</strong> ?<br>
    Tous ses véhicules et réparations associés seront également supprimés.</p>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-danger" id="m-confirm">Supprimer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-confirm').onclick = async () => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { toast('Erreur lors de la suppression', 'error'); return }
    closeModal()
    toast('Client supprimé', 'info')
    await load(container)
  }
}
