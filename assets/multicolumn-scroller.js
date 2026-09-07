/**
 * <multicolumn-scroller>
 * Drives the prev/next arrows for a multicolumn grid that has switched to a
 * single-row horizontal scroller (`.grid-layout--overflow-scroll`).
 *
 * The arrows are the theme's default carousel buttons (`swiper-button` snippet).
 * Since this is native overflow scrolling and not a Swiper instance, this
 * element wires the clicks/keyboard and toggles `swiper-button-disabled`
 * itself, mirroring what Swiper would normally do.
 */
if (!customElements.get('multicolumn-scroller')) {
  class MulticolumnScroller extends HTMLElement {
    connectedCallback() {
      this.scroller = this.querySelector('.grid-layout--overflow-scroll');
      this.prevButton = this.querySelector('.swiper-button-prev');
      this.nextButton = this.querySelector('.swiper-button-next');

      if (!this.scroller || !this.prevButton || !this.nextButton) return;

      this.setupButton(this.prevButton, this.dataset.prevLabel || 'Previous', () => this.scrollByPage(-1));
      this.setupButton(this.nextButton, this.dataset.nextLabel || 'Next', () => this.scrollByPage(1));

      this.update = this.update.bind(this);
      this.scroller.addEventListener('scroll', this.update, { passive: true });
      window.addEventListener('resize', this.update);

      this.update();
    }

    disconnectedCallback() {
      this.scroller?.removeEventListener('scroll', this.update);
      window.removeEventListener('resize', this.update);
    }

    setupButton(button, label, onActivate) {
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      button.setAttribute('aria-label', label);
      button.addEventListener('click', onActivate);
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          onActivate();
        }
      });
    }

    step() {
      const item = this.scroller.querySelector('.grid__item');
      if (!item) return this.scroller.clientWidth;
      const styles = getComputedStyle(this.scroller);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return item.getBoundingClientRect().width + gap;
    }

    scrollByPage(direction) {
      const step = this.step();
      const perView = Math.max(1, Math.round(this.scroller.clientWidth / step));
      this.scroller.scrollBy({ left: direction * step * perView, behavior: 'smooth' });
    }

    update() {
      const { scrollLeft, scrollWidth, clientWidth } = this.scroller;
      const maxScroll = scrollWidth - clientWidth;
      const hasOverflow = maxScroll > 1;

      this.classList.toggle('multicolumn-scroller--no-nav', !hasOverflow);
      this.prevButton.classList.toggle('swiper-button-disabled', !hasOverflow || scrollLeft <= 1);
      this.nextButton.classList.toggle('swiper-button-disabled', !hasOverflow || scrollLeft >= maxScroll - 1);
    }
  }

  customElements.define('multicolumn-scroller', MulticolumnScroller);
}
