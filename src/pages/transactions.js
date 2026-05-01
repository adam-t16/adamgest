import { supabase } from '../supabase.js'
import { showModal, closeModal } from '../modal.js'
import { toast } from '../toast.js'

let allTransactions = []
let allRepairs = []

export async function mount(container) {
  container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`
  const { data: repairs } = await supabase.from('repairs').select('id, description, vehicle_id, vehicles(brand, model)').order('created_at', { ascending: false })
  allRepairs = repairs || []
  await load(container)
}

async function load(container) {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, type, description, created_at, repair_id, repairs(id, description, vehicles(brand, model))')
    .order('created_at', { ascending: false })

  if (error) { container.innerHTML = `<p class="text-muted">Erreur de chargement</p>`; return }
  allTransactions = data || []
  render(container, allTransactions)
}

function render(container, transactions) {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Transactions</h2>
        <p>${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}</p>
      </div>
      <button class="btn btn-primary" id="btn-add-tx">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvelle transaction
      </button>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:24px">
      <div class="kpi-card">
        <div class="kpi-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div class="kpi-value" style="color:var(--success)">${totalIncome.toLocaleString('fr-DZ')} DA</div>
        <div class="kpi-label">Revenus</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:var(--error-bg);color:var(--error)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
        </div>
        <div class="kpi-value" style="color:var(--error)">${totalExpense.toLocaleString('fr-DZ')} DA</div>
        <div class="kpi-label">Dépenses</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon ${balance >= 0 ? 'green' : ''}" style="${balance < 0 ? 'background:var(--error-bg);color:var(--error)' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="kpi-value" style="color:${balance >= 0 ? 'var(--success)' : 'var(--error)'}">${balance.toLocaleString('fr-DZ')} DA</div>
        <div class="kpi-label">Solde</div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="search-input">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="tx-search" placeholder="Rechercher une transaction..." />
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="type-filter" class="form-control" style="width:auto;padding:6px 28px 6px 10px">
            <option value="">Tous types</option>
            <option value="income">Revenus</option>
            <option value="expense">Dépenses</option>
          </select>
          <span class="text-muted text-small" id="tx-count">${transactions.length} résultat${transactions.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Réparation liée</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tx-tbody">${renderRows(transactions)}</tbody>
        </table>
      </div>
    </div>
  `

  container.querySelector('#btn-add-tx').onclick = () => openAddModal(container)

  const applyFilters = () => {
    const q = container.querySelector('#tx-search').value.toLowerCase()
    const typeVal = container.querySelector('#type-filter').value
    const filtered = allTransactions.filter(t => {
      const matchText = t.description.toLowerCase().includes(q) ||
        (t.repairs?.description || '').toLowerCase().includes(q)
      const matchType = !typeVal || t.type === typeVal
      return matchText && matchType
    })
    container.querySelector('#tx-tbody').innerHTML = renderRows(filtered)
    container.querySelector('#tx-count').textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`
    bindRowActions(container)
  }

  container.querySelector('#tx-search').oninput = applyFilters
  container.querySelector('#type-filter').onchange = applyFilters

  bindRowActions(container)
}

function renderRows(transactions) {
  if (!transactions.length) {
    return `<tr><td colspan="6" class="table-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      Aucune transaction trouvée
    </td></tr>`
  }
  return transactions.map(t => `
    <tr>
      <td style="font-weight:500">${t.description}</td>
      <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Revenu' : 'Dépense'}</span></td>
      <td class="${t.type === 'income' ? 'amount-positive' : 'amount-negative'}">
        ${t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString('fr-DZ')} DA
      </td>
      <td class="text-muted text-small">
        ${t.repairs ? `${t.repairs.vehicles?.make} ${t.repairs.vehicles?.model} — ${t.repairs.description}` : '—'}
      </td>
      <td class="text-muted text-small">${new Date(t.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <div class="actions-cell">
          <button class="icon-btn danger" data-delete="${t.id}" title="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('')
}

function bindRowActions(container) {
  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = () => confirmDelete(container, btn.dataset.delete)
  })
}

function openAddModal(container) {
  const repairOptions = allRepairs.map(r =>
    `<option value="${r.id}">${r.vehicles?.brand} ${r.vehicles?.model} — ${r.description}</option>`
  ).join('')

  showModal('Nouvelle transaction', `
    <div class="form-group">
      <label>Description *</label>
      <input class="form-control" id="f-desc" placeholder="Ex: Paiement réparation moteur" required />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Type</label>
        <select class="form-control" id="f-type">
          <option value="income">Revenu</option>
          <option value="expense">Dépense</option>
        </select>
      </div>
      <div class="form-group">
        <label>Montant (DA)</label>
        <input class="form-control" id="f-amount" type="number" min="0" step="0.01" value="0" />
      </div>
    </div>
    <div class="form-group">
      <label>Réparation liée (optionnel)</label>
      <select class="form-control" id="f-repair">
        <option value="">Aucune</option>
        ${repairOptions}
      </select>
    </div>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-primary" id="m-save">Enregistrer</button>
    </div>
  `)

  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-save').onclick = async () => {
    const description = document.getElementById('f-desc').value.trim()
    const amount = Number(document.getElementById('f-amount').value)
    if (!description || amount <= 0) { toast('Remplissez tous les champs', 'error'); return }
    const repair_id = document.getElementById('f-repair').value || null
    const { error } = await supabase.from('transactions').insert({
      description,
      amount: amount || 0,
      type: document.getElementById('f-type').value || 'income',
      repair_id: repair_id || null,
    })
    if (error) { toast('Erreur lors de la création', 'error'); return }
    closeModal()
    toast('Transaction enregistrée')
    await load(container)
  }
}

function confirmDelete(container, id) {
  showModal('Supprimer cette transaction ?', `
    <p class="info-text">Cette transaction sera définitivement supprimée.</p>
    <div class="form-actions">
      <button class="btn btn-secondary" id="m-cancel">Annuler</button>
      <button class="btn btn-danger" id="m-confirm">Supprimer</button>
    </div>
  `)
  document.getElementById('m-cancel').onclick = closeModal
  document.getElementById('m-confirm').onclick = async () => {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) { toast('Erreur lors de la suppression', 'error'); return }
    closeModal()
    toast('Transaction supprimée', 'info')
    await load(container)
  }
}
