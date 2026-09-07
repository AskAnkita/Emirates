if (!customElements.get('localization-form')) {
  customElements.define(
    'localization-form',
    class LocalizationForm extends HTMLElement {
      constructor() {
        super();
        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          input: this.querySelector('input[name="locale_code"], input[name="country_code"]'),
          returnInput: this.querySelector('input[name="return_to"]'),
          button: this.querySelector('button.localization-form__select'),
          drawer: this.querySelector('.selector__dropdown[element-s-up]'),
          panel: this.querySelector('.disclosure__list-wrapper'),
          search: this.querySelector('input[name="country_filter"]'),
          closeButton: this.querySelector('.selector__close-button'),
          resetButton: this.querySelector('.country-filter__reset-button'),
          searchIcon: this.querySelector('.country-filter__search-icon'),
          liveRegion: this.querySelector('#sr-country-search-results'),
        };

        // Check for section-fetcher and wait for completion
        this.initializeForm();
      }

      // waitForSectionFetcher() {
      //   // Check if there are any section-fetcher elements in the document
      //   const sectionFetcher = this.querySelector('section-fetcher');

      //   if (!sectionFetcher) {
      //     // No section-fetcher found, initialize immediately
      //     this.initializeForm();
      //     return;
      //   }

      //   // Wait for all section-fetcher elements to complete
      //   let completedFetchers = 0;
      //   const totalFetchers = 1;

      //   const onSectionCached = (event) => {
      //     completedFetchers++;
      //     if (completedFetchers >= totalFetchers) {
      //       // All section-fetchers completed, initialize the form
      //       document.removeEventListener('section:cached', onSectionCached);
      //       this.initializeForm();
      //     }
      //   };

      //   // Listen for section:cached events
      //   document.addEventListener('section:cached', onSectionCached);

      //   // Also check if any section-fetchers are already completed
      //   const targetElement = document.getElementById(sectionFetcher.dataset.targetId);
      //   if (targetElement && targetElement.hasAttribute('data-loaded')) {
      //     completedFetchers++;
      //   }

      //   // If all are already completed, initialize immediately
      //   if (completedFetchers >= totalFetchers) {
      //     document.removeEventListener('section:cached', onSectionCached);
      //     this.initializeForm();
      //   }
      // }

      initializeForm() {
        if (!theme.config.isTouch || Shopify.designMode) {
          Motion.inView(this, this.init.bind(this));
        } else {
          theme.initWhenVisible(this.init.bind(this));
        }
      }

      init() {
        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        this.addEventListener('keydown', this.onContainerKeyDown.bind(this));
        if (theme.config.mql) this.addEventListener('focusout', this.closeSelector.bind(this));
        this.querySelector('#Selector-Overlay')?.addEventListener('click', this.hidePanel.bind(this));
        this.elements.button?.addEventListener('click', this.openSelector.bind(this));

        if (theme.config.mqlDesktop && this.getAttribute('activate-event') === 'hover') {
          const hoverEvents = ['focusin', 'mouseenter', 'mouseleave'];
          hoverEvents.forEach(event => this.addEventListener(event, this._hoverOpen.bind(this)));
        }

        if (this.elements.search) {
          this.elements.search.addEventListener('keyup', this.filterCountries.bind(this));
          this.elements.search.addEventListener('focus', this.onSearchFocus.bind(this));
          this.elements.search.addEventListener('blur', this.onSearchBlur.bind(this));
          this.elements.search.addEventListener('keydown', this.onSearchKeyDown.bind(this));
        }
        if (this.elements.closeButton) {
          this.elements.closeButton?.addEventListener('click', this.hidePanel.bind(this));
        }
        if (this.elements.resetButton) {
          this.elements.resetButton.addEventListener('click', this.resetFilter.bind(this));
          this.elements.resetButton.addEventListener('mousedown', (event) => event.preventDefault());
        }

        this.querySelectorAll('a').forEach((item) => item.addEventListener('click', this.onItemClick.bind(this)));
      }

      hidePanel() {
        this.elements.button?.setAttribute('aria-expanded', 'false');
        this.elements.drawer?.classList.remove('active');
        if (this.elements.search) {
          this.elements.search.value = '';
          this.filterCountries();
          this.elements.search.setAttribute('aria-activedescendant', '');
        }
        if (!theme.config.mql) removeTrapFocus(this.elements.button);
        document.body.classList.remove('overflow-hidden-mobile');
        document.querySelector('.menu-drawer').classList.remove('disclosure-selector-open');
        this.header.preventHide = false;
      }

      onContainerKeyDown(event) {
        const focusableItems = Array.from(this.querySelectorAll('a')).filter(
          (item) => !item.parentElement.classList.contains('hidden')
        );
        let focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
        let itemToFocus;

        switch (event.code.toUpperCase()) {
          case 'ARROWUP':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex > 0 ? focusableItems[focusedItemIndex - 1] : focusableItems[focusableItems.length - 1];
            itemToFocus.focus();
            break;
          case 'ARROWDOWN':
            event.preventDefault();
            itemToFocus =
              focusedItemIndex < focusableItems.length - 1 ? focusableItems[focusedItemIndex + 1] : focusableItems[0];
            itemToFocus.focus();
            break;
        }

        if (!this.elements.search) return;

        setTimeout(() => {
          focusedItemIndex = focusableItems.findIndex((item) => item === document.activeElement);
          if (focusedItemIndex > -1) {
            this.elements.search.setAttribute('aria-activedescendant', focusableItems[focusedItemIndex].id);
          } else {
            this.elements.search.setAttribute('aria-activedescendant', '');
          }
        });
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      onItemClick(event) {
        event.preventDefault();
        const form = this.querySelector('form');
        this.elements.input.value = event.currentTarget.dataset.value;
        this.elements.returnInput.value = window.location.href;

        if (form) form.submit();
      }

      openSelector() {
        this.elements.button?.focus();
        this.elements.drawer?.classList.toggle('active');
        this.elements.button?.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());
        if (!document.body.classList.contains('overflow-hidden-tablet')) {
          document.body.classList.add('overflow-hidden-mobile');
        }
        if (theme.config.mql) {
          if (this.elements.search) this.elements.search.focus();
        } else {
          this.addEventListener('transitionend', () => {
            const containerToTrapFocusOn = this.querySelector('.slide__inner--mb');
            const focusElement = this.querySelector('.selector__close-button');
            trapFocus(containerToTrapFocusOn, focusElement);
          }, { once: true });

          this.elements.drawer.classList.add('drawer-slide-mb');
        }
        if (this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = true;
        }
        document.querySelector('.menu-drawer').classList.add('disclosure-selector-open');
      }

      _hoverOpen(event) {
        const value = event.type === 'mouseenter' || event.type === 'focusin';
        this.elements.drawer?.classList.toggle('active', value);
        this.elements.button?.setAttribute('aria-expanded', value);
        if (!document.body.classList.contains('overflow-hidden-tablet')) document.body.classList.toggle('overflow-hidden-mobile', value);
        if (this.hasAttribute('data-prevent-hide')) this.header.preventHide = value;
        document.querySelector('.menu-drawer').classList.toggle('disclosure-selector-open', value);
      }

      closeSelector(event) {
        if (!this.contains(event.target) || !this.contains(event.relatedTarget)) {
          this.hidePanel();
        }
      }

      normalizeString(str) {
        return str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
      }

      filterCountries() {
        const searchValue = this.normalizeString(this.elements.search.value);
        const popularCountries = this.querySelector('.popular-countries');
        const allCountries = this.querySelectorAll('a');
        let visibleCountries = allCountries.length;

        this.elements.resetButton.classList.toggle('hidden', !searchValue);

        if (popularCountries) {
          popularCountries.classList.toggle('hidden', searchValue);
        }

        allCountries.forEach((item) => {
          const countryName = this.normalizeString(item.querySelector('.country').textContent);
          if (countryName.indexOf(searchValue) > -1) {
            item.parentElement.classList.remove('hidden');
            visibleCountries++;
          } else {
            item.parentElement.classList.add('hidden');
            visibleCountries--;
          }
        });

        if (this.elements.liveRegion) {
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.countrySelectorSearchCount.replace('[count]', visibleCountries);
        }

        this.querySelector('.country-selector').scrollTop = 0;
        this.querySelector('.country-selector__list').scrollTop = 0;
      }

      resetFilter(event) {
        event.stopPropagation();
        this.elements.search.value = '';
        this.filterCountries();
        this.elements.search.focus();
      }

      onSearchFocus() {
        this.elements.searchIcon.classList.add('country-filter__search-icon--hidden');
      }

      onSearchBlur() {
        if (!this.elements.search.value) this.elements.searchIcon.classList.remove('country-filter__search-icon--hidden');
      }

      onSearchKeyDown(event) {
        if (event.code.toUpperCase() === 'ENTER') event.preventDefault();
      }
    }
  );
}

if (!customElements.get('dropdown-localization-component')) {
  customElements.define(
    'dropdown-localization-component',
    class DropdownLocalizationComponent extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        // Check for section-fetcher and wait for completion
        this.waitForSectionFetcher();
      }

      waitForSectionFetcher() {
        // Check if there are any section-fetcher elements in the document
        const sectionFetcher = this.querySelector('section-fetcher');

        if (!sectionFetcher) {
          // No section-fetcher found, initialize immediately
          this.initializeForm();
          return;
        }

        // Wait for all section-fetcher elements to complete
        let completedFetchers = 0;
        const totalFetchers = 1;

        const onSectionCached = (event) => {
          completedFetchers++;
          if (completedFetchers >= totalFetchers) {
            // All section-fetchers completed, initialize the form
            document.removeEventListener('section:cached', onSectionCached);
            this.initializeForm();
          }
        };

        // Listen for section:cached events
        document.addEventListener('section:cached', onSectionCached);

        // Also check if any section-fetchers are already completed
        const targetElement = document.getElementById(sectionFetcher.dataset.targetId);
        if (targetElement && targetElement.hasAttribute('data-loaded')) {
          completedFetchers++;
        }

        // If all are already completed, initialize immediately
        if (completedFetchers >= totalFetchers) {
          document.removeEventListener('section:cached', onSectionCached);
          this.initializeForm();
        }
      }

      initializeForm() {
        if (!theme.config.isTouch || Shopify.designMode) {
          Motion.inView(this, this.init.bind(this));
        } else {
          theme.initWhenVisible(this.init.bind(this));
        }
      }

      init() {
        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          button: this.querySelector('.dropdown-localization__button'),
          drawer: this.querySelector('.selector__dropdown[element-s-up]'),
          panel: this.querySelector('.disclosure__list-wrapper'),
        };

        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        if (theme.config.mql.matches) this.addEventListener('focusout', this.closeSelector.bind(this));
        this.elements.button?.addEventListener('click', this.openSelector.bind(this));

        // this.elements.drawer?.addEventListener('click', this.closeSelector.bind(this));
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      openSelector() {
        this.elements.button.focus();
        this.elements.drawer.classList.toggle('active');
        this.elements.button.setAttribute('aria-expanded', (this.elements.button.getAttribute('aria-expanded') === 'false').toString());

        if (theme.config.mql) {
          if (this.elements.search) this.elements.search.focus();
        } else {

          this.addEventListener('transitionend', () => {
            const containerToTrapFocusOn = this.querySelector('.slide__inner--mb');
            const focusElement = this.querySelector('.selector__close-button');
            trapFocus(containerToTrapFocusOn, focusElement);
          }, { once: true });

          this.elements.drawer.classList.add('drawer-slide-mb');
        }
        if (this.hasAttribute('data-prevent-hide')) {
          this.header.preventHide = true;
        }
        document.querySelector('.menu-drawer').classList.add('disclosure-selector-open');
      }

      closeSelector(event) {
        event.preventDefault();
        if (!this.contains(event.target) || !this.contains(event.relatedTarget)) {
          this.hidePanel();
        }
      }

      hidePanel() {
        this.elements.button?.setAttribute('aria-expanded', 'false');
        this.elements.drawer?.classList.remove('active');
      }
    }
  );
}

if (!customElements.get('drawer-localization-component')) {
  customElements.define(
    'drawer-localization-component',
    class DrawerLocalizationComponent extends HTMLElement {
      constructor() {
        super();

        // Check for section-fetcher and wait for completion
        this.waitForSectionFetcher();
      }

      waitForSectionFetcher() {
        // Check if there are any section-fetcher elements in the document
        const sectionFetcher = this.querySelector('section-fetcher');

        if (!sectionFetcher) {
          // No section-fetcher found, initialize immediately
          this.initializeForm();
          return;
        }

        // Wait for all section-fetcher elements to complete
        let completedFetchers = 0;
        const totalFetchers = 1;

        const onSectionCached = (event) => {
          completedFetchers++;
          if (completedFetchers >= totalFetchers) {
            // All section-fetchers completed, initialize the form
            document.removeEventListener('section:cached', onSectionCached);
            this.initializeForm();
          }
        };

        // Listen for section:cached events
        document.addEventListener('section:cached', onSectionCached);

        // Also check if any section-fetchers are already completed
        const targetElement = document.getElementById(sectionFetcher.dataset.targetId);
        if (targetElement && targetElement.hasAttribute('data-loaded')) {
          completedFetchers++;
        }

        // If all are already completed, initialize immediately
        if (completedFetchers >= totalFetchers) {
          document.removeEventListener('section:cached', onSectionCached);
          this.initializeForm();
        }
      }

      initializeForm() {
        if (!theme.config.isTouch || Shopify.designMode) {
          Motion.inView(this, this.init.bind(this));
        } else {
          theme.initWhenVisible(this.init.bind(this));
        }
      }

      init() {
        this.loadTemplate();

        this.header = document.querySelector('.header-wrapper');
        this.elements = {
          button: this.querySelector('.drawer-localization__button'),
          drawer: this.querySelector('.selector__dropdown[element-s-up]'),
          backButton: this.querySelector('.menu-drawer__back-button'),
        };
        this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
        // this.addEventListener('focusout', this.closeSelector.bind(this));
        this.elements.button.addEventListener('click', this.openSelector.bind(this));
        this.elements.backButton?.addEventListener('click', this.closeSelector.bind(this));
        // this.elements.drawer?.addEventListener('click', this.closeSelector.bind(this));
      }

      loadTemplate() {
        const template = this.querySelector('template');
        if (template) {
          const templateContent = template.content.cloneNode(true);
          this.appendChild(templateContent);
        }
      }

      openSelector() {
        this.elements.button.focus();
        this.elements.drawer.classList.add('active');
      }

      onContainerKeyUp(event) {
        event.preventDefault();

        switch (event.code.toUpperCase()) {
          case 'ESCAPE':
            if (this.elements.button.getAttribute('aria-expanded') == 'false') return;
            this.hidePanel();
            event.stopPropagation();
            this.elements.button.focus();
            break;
          case 'SPACE':
            if (this.elements.button.getAttribute('aria-expanded') == 'true') return;
            this.openSelector();
            break;
        }
      }

      closeSelector(event) {
        event.preventDefault();
        if (!this.contains(event.target) || !this.contains(event.relatedTarget)) {
          this.hidePanel();
        }
      }

      hidePanel() {
        this.elements.button?.setAttribute('aria-expanded', 'false');
        this.elements.drawer?.classList.remove('active');
        document.body.classList.remove('overflow-hidden-mobile');
        document.querySelector('.menu-drawer').classList.remove('disclosure-selector-open');
      }
    }
  );
}