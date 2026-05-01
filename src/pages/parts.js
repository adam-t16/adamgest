import { supabase } from '../supabase.js'
import { showModal, closeModal } from '../modal.js'
import { toast } from '../toast.js'

let allParts = []

export async function mount(container) {
  container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`
  await load(container)
}

async function load(container) {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .order('part_name')

  if (error) { container.innerHTML = `<p class="text-muted">Erreur de chargement</p>`; return }
  allParts = data || []
  render(container, allParts)
}

function render(container, parts) {
  const lowStock = parts.filter(p => p.quantity < 5 && p.quantity > 0).length
  const outOfStock = parts.filter(p => p.quantity === 0).length

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Stock pièces</h2>
        <p>${parts.length} référence${parts.length !== 1 ? 's' : ''}
          ${lowStock > 0 ? `· <span style="color:var(--warning)">${lowStock} stock faible</span>` : ''}
          ${outOfStock > 0 ? `· <span style="color:var(--error)">${outOfStock} épuisé</span>` : ''}
        </p>
      </div>
      <button class="btn btn-primary" id="btn-add-part">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter pièce
      </button>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="parts-search" placeholder="Rechercher une pièce..." />
        </div>
        <span class="text-muted text-small" id="parts-count">${parts.length} résultat${parts.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Valeur stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="parts-tbody">${renderRows(parts)}</tbody>
        </table>
      </div>
    </div>
  `

  container.querySelector('#btn-add-part').onclick = () => openAddModal(container)

  container.querySelector('#parts-search').oninput = (e) => {
    const q = e.target.value.toLowerCase()
    const filtered = allParts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
    container.querySelector('#parts-tbody').innerHTML = renderRows(filtered)
    container.querySelector('#parts-count').textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
    bindRowActions(container)
  }

  bindRowActions(container)
}

function renderRows(parts) {
  if (!parts.length) {
    return `<tr><td colspan="6" class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      Aucune pièce trouvée
    </td></tr>`
  }
  return parts.map(p => {
    const stockClass = p.quantity === 0 ? 'badge-cancelled' : p.quantity < 5 ? 'badge-pending' : 'badge-done'
    const stockLabel = p.quantity === 0 ? 'Épuisé' : p.quantity < 5 ? 'Stock faible' : 'En stock'
    return `<tr>
      <td style="font-weight:600">${p.part_name}</td>
      <td class="text-muted">—</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-weight:600;font-size:15px">${p.quantity}</span>
          <span class="badge ${stockClass}">${stockLabel}</span>
        </div>
      </td>
      <td style="font-weight:500">${Number(p.unit_price).toLocaleString('fr-DZ')} DA</td>
      <td style="color:var(--text-secondary)">${(p.quantity * Number(p.unit_price)).toLocaleString('fr-DZ')} DA</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-sm btn-secondary" data-adjust="${p.id}" title="Ajuster stock">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Stock
          </button>
          <button class="icon-btn" data-edit="${p.id}" title="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-delete="${p.id}" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`
  }).join('')
}

function bindRowActions(container) {
  container.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const p = allParts.find(x => x.id === btn.dataset.edit)
      if (p) openEditModal(container, p)
    }
  })
  container.querySelectorAll('[data-adjust]').forEach(btn => {
    btn.onclick = () => {
      const p = allParts.find(x => x.id === btn.dataset.adjust)
      if (p) openAdjustModal(container, p)
    }
  })
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => confirmDelete(container, btn.dataset.delete)
  })
}

function partForm(p = {}) {
  return `
    <div class="form-group">
      <label>Nom de la pièce *</label>
      <input class="form-control" id="f-name" value="${p.part_name || ''}" placeholder="Ex: Filtre à huile" required />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Quantité</label>
        <input class="form-control" id="f-qty" type="number" min="0" value="${p.quantity ?? 0}" />
      </div>
      <div class="form-group">
        <label>Prix unitaire (DA)</label>
        <input class="form-control" id="f-price" type="number" min="0" step="0.01" value="${p.unit_price ?? 0}" />
      </div>
    </div>
  `
}

function openAddModal(container) {
  showModal('Nouvelle pièce', `
    ${partForm()}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const name = document.getElementById('f-name').value.trim()
    if (!name) { toast('Le nom est obligatoire', 'error'); return }
    const { error } = await supabase.from('parts').insert({
      part_name: name,
      quantity: Number(document.getElementById('f-qty').value) || 0,
      unit_price: Number(document.getElementById('f-price').value) || 0,
    })
    if (error) { toast('Erreur lors de la création', 'error'); return }
    closeModal()
    toast('Pièce ajoutée au stock')
    await load(container)
  }
}

function openEditModal(container, p) {
  showModal('Modifier pièce', `
    ${partForm(p)}
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const name = document.getElementById('f-name').value.trim()
    if (!name) { toast('Le nom est obligatoire', 'error'); return }
    const { error } = await supabase.from('parts').update({
      part_name: name,
      quantity: Number(document.getElementById('f-qty').value) || 0,
      unit_price: Number(document.getElementById('f-price').value) || 0,
    }).eq('id', p.id)
    if (error) { toast('Erreur lors de la modification', 'error'); return }
    closeModal()
    toast('Pièce modifiée')
    await load(container)
  }
}

function openAdjustModal(container, p) {
  showModal(`Ajuster stock — ${p.name}`, `
    <p class="info-text" style="margin-bottom:16px">Stock actuel: <strong>${p.quantity}</strong></p>
    <div class="form-group">
      <label>Nouveau stock</label>
      <input class="form-control" id="f-new-qty" type="number" min="0" value="${p.quantity}" />
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Mettre à jour</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const qty = Number(document.getElementById('f-new-qty').value)
    if (isNaN(qty) || qty < 0) { toast('Quantité invalide', 'error'); return }
    const { error } = await supabase.from('parts').update({ quantity: qty }).eq('id', p.id)
    if (error) { toast('Erreur mise à jour', 'error'); return }
    closeModal()
    toast('Stock mis à jour')
    await load(container)
  }
}

function confirmDelete(container, id) {
  const p = allParts.find(x => x.id === id)
  showModal('Supprimer cette pièce ?', `
    <p class="info-text">Supprimer <strong>${p?.part_name}</strong> du stock ?<br>Cette action ne peut pas être annulée.</p>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-danger" id="m-confirm">Supprimer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-confirm').onclick = async () => {
    const { error } = await supabase.from('parts').delete().eq('id', id)
    if (error) { toast('Erreur lors de la suppression', 'error'); return }
    closeModal()
    toast('Pièce supprimée', 'info')
    await load(container)
  }
}
