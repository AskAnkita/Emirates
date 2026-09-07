if (!customElements.get('skin-tone-controller')) {
  customElements.define(
    'skin-tone-controller',
    class SkinToneController extends HTMLElement {
      connectedCallback() {
        this.input = this.querySelector('input[type="range"]');
        this.valueLabel = this.querySelector('.skin-tone-controller__value');
        // Scope to the single media container this control lives in, so the
        // filter can never reach the rest of the gallery.
        this.container = this.closest('.media-gallery__grid-item') || this.parentElement;

        if (!this.input || !this.container) return;

        this.input.addEventListener('input', () => this.update());
        this.update();
      }

      update() {
        const value = Number(this.input.value);
        const filters = [
          'none',
          'sepia(.12) saturate(.9) hue-rotate(-8deg) brightness(1.03)',
          'sepia(.28) saturate(1.1) hue-rotate(-2deg)',
          'sepia(.42) saturate(1.25) hue-rotate(3deg) brightness(.97)',
          'sepia(.58) saturate(1.4) hue-rotate(7deg) brightness(.9)',
        ];
        const filter = filters[Math.min(Math.floor(value / 20), filters.length - 1)];
        const label = value < 20 ? 'Light' : value < 40 ? 'Fair' : value < 60 ? 'Natural' : value < 80 ? 'Tan' : 'Deep';

        this.container.querySelectorAll('img').forEach((image) => {
          image.style.filter = filter;
        });
        this.valueLabel.textContent = label;
      }
    }
  );
}
