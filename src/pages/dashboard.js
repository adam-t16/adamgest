import { supabase } from '../supabase.js'

const statusLabel = { pending: 'En attente', in_progress: 'En cours', done: 'Terminé', cancelled: 'Annulé' }

export async function mount(container) {
  container.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`

  const [
    { count: clientCount },
    { count: vehicleCount },
    { count: repairCount },
    { data: repairs },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('repairs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('repairs').select('id, description, status, labor_cost, created_at, vehicles(brand, model, plate_number)').order('created_at', { ascending: false }).limit(8),
  ])

  const totalLabor = (repairs || []).reduce((s, r) => s + Number(r.labor_cost || 0), 0)

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Tableau de bord</h2>
        <p>Vue d'ensemble de votre garage</p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
          </svg>
        </div>
        <div class="kpi-value">${clientCount ?? 0}</div>
        <div class="kpi-label">Clients</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
            <rect x="9" y="11" width="14" height="10" rx="2"/>
          </svg>
        </div>
        <div class="kpi-value">${vehicleCount ?? 0}</div>
        <div class="kpi-label">Véhicules</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon cyan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <div class="kpi-value">${repairCount ?? 0}</div>
        <div class="kpi-label">Réparations en cours</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <div class="kpi-value">${totalLabor.toLocaleString('fr-DZ')} DA</div>
        <div class="kpi-label">Total réparations</div>
      </div>
    </div>

    <div class="recent-section">
      <div class="recent-section-header">Réparations récentes</div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Coût total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${(repairs || []).length === 0
              ? `<tr><td colspan="5" class="table-empty">Aucune réparation pour l'instant</td></tr>`
              : (repairs || []).map(r => `
                <tr>
                  <td>
                    <div style="font-weight:500">${r.vehicles?.brand} ${r.vehicles?.model}</div>
                    <div class="text-muted text-small font-mono">${r.vehicles?.plate_number || '—'}</div>
                  </td>
                  <td>${r.description}</td>
                  <td><span class="badge badge-${r.status}">${statusLabel[r.status] || r.status}</span></td>
                  <td style="font-weight:600">${Number(r.labor_cost).toLocaleString('fr-DZ')} DA</td>
                  <td class="text-muted text-small">${new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}
