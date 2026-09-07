/**
 * <multicolumn-scroller>
 * Drives the prev/next arrows for a multicolumn grid that has switched to a
 * single-row horizontal scroller (`.grid-layout--overflow-scroll`).
 * The scrolling itself is native overflow; this only wires the arrow buttons
 * and hides them when there is nothing to scroll.
 */
if (!customElements.get('multicolumn-scroller')) {
  class MulticolumnScroller extends HTMLElement {
    connectedCallback() {
      this.scroller = this.querySelector('.grid-layout--overflow-scroll');
      this.prevButton = this.querySelector('[data-scroll-prev]');
      this.nextButton = this.querySelector('[data-scroll-next]');

      if (!this.scroller || !this.prevButton || !this.nextButton) return;

      this.update = this.update.bind(this);
      this.onPrev = () => this.scrollByPage(-1);
      this.onNext = () => this.scrollByPage(1);

      this.prevButton.addEventListener('click', this.onPrev);
      this.nextButton.addEventListener('click', this.onNext);
      this.scroller.addEventListener('scroll', this.update, { passive: true });
      window.addEventListener('resize', this.update);

      this.update();
    }

    disconnectedCallback() {
      this.prevButton?.removeEventListener('click', this.onPrev);
      this.nextButton?.removeEventListener('click', this.onNext);
      this.scroller?.removeEventListener('scroll', this.update);
      window.removeEventListener('resize', this.update);
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
      this.prevButton.disabled = !hasOverflow || scrollLeft <= 1;
      this.nextButton.disabled = !hasOverflow || scrollLeft >= maxScroll - 1;
    }
  }

  customElements.define('multicolumn-scroller', MulticolumnScroller);
}
