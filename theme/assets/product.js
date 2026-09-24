/*
  Product page components: gallery (swipe, thumbnails, zoom), variant picker, recommendations.
  Loaded only on product pages.
*/

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function define(name, constructor) {
  if (!customElements.get(name)) customElements.define(name, constructor);
}

/* ---------- Gallery: native scroll-snap track, synced thumbnails, <dialog> zoom ---------- */

class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('.product-gallery__track');
    this.slides = [...this.querySelectorAll('.product-gallery__slide')];
    this.thumbs = [...this.querySelectorAll('.product-gallery__thumb')];
    this.counter = this.querySelector('[data-gallery-index]');
    this.dialog = this.querySelector('.zoom-dialog');

    this.thumbs.forEach((thumb) =>
      thumb.addEventListener('click', () => this.goTo(document.getElementById(thumb.dataset.target))),
    );

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry) => this.setActive(entry.target));
      },
      { root: this.track, threshold: 0.6 },
    );
    this.slides.forEach((slide) => this.observer.observe(slide));

    this.addEventListener('click', (event) => {
      const zoom = event.target.closest('[data-zoom-src]');
      if (zoom) this.openZoom(zoom);
      if (event.target.closest('[data-zoom-close]') || event.target === this.dialog) this.dialog.close();
    });

    const current = this.slides.find((slide) => slide.getAttribute('aria-current') === 'true');
    if (current && current !== this.slides[0]) this.goTo(current, 'auto');
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  goTo(slide, behavior) {
    if (!slide) return;
    this.track.scrollTo({
      left: slide.offsetLeft - this.track.offsetLeft,
      behavior: behavior ?? (reducedMotion.matches ? 'auto' : 'smooth'),
    });
    this.setActive(slide);
  }

  goToMedia(mediaId) {
    this.goTo(this.slides.find((slide) => slide.dataset.mediaId === String(mediaId)));
  }

  setActive(slide) {
    const index = this.slides.indexOf(slide);
    this.slides.forEach((s) => s.removeAttribute('aria-current'));
    slide.setAttribute('aria-current', 'true');
    this.thumbs.forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === index)));
    // Scroll only the thumbnail strip (scrollIntoView could also scroll the page).
    const thumb = this.thumbs[index];
    const strip = thumb?.closest('.product-gallery__thumbs');
    if (strip) strip.scrollTo({ left: thumb.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 });
    if (this.counter) this.counter.textContent = index + 1;
  }

  openZoom(button) {
    const source = button.querySelector('img');
    const image = document.createElement('img');
    image.className = 'zoom-dialog__image';
    image.src = button.dataset.zoomSrc;
    image.alt = source?.alt ?? '';
    image.width = source?.width || 2400;
    image.height = source?.height || 2400;
    this.dialog.querySelector('[data-zoom-stage]').replaceChildren(image);
    this.dialog.showModal();
  }
}
define('product-gallery', ProductGallery);

/* ---------- Variant picker ---------- */

class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.variants = JSON.parse(this.querySelector('[data-variants]').textContent);
    this.section = this.closest('[data-section-id]');
    this.addEventListener('change', () => this.onChange());
    this.updateAvailability();
  }

  get selectedOptions() {
    return [...this.querySelectorAll('fieldset')].map((fieldset) => fieldset.querySelector('input:checked')?.value);
  }

  onChange() {
    const selected = this.selectedOptions;
    this.querySelectorAll('[data-option-selected]').forEach((label, i) => (label.textContent = selected[i]));
    this.updateAvailability();

    const variant = this.variants.find((v) => v.options.every((value, i) => value === selected[i]));
    const idInput = this.section.querySelector('[data-variant-id]');
    const submit = this.section.querySelector('.product-form__submit');

    if (!variant) {
      if (submit) {
        submit.disabled = true;
        submit.querySelector('.button__label').textContent = window.theme?.strings.unavailable ?? '';
      }
      return;
    }

    if (idInput) idInput.value = variant.id;
    const url = `${this.dataset.url}?variant=${variant.id}`;
    window.history.replaceState({}, '', url);
    if (variant.featured_media) this.section.querySelector('product-gallery')?.goToMedia(variant.featured_media.id);
    this.renderVariant(url);
  }

  // Marks values that have no available variant given the other selected options.
  updateAvailability() {
    const selected = this.selectedOptions;
    this.querySelectorAll('fieldset').forEach((fieldset, optionIndex) => {
      fieldset.querySelectorAll('input').forEach((input) => {
        const candidate = [...selected];
        candidate[optionIndex] = input.value;
        const available = this.variants.some(
          (v) => v.available && v.options.every((value, i) => value === candidate[i]),
        );
        input.nextElementSibling.classList.toggle('is-unavailable', !available);
      });
    });
  }

  // Re-render price and buy block from Liquid so money formats and states stay exact.
  async renderVariant(url) {
    const sectionId = this.dataset.sectionId;
    this.abort?.abort();
    this.abort = new AbortController();
    try {
      const response = await fetch(`${url}&section_id=${sectionId}`, { signal: this.abort.signal });
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      [`Price-${sectionId}`].forEach((id) => {
        const fresh = doc.getElementById(id);
        const current = document.getElementById(id);
        if (fresh && current) current.innerHTML = fresh.innerHTML;
      });
      const freshBuy = doc.getElementById(`Buy-${sectionId}`);
      const currentBuy = document.getElementById(`Buy-${sectionId}`);
      if (freshBuy && currentBuy) {
        const quantity = currentBuy.querySelector('[name="quantity"]')?.value;
        ['.product__availability', '.product-form__submit'].forEach((selector) => {
          const next = freshBuy.querySelector(selector);
          const prev = currentBuy.querySelector(selector);
          if (next && prev) prev.replaceWith(next);
        });
        const quantityInput = currentBuy.querySelector('[name="quantity"]');
        if (quantity && quantityInput) quantityInput.value = quantity;
      }
    } catch (error) {
      if (error.name !== 'AbortError') window.location.assign(url);
    }
  }
}
define('variant-picker', VariantPicker);

/* ---------- Recommendations (lazy, near viewport) ---------- */

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    if (this.querySelector('.rail')) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        this.load();
      },
      { rootMargin: '0px 0px 400px 0px' },
    );
    observer.observe(this);
  }

  async load() {
    try {
      const response = await fetch(this.dataset.url);
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const fresh = doc.querySelector('product-recommendations');
      if (!fresh?.innerHTML.trim()) return;
      this.innerHTML = fresh.innerHTML;
      this.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    } catch {
      // Recommendations are optional; leave the section empty on failure.
    }
  }
}
define('product-recommendations', ProductRecommendations);
