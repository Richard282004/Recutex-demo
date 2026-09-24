/*
  Collection filtering + sorting without page reloads (Section Rendering API).
  The underlying <form> works without JS; this only enhances it.
*/

function define(name, constructor) {
  if (!customElements.get(name)) customElements.define(name, constructor);
}

class CollectionFilters extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('[data-facets-form]');
    if (!this.form) return;
    this.sectionId = this.dataset.sectionId;

    this.form.addEventListener('change', (event) => {
      const isNumber = event.target.type === 'number';
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.update(this.formQuery()), isNumber ? 600 : 0);
    });
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.update(this.formQuery());
    });
    this.addEventListener('click', (event) => {
      const link = event.target.closest('[data-facet-link]');
      if (!link) return;
      event.preventDefault();
      this.update(new URL(link.href, window.location.origin).searchParams.toString());
    });
    window.addEventListener('popstate', () => this.update(window.location.search.slice(1), false));

    // On desktop the filters drawer is a static sidebar: expose it to assistive tech.
    this.desktop = window.matchMedia('(width >= 990px)');
    this.syncFacets = this.syncFacets.bind(this);
    this.desktop.addEventListener('change', this.syncFacets);
    this.syncFacets();
  }

  disconnectedCallback() {
    this.desktop?.removeEventListener('change', this.syncFacets);
  }

  syncFacets() {
    const facets = this.querySelector('.facets');
    const panel = facets?.querySelector('.drawer__panel');
    if (!facets || !panel) return;
    if (this.desktop.matches) {
      facets.close?.();
      facets.setAttribute('aria-hidden', 'false');
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    } else {
      facets.setAttribute('aria-hidden', String(!facets.hasAttribute('open')));
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
    }
  }

  formQuery() {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(this.form)) {
      if (value !== '') params.append(key, value);
    }
    return params.toString();
  }

  async update(query, push = true) {
    this.abort?.abort();
    this.abort = new AbortController();
    const results = this.querySelector('[data-results]');
    results?.setAttribute('aria-busy', 'true');
    results?.classList.add('is-loading');

    try {
      const url = `${window.location.pathname}?${query}${query ? '&' : ''}section_id=${this.sectionId}`;
      const response = await fetch(url, { signal: this.abort.signal });
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

      ['[data-results]', '[data-results-count]', '[data-facets]', '.collection__filter-toggle'].forEach((selector) => {
        const fresh = doc.querySelector(selector);
        const current = this.querySelector(selector);
        if (fresh && current) current.innerHTML = fresh.innerHTML;
      });
      this.querySelectorAll('[data-results] [data-reveal]').forEach((el) => el.classList.add('is-visible'));
      if (push) window.history.pushState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    } catch (error) {
      if (error.name !== 'AbortError') window.location.assign(`${window.location.pathname}?${query}`);
    } finally {
      const fresh = this.querySelector('[data-results]');
      fresh?.removeAttribute('aria-busy');
      fresh?.classList.remove('is-loading');
    }
  }
}
define('collection-filters', CollectionFilters);
