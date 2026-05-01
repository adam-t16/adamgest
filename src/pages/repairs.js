import { supabase } from '../supabase.js'
import { showModal, closeModal, getModalBody } from '../modal.js'
import { toast } from '../toast.js'

let allRepairs = []
let allVehicles = []
let allParts = []

const statusLabel = { pending: 'En attente', in_progress: 'En cours', done: 'Terminé', cancelled: 'Annulé' }

export async function mount(container) {
  container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`
  const [{ data: vehicles }, { data: parts }] = await Promise.all([
    supabase.from('vehicles').select('id, brand, model, plate_number, clients(name)').order('brand'),
    supabase.from('parts').select('id, part_name, quantity, unit_price').order('part_name'),
  ])
  allVehicles = vehicles || []
  allParts = parts || []
  await load(container)
}

async function load(container) {
  const { data, error } = await supabase
    .from('repairs')
    .select('id, description, status, labor_cost, created_at, vehicle_id, vehicles(id, brand, model, plate_number, clients(name))')
    .order('created_at', { ascending: false })

  if (error) { container.innerHTML = `<p class="text-muted">Erreur de chargement</p>`; return }
  allRepairs = data || []
  render(container, allRepairs)
}

function render(container, repairs) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Réparations</h2>
        <p>${repairs.length} réparation${repairs.length !== 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" id="btn-add-repair">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvelle réparation
      </button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="repair-search" placeholder="Rechercher réparation, véhicule, client..." />
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="status-filter" class="form-control" style="width:auto;padding:6px 28px 6px 10px">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <span class="text-muted text-small" id="repair-count">${repairs.length} résultat${repairs.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Main d'œuvre</th>
              <th>Pièces</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="repairs-tbody">${renderRows(repairs)}</tbody>
        </table>
      </div>
    </div>
  `

  container.querySelector('#btn-add-repair').onclick = () => openAddModal(container)

  const applyFilters = () => {
    const q = container.querySelector('#repair-search').value.toLowerCase()
    const statusVal = container.querySelector('#status-filter').value
    const filtered = allRepairs.filter(r => {
      const matchText = r.description.toLowerCase().includes(q) ||
        (r.vehicles?.make || '').toLowerCase().includes(q) ||
        (r.vehicles?.model || '').toLowerCase().includes(q) ||
        (r.vehicles?.plate || '').toLowerCase().includes(q) ||
        (r.vehicles?.clients?.name || '').toLowerCase().includes(q)
      const matchStatus = !statusVal || r.status === statusVal
      return matchText && matchStatus
    })
    container.querySelector('#repairs-tbody').innerHTML = renderRows(filtered)
    container.querySelector('#repair-count').textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
    bindRowActions(container)
  }

  container.querySelector('#repair-search').oninput = applyFilters
  container.querySelector('#status-filter').onchange = applyFilters

  bindRowActions(container)
}

function renderRows(repairs) {
  if (!repairs.length) {
    return `<tr><td colspan="8" class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      Aucune réparation trouvée
    </td></tr>`
  }
  return repairs.map(r => `
    <tr>
      <td>
        <div style="font-weight:500">${r.vehicles?.brand} ${r.vehicles?.model}</div>
        <div class="text-muted text-small">${r.vehicles?.clients?.name || ''} · <span class="font-mono">${r.vehicles?.plate_number || '—'}</span></div>
      </td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${r.description}">${r.description}</td>
      <td>
        <select class="status-select badge badge-${r.status}" data-id="${r.id}" style="border:none;background:inherit;cursor:pointer;font-size:11px;font-weight:600;padding:2px 4px;border-radius:100px">
          ${Object.entries(statusLabel).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </td>
      <td>${Number(r.labor_cost).toLocaleString('fr-DZ')} DA</td>
      <td>0 DA</td>
      <td style="font-weight:700">${Number(r.labor_cost).toLocaleString('fr-DZ')} DA</td>
      <td class="text-muted text-small">${new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn" data-parts="${r.id}" title="Gérer pièces">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </button>
          <button class="icon-btn" data-edit="${r.id}" title="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-delete="${r.id}" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('')
}

function bindRowActions(container) {
  container.querySelectorAll('.status-select').forEach(sel => {
    sel.onchange = async (e) => {
      const id = sel.dataset.id
      const status = e.target.value
      const patch = { status }
      if (status === 'done') patch.completed_at = new Date().toISOString()
      const { error } = await supabase.from('repairs').update(patch).eq('id', id)
      if (error) { toast('Erreur mise à jour statut', 'error'); return }
      toast(`Statut mis à jour: ${statusLabel[status]}`)
      await load(container)
    }
  })
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const r = allRepairs.find(x => x.id === btn.dataset.edit)
      if (r) openEditModal(container, r)
    }
  })
  container.querySelectorAll('[data-parts]').forEach(btn => {
    btn.onclick = () => {
      const r = allRepairs.find(x => x.id === btn.dataset.parts)
      if (r) openPartsModal(container, r)
    }
  })
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => confirmDelete(container, btn.dataset.delete)
  })
}

function repairForm(r = {}) {
  const vehicleOptions = allVehicles.map(v =>
    `<option value="${v.id}" ${r.vehicles?.id === v.id ? 'selected' : ''}>${v.brand} ${v.model} (${v.plate_number || '—'}) - ${v.clients?.name || ''}</option>`
  ).join('')
  return `
    <div class="form-group">
      <label>Véhicule *</label>
      <select class="form-control" id="f-vehicle">
        <option value="">Sélectionner un véhicule...</option>
        ${vehicleOptions}
      </select>
    </div>
    <div class="form-group">
      <label>Description *</label>
      <textarea class="form-control" id="f-desc" placeholder="Décrire la réparation...">${r.description || ''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Main d'œuvre (DA)</label>
        <input class="form-control" id="f-labor" type="number" min="0" value="${r.labor_cost || 0}" />
      </div>
      <div class="form-group">
        <label>Statut</label>
        <select class="form-control" id="f-status">
          ${Object.entries(statusLabel).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
  `
}

function openAddModal(container) {
  showModal('Nouvelle réparation', `
    ${repairForm()}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const vehicle_id = document.getElementById('f-vehicle').value
    const description = document.getElementById('f-desc').value.trim()
    if (!vehicle_id || !description) { toast('Remplissez les champs obligatoires', 'error'); return }
    const labor = Number(document.getElementById('f-labor').value) || 0
    const { error } = await supabase.from('repairs').insert({
      vehicle_id,
      description,
      status: document.getElementById('f-status').value,
      labor_cost: labor,
    })
    if (error) { toast('Erreur lors de la création', 'error'); return }
    closeModal()
    toast('Réparation créée')
    await load(container)
  }
}

function openEditModal(container, r) {
  showModal('Modifier réparation', `
    ${repairForm(r)}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const vehicle_id = document.getElementById('f-vehicle').value
    const description = document.getElementById('f-desc').value.trim()
    if (!vehicle_id || !description) { toast('Remplissez les champs obligatoires', 'error'); return }
    const labor = Number(document.getElementById('f-labor').value) || 0
    const { error } = await supabase.from('repairs').update({
      vehicle_id,
      description,
      status: document.getElementById('f-status').value,
      labor_cost: labor,
    }).eq('id', r.id)
    if (error) { toast('Erreur lors de la modification', 'error'); return }
    closeModal()
    toast('Réparation modifiée')
    await load(container)
  }
}

async function openPartsModal(container, repair) {
  const { data: repairParts } = await supabase
    .from('repair_parts')
    .select('id, quantity, unit_price, parts(id, name)')
    .eq('repair_id', repair.id)

  const renderPartsTable = (rps) => {
    if (!rps?.length) return `<p class="text-muted text-small" style="padding:12px">Aucune pièce ajoutée</p>`
    return `<table style="width:100%">
      <thead><tr><th>Pièce</th><th>Qté</th><th>Prix unit.</th><th>Total</th><th></th></tr></thead>
      <tbody>
        ${rps.map(rp => `<tr>
          <td>${rp.parts?.name}</td>
          <td>${rp.quantity}</td>
          <td>${Number(rp.unit_price).toLocaleString('fr-DZ')} DA</td>
          <td style="font-weight:600">${(rp.quantity * rp.unit_price).toLocaleString('fr-DZ')} DA</td>
          <td><button class="icon-btn danger" data-rm-part="${rp.id}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button></td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }

  const partOptions = allParts.map(p =>
    `<option value="${p.id}" data-price="${p.unit_price}">${p.name} (${p.quantity} dispo) - ${Number(p.unit_price).toLocaleString('fr-DZ')} DA</option>`
  ).join('')

  showModal(`Pièces — ${repair.vehicles?.make} ${repair.vehicles?.model}`, `
    <div class="parts-used-section">
      <div class="parts-used-header">Pièces utilisées</div>
      <div id="parts-list">${renderPartsTable(repairParts)}</div>
    </div>

    <div class="form-group">
      <label>Ajouter une pièce</label>
      <select class="form-control" id="f-part-id">
        <option value="">Choisir une pièce...</option>
        ${partOptions}
      </select>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Quantité</label>
        <input class="form-control" id="f-part-qty" type="number" min="1" value="1" />
      </div>
      <div class="form-group">
        <label>Prix unitaire (DA)</label>
        <input class="form-control" id="f-part-price" type="number" min="0" value="0" />
      </div>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-close">Fermer</button>
      <button class="btn btn-primary" id="m-add-part">Ajouter la pièce</button>
    </div>
  `, { large: true })

  document.getElementById('f-part-id').onchange = (e) => {
    const sel = e.target.selectedOptions[0]
    const price = sel?.dataset.price || 0
    document.getElementById('f-part-price').value = price
  }

  const refreshParts = async () => {
    const { data: rps } = await supabase.from('repair_parts').select('id, quantity, unit_price, parts(id, name)').eq('repair_id', repair.id)
    const modal = document.getElementById('parts-list')
    if (modal) modal.innerHTML = renderPartsTable(rps)
    bindRemovePart(repair, container)
  }

  const bindRemovePart = (rep, cont) => {
    document.querySelectorAll('[data-rm-part]').forEach(btn => {
      btn.onclick = async () => {
        const { data: rp } = await supabase.from('repair_parts').select('quantity, unit_price').eq('id', btn.dataset.rmPart).maybeSingle()
        await supabase.from('repair_parts').delete().eq('id', btn.dataset.rmPart)
        if (rp) {
          const { data: cur } = await supabase.from('repairs').select('parts_cost, labor_cost').eq('id', rep.id).maybeSingle()
          const newParts = Math.max(0, Number(cur.parts_cost) - rp.quantity * rp.unit_price)
          await supabase.from('repairs').update({ parts_cost: newParts, total_cost: newParts + Number(cur.labor_cost) }).eq('id', rep.id)
        }
        toast('Pièce retirée', 'info')
        await refreshParts()
        await load(cont)
      }
    })
  }

  bindRemovePart(repair, container)

  document.getElementById('m-close').onclick = closeModal
  document.getElementById('m-add-part').onclick = async () => {
    const part_id = document.getElementById('f-part-id').value
    const qty = Number(document.getElementById('f-part-qty').value) || 1
    const price = Number(document.getElementById('f-part-price').value) || 0
    if (!part_id) { toast('Sélectionnez une pièce', 'error'); return }

    const { error } = await supabase.from('repair_parts').insert({ repair_id: repair.id, part_id, quantity: qty, unit_price: price })
    if (error) { toast('Erreur ajout pièce', 'error'); return }

    const { data: cur } = await supabase.from('repairs').select('parts_cost, labor_cost').eq('id', repair.id).maybeSingle()
    const newParts = Number(cur.parts_cost) + qty * price
    await supabase.from('repairs').update({ parts_cost: newParts, total_cost: newParts + Number(cur.labor_cost) }).eq('id', repair.id)

    await supabase.from('parts').rpc ? null : null

    toast('Pièce ajoutée')
    await refreshParts()
    await load(container)
  }
}

function confirmDelete(container, id) {
  const r = allRepairs.find(x => x.id === id)
  showModal('Supprimer cette réparation ?', `
    <p class="info-text">Supprimer la réparation <strong>"${r?.description}"</strong> ?<br>Toutes les pièces associées seront également supprimées.</p>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-danger" id="m-confirm">Supprimer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-confirm').onclick = async () => {
    const { error } = await supabase.from('repairs').delete().eq('id', id)
    if (error) { toast('Erreur lors de la suppression', 'error'); return }
    closeModal()
    toast('Réparation supprimée', 'info')
    await load(container)
  }
}
