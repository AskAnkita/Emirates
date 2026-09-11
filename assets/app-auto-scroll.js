/**
 * <app-auto-scroll>
 * Slowly auto-scrolls the horizontal carousel rendered by an app block (e.g. Quinn
 * shoppable reels).
 *
 * App blocks render client-side, often lazily (Quinn can wait until the widget is in
 * view), and swap their loading placeholders for the real carousel. So instead of
 * locking onto one element, this keeps following the first horizontally scrollable
 * descendant (including open shadow roots) that actually overflows, and looks again
 * whenever the app's markup changes. If there is none, the element does nothing.
 *
 * Auto-scrolling pauses while the carousel is hovered, pressed, dragged, wheeled,
 * focused or touched, and resumes shortly after. It loops endlessly: each card that
 * scrolls out on the left is moved (not cloned, so the app's clicks and videos keep
 * working) to the end of the row. If the row overflows by less than one card it rewinds
 * to the start instead. It is skipped for visitors who prefer reduced motion, and
 * dragging is left to the app itself.
 */
if (!customElements.get('app-auto-scroll')) {
  // Loading placeholders apps render before their real content (e.g. Quinn's `.quinn_card_loading`).
  const PLACEHOLDER_SELECTOR = '[class*="_loading"], [class*="skeleton"]';

  class AppAutoScroll extends HTMLElement {
    connectedCallback() {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      this.speed = parseFloat(this.dataset.speed) || 40; // pixels per second
      this.resumeDelay = 2500;
      this.holds = new Set();
      this.paused = false;
      this.visible = true;
      this.stale = true;
      this.readyAt = null;
      this.scroller = null;
      this.lastLookup = -Infinity;
      this.abort = new AbortController();
      this.tick = this.tick.bind(this);

      const { signal } = this.abort;
      const release = (reason) => () => this.holds.has(reason) && this.setHold(reason, false);

      this.addEventListener('pointerenter', (event) => event.pointerType === 'mouse' && this.setHold('hover', true), { signal });
      this.addEventListener('pointerleave', (event) => event.pointerType === 'mouse' && this.setHold('hover', false), { signal });
      this.addEventListener('pointerdown', () => this.setHold('press', true), { signal });
      window.addEventListener('pointerup', release('press'), { signal });
      window.addEventListener('pointercancel', release('press'), { signal });
      this.addEventListener('touchstart', () => this.setHold('touch', true), { passive: true, signal });
      this.addEventListener('touchend', release('touch'), { passive: true, signal });
      this.addEventListener('touchcancel', release('touch'), { passive: true, signal });
      this.addEventListener('focusin', () => this.setHold('focus', true), { signal });
      this.addEventListener('focusout', () => this.setHold('focus', false), { signal });
      this.addEventListener(
        'wheel',
        () => {
          this.setHold('wheel', true);
          this.setHold('wheel', false);
        },
        { passive: true, signal }
      );

      // The app mounts its carousel late and replaces placeholders; re-check when it does.
      this.mutationObserver = new MutationObserver(() => {
        this.stale = true;
      });
      this.mutationObserver.observe(this, { childList: true, subtree: true });

      this.intersectionObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
      });
      this.intersectionObserver.observe(this);

      this.frame = requestAnimationFrame(this.tick);
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      clearTimeout(this.resumeTimer);
      this.mutationObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      this.abort?.abort();
    }

    overflows(element) {
      return element.scrollWidth - element.clientWidth > 1;
    }

    locateScroller(root) {
      for (const element of root.querySelectorAll('*')) {
        if (element.shadowRoot) {
          const inner = this.locateScroller(element.shadowRoot);
          if (inner) return inner;
        }
        if (this.overflows(element)) {
          const { overflowX } = getComputedStyle(element);
          if (overflowX === 'auto' || overflowX === 'scroll') return element;
        }
      }
      return null;
    }

    // True while the app still shows its skeleton row, i.e. placeholders sitting directly in a
    // scroll container. Per-card loading states nested inside real cards don't count.
    isLoading() {
      return [...this.querySelectorAll(PLACEHOLDER_SELECTOR)].some((placeholder) => {
        const parent = placeholder.parentElement;
        if (!parent) return false;
        const { overflowX } = getComputedStyle(parent);
        return overflowX === 'auto' || overflowX === 'scroll';
      });
    }

    // Endless loop: once the first card has fully left the view, move that same element to
    // the end of the row and shift the scroll position back by its width, so nothing jumps.
    recycle(scroller) {
      // Don't reorder while the app is still adding cards, or new ones could land out of order.
      const count = scroller.childElementCount;
      if (count !== this.cardCount) {
        this.cardCount = count;
        this.cardCountChangedAt = performance.now();
      }
      if (performance.now() - this.cardCountChangedAt < 3000) return false;

      const step = this.loopStep(scroller);
      if (this.position < step) return false;

      const first = scroller.firstElementChild;
      try {
        scroller.moveBefore ? scroller.moveBefore(first, null) : scroller.append(first);
      } catch {
        scroller.append(first);
      }
      this.position -= step;
      scroller.scrollLeft = this.position;
      return true;
    }

    // Distance between the first two cards (width + gap), or Infinity when looping isn't possible.
    loopStep(scroller) {
      const first = scroller.firstElementChild;
      const second = first?.nextElementSibling;
      const step = second ? second.offsetLeft - first.offsetLeft : 0;
      return step > 0 ? step : Infinity;
    }

    adopt(scroller) {
      if (scroller === this.scroller) return;
      this.scroller = scroller;
      if (!scroller) return;

      this.direction = getComputedStyle(scroller).direction === 'rtl' ? -1 : 1;
      this.position = Math.abs(scroller.scrollLeft);

      // Snap points and smooth scrolling fight the small programmatic scroll steps.
      scroller.style.scrollSnapType = 'none';
      scroller.style.scrollBehavior = 'auto';
    }

    setHold(reason, active) {
      if (active) {
        this.holds.add(reason);
      } else {
        this.holds.delete(reason);
      }

      clearTimeout(this.resumeTimer);
      if (this.holds.size) {
        this.paused = true;
        return;
      }
      this.resumeTimer = setTimeout(() => {
        if (this.scroller) this.position = Math.abs(this.scroller.scrollLeft);
        this.paused = false;
      }, this.resumeDelay);
    }

    tick(time) {
      const elapsed = this.lastTime ? Math.min(time - this.lastTime, 100) : 0;
      this.lastTime = time;
      this.frame = requestAnimationFrame(this.tick);

      if (this.paused || !this.visible) return;

      const current = this.scroller;
      const needsLookup = this.stale || !current || !current.isConnected || !this.overflows(current);
      if (needsLookup && time - this.lastLookup > 500) {
        this.lastLookup = time;
        this.stale = false;
        // Leave the carousel alone while the app is still swapping in its content: scrolling
        // the placeholder row can stop the app (e.g. Quinn) from ever replacing the placeholders.
        const loading = this.isLoading();
        if (loading) {
          this.readyAt = null;
        } else if (this.readyAt == null) {
          this.readyAt = time;
        }
        this.adopt(loading ? null : this.locateScroller(this));
      }

      // Give the freshly rendered carousel a moment to settle before moving it.
      if (this.readyAt == null || time - this.readyAt < 1500) return;

      const { scroller } = this;
      if (!scroller || !scroller.isConnected) return;

      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      if (maxScroll <= 1) return;

      // Pick up where the visitor (or the app's own arrows/drag) left the carousel.
      if (Math.abs(Math.abs(scroller.scrollLeft) - this.position) > 2) {
        this.position = Math.abs(scroller.scrollLeft);
      }

      this.position += (this.speed * elapsed) / 1000;

      if (this.direction === 1 && this.recycle(scroller)) return;

      if (this.position >= maxScroll - 1) {
        // Hold at the end until the loop can move a card (the app may still be adding cards);
        // rewind only when looping isn't possible.
        if (this.direction === 1 && this.loopStep(scroller) <= maxScroll) {
          this.position = maxScroll;
          scroller.scrollLeft = maxScroll;
          return;
        }
        this.rewind();
      } else {
        scroller.scrollLeft = this.position * this.direction;
      }
    }

    rewind() {
      this.paused = true;
      clearTimeout(this.resumeTimer);
      this.resumeTimer = setTimeout(() => {
        this.scroller?.scrollTo({ left: 0, behavior: 'smooth' });
        this.position = 0;
        this.resumeTimer = setTimeout(() => {
          if (!this.holds.size) this.paused = false;
        }, 1500);
      }, 1500);
    }
  }

  customElements.define('app-auto-scroll', AppAutoScroll);
}
