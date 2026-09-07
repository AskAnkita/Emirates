class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = theme.utils.debounce((event) => {
      this.onSubmitHandler(event);
    }, 800);

    const facetForm = this.querySelector('form');
    facetForm.addEventListener('input', this.onInputChange.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);

    // Add event listener for price range apply button
    this.addEventListener('click', this.onPriceRangeApply.bind(this));

    // Add event listener for drawer overlay click to close drawer
    this.setupDrawerOverlayClose();
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    FacetFiltersForm.renderProductPerPage();
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById('ProductCount');
    const countContainerMobile = document.getElementById('ProductCountMobile');
    const loadingSpinners = document.querySelectorAll(
      '.product-count .loading__spinner, .product-grid-container .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.remove('hidden'));
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    if (countContainer) {
      countContainer.classList.add('loading');
    }
    if (countContainerMobile) {
      countContainerMobile.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        FacetFiltersForm.renderProductPerPage();
        FacetFiltersForm.clickGridView(html);
        if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    FacetFiltersForm.renderProductPerPage();
    FacetFiltersForm.clickGridView(html);
    if (typeof initializeScrollAnimationTrigger === 'function') initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser()
      .parseFromString(html, 'text/html')
      .getElementById('ProductGridContainer').innerHTML;

    document
      .getElementById('ProductGridContainer')
      .querySelectorAll('.scroll-trigger')
      .forEach((element) => {
        element.classList.add('scroll-trigger--cancel');
      });

    // Rebind 'show more swatches' buttons after grid re-render
    if (typeof initMoreSwatchButtons === 'function') {
      const container = document.getElementById('ProductGridContainer');
      initMoreSwatchButtons(container || document);
    }
  }

  static clickGridView (event) {
    document.querySelectorAll('.button--grid-view').forEach((button) => {
      button.addEventListener('click', this.changeLayoutGrid.bind(this));
    });
  }

  static changeLayoutGrid (event) {
    const gridView = event.currentTarget.dataset.grid;
    document.querySelectorAll('.button--grid-view').forEach((button) => {
      button.classList.add('cursor-pointer');
      button.classList.remove('active');
    });

    event.currentTarget.classList.remove('cursor-pointer');
    event.currentTarget.classList.add('active');
    document.querySelector('.product-grid-container .product-grid').setAttribute('data-view', gridView);
  }

  static renderProductPerPage() {
    const productGrid = document.querySelector('.product-grid-container .product-grid');

    document.querySelectorAll('input[name="per_page"]').forEach(function(input) {
      input.addEventListener('change', function() {
        const detailsList = input.closest('.details__list');
        const currentSelected = detailsList ? detailsList.querySelector('.selected') : null;
        if (currentSelected) currentSelected.classList.remove('selected', 'pointer-events-none');

        const currentItem = input.closest('.facet-filters__sort_item');
        if (currentItem) currentItem.classList.add('selected', 'pointer-events-none');

        const labelText = input.closest('details') ? input.closest('details').querySelector('.label-text') : null;
        if (labelText) labelText.innerHTML = this.value;

        if (detailsList) {
          detailsList.querySelectorAll('input[name="per_page"]').forEach((other) => {
            if (other !== input) other.checked = false;
          });
          detailsList.querySelectorAll('.facet-filters__sort_item').forEach((li) => {
            if (li !== currentItem) li.classList.remove('selected', 'pointer-events-none');
          });
        }

        var data = new URLSearchParams();
        data.append('attributes[pagination]', this.value);

        fetch('/cart/update.js', {
          method: 'POST',
          body: data,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        .then((response) => response.text())
        .finally(() => {
          FacetFiltersForm.renderPage(window.location.search.slice(1), null, false);
        });
      });
    });

    if (productGrid) {
      const gridViewButton = document.querySelector('.button--grid-view.active');

      if (gridViewButton) {
        productGrid.setAttribute('data-view', gridViewButton.dataset.grid);
      }
    }
  }

  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount').innerHTML;
    const container = document.getElementById('ProductCount');
    const containerMobile = document.getElementById('ProductCountMobile');
    container.innerHTML = count;
    container.classList.remove('loading');

    if(containerMobile) {
      containerMobile.innerHTML = count;
      containerMobile.classList.remove('loading');
    }

    const loadingSpinners = document.querySelectorAll(
      '.product-count .loading__spinner'
    );
    loadingSpinners.forEach((spinner) => spinner.classList.add('hidden'));
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      '#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter'
    );

    // Remove facets that are no longer returned from the server
    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      // Element already rendered in the DOM so just update the innerHTML
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
          // Same facet type (eg horizontal/vertical or drawer/mobile)
          if (elementToRender.className === previousElementClassName) {
            document.getElementById(previousElementId).after(elementToRender);
            return;
          }
        }

        if (elementToRender.parentElement) {
          document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender) {
      const closestJSFilterID = event.target.closest('.js-filter').id;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, event.target.closest('.js-filter'));
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        const newElementSelector = newFacetDetailsElement.classList.contains('mobile-facets__details')
          ? `.mobile-facets__close-button`
          : `.facets__summary`;
        const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

        const isTextInput = event.target.getAttribute('type') === 'text';

        if (newElementToActivate && !isTextInput) newElementToActivate.focus();
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '#FacetsWrapperDesktop', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile').closest('menu-drawer').bindEvents();

    const facetFiltersForm = document.querySelector('facet-filters-form');
    if (facetFiltersForm) {
      facetFiltersForm.setupDrawerOverlayClose();
    }
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector('.facets__summary');
    const sourceSummary = source.querySelector('.facets__summary');

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector('.facets__header');
    const sourceHeaderElement = source.querySelector('.facets__header');

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector('.facets-wrap');
    const sourceWrapElement = source.querySelector('.facets-wrap');

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector('show-more-button .label-show-more.hidden'));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll('.facets__item.hidden')
          .forEach((hiddenItem) => hiddenItem.classList.replace('hidden', 'show-more-item'));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector('.mobile-facets__list');
    const sourceFacetsList = source.querySelector('.mobile-facets__list');

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll('facet-filters-form form');
    if (event.srcElement.className == 'mobile-facets__checkbox') {
      const searchParams = this.createSearchParams(event.target.closest('form'));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest('form').id === 'FacetFiltersFormMobile';

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === 'FacetSortForm' || form.id === 'FacetFiltersForm' || form.id === 'FacetSortDrawerForm') {
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === 'FacetFiltersFormMobile') {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join('&'), event);
    }
  }

  onInputChange(event) {
    // Check if the input is a price range input
    const isPriceRangeInput = event.target.classList.contains('filter__price_change') ||
                             event.target.classList.contains('filter__price_number');

    // Only auto-submit if it's not a price range input
    if (!isPriceRangeInput) {
      this.debouncedOnSubmit(event);
    }
  }

  onPriceRangeApply(event) {
    // Check if the clicked element is the price range apply button
    if (event.target.closest('.facets-price__apply button')) {
      event.preventDefault();

      // Find the form and submit it manually
      const form = this.querySelector('form');
      if (form) {
        const searchParams = this.createSearchParams(form);
        this.onSubmitForm(searchParams, event);
      }
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf('?') == -1
        ? ''
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
    FacetFiltersForm.renderPage(url);

    if(window.innerWidth <= 1024) {
      document.querySelectorAll('.mobile-facets__details').forEach(item => {
        item.removeAttribute('style');
        item.removeAttribute('open')
      })
    }
  }

  setupDrawerOverlayClose() {
    const drawerOverlay = this.querySelector('[data-drawer-overlay]');
    if (drawerOverlay) {
      drawerOverlay.addEventListener('click', (event) => {
        event.preventDefault();
        this.closeDrawer();
      });
    }
  }

  closeDrawer() {
    const closeButton = this.querySelector('[data-close-drawer]');
    if (closeButton) {
      closeButton.click();
      document.body.classList.remove('overflow-hidden-mobile');
    } else {
      const menuDrawer = this.closest('menu-drawer');
      if (menuDrawer) {
        const details = menuDrawer.querySelector('details');
        if (details && details.hasAttribute('open')) {
          details.removeAttribute('open');
          document.body.classList.remove('overflow-hidden-mobile');
        }
      }
    }
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
if (!customElements.get('facet-filters-form')) customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.rangeSliderPrice();
    this.querySelectorAll('input').forEach((element) => {
      element.addEventListener('change', this.onRangeChange.bind(this));
      element.addEventListener('keydown', this.onKeyDown.bind(this));
    });
    this.setMinAndMaxValues();

    const numberS = this.querySelectorAll('.filter__price_change');
    let value1 = numberS[0].value;
    let value2 = numberS[1].value;
    this.updateDisplay(value1, value2);
  }

  onRangeChange(event) {
    // this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
    // Note: Form submission is now handled by the apply button click
  }

  onKeyDown(event) {
    if (event.metaKey) return;

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
    if (!event.key.match(pattern)) event.preventDefault();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];

    // if (maxInput.value) minInput.setAttribute('data-max', maxInput.value);
    // if (minInput.value) maxInput.setAttribute('data-min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('data-min', 0);
    if (maxInput.value === '') minInput.setAttribute('data-max', maxInput.getAttribute('data-max'));
  }

  // adjustToValidValues(input) {
  //   const value = Number(input.value);
  //   const min = Number(input.getAttribute('data-min'));
  //   const max = Number(input.getAttribute('data-max'));

  //   if (value < min) input.value = min;
  //   if (value > max) input.value = max;
  // }

  rangeSliderPrice() {
    let rangeS = this.querySelectorAll('.filter__price_change'),
        numberS = this.querySelectorAll('.filter__price_number'),
        isFireFox = typeof InstallTrigger !== 'undefined',
        lowerSlider = rangeS[0],
        upperSlider = rangeS[1];

    rangeS.forEach(element => {
      element.oninput = () => {
        let slide1 = Math.floor(rangeS[0].value),
          slide2 = Math.ceil(rangeS[1].value),
          slide = Math.round(Number(this.querySelector('.filter__price_change').max) / 100 * (72 / (this.offsetWidth / 100)));

        if (slide1 > slide2 - slide) {
          if (slide2 != upperSlider.max) {
            upperSlider.value = slide1 + slide;
            numberS[0].value = lowerSlider.value;
            numberS[1].value = slide1 + slide;

            if (slide2 == upperSlider.max) {
              lowerSlider.value = parseInt(upperSlider.max) - slide;
              numberS[0].value = parseInt(upperSlider.max) - slide;
            }
          }
        }

        if (slide2 < slide1 + slide) {
          if (slide1 == lowerSlider.min) return;
          lowerSlider.value = slide2 - slide;
          numberS[0].value = slide2 - slide;
          numberS[1].value = upperSlider.value;

          if (slide1 == lowerSlider.min) {
            upperSlider.value = slide;
            numberS[1].value = slide;
          }
        }

        if (slide2 < slide1 + slide && slide2 == upperSlider.max) return;

        numberS[0].value = slide1;
        numberS[1].value = slide2;
        if (!isFireFox) this.updateDisplay(numberS[0].value, numberS[1].value);
      }
    });

    numberS.forEach((element) => {
      element.oninput = () => {
        var number1 = parseFloat(numberS[0].placeholder),
            checkValue1 = number1 != number1,
            number2 = parseFloat(numberS[1].placeholder),
            checkValue2 = number2 != number2;

        if (!checkValue1) {
          rangeS[0].placeholder = number1;
        }

        if (!checkValue2) {
          rangeS[1].placeholder = number2;
        }

        if (number1 > number2) {
          if (!isFireFox) this.updateDisplay(number2, number1);
        } else {
          if (!isFireFox) this.updateDisplay(number1, number2);
        }
      }
    });
  }

  updateDisplay(value1, value2) {
    const priceRange = this.querySelector('.facets-price__range');
    const max = this.querySelector('.filter__price_change').max;
    const width = priceRange.clientWidth;

    priceRange.style.setProperty('--left-space', (parseInt(value1) / parseInt(max)) * width + 'px');
    priceRange.style.setProperty('--right-space', (width - (parseInt(value2) / parseInt(max)) * width) + 'px');
  }
}
if (!customElements.get('price-range')) customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector('a');
    facetLink.setAttribute('role', 'button');
    facetLink.addEventListener('click', this.closeFilter.bind(this));
    facetLink.addEventListener('keyup', (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === 'SPACE') this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
    form.onActiveFilterClick(event);
  }
}
if (!customElements.get('facet-remove')) customElements.define('facet-remove', FacetRemove);
