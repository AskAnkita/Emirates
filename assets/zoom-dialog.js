if (!customElements.get('zoom-dialog')) {
  class ZoomDialog extends HTMLElement {
    constructor() {
      super();
      this.dialog = this.querySelector('dialog');
      this.media = Array.from(this.querySelectorAll('.product-media-container'));
      this.thumbnails = this.querySelector('.dialog-thumbnails-list');
      this.highResImagesLoaded = new Set();

      this.handleScroll = this.debounce(this.handleScrollEvent.bind(this), 50);

      if (this.dialog) {
        this.dialog.addEventListener('scroll', this.handleScroll);
      }
    }

    connectedCallback() {
      this.querySelectorAll('[data-zoom-index]').forEach(trigger => {
        trigger.addEventListener('click', e => {
          const index = Number(trigger.dataset.zoomIndex);

          this.open(index, e);
        });
      });
    }

    disconnectedCallback() {
      if (this.dialog) {
        this.dialog.removeEventListener('scroll', this.handleScroll);
      }
    }

    async open(index, event) {
      event.preventDefault();

      const targetImage = this.media[index];
      const targetThumbnail = this.thumbnails?.children[index];

      const openDialog = () => {
        if (this.dialog.showModal) {
          this.dialog.showModal();
        } else {
          this.dialog.setAttribute('open', '');
        }

        for (const target of [targetThumbnail, targetImage]) {
          target?.scrollIntoView({ behavior: 'smooth' });
        }
      };

      const sourceImage = event.target instanceof Element ? event.target.closest('li,slideshow-slide') : null;

      if (!this.supportsViewTransitions() || !sourceImage || !targetImage) {
        openDialog();
        this.selectThumbnail(index, { behavior: 'auto' });
        return;
      }

      const transitionName = `gallery-item`;
      sourceImage.style.setProperty('view-transition-name', transitionName);

      await this.startViewTransition(() => {
        openDialog();
        sourceImage.style.removeProperty('view-transition-name');
        targetImage.style.setProperty('view-transition-name', transitionName);
      });

      targetImage.style.removeProperty('view-transition-name');
      this.selectThumbnail(index, { behavior: 'auto' });
    }

    closeDialog() {
      if (this.dialog.close) {
        this.dialog.close();
      } else {
        this.dialog.removeAttribute('open');
      }
      window.dispatchEvent(new CustomEvent('dialog-close'));
    }

    async close() {
      if (!this.supportsViewTransitions()) return this.closeDialog();

      const mostVisibleElement = await this.getMostVisibleElement(this.media);
      const activeIndex = this.media.indexOf(mostVisibleElement);
      const transitionName = `gallery-item`;

      const mediaGallery = this.closest('media-gallery');
      const slideshowActive = mediaGallery?.presentation === 'carousel';
      const slide = slideshowActive ? mediaGallery.slideshow?.slides?.[activeIndex] : mediaGallery?.media?.[activeIndex];

      if (!slide) return this.closeDialog();

      this.dialog.classList.add('dialog--closed');
      await this.onAnimationEnd(this.thumbnails);

      mostVisibleElement.style.setProperty('view-transition-name', transitionName);

      await this.startViewTransition(() => {
        mostVisibleElement.style.removeProperty('view-transition-name');
        slide.style.setProperty('view-transition-name', transitionName);
        this.closeDialog();
      });

      slide.style.removeProperty('view-transition-name');
      this.dialog.classList.remove('dialog--closed');
    }

    async handleScrollEvent() {
      const mostVisibleElement = await this.getMostVisibleElement(this.media);
      const activeIndex = this.media.indexOf(mostVisibleElement);
      const targetThumbnail = this.thumbnails?.children[activeIndex];

      if (!targetThumbnail || !(targetThumbnail instanceof HTMLElement)) return;

      Array.from(this.thumbnails.querySelectorAll('button')).forEach((button, i) => {
        button.setAttribute('aria-selected', `${i === activeIndex}`);
      });

      this.loadHighResolutionImage(mostVisibleElement);
      this.dispatchEvent(new CustomEvent('zoom-media:selected', { detail: { index: activeIndex } }));
    }

    async handleThumbnailClick(index) {
      const behavior = this.prefersReducedMotion() ? 'auto' : 'smooth';
      this.selectThumbnail(index, { behavior });
    }

    async selectThumbnail(index, options = { behavior: 'smooth' }) {
      if (!this.thumbnails || !this.thumbnails.children.length) return;
      if (isNaN(index) || index < 0 || index >= this.thumbnails.children.length) return;

      const targetThumbnail = this.thumbnails.children[index];
      if (!targetThumbnail || !(targetThumbnail instanceof HTMLElement)) return;

      Array.from(this.thumbnails.querySelectorAll('button')).forEach((button, i) => {
        button.setAttribute('aria-selected', `${i === index}`);
      });

      this.scrollIntoView(targetThumbnail, {
        ancestor: this.thumbnails,
        behavior: options.behavior,
        block: 'center',
        inline: 'center',
      });

      const targetImage = this.media[index];

      if (targetImage) {
        targetImage.scrollIntoView({
          behavior: options.behavior,
        });

        this.loadHighResolutionImage(targetImage);
      }

      this.dispatchEvent(new CustomEvent('zoom-media-selected', { detail: { index } }));
    }

    loadHighResolutionImage(mediaContainer) {
      if (!mediaContainer.classList.contains('product-media-container--image')) return false;

      const image = mediaContainer.querySelector('img.product-media__image');
      if (!image || !(image instanceof HTMLImageElement)) return false;

      const highResolutionUrl = image.getAttribute('data_max_resolution');
      if (!highResolutionUrl || this.highResImagesLoaded.has(highResolutionUrl)) return false;

      this.preloadImage(highResolutionUrl);

      const newImage = new Image();
      newImage.className = image.className;
      newImage.alt = image.alt;
      newImage.setAttribute('data_max_resolution', highResolutionUrl);

      newImage.onload = () => {
        image.replaceWith(newImage);
        this.highResImagesLoaded.add(highResolutionUrl);
      };

      newImage.src = highResolutionUrl;
    }

    getMostVisibleElement(elements) {
      return new Promise((resolve) => {
        const observer = new IntersectionObserver(
          (entries) => {
            const mostVisible = entries.reduce((prev, current) =>
              current.intersectionRatio > prev.intersectionRatio ? current : prev
            );
            observer.disconnect();
            resolve(mostVisible.target);
          },
          { threshold: [0, 0.5, 1] }
        );
        for (const element of elements) {
          observer.observe(element);
        }
      });
    }

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    supportsViewTransitions() {
      return 'startViewTransition' in document;
    }

    async startViewTransition(callback) {
      if (this.supportsViewTransitions()) {
        return document.startViewTransition(callback);
      } else {
        callback();
      }
    }

    prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    preloadImage(src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }

    onAnimationEnd(element) {
      return new Promise((resolve) => {
        const handleAnimationEnd = () => {
          element.removeEventListener('animationend', handleAnimationEnd);
          resolve();
        };
        element.addEventListener('animationend', handleAnimationEnd);
      });
    }

    scrollIntoView(element, { ancestor, behavior = 'smooth', block = 'start', inline = 'start' } = {}) {
      if (!ancestor) {
        return element.scrollIntoView({ behavior, block, inline });
      }

      const ancestorRect = ancestor.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const calculateScrollOffset = (alignment, ancestorStart, ancestorLength, elemStart, elemLength, currentScroll) => {
        switch (alignment) {
          case 'start':
            return currentScroll + elemStart - ancestorStart;
          case 'center':
            return currentScroll + elemStart - ancestorStart - ancestorLength / 2 + elemLength / 2;
          case 'end':
            return currentScroll + elemStart - ancestorStart - ancestorLength + elemLength;
          default:
            return currentScroll;
        }
      };

      const scrollTop =
        ancestor.scrollHeight > ancestor.clientHeight
          ? calculateScrollOffset(
              block,
              ancestorRect.top,
              ancestor.clientHeight,
              elementRect.top,
              elementRect.height,
              ancestor.scrollTop
          )
          : ancestor.scrollTop;

      const scrollLeft =
        ancestor.scrollWidth > ancestor.clientWidth
          ? Math.max(0, calculateScrollOffset(
              inline,
              ancestorRect.left,
              ancestor.clientWidth,
              elementRect.left,
              elementRect.width,
              ancestor.scrollLeft
            ))
          : ancestor.scrollLeft;

      ancestor.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: behavior
      });
    }
  }

  if (!customElements.get('zoom-dialog')) {
    customElements.define('zoom-dialog', ZoomDialog);
  }
}

document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-zoom-target]');
  if (!trigger) return;

  const targetSelector = trigger.dataset.zoomTarget;
  const zoomDialog = document.querySelector(targetSelector);
  if (!zoomDialog) return;

  const index = Number(trigger.dataset.zoomIndex);

  if (trigger.classList.contains('product-media-container--zoomable')) {
    zoomDialog.open(index, e);
  }

  if (trigger.classList.contains('dialog-thumbnails-list__thumbnail')) {
    zoomDialog.handleThumbnailClick(index);

    const swiperThumbnail = document.querySelector(`.swiper-controls__thumbnail[data-index="${index}"]`);
    if (swiperThumbnail) {
      swiperThumbnail.click();
    }
  }
});

if (!customElements.get('scroll-hint')) {
  class ScrollHint extends HTMLElement {
    connectedCallback() {
      this.addEventListener('scroll', theme.utils.rafThrottle(this.update.bind(this)));
      this.resizeObserver.observe(this);
    }

    disconnectedCallback() {
      this.removeEventListener('scroll', this.update);
      this.resizeObserver.disconnect();
    }

    update = () => {
      const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = this;
      const scrollDirection = scrollWidth > clientWidth ? 'horizontal' : 'vertical';
      const scrollPercentage =
        scrollDirection === 'vertical'
          ? scrollTop / (scrollHeight - clientHeight)
          : scrollLeft / (scrollWidth - clientWidth);

      this.style.maskImage = Number.isNaN(scrollPercentage)
        ? ''
        : `linear-gradient(
          to ${scrollDirection === 'vertical' ? 'bottom' : 'right'},
          transparent ${scrollPercentage > 0 ? 1 : 0}%,
          black ${scrollPercentage < 0.1 ? scrollPercentage * 100 : 10}%,
          black ${scrollPercentage > 0.9 ? scrollPercentage * 100 : 90}%,
          transparent 100%
        )`;
    };

    resizeObserver = new ResizeObserver(this.update);
  }

  customElements.define('scroll-hint', ScrollHint);
}
