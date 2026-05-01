import './style.css'

const pages = {
  dashboard: { title: 'Tableau de bord', loader: () => import('./src/pages/dashboard.js') },
  clients:   { title: 'Clients',          loader: () => import('./src/pages/clients.js') },
  vehicles:  { title: 'Véhicules',        loader: () => import('./src/pages/vehicles.js') },
  repairs:   { title: 'Réparations',      loader: () => import('./src/pages/repairs.js') },
  parts:     { title: 'Stock pièces',     loader: () => import('./src/pages/parts.js') },
  transactions: { title: 'Transactions',  loader: () => import('./src/pages/transactions.js') },
}

const content = () => document.getElementById('content')
const pageTitle = () => document.getElementById('page-title')

async function navigate(hash) {
  const page = hash.replace('#', '') || 'dashboard'
  const config = pages[page] || pages.dashboard

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page)
  })

  pageTitle().textContent = config.title
  content().innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`

  try {
    const mod = await config.loader()
    await mod.mount(content())
  } catch (err) {
    content().innerHTML = `<p class="text-muted" style="padding:40px">Erreur lors du chargement de la page.</p>`
    console.error(err)
  }
}

window.addEventListener('hashchange', () => navigate(window.location.hash))
navigate(window.location.hash || '#dashboard')
