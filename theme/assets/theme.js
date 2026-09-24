/*
  RECUTEX 2.0 — theme entry (ES module, loaded deferred).
  Components are added as Custom Elements in later phases (Header, CartDrawer, ProductGallery...).
*/

document.documentElement.classList.remove('no-js');

// Collection sort: submit on change (a <noscript> button covers the no-JS case).
document.addEventListener('change', (event) => {
  const select = event.target.closest('select[data-autosubmit]');
  if (select) select.form.requestSubmit();
});
