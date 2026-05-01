const overlay = () => document.getElementById('modal-overlay')
const box = () => document.getElementById('modal-box')
const titleEl = () => document.getElementById('modal-title')
const bodyEl = () => document.getElementById('modal-body')
const closeBtn = () => document.getElementById('modal-close')

let onCloseCallback = null

export function showModal(title, html, { large = false, onClose } = {}) {
  titleEl().textContent = title
  bodyEl().innerHTML = html
  box().className = large ? 'modal-box modal-lg' : 'modal-box'
  overlay().classList.remove('hidden')
  onCloseCallback = onClose || null

  closeBtn().onclick = closeModal
  overlay().onclick = (e) => { if (e.target === overlay()) closeModal() }
}

export function closeModal() {
  overlay().classList.add('hidden')
  if (onCloseCallback) { onCloseCallback(); onCloseCallback = null }
}

export function getModalBody() {
  return bodyEl()
}
