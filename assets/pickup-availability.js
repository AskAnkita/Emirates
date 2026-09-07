if (!customElements.get('pickup-availability')) {
  class PickupAvailability extends HTMLElement {
    constructor() {
      super();

      if (!this.hasAttribute('available')) return;

      this.errorHtml = this.querySelector('template').content.firstElementChild.cloneNode(true);
      this.onClickRefreshList = this.onClickRefreshList.bind(this);
      this.fetchAvailability(this.dataset.variantId);
    }

    fetchAvailability(variantId) {
      if (!variantId) return;

      let rootUrl = this.dataset.rootUrl;
      if (!rootUrl.endsWith('/')) {
        rootUrl = rootUrl + '/';
      }
      const variantSectionUrl = `${rootUrl}variants/${variantId}/?section_id=pickup-availability`;

      fetch(variantSectionUrl)
        .then((response) => response.text())
        .then((text) => {
          const sectionInnerHTML = new DOMParser()
            .parseFromString(text, 'text/html')
            .querySelector('.shopify-section');
          this.renderPreview(sectionInnerHTML);
        })
        .catch((e) => {
          const button = this.querySelector('button');
          if (button) button.removeEventListener('click', this.onClickRefreshList);
          this.renderError();
        });
    }

    onClickRefreshList() {
      this.fetchAvailability(this.dataset.variantId);
    }

    update(variant) {
      if (variant?.available) {
        this.fetchAvailability(variant.id);
      } else {
        this.removeAttribute('available');
        this.innerHTML = '';
      }
    }

    renderError() {
      this.innerHTML = '';
      this.appendChild(this.errorHtml);

      this.querySelector('button').addEventListener('click', this.onClickRefreshList);
    }

    renderPreview(sectionInnerHTML) {
      const drawer = document.querySelector('pickup-availability-drawer');
      if (drawer) drawer.remove();
      if (!sectionInnerHTML.querySelector('pickup-availability-preview')) {
        this.innerHTML = '';
        this.removeAttribute('available');
        return;
      }

      this.innerHTML = sectionInnerHTML.querySelector('pickup-availability-preview').outerHTML;
      this.setAttribute('available', '');

      document.body.appendChild(sectionInnerHTML.querySelector('pickup-availability-drawer'));
      const colorClassesToApply = this.dataset.productPageColorScheme.split(' ');
      colorClassesToApply.forEach((colorClass) => {
        document.querySelector('.pickup-availability-drawer').classList.add(colorClass);
      });

      const button = this.querySelector('button');
      if (button)
        button.addEventListener('click', (evt) => {
          document.querySelector('pickup-availability-drawer').open(evt.target);
        });
    }
  }

  customElements.define('pickup-availability', PickupAvailability);
}

if (!customElements.get('pickup-availability-drawer')) {
  class PickupAvailabilityDrawer extends HTMLElement {
    constructor() {
      super();
      this.addEventListener('keyup', (event) => event.code === 'Escape' && this.close());
      this.overlay = this.querySelector('#PickupAvailabilityDrawer-Overlay');
      this.overlay?.addEventListener('click', this.close.bind(this));
      this.setHeaderAccessibility();
    }

    setHeaderAccessibility() {
      const button = document.querySelector('#ShowPickupAvailabilityDrawer');
      button.setAttribute('role', 'button');
      button.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
          event.preventDefault();
          this.open(button);
        }
      });
    }

    async close() {
      if (this.activeElement) removeTrapFocus(this.activeElement);
      document.body.classList.remove('overflow-hidden');
      document.documentElement.removeAttribute('scroll-lock');
      this.handleTransition(false, 'drawer--closing');

      let rtl = typeof theme !== "undefined" && theme.config && theme.config.rtl === true;
      let drawerDirection = this.getAttribute("data-drawer-direction") || "right";
      const contentElement = this.querySelector("[data-drawer-content]");

      let transform = ['translateX(0)', 'translateX(0)'];
      let duration = 0.3;
      if (drawerDirection === "left") {
        if (rtl) {
          transform = ["translateX(0)", "translateX(100%)"];
        } else {
          transform = ["translateX(0)", "translateX(-100%)"];
        }
      } else if (drawerDirection === "right") {
        if (rtl) {
          transform = ["translateX(0)", "translateX(-100%)"];
        } else {
          transform = ["translateX(0)", "translateX(100%)"];
        }
      } else if (drawerDirection === "center") {
        transform = ["translate(-50%, -50%)", "translate(-50%, -40%)"];
        duration = 0.6;
      }

      await Motion.timeline([
        [
          contentElement,
          {
            opacity: [1, 0],
            transform: transform
          },
          { duration: duration, easing: theme.config.easing || [0.61, 0.22, 0.23, 1] }
        ]
      ]).finished;

      this.classList.remove('active', 'open');
    }

    open(triggeredBy) {
      if (triggeredBy) this.setActiveElement(triggeredBy);
      setTimeout(() => {
        this.classList.add('animate', 'active');
      });

      let rtl = typeof theme !== "undefined" && theme.config && theme.config.rtl === true;
      let drawerDirection = this.getAttribute("data-drawer-direction") || "right";
      const contentElement = this.querySelector("[data-drawer-content]");

      this.classList.add("open");

      if (rtl) {
        drawerDirection = drawerDirection === "left" ? "right" : "left";
      }

      let transform;
      let duration = 0.3;
      if (drawerDirection === "left") {
        transform = ["translateX(-100%)", "translateX(0)"];
      } else if (drawerDirection === "right") {
        transform = ["translateX(100%)", "translateX(0)"];
      } else if (drawerDirection === "center") {
        transform = ['translate(-50%, -40%)', 'translate(-50%, -50%)'];
        duration = 0.6;
      } else {
        transform = ["translateX(0)", "translateX(0)"];
      }

      Motion.timeline([
        [
          contentElement,
          {
            opacity: [0, 1],
            transform: transform
          },
          { duration: duration, easing: theme.config.easing || [0.61, 0.22, 0.23, 1], at: "-0.05" }
        ]
      ]);

      this.addEventListener(
        'transitionend',
        () => {
          const containerToTrapFocusOn = this.classList.contains('is-empty')
            ? this.querySelector('.drawer__inner-empty')
            : document.getElementById('PickupAvailabilityDrawer');
          const focusElement = this.querySelector('.drawer__close');
          trapFocus(containerToTrapFocusOn, focusElement);
      }, { once: true });

      document.body.classList.add('overflow-hidden');
      document.documentElement.setAttribute('scroll-lock', '');
    }

    handleTransition(checkOpen, startClass, endClass = '') {
      const isDrawer = this.querySelector('[data-drawer-content]');
      if (!isDrawer) return;

      this.addEventListener('transitionstart', () => {
        document.body.classList.add(startClass);
        if (checkOpen) {
          document.body.classList.remove('drawer--open', 'drawer--closing');
        } else {
          document.body.classList.remove('drawer--open', 'drawer--opening');
        }
      }, { once: true });

      this.addEventListener('transitionend', () => {
        if (checkOpen) {
          document.body.classList.remove(startClass, 'drawer--opening', 'drawer--closing');
        } else {
          document.body.classList.remove('drawer--closing', 'drawer--opening', 'drawer--open');
        }
        if (endClass) document.body.classList.add(endClass);
      }, { once: true });
    }

    setActiveElement(element) {
      this.activeElement = element;
    }
  }

  customElements.define('pickup-availability-drawer', PickupAvailabilityDrawer);
}