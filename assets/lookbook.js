var check_JS_load = true;

function loadFunction() {
  if (check_JS_load) {
    check_JS_load = false;

    initializeLookbook();
    handleViewLookbook();
    renderDotsNumber();
    handleLookBookAllItemsLayout();
  }
}

function eventLoad() {
  ['keydown', 'mousemove', 'touchstart'].forEach((event) => {
    document.addEventListener(event, () => {
      loadFunction();
    });
  });
}
eventLoad();

function handleViewLookbook() {
  const lookbookPopup = document.querySelector('.lookbook-section-list.style-popup');
  const lookbookOnImage = document.querySelector('.lookbook-section-list.style-on-image');
  if (lookbookPopup) lookbookViewPopup();
  if (lookbookOnImage) lookbookViewOnImage();
}

function lookbookViewPopup() {
  const lookbookPopup = `
    <div class="lookbook-popup">
      <div class="lookbook-popup-title">
        <h5 class="title w-full">All products</h5>
        <a href="#" class="close lookbook-close">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
      <div class="lookbook-popup-content"></div>
      </div>
    </div>
  `;

  if (!document.querySelector('.lookbook-popup')) {
    document.body.insertAdjacentHTML('beforeend', lookbookPopup);
  }

  const bodyEl = document.body;
  const popupEl = document.querySelector('.lookbook-popup');
  if (!popupEl) return;

  const popupContentEl = popupEl.querySelector('.lookbook-popup-content');
  const popupCloseEl = popupEl.querySelector('.close');
  if (!popupContentEl || !popupCloseEl) return;

  let popupSwiper = null;

  function destroyPopupSwiper() {
    if (popupSwiper && typeof popupSwiper.destroy === 'function') {
      try {
        popupSwiper.destroy(true, true);
      } catch (_) {}
    }
    popupSwiper = null;
  }

  function resetPopupColumnClasses() {
    popupEl.classList.forEach((cls) => {
      if (
        cls.startsWith('column-') ||
        cls.startsWith('md-column-') ||
        cls.startsWith('sm-column-')
      ) {
        popupEl.classList.remove(cls);
      }
    });
  }

  function initPopupSwiper(container) {
    if (typeof window.Swiper === 'undefined') return;

    const swiperEl = container.querySelector('.swiper');
    if (!swiperEl) return;
    const slides = swiperEl.querySelectorAll('.swiper-slide');
    const slideCount = slides.length;

    const desktopView = Math.min(slideCount, 4);
    const tabletView = Math.min(slideCount, Math.max(2, desktopView - 1));
    const mobileView = Math.min(slideCount, Math.max(1.3, desktopView - 2));

    resetPopupColumnClasses();

    popupEl.classList.add(
      `column-${desktopView}`,
      `md-column-${tabletView}`,
      `sm-column-${mobileView}`
    );

    popupSwiper = new window.Swiper(swiperEl, {
      slidesPerView: desktopView,
      spaceBetween: 12,
      pagination: {
        el: container.querySelector('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        nextEl: container.querySelector('.swiper-button-next'),
        prevEl: container.querySelector('.swiper-button-prev'),
      },
      breakpoints: {
        0: { slidesPerView: mobileView },
        640: { slidesPerView: tabletView },
        1024: { slidesPerView: desktopView },
      },
    });
  }

  function buildSlidesFromItem(itemEl) {
    const cards = itemEl ? itemEl.querySelectorAll('.product-card-lookbook') : [];
    const wrapper = document.createElement('div');
    wrapper.className = 'swiper-container-for-popup';
    wrapper.innerHTML = `
      <div class="swiper">
        <div class="swiper-wrapper"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    `;
    const swiperWrapper = wrapper.querySelector('.swiper-wrapper');
    cards.forEach((card) => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      slide.appendChild(card.cloneNode(true));
      swiperWrapper.appendChild(slide);
    });
    return wrapper;
  }

  function openPopupFromButton(btn) {
    const gridItem = btn.closest('li.grid__item');
    if (!gridItem) return;
    bodyEl.classList.add('openLookbookPopup');
    btn.closest('.lookBook__btnShowProducts').classList.add('is-open');

    destroyPopupSwiper();
    popupContentEl.innerHTML = '';

    const slidesContainer = buildSlidesFromItem(gridItem);
    popupContentEl.appendChild(slidesContainer);
    initPopupSwiper(slidesContainer);
  }

  document.addEventListener('click', function (e) {
    const clickedButton = e.target.closest('.lookBook__btnShowProducts');
    const allButtons = document.querySelectorAll('.lookBook__btnShowProducts');

    if (!clickedButton && !e.target.closest('.lookbook-popup')) {
      allButtons.forEach((btn) => {
        btn.classList.remove('is-open');
        btn.querySelector('.show_products')?.classList.remove('hidden');
        btn.querySelector('.hide_products')?.classList.add('hidden');
      });
      bodyEl.classList.remove('openLookbookPopup');
      destroyPopupSwiper();
      popupContentEl.innerHTML = '';
      resetPopupColumnClasses();
      return;
    }

    if (clickedButton) {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = clickedButton.classList.contains('is-open');
      const showText = clickedButton.querySelector('.show_products');
      const hideText = clickedButton.querySelector('.hide_products');

      resetPopupColumnClasses();

      allButtons.forEach((btn) => {
        if (btn !== clickedButton) {
          btn.classList.remove('is-open');
          btn.querySelector('.show_products')?.classList.remove('hidden');
          btn.querySelector('.hide_products')?.classList.add('hidden');
        }
      });

      if (isOpen) {
        clickedButton.classList.remove('is-open');
        bodyEl.classList.remove('openLookbookPopup');
        showText.classList.remove('hidden');
        hideText.classList.add('hidden');
        destroyPopupSwiper();
        popupContentEl.innerHTML = '';
        resetPopupColumnClasses();
      } else {
        clickedButton.classList.add('is-open');
        bodyEl.classList.add('openLookbookPopup');
        showText.classList.add('hidden');
        hideText.classList.remove('hidden');
        openPopupFromButton(clickedButton);
      }
    }
  });

  popupCloseEl.addEventListener('click', function (e) {
    e.preventDefault();
    const allButtons = document.querySelectorAll('.lookBook__btnShowProducts');
    bodyEl.classList.remove('openLookbookPopup');
    allButtons.forEach((btn) => {
      btn.classList.remove('is-open');
      btn.querySelector('.show_products')?.classList.remove('hidden');
      btn.querySelector('.hide_products')?.classList.add('hidden');
    });
    destroyPopupSwiper();
    popupContentEl.innerHTML = '';
    resetPopupColumnClasses();
  });
}

function lookbookViewOnImage() {
  const popupTemplate = `
    <div class="lookBook__imgPopup">
      <a href="#" class="close lookbook-close">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
      <div class="lookBook__imgPopup-wrapper"></div>
    </div>
  `;

  const lookBookItems = document.querySelectorAll('.lookbook-section-list.style-on-image .lookbook-item');

  lookBookItems.forEach((item) => {
    if (!item.querySelector('.lookBook__imgPopup')) {
      item.insertAdjacentHTML('beforeend', popupTemplate);
    }

    const button = item.querySelector('.lookBook__btnShowProducts');
    const popupEl = item.querySelector('.lookBook__imgPopup');
    if (!popupEl) return;

    const wrapper = popupEl.querySelector('.lookBook__imgPopup-wrapper');
    const closeBtn = popupEl.querySelector('.close');
    if (!wrapper || !closeBtn) return;

    const showText = button?.querySelector('.show_products');
    const hideText = button?.querySelector('.hide_products');

    function getCards() {
      return Array.from(item.querySelectorAll('.product-card-lookbook'))
        .filter((el) => !el.closest('.lookBook__imgPopup'))
        .map((el) => el.cloneNode(true));
    }

    button?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = button.classList.contains('is-open');

      if (isOpen) {
        button.classList.remove('is-open');
        showText.classList.remove('hidden');
        hideText.classList.add('hidden');
        popupEl.classList.remove('is-open');
        wrapper.innerHTML = '';
      } else {
        button.classList.add('is-open');
        showText.classList.add('hidden');
        hideText.classList.remove('hidden');
        wrapper.innerHTML = '';
        getCards().forEach((card) => wrapper.appendChild(card));
        popupEl.classList.add('is-open');
      }
    });

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      popupEl.classList.remove('is-open');
      button.classList.remove('is-open');
      showText.classList.remove('hidden');
      hideText.classList.add('hidden');
      wrapper.innerHTML = '';
    });
  });
}

function renderDotsNumber() {
  const dotNumberSections = document.querySelectorAll('.dots-style-number');

  dotNumberSections.forEach(function(section) {
    const dots = section.querySelectorAll('.lookbook-dot');

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const number = dot.querySelector('.lookbook-dot__icon');
      dot.classList.add('dot-number');

      if (number) {
        number.innerHTML = i + 1;
      }
    }
  });
}

function handleLookBookAllItemsLayout() {
  const lookbookAllItemsLayout = document.querySelectorAll('.lookbook-section-list.lookbook-all-items-layout');

  if (!lookbookAllItemsLayout.length) return;

  lookbookAllItemsLayout.forEach(function(item) {
    const dots = item.querySelectorAll('lookbook-dot .lookbook-dot__content');
    const showProductsBtn = item.querySelector('.lookBook__btnShowProducts');
    const dotElements = item.querySelectorAll('lookbook-dot');
    const allItemsSwiper = item.querySelector('.swiper');

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        initializeActiveDot();

        setTimeout(() => {
          handleSliderChange();
        }, 200);
      }
    });
    observer.observe(item);

    if (showProductsBtn) {
      showProductsBtn.remove();
    }

    dots.forEach(function(content) {
      content.classList.add('hidden');
    });

    function getDotProductId(dot) {
      const productInfoEl = dot.querySelector('[data-json-product]');
      if (!productInfoEl) return null;

      try {
        const productInfoJson = JSON.parse(productInfoEl.getAttribute('data-json-product'));
        return productInfoJson.id;
      } catch (error) {
        console.warn('Error parsing product info:', error);
        return null;
      }
    }

    function getSlideProductId(slide) {
      const productIdEl = slide.querySelector('[data-product-card-id]');
      return productIdEl ? productIdEl.getAttribute('data-product-card-id') : null;
    }

    function updateActiveDot(productId) {
      if (!productId) return;

      dotElements.forEach(function(dot) {
        const dotProductId = getDotProductId(dot);
        const dotElement = dot.closest('lookbook-dot');

        if (dotProductId == productId) {
          dotElement.classList.add('is-active');
        } else {
          dotElement.classList.remove('is-active');
        }
      });
    }

    function initializeActiveDot() {
      if (!allItemsSwiper) return;

      const activeSlide = allItemsSwiper.querySelector('.swiper-slide');

      if (activeSlide) {
        const activeProductId = getSlideProductId(activeSlide);
        updateActiveDot(activeProductId);
      }
    }

    function handleDotClick(dot) {
      const productId = getDotProductId(dot);
      if (!productId || !allItemsSwiper || !allItemsSwiper.swiper) return;

      const swiperInstance = allItemsSwiper.swiper;
      const slides = Array.from(allItemsSwiper.querySelectorAll('.swiper-slide'));

      const targetSlideIndex = slides.findIndex(slide => {
        const slideProductId = getSlideProductId(slide);
        return slideProductId == productId;
      });

      if (targetSlideIndex >= 0) {
        swiperInstance.slideTo(targetSlideIndex, 600);
        setTimeout(() => {
          updateActiveDot(productId);
        }, 100);
      }
    }

    dotElements.forEach(function(dot) {
      dot.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleDotClick(dot);
      });
    });

    function handleSliderChange() {
      if (allItemsSwiper && allItemsSwiper.swiper) {
        allItemsSwiper.swiper.on('slideChangeTransitionEnd', function() {
          const activeSlide = this.el.querySelector('.swiper-slide-active');
          if (activeSlide) {
            const activeProductId = getSlideProductId(activeSlide);
            updateActiveDot(activeProductId);
          }
        });
      }
    }
  });
}

function initializeLookbook() {
  class LookbookDot extends HTMLElement {
    constructor() {
      super();
      this.content = this.querySelector('.lookbook-dot__content');
      this.handleClick = this.handleClick.bind(this);
      this.handleHover = this.handleHover.bind(this);
    }

    connectedCallback() {
      if (theme.config.mqlDesktop) {
        this.addEventListener('mouseenter', this.handleHover);
      } else {
        this.addEventListener('click', this.handleClick);
      }
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.handleClick);
      this.removeEventListener('mouseenter', this.handleHover);
    }

    handleHover(e) {
      this.handleClick(e);

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      this.dispatchEvent(clickEvent);
    }

    handleClick(e) {
      e.preventDefault();
      e.stopPropagation();

      const allDots = document.querySelectorAll('lookbook-dot');
      const alreadyActive = this.classList.contains('is-active');
      const isShowProductsDot = this.classList.contains('lookbook-dot--showProducts');
      const isAllItemsLayout = this.closest('.lookbook-section-list.lookbook-all-items-layout');

      allDots.forEach(dot => {
        if (!alreadyActive) {
          dot.classList.remove('is-active');
          dot.querySelector('.lookbook-dot__content')?.classList.remove('is-open');
        }
      });

      if (!alreadyActive) {
        this.classList.add('is-active');
        this.content?.classList.add('is-open');
      }

      // class lookbook-dot--showProducts
      if (isShowProductsDot) {
        const productInfoEl = this.querySelector('[data-json-product]');
        if (!productInfoEl) return;

        try {
          JSON.parse(productInfoEl.getAttribute('data-json-product'));
        } catch (err) {
          console.warn('Invalid product data in lookbook-dot:', err);
          return;
        }

        let popupEl = document.querySelector('.lookbook-popup');
        if (!popupEl) {
          lookbookViewPopup();
          popupEl = document.querySelector('.lookbook-popup');
        }
        if (!popupEl) return;

        const bodyEl = document.body;
        const popupContentEl = popupEl.querySelector('.lookbook-popup-content');
        const popupCloseEl = popupEl.querySelector('.close');
        if (!popupContentEl || !popupCloseEl) return;

        popupContentEl.innerHTML = '';

        if (!isAllItemsLayout) {
          bodyEl.classList.add('openLookbookPopup');
        }

        const productCard = this.querySelector('.product-card-lookbook');
        if (productCard) {
          const wrapper = document.createElement('div');
          wrapper.classList.add('lookbook-single-product');
          wrapper.appendChild(productCard.cloneNode(true));
          popupContentEl.appendChild(wrapper);

          popupEl.classList.forEach(cls => {
            if (
              cls.startsWith('column-') ||
              cls.startsWith('md-column-') ||
              cls.startsWith('sm-column-')
            ) popupEl.classList.remove(cls);
          });
          popupEl.classList.add('column-1', 'md-column-1', 'sm-column-1');
        }

        if (!popupCloseEl.dataset.singleDotBound) {
          popupCloseEl.dataset.singleDotBound = 'true';
          popupCloseEl.addEventListener('click', function (event) {
            event.preventDefault();
            bodyEl.classList.remove('openLookbookPopup');
            popupContentEl.innerHTML = '';
          });
        }
      }

      // class lookBook__btnShowProducts
      else if (!theme.config.mqlDesktop) {
        const lookbookItem = this.closest('.lookbook-item');
        const btnShow = lookbookItem?.querySelector('.lookBook__btnShowProducts');
        btnShow?.click();

        const allDotsArr = Array.from(allDots);
        const index = allDotsArr.indexOf(this);
        const swiperEl = document.querySelector('.lookbook-popup .swiper');
        if (swiperEl?.swiper) swiperEl.swiper.slideTo(index, 600);
      }
    }
  }
  customElements.define('lookbook-dot', LookbookDot);
}