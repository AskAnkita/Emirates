class PromotionPopup extends HTMLElement {
  constructor() {
    super();

    this.expiresDays = this.getAttribute('data-expire') || 1;
    this.timeToShow = parseInt(this.getAttribute('data-delay')) || 0;
    this._storage = this.getBestStorage();

    const popupId = this.id || 'global';
    this.dismissKey = `_halo_promotion_popup_dismiss_${popupId}`;

    this.overlay = this.querySelector('.drawer__overlay') || this.querySelector('[id^="Drawer-Overlay-"]');
    this.content = this.querySelector('.popup__inner');

    this.querySelector('.popup__close')?.addEventListener('click', this.dismiss.bind(this));
    this.overlay?.addEventListener('click', this.dismiss.bind(this));

    if (Shopify.designMode) {
      document.addEventListener('shopify:section:select', (e) => {
        if (!e?.target?.matches?.('.section-promotion-popup')) return;
        const selectedSectionId = e?.detail?.sectionId;
        const mySectionId = (this.id || '').replace('Promotion-popup-', '');
        if (selectedSectionId && mySectionId && selectedSectionId !== mySectionId) return;
        this.setOpenPopup(0);
      });

      document.addEventListener('shopify:section:deselect', (e) => {
        if (!e?.target?.matches?.('.section-promotion-popup')) return;
        const deselectedSectionId = e?.detail?.sectionId;
        const mySectionId = (this.id || '').replace('Promotion-popup-', '');
        if (deselectedSectionId && mySectionId && deselectedSectionId !== mySectionId) return;
        this.close({ persist: false });
      });
    }
  }

  connectedCallback() {
    try { this.load(); } catch (_) { this.setOpenPopup(this.timeToShow); }
  }

  load() {
    this.observeEmailSuccess();

    const hasSuccess = this.querySelector('.email-signup__message--success');
    const hasMessage = this.querySelector('.email-signup__message');

    if (hasSuccess) {
      if (hasMessage) this.classList.add('active');
      if (!Shopify.designMode) this.setOpenPopup(0);
      return;
    }

    if (this.getStore(this.dismissKey)) return;

    if (hasMessage) this.classList.add('active');
    if (!Shopify.designMode) this.setOpenPopup(this.timeToShow);
  }

  observeEmailSuccess() {
    const target = this.querySelector('form') || this;
    this.successObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList.contains('email-signup__message--success')) {
            this.classList.add('active');
            this.setOpenPopup(0);
          }
        });
      });
    });
    this.successObserver.observe(target, { childList: true, subtree: true });
  }

  setOpenPopup(timeToShow) {
    setTimeout(() => {
      this.activeElement = document.activeElement;
      this.setAttribute('open', 'true');
      this.animateOpen();
      document.body.classList.add('overflow-hidden');
      document.documentElement.setAttribute('scroll-lock', '');

      this.addEventListener('transitionend', () => {
        const containerToTrapFocusOn = this.content;
        const focusElement = this.querySelector('.field__input');
        trapFocus(containerToTrapFocusOn, focusElement);
      }, { once: true });
    }, timeToShow);
  }

  close({ persist } = { persist: true }) {
    if (persist) this.setStoreDays(this.dismissKey, '1', this.expiresDays);
    this.animateClose();
    setTimeout(() => {
      this.removeAttribute('open');
      document.body.classList.remove('overflow-hidden');
      document.documentElement.removeAttribute('scroll-lock');
      removeTrapFocus(this.activeElement);
    }, 100);
  }

  animateOpen() {
    Motion.timeline([
      [this.content, { opacity: [0, 1], transform: ['translate(-50%, -40%)', 'translate(-50%, -50%)'] }, { duration: 0.3, at: '-0.15' }]
    ]).finished;
  }

  animateClose() {
    Motion.timeline([
      [this.content, { opacity: [1, 0], transform: ['translate(-50%, -50%)', 'translate(-50%, -40%)'] }, { duration: 0.2 }]
    ]).finished;
  }

  tempClose() {
    this.animateClose();
    setTimeout(() => {
      this.removeAttribute('open');
      document.body.classList.remove('overflow-hidden');
      document.documentElement.removeAttribute('scroll-lock');
      removeTrapFocus(this.activeElement);
    }, 100);
  }

  dismiss() {
    this.close({ persist: true });
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  setStoreDays(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
    this.setStoreUntil(name, value, d);
  }

  setStoreUntil(name, value, date) {
    try {
      if (!this._storage) return;
      var payload = { v: value, exp: date.getTime() };
      this._storage.setItem(name, JSON.stringify(payload));
    } catch (_) {}
  }

  getStore(name) {
    try {
      if (!this._storage) return null;
      var raw = this._storage.getItem(name);
      if (!raw) return null;
      var payload = JSON.parse(raw);
      if (!payload || typeof payload.exp !== 'number') return null;
      if (Date.now() > payload.exp) {
        this._storage.removeItem(name);
        return null;
      }
      return payload.v;
    } catch (_) { return null; }
  }

  getBestStorage() {
    try {
      var k = '__pp_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return window.localStorage;
    } catch (_) {}
    try {
      var k2 = '__pp_test__';
      window.sessionStorage.setItem(k2, '1');
      window.sessionStorage.removeItem(k2);
      return window.sessionStorage;
    } catch (_) {}
    return null;
  }
}
if (!customElements.get('promotion-popup')) customElements.define('promotion-popup', PromotionPopup);