/*
  RECUTEX 2.0 — global behaviour (ES module, deferred).
  Every component is a Custom Element so it initialises itself, including after
  the Theme Editor re-renders a section. No globals besides window.theme (set in layout).
*/

const theme = window.theme ?? { routes: {}, strings: {} };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.documentElement.classList.remove('no-js');

/* ---------- Helpers ---------- */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.description || data.message || 'Request failed'), { data });
  return data;
}

function parseHTML(html) {
  return new DOMParser().parseFromString(html, 'text/html');
}

function define(name, constructor) {
  if (!customElements.get(name)) customElements.define(name, constructor);
}

/* ---------- Drawer (menu, search, filters, cart) ---------- */

class DrawerPanel extends HTMLElement {
  connectedCallback() {
    this.panel = this.querySelector('.drawer__panel');
    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-drawer-close]')) this.close();
    });
    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.close();
      if (event.key === 'Tab') this.trapFocus(event);
    });
  }

  get isOpen() {
    return this.hasAttribute('open');
  }

  open(opener) {
    if (this.isOpen) return;
    this.opener = opener ?? document.activeElement;
    this.setAttribute('open', '');
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    document.querySelectorAll(`[aria-controls="${this.id}"]`).forEach((el) => el.setAttribute('aria-expanded', 'true'));
    const focusTarget = this.querySelector('[autofocus], input[type="search"]') ?? this.panel;
    requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    this.dispatchEvent(new CustomEvent('drawer:open', { bubbles: true }));
  }

  close() {
    if (!this.isOpen) return;
    this.removeAttribute('open');
    this.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.drawer[open]')) document.body.classList.remove('is-locked');
    document
      .querySelectorAll(`[aria-controls="${this.id}"]`)
      .forEach((el) => el.setAttribute('aria-expanded', 'false'));
    this.opener?.focus?.({ preventScroll: true });
  }

  trapFocus(event) {
    const focusable = [...this.panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
define('drawer-panel', DrawerPanel);

// Any element with data-drawer-open="<id>" opens that drawer.
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-drawer-open]');
  if (!trigger) return;
  const drawer = document.getElementById(trigger.dataset.drawerOpen);
  if (!drawer?.open) return;
  event.preventDefault();
  drawer.open(trigger);
});

/* ---------- Sticky header ---------- */

class StickyHeader extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.section-header');
    this.hideOnScroll = this.dataset.hideOnScroll === 'true';
    this.lastY = window.scrollY;
    this.onScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      this.classList.toggle('is-scrolled', y > 8);
      if (this.hideOnScroll && this.section && !document.querySelector('.mega-menu.is-open')) {
        const goingDown = y > this.lastY;
        this.section.classList.toggle('is-hidden', goingDown && y > 400);
      }
      this.lastY = y;
      this.ticking = false;
    });
  }
}
define('sticky-header', StickyHeader);

/* ---------- Mega menu (disclosure pattern; hover-intent on pointer devices) ---------- */

class MegaMenu extends HTMLElement {
  connectedCallback() {
    this.triggers = [...this.querySelectorAll('.site-nav__trigger')];
    const canHover = window.matchMedia('(hover: hover)').matches;

    this.triggers.forEach((trigger) => {
      const item = trigger.parentElement;
      trigger.addEventListener('click', () => this.toggle(trigger));
      if (canHover) {
        item.addEventListener('mouseenter', () => {
          clearTimeout(this.closeTimer);
          this.openTimer = setTimeout(() => this.open(trigger), 90);
        });
        item.addEventListener('mouseleave', () => {
          clearTimeout(this.openTimer);
          this.closeTimer = setTimeout(() => this.close(trigger), 180);
        });
      }
    });

    this.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const open = this.triggers.find((t) => t.getAttribute('aria-expanded') === 'true');
      if (open) {
        this.close(open);
        open.focus();
      }
    });

    this.addEventListener('focusout', (event) => {
      if (!this.contains(event.relatedTarget)) this.triggers.forEach((t) => this.close(t));
    });
  }

  panelFor(trigger) {
    return document.getElementById(trigger.getAttribute('aria-controls'));
  }

  toggle(trigger) {
    // Ignore the click that immediately follows a hover-open, so hover + click doesn't close it.
    const justOpened = Date.now() - (this.openedAt ?? 0) < 400;
    if (trigger.getAttribute('aria-expanded') === 'true' && !justOpened) this.close(trigger);
    else this.open(trigger);
  }

  open(trigger) {
    this.triggers.filter((t) => t !== trigger).forEach((t) => this.close(t, true));
    const panel = this.panelFor(trigger);
    if (trigger.getAttribute('aria-expanded') !== 'true') this.openedAt = Date.now();
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
  }

  close(trigger, immediate = false) {
    if (trigger.getAttribute('aria-expanded') !== 'true') return;
    const panel = this.panelFor(trigger);
    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    if (immediate || reducedMotion.matches) panel.hidden = true;
    else setTimeout(() => !panel.classList.contains('is-open') && (panel.hidden = true), 280);
  }
}
define('mega-menu', MegaMenu);

/* ---------- Predictive search (Shopify /search/suggest + Section Rendering API) ---------- */

class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input[type="search"]');
    this.results = this.querySelector('#PredictiveSearchResults');
    this.cache = new Map();
    this.input.addEventListener(
      'input',
      debounce(() => this.search(), 220),
    );
    this.input.addEventListener('keydown', (event) => this.onKeydown(event));
  }

  async search() {
    const term = this.input.value.trim();
    if (!term) {
      this.render('');
      return;
    }
    if (this.cache.has(term)) {
      this.render(this.cache.get(term));
      return;
    }
    this.abort?.abort();
    this.abort = new AbortController();
    const params = new URLSearchParams({
      q: term,
      section_id: this.dataset.sectionId,
      'resources[limit]': '6',
      'resources[type]': 'product,collection,page,query',
      'resources[options][unavailable_products]': 'last',
    });
    try {
      const response = await fetch(`${theme.routes.predictiveSearch}?${params}`, { signal: this.abort.signal });
      if (!response.ok) throw new Error(response.status);
      const html = parseHTML(await response.text()).querySelector('.predictive-results')?.outerHTML ?? '';
      this.cache.set(term, html);
      this.render(html);
    } catch (error) {
      if (error.name !== 'AbortError') this.render('');
    }
  }

  render(html) {
    this.results.innerHTML = html;
    this.classList.toggle('has-results', Boolean(html));
    this.input.setAttribute('aria-expanded', String(Boolean(html)));
    this.activeIndex = -1;
  }

  onKeydown(event) {
    const options = [...this.results.querySelectorAll('[role="option"]')];
    if (!options.length || !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
    if (event.key === 'Enter') {
      const active = options[this.activeIndex];
      if (active) {
        event.preventDefault();
        active.querySelector('a').click();
      }
      return;
    }
    event.preventDefault();
    const step = event.key === 'ArrowDown' ? 1 : -1;
    this.activeIndex = (this.activeIndex + step + options.length) % options.length;
    options.forEach((option, index) => option.setAttribute('aria-selected', String(index === this.activeIndex)));
    this.input.setAttribute('aria-activedescendant', options[this.activeIndex].id);
    options[this.activeIndex].scrollIntoView({ block: 'nearest' });
  }
}
define('predictive-search', PredictiveSearch);

/* ---------- Quantity stepper ---------- */

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const min = Number(this.input.min || 0);
      const current = Number(this.input.value) || 0;
      const next = button.name === 'plus' ? current + 1 : Math.max(min, current - 1);
      if (next === current) return;
      this.input.value = next;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}
define('quantity-input', QuantityInput);

/* ---------- Cart drawer (Ajax Cart API + Section Rendering API) ---------- */

class CartDrawer extends DrawerPanel {
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('change', (event) => {
      const input = event.target.closest('[data-line-quantity]');
      if (input) this.updateLine(Number(input.dataset.lineQuantity), Number(input.value));
    });
    this.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-line-remove]');
      if (remove) this.updateLine(Number(remove.dataset.lineRemove), 0);
    });
  }

  get sectionId() {
    return this.closest('[id^="shopify-section-"]')?.id.replace('shopify-section-', '') ?? 'cart-drawer';
  }

  async updateLine(line, quantity) {
    this.querySelector(`[data-line="${line}"]`)?.classList.add('is-updating');
    try {
      const cart = await fetchJSON(`${theme.routes.cartChange}.js`, {
        method: 'POST',
        body: JSON.stringify({ line, quantity, sections: [this.sectionId] }),
      });
      this.renderSections(cart.sections);
      updateCartCount(cart.item_count);
    } catch (error) {
      this.querySelector(`[data-line="${line}"]`)?.classList.remove('is-updating');
      this.showError(error.message);
    }
  }

  renderSections(sections) {
    const html = sections?.[this.sectionId];
    if (!html) return;
    const fresh = parseHTML(html).querySelector('cart-drawer .drawer__panel');
    if (!fresh) return;
    this.panel.innerHTML = fresh.innerHTML;
  }

  showError(message) {
    const body = this.querySelector('[data-cart-drawer-body]');
    if (!body) return;
    body.querySelector('.form-message--error')?.remove();
    body.insertAdjacentHTML(
      'afterbegin',
      `<p class="form-message form-message--error" role="alert">${message || theme.strings.cartError}</p>`,
    );
  }
}
define('cart-drawer', CartDrawer);

class CartRecommendations extends HTMLElement {
  connectedCallback() {
    fetch(this.dataset.url)
      .then((response) => response.text())
      .then((html) => {
        const content = parseHTML(html).querySelector('.cart-recs');
        if (content) this.innerHTML = content.outerHTML;
      })
      .catch(() => {});
  }
}
define('cart-recommendations', CartRecommendations);

function updateCartCount(count) {
  document.querySelectorAll('[data-cart-count]').forEach((badge) => {
    badge.classList.toggle('is-empty', count === 0);
    badge.firstElementChild.textContent = count;
    badge.classList.remove('is-bumped');
    void badge.offsetWidth; // restart animation
    badge.classList.add('is-bumped');
  });
}

/* ---------- Add to cart (every product form; falls back to normal POST without JS) ---------- */

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[action*="/cart/add"]');
  const drawer = document.querySelector('cart-drawer');
  if (!form || !drawer || theme.cartType !== 'drawer') return;
  event.preventDefault();

  const button = form.querySelector('[type="submit"][name="add"]');
  const errorBox = form.querySelector('[data-form-error]');
  if (button?.getAttribute('aria-disabled') === 'true') return;
  button?.classList.add('is-loading');
  button?.setAttribute('aria-busy', 'true');
  if (errorBox) errorBox.hidden = true;

  const formData = new FormData(form);
  formData.append('sections', drawer.sectionId);
  formData.append('sections_url', window.location.pathname);

  try {
    const response = await fetch(`${theme.routes.cartAdd}.js`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.description || data.message);

    drawer.renderSections(data.sections);
    const cart = await fetchJSON(`${theme.routes.cart}.js`);
    updateCartCount(cart.item_count);

    button?.classList.replace('is-loading', 'is-success');
    setTimeout(() => button?.classList.remove('is-success'), 1600);
    drawer.open(button);
  } catch (error) {
    button?.classList.remove('is-loading');
    if (errorBox) {
      errorBox.textContent = error.message || theme.strings.cartError;
      errorBox.hidden = false;
    } else {
      drawer.open(button);
      drawer.showError(error.message);
    }
  } finally {
    button?.removeAttribute('aria-busy');
  }
});

/* ---------- Rail (native scroll-snap carousel with prev/next buttons) ---------- */

class ProductRail extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.rail');
    this.prev = this.querySelector('[data-rail-prev]');
    this.next = this.querySelector('[data-rail-next]');
    if (!this.track || !this.prev || !this.next) return;
    this.prev.addEventListener('click', () => this.scroll(-1));
    this.next.addEventListener('click', () => this.scroll(1));
    this.track.addEventListener(
      'scroll',
      debounce(() => this.update(), 60),
      { passive: true },
    );
    this.update();
  }

  scroll(direction) {
    const behavior = reducedMotion.matches ? 'auto' : 'smooth';
    this.track.scrollBy({ left: direction * this.track.clientWidth * 0.9, behavior });
  }

  update() {
    const { scrollLeft, scrollWidth, clientWidth } = this.track;
    this.prev.disabled = scrollLeft <= 4;
    this.next.disabled = scrollLeft + clientWidth >= scrollWidth - 4;
  }
}
define('product-rail', ProductRail);

/* ---------- Accordion height animation (Web Animations API over native <details>) ---------- */

document.addEventListener('click', (event) => {
  const summary = event.target.closest('details.accordion > summary');
  if (!summary || reducedMotion.matches) return;
  const details = summary.parentElement;
  const content = details.querySelector('.accordion__content');
  if (!content) return;
  event.preventDefault();

  if (details.open) {
    const animation = content.animate([{ height: `${content.offsetHeight}px` }, { height: '0px' }], {
      duration: 220,
      easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
    });
    animation.onfinish = () => (details.open = false);
  } else {
    details.open = true;
    content.animate(
      [
        { height: '0px', opacity: 0 },
        { height: `${content.offsetHeight}px`, opacity: 1 },
      ],
      {
        duration: 280,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    );
  }
});

/* ---------- Reveal on scroll (IntersectionObserver, no scroll-jacking) ---------- */

function initReveal(root = document) {
  const targets = root.querySelectorAll('[data-reveal]:not(.is-visible)');
  if (!document.documentElement.classList.contains('js-reveal') || reducedMotion.matches) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          entry.target.style.setProperty('--reveal-index', index);
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => observer.observe(el));
}

initReveal();

/* ---------- Collection sort: submit on change (a <noscript> button covers no-JS) ---------- */

document.addEventListener('change', (event) => {
  const select = event.target.closest('select[data-autosubmit]');
  if (select) select.form.requestSubmit();
});

/* ---------- Theme Editor support ---------- */

document.addEventListener('shopify:section:load', (event) => initReveal(event.target));
document.addEventListener('shopify:section:unload', () => document.body.classList.remove('is-locked'));
