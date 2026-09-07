class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.overlay = this.querySelector('[id^="CartDrawer-Overlay"]');
    this.overlay?.addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();

    if (Shopify.designMode) {
      document.addEventListener('shopify:section:select', (e) => {
        if (e.target.matches('.section-cart-drawer')) this.open();
      });

      document.addEventListener('shopify:section:deselect', (e) => {
        if (e.target.matches('.section-cart-drawer')) this.close();
      });
    }
  }

  connectedCallback() {
    if (!this.dataset.moved) {
      this.dataset.moved = true;
      document.body.appendChild(this);
    }
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('.cart-icon--drawer');
    cartLink?.setAttribute('role', 'button');
    cartLink?.setAttribute('aria-haspopup', 'dialog');
    cartLink?.addEventListener('click', (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink?.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
    });

    const cartDrawerDirection = this.getAttribute("data-drawer-direction");
    const contentElement = this.querySelector("[data-drawer-content]");

    this.classList.add("open");

    let rtl = typeof theme !== "undefined" && theme.config && theme.config.rtl === true;
    let drawerDirection = cartDrawerDirection;

    if (rtl) {
      drawerDirection = drawerDirection === "left" ? "right" : "left";
    }

    Motion.timeline([
      [
        contentElement,
        {
          opacity: [0, 1],
          transform:
            drawerDirection === "left"
              ? ["translateX(-100%)", "translateX(0)"]
              : ["translateX(100%)", "translateX(0)"],
        },
        { duration: 0.3, easing: [0.61, 0.22, 0.23, 1], at: "-0.05" },
      ],
    ]);

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });

    document.body.classList.add('overflow-hidden');
    document.documentElement.setAttribute('scroll-lock', '');
  }

  async close() {
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
    document.documentElement.removeAttribute('scroll-lock');
    const cartDrawerDirection = this.getAttribute("data-drawer-direction");
    const contentElement = this.querySelector("[data-drawer-content]");

    let rtl = typeof theme !== "undefined" && theme.config && theme.config.rtl === true;
    let drawerDirection = cartDrawerDirection;
    
    if (rtl) {
      drawerDirection = drawerDirection === "left" ? "right" : "left";
    }

    await Motion.timeline([
      [
        contentElement,
        {
          opacity: [1, 0],
          transform:
            drawerDirection === "left"
              ? ["translateX(0)", "translateX(-100%)"]
              : ["translateX(0)", "translateX(100%)"],
        },
        { duration: 0.3, easing: [0.61, 0.22, 0.23, 1] },
      ]
    ]).finished;

    this.classList.remove("open");
    this.classList.remove('active');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    
    const cartItemsContainer = this.querySelector('#CartDrawer-CartItems');
    const popularProductsBlock = cartItemsContainer?.querySelector('.cart-drawer__recommendations');
    const preservedPopularProducts = popularProductsBlock ? popularProductsBlock.outerHTML : null;
    
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      if (sectionElement && parsedState.sections && parsedState.sections[section.id]) {
        sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }
    });

    if (preservedPopularProducts) {
      const newCartItemsContainer = this.querySelector('#CartDrawer-CartItems');
      const newPopularProductsBlock = newCartItemsContainer?.querySelector('.cart-drawer__recommendations');
      if (!newPopularProductsBlock && newCartItemsContainer) {
        const statusElements = newCartItemsContainer.querySelectorAll('p[role="status"]');
        if (statusElements.length > 0) {
          statusElements[0].insertAdjacentHTML('beforebegin', preservedPopularProducts);
        } else {
          newCartItemsContainer.insertAdjacentHTML('beforeend', preservedPopularProducts);
        }
      }
    }

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}
if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);

class ModalComponent extends HTMLElement {
  constructor() {
    super();
    this.querySelector('#Modal-Overlay')?.addEventListener('click', this.close.bind(this));

    const modalId = `#${this.id}`;
    const toggleButtons = document.querySelectorAll(`[data-drawer-toggle="${modalId}"]`);

    toggleButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.isOpen ? this.close() : this.show(button);
      });
    });

    // Shopify Design Mode
    if (Shopify.designMode && this.hasAttribute('check-shopify-design-mode')) {
      this.addEventListener('shopify:block:select', () => (this.isOpen = true));
      this.addEventListener('shopify:block:deselect', () => (this.isOpen = false));
    }
  }

  connectedCallback() {
    if (!this.dataset.moved) {
      this.dataset.moved = true;
      document.body.appendChild(this);
    }
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      this.setAttribute('aria-expanded', newValue === '' ? 'true' : 'false');
    }
  }

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(value) {
    if (value !== this._isOpen) {
      this._isOpen = value;
      if (this.isConnected) {
        this._animate(value);
      } else {
        value ? this.setAttribute('open', '') : this.removeAttribute('open');
      }
    }
    this.setAttribute('aria-expanded', value ? 'true' : 'false');
  }

  show(opener) {
    this.openedBy = opener;
    this.isOpen = true;
    this.trapFocus();
  }

  close() {
    this.isOpen = false;
    removeTrapFocus(this.openedBy);
  }

  async _animate(open) {
    const inner = this.querySelector('.modal__inner');
    const content = this.querySelector('.modal-content');
    const header = this.querySelector('.modal-header');
    this.style.overflow = 'hidden';

    if (open) {
      this.setAttribute('open', '');
      await Motion.timeline([
        [inner, { opacity: [0, 1], transform: ['translateY(2rem)', 'translateY(0)'] }, { duration: 0.4, easing: 'cubic-bezier(0.7, 0, 0.3, 1)' }],
        [content, { opacity: [0, 1], transform: ['translateY(1rem)', 'translateY(0)'] }, { duration: 0.3, at: '-0.15' }],
        [header, { opacity: [0, 1], transform: ['translateY(-0.5rem)', 'translateY(0)'] }, { duration: 0.3, at: '-0.2' }],
      ]).finished;
    } else {
      await Motion.timeline([
        [header, { opacity: [1, 0], transform: ['translateY(0)', 'translateY(-0.5rem)'] }, { duration: 0.2 }],
        [content, { opacity: [1, 0], transform: ['translateY(0)', 'translateY(1rem)'] }, { duration: 0.2 }],
        [inner, { opacity: [1, 0], transform: ['translateY(0)', 'translateY(2rem)'] }, { duration: 0.25, easing: 'cubic-bezier(0.7, 0, 0.3, 1)' }],
      ]).finished;
      this.removeAttribute('open');
    }

    this.style.overflow = 'visible';
  }

  trapFocus() {
    this.addEventListener(
      'transitionend',
      () => {
        const container = this.querySelector('.modal__inner');
        const focusEl = this.querySelector('.modal__close');
        trapFocus(container, focusEl);
      },
      { once: true }
    );
  }
}

if (!customElements.get('modal-component')) {
  customElements.define('modal-component', ModalComponent);
}
