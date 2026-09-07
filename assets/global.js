window.theme = window.theme || {};
theme.config = {
  hasSessionStorage: true,
  hasLocalStorage: true,
  mqlSmall: false,
  mql: '(min-width: 750px)',
  mqlMobile: '(max-width: 749px)',
  mqlTablet: '(max-width: 1024px)',
  mqlDesktop: '(min-width: 1025px)',
  isTouch: ('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0),
  rtl: document.documentElement.getAttribute('dir') === 'rtl' ? true : false,
  motionReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  easing: [0.61, 0.22, 0.23, 1],
  easingFast: [0.16, 1, 0.3, 1]
};


if (typeof window.MainEvents === 'undefined') {
  window.MainEvents = {
    variantUpdate: 'variant:update',
    mediaStartedPlaying: 'media:started-playing',
  };
} else if (typeof window.MainEvents.variantUpdate === 'undefined') {
  window.MainEvents.variantUpdate = 'variant:update';
} else if (typeof window.MainEvents.mediaStartedPlaying === 'undefined') {
  window.MainEvents.mediaStartedPlaying = 'media:started-playing';
}
console.log(
  `%c${window.info.name} %c(${window.info.version})%c by Halothemes\n%cLearn more at %chttps://halothemes.net/`,
  'color: #ff8800; font-weight: bold; font-size: 1.2rem;',
  'color: #ffa733; font-style: italic; font-size: 1.1rem;',
  'color: #ffa733; font-size: 1rem;',
  'color: #ff8800;',
  'color: #d35400; text-decoration: underline;'
);

const ON_CHANGE_DEBOUNCE_TIMER = 300;

const PUB_SUB_EVENTS = {
  cartUpdate: 'cart-update',
  quantityUpdate: 'quantity-update',
  optionValueSelectionChange: 'option-value-selection-change',
  variantChange: 'variant-change',
  cartError: 'cart-error',
};
let subscribers = {};

(function() {
  const interactionEvents = ['pointerdown', 'keydown', 'scroll'];
  let deferQueue = [];
  let activated = false;
  let listenersReady = false;

  function runDeferredTasks() {
    if (activated) return;
    activated = true;

    if (listenersReady) {
      interactionEvents.forEach(e =>
        window.removeEventListener(e, runDeferredTasks)
      );
      window.removeEventListener('load', runDeferredTasks);
      listenersReady = false;
    }

    const tasks = deferQueue;
    deferQueue = [];
    for (const fn of tasks) {
      try { fn(); }
      catch (err) { console.warn('[Deferred Task Error]', err); }
    }
  }

  function setupDefers() {
    if (listenersReady || activated) return;
    listenersReady = true;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runDeferredTasks, { once: true });
    }

    window.addEventListener('load', runDeferredTasks, { once: true });

    interactionEvents.forEach(e => {
      window.addEventListener(e, runDeferredTasks, { passive: true });
    });

    setTimeout(() => {
      if (!activated && deferQueue.length) runDeferredTasks();
    }, 3000);
  }

  setupDefers();

  window.deferUntilInteraction = function(fn) {
    if (activated) {
      try { fn(); }
      catch (e) { console.warn('[Deferred Task Error]', e); }
    } else {
      deferQueue.push(fn);
      setupDefers();
    }
  };
})();  

(function() {
  window.addEventListener('DOMContentLoaded', () => {
    const headerSection = document.querySelector('.header-section');
    if (headerSection) {
      headerSection.classList.add('header-group-section');
    }
  });
})();

(function () {
  const SELECTORS = {
    swiper: '.swiper',
    swiperProgressbar: '.swiper-pagination-progressbar',
    swiperBullets: '.swiper-pagination-bullets',
    swiperLock: '.swiper-pagination-lock',
  };

  const CLASSES = {
    hasSwiperProgressbar: 'has-swiper-pagination-progressbar',
    hasSwiperBullets: 'has-swiper-pagination-bullets',
    hasSwiperLock: 'has-swiper-pagination-lock',
  };

  function applyHasFallback(root = document) {
    // .swiper:has(.swiper-pagination-progressbar), .swiper:has(.swiper-pagination-bullets), .swiper:has(.swiper-pagination-lock)
    root.querySelectorAll?.(SELECTORS.swiper)?.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.classList.toggle(CLASSES.hasSwiperProgressbar, !!el.querySelector(SELECTORS.swiperProgressbar));
      el.classList.toggle(CLASSES.hasSwiperBullets, !!el.querySelector(SELECTORS.swiperBullets));
      el.classList.toggle(CLASSES.hasSwiperLock, !!el.querySelector(SELECTORS.swiperLock));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyHasFallback(document), { once: true });
  } else {
    applyHasFallback(document);
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyHasFallback(document);
    });
  };

  const observer = new MutationObserver(schedule);
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
      },
      { once: true }
    );
  }
})();

(function () {
  const sections = Array.from(document.querySelectorAll('.shopify-section'))
    .filter((section) => section.querySelector('.sticky-text'));

  if (!sections.length) return;

  let hasUserInteracted = false;
  const activeSections = new Set();
  const headerEl = document.querySelector('.header-wrapper');
  let headerHeight = 0;
  let gap = 0;
  let ticking = false;

  const updateHeaderMetrics = () => {
    headerHeight = headerEl ? (headerEl.offsetHeight || 0) : 0;
    gap = headerHeight * 12 / 100;
  };

  const updateSectionState = section => {
    const { top, bottom } = section.getBoundingClientRect();
    const shouldBeActive = top <= headerHeight + gap && bottom > headerHeight + gap;

    if (shouldBeActive && !activeSections.has(section)) {
      section.classList.add('current-show-sticky');
      activeSections.add(section);
    }

    if (!shouldBeActive && activeSections.has(section)) {
      section.classList.remove('current-show-sticky');
      activeSections.delete(section);
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      ticking = false;
      sections.forEach(updateSectionState);
    });
  };

  const handleUserInteraction = () => {
    if (hasUserInteracted) return;

    hasUserInteracted = true;
    updateHeaderMetrics();
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      updateHeaderMetrics();
      onScroll();
    }, { passive: true });
  };

  ['scroll', 'mousemove', 'click', 'mouseover'].forEach(event => {
    window.addEventListener(event, handleUserInteraction, {
      passive: true,
      once: true
    });
  });
})();

function subscribe(eventName, callback) {
  if (subscribers[eventName] === undefined) {
    subscribers[eventName] = [];
  }

  subscribers[eventName] = [...subscribers[eventName], callback];

  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => {
      return cb !== callback;
    });
  };
}

function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach((callback) => {
      callback(data);
    });
  }
}

const mql = window.matchMedia(theme.config.mqlMobile);
theme.config.mqlSmall = mql.matches;
const mqlTablet = window.matchMedia(theme.config.mqlTablet);
theme.config.mqlTablet = mqlTablet.matches;
const mqlDesktop = window.matchMedia(theme.config.mqlDesktop);
theme.config.mqlDesktop = mqlDesktop.matches;

document.documentElement.classList.add(theme.config.isTouch ? 'touch' : 'no-touch');

theme.passiveEvents = false;
try {
  window.addEventListener('passiveCheck', null, Object.defineProperty({}, 'event', { get: () => theme.passiveEvents = true }));
} catch (_) {}

theme.utils = {
  rafThrottle: (callback) => {
    let requestId = null, lastArgs;
    const later = (context) => () => {
      requestId = null;
      callback.apply(context, lastArgs);
    };
    const throttled = (...args) => {
      lastArgs = args;
      if (requestId === null) {
        requestId = requestAnimationFrame(later(this));
      }
    };
    throttled.cancel = () => {
      cancelAnimationFrame(requestId);
      requestId = null;
    };
    return throttled;
  },

  waitForEvent: (element, eventName) => {
    return new Promise((resolve) => {
      const done = (event) => {
        if (event.target === element) {
          element.removeEventListener(eventName, done);
          resolve(event);
        }
      };
      element.addEventListener(eventName, done);
    });
  },

  /**
   * Debounce a function.
   * @param {Function} fn The function to debounce.
   * @param {number} wait The time to wait in milliseconds.
   * @returns {Function} The debounced function.
   */
  debounce: (fn, wait) => {
    /** @type {number | undefined} */
    let timer;
    /** @param {...any} args */
    const debounced = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };

     debounced.cancel = () => {
      clearTimeout(timer);
    };

    return /** @type {T & { cancel(): void }} */ (debounced);
  },

  imageLoaded: (imgOrArray) => {
    if (!imgOrArray) {
      return Promise.resolve();
    }
    imgOrArray = imgOrArray instanceof Element ? [imgOrArray] : Array.from(imgOrArray);
    return Promise.all(imgOrArray.map((image) => {
      return new Promise((resolve) => {
        if (image.tagName === "IMG" && image.complete || !image.offsetParent) {
          resolve();
        } else {
          image.onload = () => resolve();
        }
      });
    }));
  }
}

theme.initWhenVisible = (callback, delay = 5000) => {
  const events = ["mouseover", "mousemove", "keydown", "touchstart", "touchend", "touchmove", "wheel"];

  let timer;

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    events.forEach((e) => window.removeEventListener(e, run, { passive: true }));
  };

  const run = () => {
    callback();
    cleanup();
  };

  if (typeof delay === "number") {
    timer = setTimeout(run, delay);
  }

  events.forEach((e) => window.addEventListener(e, run, { passive: true }));

  return cleanup;
};

theme.renderTemplate = (template) => {
  if (!template) return;
  const templateContent = template.content.cloneNode(true);
  return templateContent;
}

const sectionRenderCache = new Map();

class SectionFetcher extends HTMLElement {
  constructor() {
    super();
    const activateMode = this.dataset.activate || 'inview';
    if (activateMode === 'interaction') {
      theme.initWhenVisible(() => this.initialize(), null);
    } else {
      Motion.inView(this, () => this.initialize());
    }
  }

  get sectionId() {
    return this.dataset.sectionId;
  }

  get targetElementId() {
    return this.dataset.targetId;
  }

  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    const targetElement = document.getElementById(this.targetElementId);

    if (!targetElement || targetElement.hasAttribute('data-loaded')) return;

    const targetUrl = new URL(window.location.href);
    targetUrl.searchParams.set('section_id', this.sectionId);
    const url = targetUrl.toString();

    if (sectionRenderCache.has(url)) {
      this.renderFromCache(url);
    } else {
      this.fetchAndRender(url);
    }

    this._cacheListener = (event) => this.onSectionCached(event);
    document.addEventListener('section:cached', this._cacheListener);
  }

  renderFromCache(url) {
    const cachedHTML = sectionRenderCache.get(url);
    if (cachedHTML) this.updateDOM(cachedHTML);
  }

  async fetchAndRender(url) {
    sectionRenderCache.set(url, '');

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const htmlText = await response.text();

      this.updateDOM(htmlText);
      sectionRenderCache.set(url, htmlText);

      document.dispatchEvent(
        new CustomEvent('section:cached', {
          detail: { url, sectionId: this.sectionId },
        })
      );
    } catch (error) {
      console.error('[SectionFetcher]', error);
    }
  }

  updateDOM(htmlText) {
    const parser = new DOMParser();
    const newDocument = parser.parseFromString(htmlText, 'text/html');
    const newSection = newDocument.getElementById(this.targetElementId);
    const oldSection = document.getElementById(this.targetElementId);

    if (!newSection) {
      console.warn(`[SectionFetcher] Target #${this.targetElementId} not found in fetched section`);
      return;
    }
    if (!oldSection) {
      console.warn(`[SectionFetcher] Target #${this.targetElementId} not found in current DOM`);
      return;
    }

    oldSection.replaceWith(newSection);
    newSection.setAttribute('data-loaded', 'true');
    document.removeEventListener('section:cached', this._cacheListener);
  }

  onSectionCached(event) {
    const { url, sectionId } = event.detail;
    if (sectionId === this.sectionId) {
      this.renderFromCache(url);
    }
  }
}
if (!customElements.get('section-fetcher')) customElements.define('section-fetcher', SectionFetcher);

function getScrollbarWidth() {
  const width = window.innerWidth - document.documentElement.clientWidth;

  if (width > 18) return;
  document.documentElement.style.setProperty('--scrollbar-width', `${width}px`);
}

getScrollbarWidth();

function getHeaderCartDrawerHeight() {
  const cartDrawer = document.querySelector('cart-drawer');
  if (!cartDrawer) return;

  const cartDrawerHeader = cartDrawer.querySelector('.drawer__header');
  const cartDrawerMessage = cartDrawer.querySelector('.previewCartMessage');
  const cartDrawerFooter = cartDrawer.querySelector('.drawer__footer');
  if (!cartDrawerHeader || !cartDrawerMessage || !cartDrawerFooter) return;

  const cartDrawerHeaderHeight = cartDrawerHeader.offsetHeight + cartDrawerMessage.offsetHeight + cartDrawerFooter.offsetHeight + 20;
  cartDrawer.style.setProperty('--cart-drawer-header-height', `${cartDrawerHeaderHeight}px`);
}

getHeaderCartDrawerHeight();

function logoReveal(preloadScreen) {
  if (preloadScreen) {
    preloadScreen.classList.add('off--ready');
  }
}

function pageReveal(preloadScreen) {
  const body = document.body;

  if (preloadScreen) {
    preloadScreen.classList.add('off');
    body.classList.add('off');

    setTimeout(() => {
      preloadScreen.classList.add('loaded');
      body.classList.add('loaded');
    }, 10);
  }
}

function linkClick() {
  (() => {
    document.addEventListener('click', function(event) {
      const link = event.target.closest('a[href]');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (href && (href.startsWith('tel:') || href.startsWith('mailto:'))) {
        const preload = document.querySelector('.preload-screen');
        if (preload) preload.classList.remove('off', 'loaded');
      }
    });

    window.addEventListener('beforeunload', () => {
      document.querySelector('.preload-screen').classList.remove('off', 'loaded');
    });
  })();
}

function historyPageReveal() {
  window.addEventListener('pageshow', (event) => {
    const navEntry = performance.getEntriesByType?.('navigation')?.[0];
    const isBackForward = event.persisted || navEntry?.type === 'back_forward';
    if (!isBackForward) return;

    const preload = document.querySelector('.preload-screen');
    if (!preload) return;

    preload.classList.add('off', 'loaded');
    document.body.classList.remove('off', 'loaded');

    requestAnimationFrame(() => pageReveal(preload));
  });
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

class SectionId {
  static #separator = "__";

  static parseId(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[0];
  }

  static parseSectionName(qualifiedSectionId) {
    return qualifiedSectionId.split(SectionId.#separator)[1];
  }

  static getIdForSection(sectionId, sectionName) {
    return `${sectionId}${SectionId.#separator}${sectionName}`;
  }
}

class HTMLUpdateUtility {
  /**
   * Used to swap an HTML node with a new node.
   * The new node is inserted as a previous sibling to the old node, the old node is hidden, and then the old node is removed.
   *
   * The function currently uses a double buffer approach, but this should be replaced by a view transition once it is more widely supported https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
   */
  static viewTransition(
    oldNode,
    newContent,
    preProcessCallbacks = [],
    postProcessCallbacks = []
  ) {
    preProcessCallbacks?.forEach((callback) => callback(newContent));

    const newNodeWrapper = document.createElement("div");
    HTMLUpdateUtility.setInnerHTML(newNodeWrapper, newContent.outerHTML);
    const newNode = newNodeWrapper.firstChild;

    // dedupe IDs
    const uniqueKey = Date.now();
    oldNode.querySelectorAll("[id], [form]").forEach((element) => {
      element.id && (element.id = `${element.id}-${uniqueKey}`);
      element.form &&
        element.setAttribute(
          "form",
          `${element.form.getAttribute("id")}-${uniqueKey}`
        );
    });

    oldNode.parentNode.insertBefore(newNode, oldNode);
    oldNode.style.display = "none";

    postProcessCallbacks?.forEach((callback) => callback(newNode));

    setTimeout(() => oldNode.remove(), 500);
  }

  // Sets inner HTML and reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
  static setInnerHTML(element, html) {
    element.innerHTML = html;
    element.querySelectorAll("script").forEach((oldScriptTag) => {
      const newScriptTag = document.createElement("script");
      Array.from(oldScriptTag.attributes).forEach((attribute) => {
        newScriptTag.setAttribute(attribute.name, attribute.value);
      });
      newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
      oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
    });
  }
}

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus?.focus();

  if (
    elementToFocus?.tagName === "INPUT" &&
    ["search", "text", "email", "url"].includes(elementToFocus.type) &&
    elementToFocus.value
  ) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch (e) {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => {
    video.pause();
    const deferredMedia = video.closest('deferred-media');
    if (deferredMedia) {
      deferredMedia.isPlaying = false;
      deferredMedia.updatePlayPauseHint(false);
    }
  });
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.setAttribute("aria-expanded", false);
  summaryElement.focus();
}

// Format money Function
Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100).toFixed(precision);
    let parts = number.split("."), dollarsAmount = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands), centsAmount = parts[1] ? decimal + parts[1] : "";
    return dollarsAmount + centsAmount;
  }
  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_space_separator":
      value = formatWithDelimiters(cents, 2, " ", ".");
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 2, "'", ".");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
    case "amount_no_decimals_with_space_separator":
      value = formatWithDelimiters(cents, 0, " ");
      break;
    case "amount_no_decimals_with_apostrophe_separator":
      value = formatWithDelimiters(cents, 0, "'");
      break;
    default:
      value = formatWithDelimiters(cents, 2);
      break;
  }
  if (formatString.indexOf("with_comma_separator") !== -1) {
    return formatString.replace(placeholderRegex, value);
  } else {
    return formatString.replace(placeholderRegex, value);
  }
};

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.quantityMessage = this.querySelector(".quantity__message");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  quantityUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.quantityUpdate,
      this.validateQtyRules.bind(this)
    );
  }

  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }

  onInputChange(event) {
    this.checkQuantityRules();
    this.validateQtyRules();
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    if (event.target.name === "plus") {
      if (
        parseInt(this.input.dataset.min) > parseInt(this.input.step) &&
        this.input.value == 0
      ) {
        this.input.value = this.input.dataset.min;
      } else {
        this.input.stepUp();
      }
    } else {
      this.input.stepDown();
    }

    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);

    if (
      this.input.dataset.min === previousValue &&
      event.target.name === "minus"
    ) {
      this.input.value = parseInt(this.input.min);
    }
  }

  checkQuantityRules() {
    if (!this.input) return;

    const min = Number(this.input.min);
    const maxAttr = Number(this.input.max);
    const maxInv = Number(this.input.dataset.inventoryQuantity);
    const newValue = Number(this.input.value);

    if (!isNaN(min) && newValue < min) {
      this.input.value = min;
    }

    let didExceedMax = false;
    if (!isNaN(maxInv) && maxInv && newValue > maxInv) {
      this.input.value = maxInv;
      didExceedMax = true;
    } else if (!isNaN(maxAttr) && maxAttr && newValue > maxAttr) {
      this.input.value = maxAttr;
      didExceedMax = true;
    }

    const plusButton = this.querySelector(".quantity__button[name='plus']");
    
    if (didExceedMax) {
      let inventoryQuantity = !isNaN(maxInv) ? maxInv : 0;
      let message = window.inventory_text && window.inventory_text.warningQuantity
        ? window.inventory_text.warningQuantity.replace("[inventory]", inventoryQuantity)
        : `Only ${inventoryQuantity} in stock`;
      if (this.quantityMessage) {
        this.quantityMessage.textContent = message;
        this.quantityMessage.style.display = '';
      }
      if (plusButton) {
        plusButton.classList.add('disabled');
      }
    } else {
      if (this.quantityMessage) {
        this.quantityMessage.textContent = '';
        this.quantityMessage.style.display = 'none';
      }
      if (plusButton) {
        plusButton.classList.remove('disabled');
      }
    }
  }

  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle(
        "disabled",
        parseInt(value) <= parseInt(this.input.min)
      );
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}
if (!customElements.get("quantity-input"))
  customElements.define("quantity-input", QuantityInput);

/**
 * Throttle a function.
 * @param {Function} fn The function to throttle.
 * @param {number} delay The time to wait in milliseconds.
 * @returns {Function} The throttled function.
 */
function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function prefersReducedMotion() {
  return reducedMotion.matches;
}

function fetchConfig(type = "json", config = {}) {
  /** @type {Headers} */
  const headers = {
    "Content-Type": "application/json",
    Accept: `application/${type}`,
    ...config.headers,
  };

  if (type === "javascript") {
    headers["X-Requested-With"] = "XMLHttpRequest";
    delete headers["Content-Type"];
  }

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class PreloadScreen extends HTMLElement {
  constructor() {
    super();
    document.addEventListener("page:loaded", () => {
      Motion.animate(this, { opacity: [1, 0] }, { duration: 0.35 }).finished.then(() => {
        this.setAttribute("loaded", true);
      });
    });
    const onLoadCallback = () => {
      const preloadScreenLogo = document.querySelector(".preload-screen[data-preload-screen-logo]");

      linkClick();
      historyPageReveal();

      if (preloadScreenLogo) {
        logoReveal(preloadScreenLogo);
        pageReveal(preloadScreenLogo);
      }
    };

    if (Shopify.designMode) {
      onLoadCallback();
    } else {
      if (document.readyState === 'complete') {
        onLoadCallback();
      } else {
        window.addEventListener('load', onLoadCallback);
      }
    }
  }
}
if (!customElements.get("preload-screen"))
  customElements.define("preload-screen", PreloadScreen);

// Cookie
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + value + '; path=/' + expires;
}

function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

// Header
function calculateHeaderGroupHeight(
  header = document.querySelector('#header-component'),
  headerGroup = document.querySelector('#header-group')
) {
  if (!headerGroup) return 0;

  let totalHeight = 0;
  const children = headerGroup.children;

  for (let i = 0; i < children.length; i++) {
    const element = children[i];

    if (element === header || !(element instanceof HTMLElement)) continue;
    totalHeight += element.offsetHeight;
  }

  if (
    header instanceof HTMLElement &&
    header.hasAttribute('transparent') &&
    !(header.parentElement && header.parentElement.nextElementSibling)
  ) {
    return totalHeight + header.offsetHeight;
  }

  return totalHeight;
}

function updateHeaderHeights() {
  const header = document.querySelector('header-component');
  if (!(header instanceof HTMLElement)) return;

  const headerGroupHeight = calculateHeaderGroupHeight(header);
  document.body.style.setProperty('--header-group-height', `${headerGroupHeight}px`);
}

function setheaderRowHeight() {
  const headerMenu = document.querySelector('.header__row [data-main-menu]');
  if (!headerMenu) return;

  const row = headerMenu.closest('.header__row');
  if (!row) return;

  const { height } = row.getBoundingClientRect();
  document.body.style.setProperty('--header-row-menu-height', `${height}px`);
}

deferUntilInteraction(() => {
  const runHeaderFunctions = () => {
    setheaderRowHeight();
    updateHeaderHeights();
  };
  if (document.readyState === "complete") {
    runHeaderFunctions();
  } else {
    window.addEventListener("load", runHeaderFunctions, { once: true });
  }
});

class HeaderComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.resizeObserver.observe(this);
    this.stickyMode = this.getAttribute("data-sticky-type");
    this.offscreen = false;

    this.menuDrawerHiddenWidth = null;
    this.intersectionObserver = null;
    this.lastScrollTop = 0;

    this.timeout = null;
    this.animationDelay = 0;

    if (this.stickyMode) {
      this.observeStickyPosition(this.stickyMode === "always");

      if (this.stickyMode === "scroll-up" || this.stickyMode === "always") {
        this._onScroll = this._onScroll || this.handleWindowScroll.bind(this);
        document.addEventListener("scroll", this._onScroll, { passive: true });
      }
    }
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    this.intersectionObserver?.disconnect();
    if (this._onScroll) document.removeEventListener("scroll", this._onScroll);
    document.body.style.setProperty("--header-height", "0px");
  }

  resizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return;
    cancelAnimationFrame(this._resizeRaf);
    this._resizeRaf = requestAnimationFrame(() => {
      const { height } = entry.target.getBoundingClientRect();
      document.body.style.setProperty("--header-height", `${height}px`);
    });
  });

  observeStickyPosition(alwaysSticky = true) {
    if (this.intersectionObserver) return;

    const config = {
      threshold: alwaysSticky ? 1 : 0,
    };

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      if (!entry) return;

      const { isIntersecting } = entry;

      if (alwaysSticky) {
        this.dataset.stickyState = isIntersecting ? "inactive" : "active";
      } else {
        this.offscreen =
          !isIntersecting || this.dataset.stickyState === "active";
      }
    }, config);

    this.intersectionObserver.observe(this);
  }

  handleWindowScroll() {
    if (!this.offscreen && this.stickyMode !== "always") return;

    const scrollTop = document.scrollingElement?.scrollTop ?? 0;
    const isScrollingUp = scrollTop < this.lastScrollTop;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.stickyMode === "always") {
      const isAtTop = this.getBoundingClientRect().top >= this.getBoundingClientRect().height;

      if (isAtTop) {
        this.dataset.scrollDirection = "none";
      } else if (isScrollingUp) {
        this.dataset.scrollDirection = "up";
      } else {
        this.dataset.scrollDirection = "down";
      }

      this.lastScrollTop = scrollTop;
      return;
    }

    if (isScrollingUp) {
      this.removeAttribute("data-animating");

      if (this.getBoundingClientRect().top >= 0) {
        this.offscreen = false;
        this.dataset.stickyState = "inactive";
        this.dataset.scrollDirection = "none";
      } else {
        this.dataset.stickyState = "active";
        this.dataset.scrollDirection = "up";
      }
    } else if (this.dataset.stickyState === "active") {
      this.dataset.scrollDirection = "none";
      this.setAttribute("data-animating", "");

      this.timeout = setTimeout(() => {
        this.dataset.stickyState = "idle";
        this.removeAttribute("data-animating");
      }, this.animationDelay);
    } else {
      this.dataset.scrollDirection = "none";
      this.dataset.stickyState = "idle";
    }

    this.lastScrollTop = scrollTop;
  }
}

if (!customElements.get("header-component"))
  customElements.define("header-component", HeaderComponent);

function menuTab() {
  const menuTabs = document.querySelector('[data-menu-tab]');
  if (!menuTabs) return;

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-menu-tab] a');
    if (!target) return;

    const activePage = target.dataset.handlePage || target.dataset.loadPage;
    if (!activePage || activePage === 'undefined') return;
    setCookie('page-url', activePage, 1);
  });

  const canonical = document.querySelector('[canonical-url]')?.getAttribute('canonical-url');
  let handlePageUrl = getCookie('page-url');
  let menuTabItem, logoTabItem, menuItem;

  const tabForCurrentPage = window.page_active
    ? document.querySelector(`[data-menu-tab] [data-handle-page='${window.page_active}']`)
    : null;

  if (tabForCurrentPage && window.page_active !== handlePageUrl) {
    setCookie('page-url', window.page_active, 1);
    handlePageUrl = window.page_active;
  }
  if (handlePageUrl) {
    menuTabItem = document.querySelector(`[data-handle-page='${handlePageUrl}']`);
    logoTabItem = document
      .querySelector('.header__heading-link')
      .setAttribute('data-logo-page', `${handlePageUrl}`);
    menuItem = document
      .querySelector(`[data-handle-page='${handlePageUrl}']~.header__inline-menu`)
      ?.setAttribute('data-menu-page', `${handlePageUrl}`);

  } else {
    menuTabItem = document.querySelector('[data-handle-page].link--multi-site--active');
    logoTabItem = document.querySelector('[data-logo-page].first');
    menuItem = document.querySelector('[data-menu-page].link--multi-site--active');
  }

  const menuTab = menuTabItem?.closest('[data-menu-tab]');
  if (menuTab) {
    menuTab.querySelectorAll('[data-handle-page]').forEach((el) => el.classList.remove('link--multi-site--active'));
    logoTabItem?.parentElement
      ?.querySelectorAll('[data-logo-page]')
      .forEach((el) => el.classList.remove('link--multi-site--active'));
    menuItem?.parentElement?.querySelectorAll('[data-menu-page]').forEach((el) => el.classList.remove('link--multi-site--active'));
  }

  if (handlePageUrl) {
    logoTabItem?.classList.add('link--multi-site--active');
    menuTabItem?.classList.add('link--multi-site--active');
    menuItem?.classList.add('link--multi-site--active');
  } else {
    document.querySelector('[data-handle-page]:nth-child(1)')?.classList.add('link--multi-site--active');
    document.querySelector('[data-logo-page]:nth-child(1)')?.classList.add('link--multi-site--active');
    document.querySelector('[data-menu-page]:nth-child(1)')?.classList.add('link--multi-site--active');
  }
}

deferUntilInteraction(() => {
  menuTab();
});

function appendTabMenuToMainMenu() {
  const handle = getCookie('page-url') || window.page_active;
  const mainLogoElements = document.querySelectorAll('[data-main-logo]');
  const mainMenu = document.querySelector('[data-main-menu]');
  const tabMenu = document.querySelector(`[data-menu-page='${handle}']`);

  if (!mainMenu) return;

  if (!handle || handle === 'undefined') return;

  if (tabMenu) {
    const menuTabTemplate = tabMenu.querySelector('.header__inline-menu-content template');
    if (menuTabTemplate) {
      const menuTabTemplateContent = menuTabTemplate.content.cloneNode(true);

      mainMenu.innerHTML = '';
      mainMenu.appendChild(menuTabTemplateContent);
    }
    
    const logoTabTemplate = tabMenu.querySelector('.header__inline-menu-logo template');
    if (logoTabTemplate) {
      const logoTabTemplateContent = logoTabTemplate.content.cloneNode(true);

      if (mainLogoElements.length > 0) {
        mainLogoElements.forEach((logoEl) => {
          logoEl.innerHTML = '';
          logoEl.appendChild(logoTabTemplateContent.cloneNode(true));
        });
      }
    }
  }
}

deferUntilInteraction(() => {
  appendTabMenuToMainMenu();
});

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll(
      "button:not(.localization-selector):not(.selector__close-button):not(.country-filter__reset-button)"
    ).forEach((button) =>
      button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(
          event,
          this.mainDetailsToggle.querySelector("summary")
        )
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const parentMenuElement = detailsElement.closest(".has-submenu");
    const isOpen = detailsElement.hasAttribute("open");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function addTrapFocus() {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );
      summaryElement.nextElementSibling.removeEventListener(
        "transitionend",
        addTrapFocus
      );
    }

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(event, summaryElement)
        : this.openMenuDrawer(summaryElement);
    } else {
      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
        summaryElement.setAttribute("aria-expanded", true);
        parentMenuElement && parentMenuElement.classList.add("submenu-open");
        !reducedMotion || reducedMotion.matches
          ? addTrapFocus()
          : summaryElement.nextElementSibling.addEventListener(
              "transitionend",
              addTrapFocus
            );
      }, 100);
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event === undefined) return;

    this.mainDetailsToggle.classList.remove("menu-opening");
    this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
      details.removeAttribute("open");
      details.classList.remove("menu-opening");
      details.removeAttribute('style');
    });
    this.mainDetailsToggle
      .querySelectorAll(".submenu-open")
      .forEach((submenu) => {
        submenu.classList.remove("submenu-open");
      });
    document.body.classList.remove(
      `overflow-hidden-${this.dataset.breakpoint}`
    );
    removeTrapFocus(elementToFocus);
    this.closeAnimation(this.mainDetailsToggle);

    if (event instanceof KeyboardEvent)
      elementToFocus?.setAttribute("aria-expanded", false);
  }

  onFocusOut() {
    setTimeout(() => {
      if (
        this.mainDetailsToggle?.hasAttribute("open") &&
        !this.mainDetailsToggle?.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    if (detailsElement) this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    const parentMenuElement = detailsElement.closest(".submenu-open");
    parentMenuElement && parentMenuElement.classList.remove("submenu-open");
    detailsElement.classList.remove("menu-opening");
    detailsElement
      .querySelector("summary")
      .setAttribute("aria-expanded", false);
    removeTrapFocus(detailsElement.querySelector("summary"));
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}
if (!customElements.get("menu-drawer"))
  customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header = this.header || document.querySelector(".section-header-main");
    this.borderOffset =
      this.borderOffset ||
      this.closest(".drawer--menu").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus) {
    if (!elementToFocus) return;
    super.closeMenuDrawer(event, elementToFocus);
    window.removeEventListener("resize", theme.utils.rafThrottle(this.onResize));
  }
}
if (!customElements.get("header-drawer"))
  customElements.define("header-drawer", HeaderDrawer);

// Deferred Media
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  connectedCallback() {
    this.toggleMediaButton = this.querySelector('button[data-click-handler="toggleMediaButton"]');
    this.isPlaying = false;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.setupEventListeners();

    if (typeof MainEvents !== 'undefined' && MainEvents.mediaStartedPlaying) {
      document.addEventListener(MainEvents.mediaStartedPlaying, this.pauseMedia.bind(this), { signal });
    }

    if (this.hasAttribute('autoplay')) {
      this.isPlaying = true;

      if (this.toggleMediaButton) {
        this.toggleMediaButton.classList.remove('hidden');
        const playIcon = this.toggleMediaButton.querySelector('.icon-play');
        if (playIcon) playIcon.classList.toggle('hidden', this.isPlaying);
        const pauseIcon = this.toggleMediaButton.querySelector('.icon-pause');
        if (pauseIcon) pauseIcon.classList.toggle('hidden', !this.isPlaying);

        this.toggleMediaButton.addEventListener('click', (e) => {
          if (playIcon) playIcon.classList.toggle('hidden', this.isPlaying);
          if (pauseIcon) pauseIcon.classList.toggle('hidden', !this.isPlaying);
        });
      }
    }
  }

  disconnectedCallback() {
    this.abortController.abort();
  }

  setupEventListeners() {
    if (this.toggleMediaButton) {
      this.toggleMediaButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.toggleMedia();
      });
    }
  }

  updatePlayPauseHint(isPlaying) {
    if (this.toggleMediaButton instanceof HTMLElement) {
      this.toggleMediaButton.classList.remove('hidden');
      const playIcon = this.toggleMediaButton.querySelector('.icon-play');
      if (playIcon) playIcon.classList.toggle('hidden', isPlaying);
      const pauseIcon = this.toggleMediaButton.querySelector('.icon-pause');
      if (pauseIcon) pauseIcon.classList.toggle('hidden', !isPlaying);
    }
  }

  showDeferredMedia = () => {
    this.loadContent(true);
    this.isPlaying = true;
    this.updatePlayPauseHint(this.isPlaying);
  };

  loadContent(focus = true) {
    if (this.getAttribute('data-media-loaded')) return;

    if (typeof MediaStartedPlayingEvent !== 'undefined') {
      this.dispatchEvent(new MediaStartedPlayingEvent(this));
    }

    const content = this.querySelector('template')?.content.firstElementChild?.cloneNode(true);

    if (!content) return;

    this.setAttribute('data-media-loaded', true);
    this.appendChild(content);

    if (focus && content instanceof HTMLElement) {
      content.focus();
    }

    this.toggleMediaButton?.classList.add('deferred-media__playing');
    this.toggleMediaButton?.closest('.product-media-container')?.classList.add('has-deferred-media__playing');

    if (content instanceof HTMLVideoElement) {
      // Set up video event listeners
      content.addEventListener('play', () => {
        this.isPlaying = true;
        this.updatePlayPauseHint(this.isPlaying);
      });

      content.addEventListener('pause', () => {
        this.isPlaying = false;
        this.updatePlayPauseHint(this.isPlaying);
      });

      if (content.getAttribute('autoplay')) {
        // force autoplay for safari
        content.play().catch(() => {});
      }
    }
  }

  toggleMedia() {
    if (this.isPlaying) {
      this.pauseMedia();
    } else {
      this.playMedia();
    }
  }

  playMedia() {
    /** @type {HTMLIFrameElement | null} */
    const iframe = this.querySelector('iframe[data-video-type]');
    if (iframe) {
      iframe.contentWindow?.postMessage(
        iframe.dataset.videoType === 'youtube'
          ? '{"event":"command","func":"playVideo","args":""}'
          : '{"method":"play"}',
        '*'
      );
      this.isPlaying = true;
      this.updatePlayPauseHint(this.isPlaying);
    } else {
      const video = this.querySelector('video');
      if (video) {
        video.play().then(() => {
          this.isPlaying = true;
          this.updatePlayPauseHint(this.isPlaying);
        }).catch(e => {
          // Ignore autoplay errors (common on mobile / low-power modes)
        });
      }
    }
  }

  pauseMedia() {
    /** @type {HTMLIFrameElement | null} */
    const iframe = this.querySelector('iframe[data-video-type]');

    if (iframe) {
      iframe.contentWindow?.postMessage(
        iframe.dataset.videoType === 'youtube'
          ? '{"event":"command","func":"pauseVideo","args":""}'
          : '{"method":"pause"}',
        '*'
      );
      this.isPlaying = false;
    } else {
      const video = this.querySelector('video');
      if (video) {
        video.pause();
        this.isPlaying = false;
      }
    }

    if (this.getAttribute('data-media-loaded')) {
      this.updatePlayPauseHint(this.isPlaying);
    }
  }
}
if (!customElements.get("deferred-media"))
  customElements.define("deferred-media", DeferredMedia);

class CardMedia extends HTMLElement {
  constructor() {
    super();
    this.deferredMedia = null;
    this.isHovered = false;
  }

  connectedCallback() {
    this.deferredMedia = this.querySelector('deferred-media');

    if (this.deferredMedia) {
      if (typeof this.deferredMedia.loadContent === "function") {
        this.deferredMedia.loadContent();
      }
      if (typeof this.deferredMedia.pauseMedia === "function") {
        this.deferredMedia.pauseMedia();
      }

      if (theme.config.isTouch) return;

      this.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
  }

  handleMouseEnter() {
    if (this.deferredMedia && !this.isHovered) {
      this.isHovered = true;
      this.deferredMedia.playMedia();
    }
  }

  handleMouseLeave() {
    if (this.deferredMedia && this.isHovered) {
      this.isHovered = false;
      this.deferredMedia.pauseMedia();
    }
  }

  disconnectedCallback() {
    this.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
}
if (!customElements.get("card-media"))
  customElements.define("card-media", CardMedia);

class SwiperComponent extends HTMLElement {
  constructor() {
    super();
    this.isMobileOnly = this.hasAttribute("data-swiper-mobile");
    this.swiperEl = null;
    this.initSwiper = null;
    this.options = null;
    this.breakpoint = null;
    this.breakpointChecker = null;
    this.arrowOnHeader = this.closest(
      ".arrow-on-header:has(.swiper-btns-on-header)"
    );
    this._thumbnailSwiper = null;
    this._thumbsSwiper = null;
  }
  get items() {
    return (this._items = this._items || Array.from(this.querySelector(".swiper-wrapper").children));
  }

  connectedCallback() {
    deferUntilInteraction(() => {
      Motion.inView(this, this.initializeSwiper.bind(this), { margin: "200px 0px 200px 0px" });
    });
  }

  disconnectedCallback() {
    if (this.breakpoint && this.breakpointChecker) {
      this.breakpoint.removeEventListener("change", this.breakpointChecker);
    }
    if (this.initSwiper) {
      this.initSwiper.destroy(true, true);
      this.initSwiper = null;
    }
    if (this.swiperEl) {
      this.swiperEl._swiperInitialized = false;
    }
  }

  initializeSwiper() {
    if (this.items.length > 0) {
      this.swiperEl = this.querySelector(".swiper");
      if (!this.swiperEl) return;
      
      // Debug: Check if swiper elements exist
      const nextButton = this.swiperEl.querySelector(".swiper-button-next");
      const prevButton = this.swiperEl.querySelector(".swiper-button-prev");
      const pagination = this.swiperEl.querySelector(".swiper-pagination");
      const arrowOnHeaderNextButton = this.arrowOnHeader
        ? this.arrowOnHeader.querySelector(".swiper-btns-on-header .swiper-button-next")
        : nextButton;
      const arrowOnHeaderPrevButton = this.arrowOnHeader
        ? this.arrowOnHeader.querySelector(".swiper-btns-on-header .swiper-button-prev")
        : prevButton;

      const getOption = (name, defaultValue = undefined) => {
        const attr = this.getAttribute(`data-${name}`);
        if (attr === null) return defaultValue;
        try {
          return JSON.parse(attr);
        } catch {
          if (attr === "true") return true;
          if (attr === "false") return false;
          if (!isNaN(attr)) return Number(attr);
          return attr;
        }
      };

      const baseSpaceBetween = getOption("space-between", 20);
      const baseBreakpoints = getOption("breakpoints", null);
      
      const defaultSpacebetween = !baseBreakpoints
        ? baseSpaceBetween * 0.5
        : baseSpaceBetween;

      const spaceBetweenTablet = !baseBreakpoints
        ? baseSpaceBetween * 0.75
        : baseSpaceBetween;

      const defaultBreakpoints = !baseBreakpoints
        ? {
            750: { spaceBetween: spaceBetweenTablet },
            990: { spaceBetween: baseSpaceBetween },
          }
        : baseBreakpoints;
      
      const fractionInNextButton = arrowOnHeaderNextButton?.querySelector(".swiper-pagination-fraction");

      const updateFraction = (swiper) => {
        if (!fractionInNextButton) return;
        const current = swiper.realIndex + 1;
        const total = this.items.length; 

        fractionInNextButton.innerHTML = `<span class="swiper-pagination-current">${current}</span> / <span class="swiper-pagination-total">${total}</span>`;
      };
      // ----------------------------------------------------

      this._thumbnailSwiper = this.querySelector(".swiper-controls__thumbnails-container .swiper");
      this._thumbsSwiper = null;
      if (this._thumbnailSwiper && !this._thumbnailSwiper._swiperInitialized) {
        this._thumbnailSwiper._swiperInitialized = true;

        const thumbnailDirection = this.getAttribute("data-thumbnail-direction") || "horizontal";
        const isVerticalThumbnails = thumbnailDirection === "vertical";
        const thumbnailPosition =
          this.querySelector(".swiper-controls__thumbnails-container")?.getAttribute("data-thumbnail-position") ||
          "bottom";
        const slidesPerView =
          thumbnailPosition === "left" || thumbnailPosition === "right" ? "auto" : 4;

        this._thumbsSwiper = new Swiper(this._thumbnailSwiper, {
          direction: "horizontal",
          spaceBetween: 8,
          slidesPerView: 4,
          freeMode: false,
          watchSlidesProgress: true,
          allowTouchMove: true,
          grabCursor: true,
          slideToClickedSlide: true,
          loop: this._thumbnailSwiper.getAttribute("data-loop") || false,
          breakpoints: {
            750: { 
              slidesPerView: slidesPerView, 
              spaceBetween: isVerticalThumbnails ? 8 : 16, 
              direction: isVerticalThumbnails ? "vertical" : "horizontal"
            }
          },
          pagination: {
            el: ".swiper-controls__thumbnails-container .swiper-pagination",
            type: "bullets",
            clickable: true,
          },
        });
      }

      const effect = getOption("effect", false);

      this.options = {
        observer: false,
        observeParents: false,
        resistance: false,
        resistanceRatio: 0.85,
        direction: getOption("direction", "horizontal"),
        watchSlidesProgress: getOption("watch-slides-progress", false),
        loop: getOption("loop", false),
        speed: getOption("speed", 500),
        parallax: getOption("parallax", false),
        effect,
        spaceBetween: defaultSpacebetween,
        autoplay: {
          enabled: getOption("slide-autoplay", false),
          delay: getOption("swiper-autoplay", 3) * 1000,
          pauseOnMouseEnter: true,
          disableOnInteraction: false,
        },
        slidesPerView: getOption("slides-per-view", 1),
        centeredSlides: getOption("centered-slides", false),
        autoHeight: getOption("auto-height", false),
        allowTouchMove: true,
        navigation: {
          nextEl: arrowOnHeaderNextButton,
          prevEl: arrowOnHeaderPrevButton,
          disabledClass: "swiper-button-disabled",
          hiddenClass: "swiper-button-hidden",
        },
        pagination: {
          el: pagination,
          clickable: true,
          type: getOption("pagination-type", "bullets"),
          dynamicBullets: getOption("dynamic-bullets", false),
        },
        on: {
            init: (swiper) => updateFraction(swiper),
            slideChange: (swiper) => updateFraction(swiper),
        },
        // -----------------------------------------------------
        breakpoints: defaultBreakpoints,
        ...(this._thumbsSwiper
          ? {
              thumbs: {
                swiper: this._thumbsSwiper,
              },
            }
          : {
              thumbs: {
                swiper: null,
              },
            }),
      };

      if (this.options.effect === "fade") {
        this.options.fadeEffect = { crossFade: true };
      }

      if (this.isMobileOnly) {
        this.initSwiperMobile();
      } else {
        this.initSwiper = new Swiper(this.swiperEl, this.options);

        if (this._thumbnailSwiper && this._thumbsSwiper) {
          this._setupThumbnailSync();
        }
      }
    }
  }

  _setupThumbnailSync() {
    const mainSwiper = this.initSwiper;
    const thumbsSwiper = this._thumbsSwiper;
    const thumbnailButtons = this._thumbnailSwiper.querySelectorAll(".swiper-controls__thumbnail");

    thumbnailButtons.forEach((button, index) => {
      if (!button._listenerAttached) {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          mainSwiper.slideTo(index);
        });
        button._listenerAttached = true;
      }
    });

    mainSwiper.on("slideChange", () => {
      const { activeIndex, realIndex } = mainSwiper;

      thumbnailButtons.forEach((button, index) => {
        button.classList.toggle("active", index === activeIndex);
      });

      if (!thumbsSwiper || thumbsSwiper.destroyed) return;

      let thumbsPerView = thumbsSwiper.params.slidesPerView;
      if (thumbsPerView === "auto") {
        thumbsPerView = thumbsSwiper.slides.filter((s) =>
          s.classList.contains("swiper-slide-visible")
        ).length || 1;
      }

      const totalSlides = thumbsSwiper.slides.length;

      let targetIndex = realIndex - Math.floor(thumbsPerView / 2);
      if (targetIndex < 0) targetIndex = 0;
      if (targetIndex > totalSlides - thumbsPerView) {
        targetIndex = totalSlides - thumbsPerView;
      }

      thumbsSwiper.slideTo(targetIndex);
    });

    if (thumbnailButtons.length > 0) {
      thumbnailButtons[0].classList.add("active");
    }
  }

  initSwiperMobile() {
    this.breakpoint = window.matchMedia(theme.config.mql);

    const enableSwiper = () => {
      if (!this.swiperEl || !this.options) return;

      if (this.initSwiper) {
        this.initSwiper.destroy(true, true);
        this.initSwiper = null;
      }

      try {
        const swiperOptions = {
          ...this.options,
        };

        this.initSwiper = new Swiper(this.swiperEl, swiperOptions);

        if (this._thumbnailSwiper && this._thumbsSwiper) {
          this._setupThumbnailSync();
        }

        if (this.initSwiper) {
          this.initSwiper.update();
          if (this._thumbsSwiper) {
            this._thumbsSwiper.update();
          }
        }
      } catch (error) {
        console.error("❌ Error initializing Swiper:", error);
        enableSwiper();
      }
    };

    this.breakpointChecker = () => {
      if (this.isMobileOnly) {
        if (this.breakpoint.matches) {
          if (this.initSwiper) {
            this.initSwiper.destroy(true, true);
            this.initSwiper = null;
          }
        } else {
          if (!this.initSwiper) {
            enableSwiper();
          }
        }
      } else {
        if (!this.initSwiper) {
          enableSwiper();
        }
      }
    };

    if (this.isMobileOnly) {
      this.breakpoint.addEventListener("change", this.breakpointChecker);
    }

    this.breakpointChecker();
  }
}
if (!customElements.get("swiper-component"))
  customElements.define("swiper-component", SwiperComponent);

// Init section function when it's visible, then disable observer
theme.initSectionVisible = function (options) {
  const threshold = options.threshold ? options.threshold : 0;

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (typeof options.callback === "function") {
            options.callback();
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { rootMargin: `0px 0px ${threshold}px 0px` }
  );

  observer.observe(options.element);
};

class AccountIcon extends HTMLElement {
  constructor() {
    super();

    this.icon = this.querySelector(".icon");
  }

  connectedCallback() {
    document.addEventListener(
      "storefront:signincompleted",
      this.handleStorefrontSignInCompleted.bind(this)
    );
  }

  handleStorefrontSignInCompleted(event) {
    if (event?.detail?.avatar) {
      this.icon?.replaceWith(event.detail.avatar.cloneNode());
    }
  }
}
if (!customElements.get("account-icon"))
  customElements.define("account-icon", AccountIcon);

class BulkAdd extends HTMLElement {
  constructor() {
    super();
    this.queue = [];
    this.requestStarted = false;
    this.ids = [];
  }

  startQueue(id, quantity) {
    this.queue.push({ id, quantity });
    const interval = setInterval(() => {
      if (this.queue.length > 0) {
        if (!this.requestStarted) {
          this.sendRequest(this.queue);
        }
      } else {
        clearInterval(interval);
      }
    }, 250);
  }

  sendRequest(queue) {
    this.requestStarted = true;
    const items = {};
    queue.forEach((queueItem) => {
      items[parseInt(queueItem.id)] = queueItem.quantity;
    });
    this.queue = this.queue.filter(
      (queueElement) => !queue.includes(queueElement)
    );
    const quickBulkElement =
      this.closest("quick-order-list") || this.closest("quick-add-bulk");
    quickBulkElement.updateMultipleQty(items);
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute("value");
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;

    if (inputValue < event.target.dataset.min) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.min_error.replace(
          "[min]",
          event.target.dataset.min
        )
      );
    } else if (inputValue > parseInt(event.target.max)) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.max_error.replace(
          "[max]",
          event.target.max
        )
      );
    } else if (inputValue % parseInt(event.target.step) != 0) {
      this.setValidity(
        event,
        index,
        window.quickOrderListStrings.step_error.replace(
          "[step]",
          event.target.step
        )
      );
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      this.startQueue(index, inputValue);
    }
  }

  getSectionsUrl() {
    if (window.pageNumber) {
      return `${window.location.pathname}?page=${window.pageNumber}`;
    } else {
      return `${window.location.pathname}`;
    }
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }
}
if (!customElements.get("bulk-add"))
  customElements.define("bulk-add", BulkAdd);

class CartPerformance {
  static #metric_prefix = "cart-performance"

  static createStartingMarker(benchmarkName) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    return performance.mark(`${metricName}:start`);
  }

  static measureFromEvent(benchmarkName, event) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    const startMarker = performance.mark(`${metricName}:start`, {
      startTime: event.timeStamp
    });

    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(
      metricName,
      `${metricName}:start`,
      `${metricName}:end`
    );
  }

  static measureFromMarker(benchmarkName, startMarker) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(
      metricName,
      startMarker.name,
      `${metricName}:end`
    );
  }

  static measure(benchmarkName, callback) {
    const metricName = `${CartPerformance.#metric_prefix}:${benchmarkName}`
    const startMarker = performance.mark(`${metricName}:start`);

    callback();

    const endMarker = performance.mark(`${metricName}:end`);

    performance.measure(
      metricName,
      `${metricName}:start`,
      `${metricName}:end`
    );
  }
}

class GridView extends HTMLElement {
  constructor() {
    super();
    this.productGrid = null;
    this.mediaView = null;
    this.boundModeButtonHandler = this.onClickModeButtonHandler.bind(this);
  }

  connectedCallback() {
    this.productGrid = document.querySelector(".product-grid-container .product-grid");
    this.mediaView = this.querySelector(".desktop-grid-view");
    if (this.mediaView) {
      this.mediaView.querySelectorAll(".button--grid-view").forEach((modeButton) => {
        modeButton.removeEventListener("click", this.boundModeButtonHandler);
        modeButton.addEventListener("click", this.boundModeButtonHandler);
      });
      this.autoChangeLayout();
    }
  }

  onClickModeButtonHandler(event) {
    event.preventDefault();

    if (!this.mediaView || !this.productGrid) return;

    const buttonElement = event.currentTarget;
    const viewMode = this.mediaView.querySelector(".button--grid-view.active");
    const column = parseInt(buttonElement.dataset.grid);

    if (!buttonElement.classList.contains("active")) {
      viewMode?.classList.remove("active");
      buttonElement.classList.add("active");

      if (this.mediaViewMobile) {
        this.mediaViewMobile.querySelectorAll(".button--grid-view").forEach((element) => {
          var currentColumn = parseInt(element.dataset.grid);
          if (currentColumn == column) {
            element.classList.add("active");
          } else {
            element.classList.remove("active");
          }
        });
      }

      this.initViewModeLayout(column);
    }
  }

  autoChangeLayout() {
    if (!this.mediaView || !this.productGrid) return;

    const getColByWidth = (col, width, isVertical) => {
      if (isNaN(col)) return col;
      if (isVertical) {
        if (width < 750 && [3, 4, 5].includes(col)) return 2;
        if (width <= 1100 && width >= 750 && [3, 4, 5].includes(col)) return 2;
        if (width < 1300 && width > 1100 && [4, 5].includes(col)) return 3;
        if (width < 1700 && width >= 1300 && col == 5) return 4;
      } else {
        if (width < 750 && [3, 4, 5].includes(col)) return 2;
        if (width < 990 && width >= 750 && [3, 4, 5].includes(col)) return 3;
        if (width < 1600 && width >= 990 && col == 5) return 4;
      }
      return col;
    };

    const updateViewMode = () => {
      if (!this.mediaView || !this.productGrid) return;
      let viewMode = this.mediaView.querySelector(".button--grid-view.active");
      let col = parseInt(viewMode?.dataset.grid);
      if (!viewMode || isNaN(col)) return;

      const width = window.innerWidth;
      const isVertical = !!document.querySelector(".facets-vertical");
      const newCol = getColByWidth(col, width, isVertical);

      if (col !== newCol) {
        viewMode.classList.remove("active");
        const newButton = this.mediaView.querySelector(`.grid-view--item.grid-view-${newCol} .button--grid-view`);
        if (newButton) {
          newButton.classList.add("active");
        }
        col = newCol;
      }
    };

    if (window.theme && theme.utils && typeof theme.utils.rafThrottle === "function") {
      window.addEventListener("resize", theme.utils.rafThrottle(updateViewMode));
    } else {
      window.addEventListener("resize", updateViewMode);
    }

    updateViewMode();
  }

  transitionGrid(gridView, cards) {
    const execute = () => {
      if (!this.productGrid) return;
      if (!cards) cards = this.productGrid.querySelectorAll(".product-grid__item");
      if (document.startViewTransition && cards.length > 0) {
        cards.forEach((card) => {
          if (card && card.dataset && card.dataset.productId) {
            card.style.setProperty(
              "view-transition-name",
              `product-card-${card.dataset.productId}`
            );
          }
        });

        document
          .startViewTransition(() => {
            this.productGrid.setAttribute("data-view", gridView);
          })
          .finished.finally(() => {
            cards.forEach((card) => {
              if (card) card.style.removeProperty("view-transition-name");
            });
          });
      } else {
        this.productGrid.setAttribute("data-view", gridView);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", execute, { once: true });
    } else {
      execute();
    }
  }

  changeLayoutGrid(event) {
    if (!this.productGrid) return;
    const gridView = event.currentTarget.dataset.grid;
    const parent = event.currentTarget.closest(".grid-view--list");

    const cards = this.productGrid.querySelectorAll(".product-grid__item");

    if (parent) {
      parent.querySelectorAll(".button--grid-view").forEach((button) => {
        button.classList.add("cursor-pointer");
        button.classList.remove("active");
      });

      event.currentTarget.classList.remove("cursor-pointer");
      event.currentTarget.classList.add("active");
    }

    this.transitionGrid(gridView, cards);
  }

  initViewModeLayout(column) {
    if (!this.productGrid) return;
    const cards = this.productGrid.querySelectorAll(".product-grid__item");
    this.transitionGrid(column, cards);
  }
}
if (!customElements.get("grid-view")) {
  customElements.define("grid-view", GridView);
}

class RecentlyViewedProducts extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    theme.initSectionVisible({
      element: this,
      callback: this.load.bind(this),
      threshold: 400,
    });
  }

  load() {
    fetch(this.getUrl())
      .then((response) => response.text())
      .then((text) => {
        const recentlyViewed = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("recently-viewed-products");

        if (!recentlyViewed) return;

        this.innerHTML = recentlyViewed.innerHTML;

        const recentlyViewedProducts = this.querySelector(".collection--grid-layout");

        if (recentlyViewedProducts && recentlyViewedProducts.textContent.trim() === '') {
          this.classList.add("hidden");
        }

        const cardMedias = this.querySelectorAll("card-media");
        cardMedias.forEach((cardMedia) => {
          this.deferredMedia = cardMedia.querySelector('deferred-media');

          if (this.deferredMedia && typeof this.deferredMedia.loadContent === "function") {
            this.deferredMedia.loadContent();
          }
          if (this.deferredMedia && typeof this.deferredMedia.pauseMedia === "function") {
            this.deferredMedia.pauseMedia();
          }
        });

        if (typeof initMoreSwatchButtons === 'function') {
          const container = document.getElementById('recently-viewed-products');
          initMoreSwatchButtons(container || document);
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }

  getUrl() {
    const listItems = JSON.parse(
      localStorage.getItem("_halo_recently_viewed") || "[]"
    );

    if (
      this.dataset.productId &&
      listItems.includes(parseInt(this.dataset.productId))
    )
      listItems.splice(listItems.indexOf(parseInt(this.dataset.productId)), 1);
    return (
      this.dataset.url +
      listItems
        .map((id) => "id:" + id)
        .slice(0, parseInt(this.dataset.limit))
        .join("%20OR%20")
    );
  }
}
if (!customElements.get("recently-viewed-products"))
  customElements.define("recently-viewed-products", RecentlyViewedProducts);

const moreButton = document.querySelectorAll(
  ".card__swatch .item-swatch-more .number-showmore"
);

function initMoreSwatchButtons(root = document) {
  const buttons = root.querySelectorAll(
    ".card__swatch .item-swatch-more .number-showmore"
  );

  buttons.forEach((button) => {
    if (button.dataset.moreSwatchBound === "true") return;
    button.dataset.moreSwatchBound = "true";

  button.addEventListener("click", function (event) {
    const swatch = event.target.closest(".swatch-list");
      (span = button.querySelector("span")), (groupSwatch = swatch.querySelector(".group-swatch"));

    if (groupSwatch.style.display == "flex") {
      groupSwatch.style.display = "none";
      if (span) span.textContent = "+";
    } else {
      groupSwatch.style.display = "flex";
      if (span) span.textContent = "-";
    }
  });
});
}

deferUntilInteraction(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initMoreSwatchButtons());
  } else {
    initMoreSwatchButtons();
  }
});

function setProductForWishlistGlobal(handle) {
  const wishlistList = JSON.parse(localStorage.getItem('wishlistItem')) || [];
  const items = document.querySelectorAll(`[data-wishlist-handle="${handle}"]`);

  if (!items || items.length === 0) return;

  items.forEach(item => {
    if (wishlistList.includes(handle)) {
      item.classList.add('wishlist-added');
      const textElem = item.querySelector('.text');
      if (textElem) textElem.textContent = window.wishlist.added;
      if (item.tagName === 'BUTTON') item.setAttribute('title', window.wishlist.added);
    } else {
      item.classList.remove('wishlist-added');
      const textElem = item.querySelector('.text');
      if (textElem) textElem.textContent = window.wishlist.add;
      if (item.tagName === 'BUTTON') item.setAttribute('title', window.wishlist.add);
    }
  });
}

function checkWishlistCountGlobal(wishlistList) {
  const wishlistCountBubble = document.querySelectorAll(".wishlist-count-bubble");
  const wishlistCount = document.querySelectorAll("[data-wishlist-count]");
  const count = wishlistList.length;
  
  if (wishlistCount.length > 0) {
    wishlistCount.forEach(elem => {
      elem.textContent = count > 0 ? count : 0;
    });
  }
  
  if (wishlistCountBubble.length > 0) {
    if (count === 0) {
      wishlistCountBubble.forEach(bubble => bubble.style.display = "none");
    } else {
      wishlistCountBubble.forEach(bubble => bubble.style.display = "");
    }
  }
}

function initWishlistFromLocalStorage() {
  let wishlistList = [];
  try {
    const stored = localStorage.getItem('wishlistItem');
    if (stored) {
      wishlistList = JSON.parse(stored);
      if (!Array.isArray(wishlistList)) wishlistList = [];
    }
  } catch (e) {
    wishlistList = [];
  }

  localStorage.setItem('wishlistItem', JSON.stringify(wishlistList));

  const updateWishlistMailEvent = new CustomEvent('update:wishlist-mail', { bubbles: true });
  document.dispatchEvent(updateWishlistMailEvent); 

  checkWishlistCountGlobal(wishlistList);

  if (wishlistList.length > 0) {
    wishlistList.forEach((handle) => {
      setProductForWishlistGlobal(handle);
    });
  }
}

class Wishlist extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.wishlistButton = this.querySelector("[data-wishlist]");
    if (this.wishlistButton) {
      this.wishlistButton.addEventListener(
        "click",
        this.onWishlistButtonClick.bind(this)
      );
    }
  }

  onWishlistButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;
    const isInGrid = target.classList.contains("is-in-grid");

    if (!isInGrid) {
      document
        .querySelectorAll("[data-wishlist-items-display]")
        .forEach((el) => {
          el.classList.remove("is-loaded");
        });
    }

    const id = target.dataset.productId;
    const handle = target.dataset.wishlistHandle;
    if (!handle) return;

    let wishlistList = JSON.parse(localStorage.getItem("wishlistItem")) || [];
    let index = wishlistList.indexOf(handle);

    if (!target.classList.contains("wishlist-added")) {
      target.classList.add("wishlist-added");
      const textElement = target.querySelector(".text");
      if (textElement) textElement.textContent = window.wishlist.added;
      if (target.tagName === 'BUTTON') target.setAttribute('title', window.wishlist.added);

      if (!wishlistList.includes(handle)) {
        wishlistList.push(handle);
        localStorage.setItem("wishlistItem", JSON.stringify(wishlistList));
      }

      document.dispatchEvent(new CustomEvent("add:wishlist-item", { detail: { handle }, bubbles: true }));
      document.dispatchEvent(new CustomEvent("update:pagination", { bubbles: true }));
      document.dispatchEvent(new CustomEvent("update:wishlist-mail", { bubbles: true }));
    } else {
      target.classList.remove("wishlist-added");
      const textElement = target.querySelector(".text");
      if (textElement) textElement.textContent = window.wishlist.add;
      if (target.tagName === 'BUTTON') target.setAttribute('title', window.wishlist.add);

      if (index > -1) {
        wishlistList.splice(index, 1);
        localStorage.setItem("wishlistItem", JSON.stringify(wishlistList));
      }

      document.dispatchEvent(
        new CustomEvent("remove:wishlist-item", { detail: { handle, productId: id }, bubbles: true })
      );
      document.dispatchEvent(new CustomEvent("update:pagination", { bubbles: true }));
      document.dispatchEvent(new CustomEvent("update:wishlist-mail", { bubbles: true }));
    }

    checkWishlistCountGlobal(wishlistList);
    setProductForWishlistGlobal(handle);
  }

  setProductForWishlist(handle) {
    setProductForWishlistGlobal(handle);
  }

  checkWishlistCount(wishlistList) {
    checkWishlistCountGlobal(wishlistList);
  }
}
if (!customElements.get("wish-list"))
  customElements.define("wish-list", Wishlist);

class WishlistView extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.gridViewContainer = this.querySelector('[data-wishlist-items-grid-display]');
    this.wishlistPaginateContainer = document.getElementById('wishlist-paginate');
    this.wishlistContainer = this.closest('[data-wishlist-container]');
    this.wishlistFooter = document.querySelector('[data-wishlist-footer]');

    this.viewCols = this.wishlistContainer ? [...this.wishlistContainer.querySelectorAll('[data-col]')] : [];

    this.viewCols.forEach(viewCol => {
      viewCol.addEventListener('click', this.onViewColClick.bind(this));
    });

    window.addEventListener('resize', theme.utils.rafThrottle(this.onResize.bind(this)));

    this.initWishlistPage();
  }

  getMaxColOnSize() {
    const availableViewCols = this.viewCols.filter(view => {
      return getComputedStyle(view, null).getPropertyValue('display') === 'inline-block';
    }).map(view => Number(view.dataset.col));

    return availableViewCols[availableViewCols.length - 1];
  }

  onResize() {
    const selectedColEl = this.wishlistContainer?.querySelector('[data-col].active');
    if (!selectedColEl) return;
    const selectedCol = Number(selectedColEl.dataset.col);
    const maxColNum = this.getMaxColOnSize();

    if (selectedCol > maxColNum) {
      const target = this.viewCols.find(viewCol => Number(viewCol.dataset.col) === maxColNum);
      if (target) target.click();
    }
  }

  onViewColClick(event) {
    const viewCol = event.target;
    const col = Number(viewCol.dataset.col);

    this.switchViewListGrid(col === 1);
    this.setPaginationAndHeadingView(col === 1);
    this.paginationForList(col === 1);
    this.setGridColumns(col);
    this.setActiveViewCol(viewCol);
  }

  switchViewListGrid(isList) {
    if (!this.gridViewContainer) return;
    if (isList) {
      this.gridViewContainer.classList.add('productList');
      return;
    }

    this.gridViewContainer.classList.remove('productList');
  }

  setGridColumns(col) {
    if (!this.gridViewContainer) return;
    this.gridViewContainer.style.setProperty('--grid-columns', col);
  }

  setActiveViewCol(colElement) {
    this.viewCols.forEach(col => col.classList.remove('active'));
    colElement.classList.add('active');
  }

  setPaginationAndHeadingView(isList) {
    if (!this.wishlistPaginateContainer) return;
    if (isList) {
      this.wishlistPaginateContainer.style.display = 'flex';
      return;
    }

    this.wishlistPaginateContainer.style.display = 'none';
  }

  paginationForList(isList) {
    if (!this.gridViewContainer || !this.wishlistPaginateContainer) return;
    const items = this.gridViewContainer.querySelectorAll('.product');
    const currentPage = Number(this.wishlistPaginateContainer.dataset.currentPage);

    if (isList && currentPage) {
      items.forEach((item, index) => {
        if (index >= (currentPage - 1) * 3 && index < currentPage * 3) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    } else {
      items.forEach((item) => {
        item.style.display = '';
      });
    }
  }

  async initWishlistPage() {
    if (typeof(Storage) !== 'undefined') {
      const wishlistList = localStorage.getItem('wishlistItem') ? JSON.parse(localStorage.getItem('wishlistItem')) : [];

      if (wishlistList.length > 0) {
        try {
          await Promise.all(wishlistList.map((handle, index) => this.setProductForWishlistPage(handle, index, wishlistList.length)));
          this.updateShareWishlistViaMail();
          this.gridViewContainer?.classList.add('is-loaded');
          this.wishlistPagination();
          this.setDefaultLayout();

          document.addEventListener('update:pagination', this.wishlistPagination.bind(this));
          document.addEventListener('update:wishlist-mail', this.updateShareWishlistViaMail.bind(this));
          document.addEventListener('add:wishlist-item', async (event) => {
            const handle = event.detail?.handle;
            if (!handle) return;
            await this.setProductForWishlistPage(handle);
            this.wishlistPagination();
            this.updateShareWishlistViaMail();
          });
          document.addEventListener('remove:wishlist-item', (event) => {
            const handle = event.detail?.handle;
            const productId = event.detail?.productId;
            this.removeItemFromWishlistPage(handle, productId);
            this.updateShareWishlistViaMail();
          });
        } catch(err) {
          console.error(err);
        }
      } else {
        if (this.wishlistContainer) {
          this.wishlistContainer.classList.add('is-empty');
          this.wishlistContainer.innerHTML = `
            <div class="page-margin wishlist-content-empty center">
              <span class="wishlist-content-text block">${window.wishlist.empty}</span>
              <div class="wishlist-content-actions">
                <a class="button" href="${window.routes?.collection_all}">
                  ${window.wishlist.continue_shopping}
                </a>
              </div>
            </div>
          `;
        }

        if (this.wishlistFooter) this.wishlistFooter.style.display = 'none';
      }
    } else {
      alert('Sorry! No web storage support..');
    }
  }

  setDefaultLayout() {
    const defaultDesktopCol = parseInt(this.dataset.defaultDesktopCol);
    const maxCol = this.getMaxColOnSize();
    const defaultCol = (defaultDesktopCol <= maxCol) ? defaultDesktopCol : maxCol;

    const targetViewCol = this.viewCols.find(viewCol => parseInt(viewCol.dataset.col) === defaultCol );
    if (targetViewCol) {
      targetViewCol.click();
    }
  }

  async setProductForWishlistPage(handle) {
    try {
      if (!this.gridViewContainer || !handle) return;

      const res = await fetch(`${window.routes.shop_origin}/products/${handle}?view=block_wishlist_card`);
      const data = await res.text();
      const parser = new DOMParser();

      const parsedDoc = parser.parseFromString(data, 'text/html');
      const productHTML = parsedDoc.querySelectorAll('#MainContent .card--block')[0];
      if (!productHTML) return;

      this.gridViewContainer.appendChild(productHTML);
      productHTML.dataset.productHandle = handle;

      this.updateProductForWishlistPage();

      const item = this.wishlistContainer?.querySelector(`.card--block[data-product-handle="${handle}"]`);

      if (item != null) {
        // debug: console.log(item);
        item.querySelector('[data-wishlist]').classList.add('wishlist-added');
        item.querySelector('[data-wishlist] .text').textContent = window.wishlist.remove;
        item.classList.add('is-in-grid');
        productHTML.dataset.wishlistAdded = `wishlist-${item.dataset.productCardId}`;
      }

    } catch (err) {
      console.error(err);
    }
  }

  updateProductForWishlistPage() {
    const sectionFetcher = document.querySelector('section-fetcher');

    if (sectionFetcher && typeof sectionFetcher.initialize === 'function') {
      sectionFetcher.initialize();
    } else {
      console.error('WishlistView: No section fetcher component found or initialize method not available');
    }
  }

  wishlistPagination() {
    if (!this.wishlistPaginateContainer || !this.gridViewContainer) return;
    const wishlistList = localStorage.getItem('wishlistItem') ? JSON.parse(localStorage.getItem('wishlistItem')) : [];

    this.wishlistPaginateContainer.setAttribute('data-current-page', 1);
    while (this.wishlistPaginateContainer.firstChild) {
      this.wishlistPaginateContainer.removeChild(this.wishlistPaginateContainer.firstChild);
    }

    if (!this.gridViewContainer.classList.contains('productList')) return;
    this.gridViewContainer.classList.remove('is-loaded');

    this.totalPages = Math.ceil(wishlistList.filter(item => item != null).length / 3);

    if (this.totalPages <= 1) {
      [...this.gridViewContainer.children].forEach(child => {
        child.style.display = 'block';
      });
      this.gridViewContainer.classList.add('is-loaded');
      return;
    }

    this.gridViewContainer.classList.add('is-loaded');
  }

  removeItemFromWishlistPage(handle, productId) {
    if (!this.gridViewContainer) return;
    let productElement = null;

    if (handle) {
      productElement = this.gridViewContainer.querySelector(`[data-product-handle="${handle}"]`);
    }

    if (!productElement && productId) {
      productElement = this.gridViewContainer.querySelector(`[data-wishlist-added="wishlist-${productId}"]`);
    }

    if (productElement) {
      productElement.remove();
    }

    const wishlistList = localStorage.getItem('wishlistItem') ? JSON.parse(localStorage.getItem('wishlistItem')) : [];
    const remainingItems = this.gridViewContainer.querySelectorAll('[data-product-handle]');

    if (wishlistList.length === 0 || remainingItems.length === 0) {
      if (this.wishlistContainer) {
        this.wishlistContainer.classList.add('is-empty');
        this.wishlistContainer.innerHTML = `
          <div class="page-margin wishlist-content-empty center">
            <span class="wishlist-content-text block">${window.wishlist.empty}</span>
            <div class="wishlist-content-actions">
              <a class="button" href="${window.routes?.collection_all}">
                ${window.wishlist.continue_shopping}
              </a>
            </div>
          </div>
        `;
      }

      if (this.wishlistFooter) {
        this.wishlistFooter.style.display = 'none';
      }
    } else {
      this.wishlistPagination();

      if (this.gridViewContainer.classList.contains('productList')) {
        this.paginationForList(true);
      }
    }
  }

  updateShareWishlistViaMail() {
    const regex = /(<([^>]+)>)/ig;
    const addedItems = document.querySelectorAll('[data-wishlist-added]');

    const shareLinkElement = document.querySelector('[data-wishlist-share]');
    if (!shareLinkElement) return;
    let href = 'mailto:?subject= Wish List&body=';

    addedItems.forEach((item) => {
      const price = item.querySelector('.price__sale .price-item--last')?.textContent || item.querySelector('.price__regular .price-item')?.textContent;
      const title = item.dataset.productTitle || item.querySelector('[data-product-title]')?.dataset.productTitle;
      const url = item.dataset.productUrl || item.querySelector('[data-product-url]')?.dataset.productUrl;
      if (!title || !url) return;

      href += encodeURIComponent(title + '\nPrice: ' + price?.replace(regex, '') + '\nLink: ' + window.location.protocol + '//' + window.location.hostname + url +'\n\n');
    });

    shareLinkElement.href = href;
  }
}
if (!customElements.get('wishlist-view')) customElements.define('wishlist-view', WishlistView);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWishlistFromLocalStorage);
} else {
  initWishlistFromLocalStorage();
}

class CountDown extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.d = new Date(this.dataset.countdown).getTime();
    this.t = this.dataset.type;
    this.e = this.dataset.hide;
    this.createObserver();
  }

  init(time, type, hide) {
    var countdown = setInterval(() => {
      let now = new Date().getTime();

      if (isNaN(time)) {
        time = new Date(this.dataset.countdown.replace(/-/g, "/")).getTime();

        if (isNaN(time)) {
          clearInterval(countdown);
          this.parentElement.classList.add("hidden");
          return;
        }
      }

      let distance = time - now;

      if (distance < 0) {
        clearInterval(countdown);
        if (hide == "true") {
          this.parentElement.classList.add("hidden");
        } else {
          let content = `<span class="countdown-item inline-block v-a-top center"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.days}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.hours}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.mins}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">0<span class="block body-sm">${window.countdown.secs}</span></span></span>`;

          this.querySelector(".countdown").innerHTML = content;
          this.querySelector(".countdown-expired").classList.remove("hidden");
        }
      } else {
        let day = Math.floor(distance / (1000 * 60 * 60 * 24)),
          hour = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minute = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          second = Math.floor((distance % (1000 * 60)) / 1000),
          content;

        if (type == "sale-banner") {
          content = `<span class="countdown-item inline-block v-a-top center"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${day}<span class="block body-sm">${window.countdown.days}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${hour}<span class="block body-sm">${window.countdown.hours}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${minute}<span class="block body-sm">${window.countdown.mins}</span></span></span>\
              <span class="countdown-item inline-block v-a-top center w-auto"><span class="flex flex-column items-center justify-center countdown-digit typography-font-body font-semibold relative">${second}<span class="block body-sm">${window.countdown.secs}</span></span></span>`;

          this.querySelector(".countdown").innerHTML = content;
          this.parentElement.classList.remove("hidden");
        }
      }
    }, 1000);
  }

  createObserver() {
    let observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          this.init(this.d, this.t, this.e);
          observer.unobserve(this);
        });
      },
      { rootMargin: "0px 0px -200px 0px" }
    );

    observer.observe(this);
  }
}
if (!customElements.get("count-down"))
  customElements.define("count-down", CountDown);

class ColorSwatch extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.swatchList = this.querySelector(".swatch-list");
    this.variantSelectsSwatchList = this.querySelector("variant-selects .swatch-list");
    this.swatchList?.addEventListener(
      "click",
      this.handleSwatchClick.bind(this)
    );
  }

  handleSwatchClickActive(event) {
    const target = event.target;
    if (target.closest(".swatch-item")) {
      this.querySelectorAll(".swatch-item").forEach(item => {
        if (item !== target.closest(".swatch-item")) {
          item.classList.remove("active");
        }
      });
      target.closest(".swatch-item").classList.add("active");
    }
  }

  handleSwatchClick(event) {
    let target = event.target,
      title = target.getAttribute("data-title")?.trim(),
      product = target.closest(".card-wrapper");
      if (!product) return;

    let template = product.querySelector("template"),
      fragment = template.content.cloneNode(true),
      divFragment = fragment.querySelector("[data-json-product]"),
      jsonData = divFragment.getAttribute("data-json-product"),
      productJson = JSON.parse(jsonData),
      productTitle = product.querySelector(".card__heading > a"),
      variantId = Number(target.dataset.variantId),
      productHref = product.querySelector("a").getAttribute("href"),
      newImage = target.dataset.variantImg,
      mediaList = [];

    if (target.closest(".swatch-item")) {
      this.handleSwatchClickActive(event);
      // format title
      title = title.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      // CHANGE TITLE
      if (productTitle.classList.contains("card-title-change")) {
        productTitle
          .querySelector(".text")
          .setAttribute("data-change-title", " - " + title);
      } else {
        productTitle.classList.add("card-title-change");
        productTitle
          .querySelector(".text")
          .setAttribute("data-change-title", " - " + title);
      }

      const selectedVariant = productJson.variants.find(
        (variant) => variant.id === variantId
      );

      if (selectedVariant.compare_at_price > selectedVariant.price) {
        product.querySelector(".price").classList.add("price--on-sale");

        product.querySelector(".price__sale .price-item--regular").innerHTML =
          Shopify.formatMoney(
            selectedVariant.compare_at_price,
            window.money_format
          );

        product.querySelector(".price__sale .price-item--sale").innerHTML =
          Shopify.formatMoney(selectedVariant.price, window.money_format);

        const labelSale = `(-${Math.round(
          ((selectedVariant.compare_at_price - selectedVariant.price) * 100) /
            selectedVariant.compare_at_price
        )}%)`;

        const salePercent = product.querySelector(
          ".price__sale .price-item--percent span"
        );
        if (salePercent) salePercent.innerHTML = labelSale;
      } else {
        product.querySelector(".price__regular .price-item").innerHTML =
          Shopify.formatMoney(selectedVariant.price, window.money_format);

        if (selectedVariant.compare_at_price == null) {
          product.querySelector(".price").classList.remove("price--on-sale");
          product.querySelector(".price__sale .price-item--regular").innerHTML =
            "";
        }
      }

      product
        .querySelector(".card__heading > a")
        .setAttribute(
          "href",
          productHref.split("?variant=")[0] + "?variant=" + variantId
        );

      if (productJson.media != undefined) {
        const mediaList = productJson.media.filter((index, element) => {
          return element.alt === title;
        });
      }

      if (mediaList.length > 0) {
        if (mediaList.length > 1) {
          const length = 2;
        } else {
          const length = mediaList.length;
        }

        for (let i = 0; i < length; i++) {
          product
            .querySelector(".card__media img:eq(" + i + ")")
            .setAttribute("srcset", mediaList[i].src);
        }
      } else {
        if (newImage) {
          product
            .querySelector(".card__media img:nth-child(1)")
            .setAttribute("srcset", newImage);
        }
      }
    }

  }
}
if (!customElements.get("color-swatch"))
  customElements.define("color-swatch", ColorSwatch);

class ShowMoreGrid extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.refType = this.getAttribute("ref");
    this.button = this.querySelector("button");
    if (!this.button || !this.refType) return;

    if (this.refType === "collection-grid") {
      this.itemsPerClick = parseInt(this.getAttribute("data-max-items"));
      this.currentIndex = 0;
    }

    this.button.addEventListener("click", this.handleButtonClick.bind(this));
  }

  handleButtonClick(event) {
    event.preventDefault();

    if (this.refType === "collection-grid") {
      this.handleCollectionGrid();
    } else if (this.refType === "product-grid") {
      this.handleProductGrid();
    }
  }

  handleCollectionGrid() {
    const sectionContent = this.closest(".collection-list-page");
    if (!sectionContent) return;

    const template = sectionContent.querySelector(
      "template[data-collection-card-template-showmore]"
    );
    if (!template) return;

    const collectionListEditorial = sectionContent.querySelector(".editorial-collection__grid");

    const allHiddenItems = Array.from(
      collectionListEditorial ? template.content.querySelectorAll(".editorial-collection__item") : template.content.querySelectorAll(".resource-list__item")
    );

    const collectionList = collectionListEditorial ? collectionListEditorial : sectionContent.querySelector(".resource-list");
    if (!collectionList || !allHiddenItems.length) return;

    const nextItems = allHiddenItems.slice(
      this.currentIndex,
      this.currentIndex + this.itemsPerClick
    );

    nextItems.forEach((item) => {
      const clone = item.cloneNode(true);
      collectionList.appendChild(clone);
    });

    this.currentIndex += this.itemsPerClick;

    if (this.currentIndex >= allHiddenItems.length) {
      this.remove();
    }
  }

  handleProductGrid() {
    const sectionContent = this.closest(".section-global__content");
    if (!sectionContent) return;

    const template = sectionContent.querySelector(
      "template[data-product-grid-template-showmore]"
    );
    if (!template) return;

    const productGrid = sectionContent.querySelector(
      ".collection--grid-layout .grid-layout"
    );
    if (!productGrid) return;

    const templateContent = template.content.cloneNode(true);
    productGrid.appendChild(templateContent);

    this.remove();
  }
}
if (!customElements.get("show-more-grid")) {
  customElements.define("show-more-grid", ShowMoreGrid);
}

class ParallaxImg extends HTMLElement {
  constructor() {
    super();
    this.img = null;
    this.disableParallaxMobile =
      this.getAttribute("data-disable-parallax-mobile") === "true";
    this.isMobile = window.innerWidth < 750;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    if (this.getAttribute("data-parallax") !== "true") return;

    this.img = this.querySelector(".image-parallax--target");
    if (!this.img) return;

    if (this.disableParallaxMobile && this.isMobile) return;

    if (this.img.complete) {
      this.setupParallax();
    } else {
      this.img.addEventListener("load", () => this.setupParallax(), {
        once: true,
      });
    }
  }

  setupParallax() {
    const speed = parseFloat(this.dataset.speed) || 0.5;
    const screenSpeed = window.innerWidth < 750 ? speed * 0.5 : speed;
    const minExtra = parseInt(this.dataset.minExtra) || 100;

    const viewportHeight = window.innerHeight;
    const blockHeight = this.offsetHeight;

    let imgHeight = this.img.getBoundingClientRect().height;

    if (imgHeight - blockHeight < minExtra) {
      imgHeight = this.img.getBoundingClientRect().height + minExtra;
    }

    const maxMove = (imgHeight - blockHeight) * (viewportHeight / blockHeight);
    const startY = -maxMove * screenSpeed;
    const endY = maxMove * screenSpeed;

    Motion.scroll(
      Motion.animate(
        this.img,
        { y: [startY, endY] },
        {
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.3,
        }
      ),
      { target: this, offset: ["start end", "end start"] }
    );
  }
}
if (!customElements.get("parallax-image"))
  customElements.define("parallax-image", ParallaxImg);

// Animation block scroll up/down according to window
class ParallaxElement extends HTMLElement {
  constructor() {
    super();
    this.target = null;
    this.type = this.getAttribute("is") || "content";
    this.disableParallaxMobile =
      this.getAttribute("data-disable-parallax-mobile") === "true";
    this.isMobile = window.innerWidth < 750;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    if (this.getAttribute("data-parallax") !== "true") return;

    this.target =
      this.querySelector(".parallax--target") || this.firstElementChild;
    if (!this.target) return;

    if (this.disableParallaxMobile && this.isMobile) return;

    if (this.type === "image") {
      if (this.target.complete) {
        this.setupImage();
      } else {
        this.target.addEventListener("load", () => this.setupImage(), {
          once: true,
        });
      }
    } else {
      this.section = this.closest(".shopify-section") || this;
      this.setupContent();
    }
  }

  setupImage() {
    const speed = parseFloat(this.dataset.speed) || 0.5;
    const screenSpeed = window.innerWidth < 750 ? speed * 0.5 : speed;
    const minExtra = parseInt(this.dataset.minExtra) || 100;

    const viewportHeight = window.innerHeight;
    const blockHeight = this.offsetHeight;

    let imgHeight = this.target.getBoundingClientRect().height;
    if (imgHeight - blockHeight < minExtra) {
      imgHeight += minExtra;
    }

    const maxMove = (imgHeight - blockHeight) * (viewportHeight / blockHeight);
    const startY = -maxMove * screenSpeed;
    const endY = maxMove * screenSpeed;

    Motion.scroll(
      Motion.animate(
        this.target,
        { y: [startY, endY] },
        {
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.3,
        }
      ),
      { target: this, offset: ["start end", "end start"] }
    );
  }

  setupContent() {
    const speed = parseFloat(this.dataset.speed) || 0.5;
    const screenSpeed = window.innerWidth < 750 ? speed * 0.5 : speed;

    const horizontalRange = (this.dataset.horizontalPosition || "0% 0%").split(
      " "
    );
    const verticalRange = (this.dataset.verticalPosition || "0% 0%").split(" ");

    const startX = horizontalRange[0] || "0%";
    const startY = verticalRange[0] || "0%";

    const parseVal = (val) => {
      if (typeof val === "string" && val.includes("%")) return parseFloat(val);
      return parseFloat(val) || 0;
    };

    const midX = parseVal(startX);
    const midY = parseVal(startY);

    const reverseX = (midX * -1) / 3;
    const reverseY = (midY * -1) / 3;

    if (midX === 0 && midY === 0) {
      const startY = -30 * screenSpeed;
      const endY = 30 * screenSpeed;

      Motion.scroll(
        Motion.animate(
          this.target,
          { y: [`${startY}%`, `${endY}%`] },
          {
            ease: [0.25, 0.1, 0.25, 1],
            duration: 0.3,
          }
        ),
        { target: this.section, offset: ["start end", "end start"] }
      );
      return;
    }

    Motion.scroll(
      Motion.animate(
        this.target,
        {
          x: ["0%", `${midX}%`, `${reverseX}%`],
          y: ["0%", `${midY}%`, `${reverseY}%`],
        },
        {
          ease: [0.25, 0.1, 0.25, 1],
          duration: 0.3,
        }
      ),
      {
        target: this.section,
        offset: ["start end", "center center", "end start"],
      }
    );
  }
}
if (!customElements.get("parallax-element"))
customElements.define("parallax-element", ParallaxElement);


// Animation large banner background image scroll up/down according to window
class ParallaxBackground extends HTMLElement {
  constructor() {
    super();
    this.image = null;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    this.parallax();
  }

  parallax() {
    this.image = this.querySelector("img");

    if (this.image)  {
      Motion.scroll(
        Motion.animate(
          this.image,
          { y: ['-30%', '30%'] },
          {
            ease: "none",
            duration: 1,
          }
        ),
        { target: this, offset: ["start end", "end start"] }
      );
    }
  }
}
if (!customElements.get("parallax-background"))
  customElements.define("parallax-background", ParallaxBackground);

class SplitWords extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    const splitting = Splitting({ target: this, by: 'words' });

    splitting[0].words.forEach((text, idx) => {
      const wrapper = document.createElement('animated-element');
      wrapper.className = 'inline-block';
      wrapper.setAttribute('data-animate-type', this.getAttribute('data-animate-type'));
      wrapper.setAttribute('data-animate-delay', (this.hasAttribute('data-animate-delay') ? parseInt(this.getAttribute('data-animate-delay')) : 0) + (idx * 20));

      for (const content of text.childNodes) {
        wrapper.appendChild(content);
      }

      text.appendChild(wrapper);
    });
  }
}
if (!customElements.get('split-words')) customElements.define('split-words', SplitWords);

class AnimatedElement extends HTMLElement {
  constructor() {
    super();

    this.animationType = this.getAttribute('data-animate-type');
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    this.beforeLoad();

    Motion.inView(this, this.afterLoad.bind(this), { margin: '20px 0px 20px 0px' });
  }

  beforeLoad() {
    switch (this.animationType) {
      case 'slide-up':
        Motion.animate(this, { transform: 'translateY(95%)', opacity: 0 }, { duration: 0 });
        break;
    }
  }

  async afterLoad() {
    switch (this.animationType) {
      case 'slide-up':
        await Motion.animate(this, { transform: 'translateY(0)', opacity: 1 }, { duration: 1, easing: theme.config.easingFast }).finished;
        break;
    }
  }
}
if (!customElements.get('animated-element')) customElements.define('animated-element', AnimatedElement);

class AnimateImage extends HTMLElement {
  constructor() {
    super();

    this.animationType = this.getAttribute('data-animate-type');
    this.image = this.querySelector('img');
    this.delay = this.getAttribute('data-delay') || 0;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    this.beforeLoad();

    Motion.inView(this, async () => {
      if (this.media) await theme.utils.imageLoaded(this.media);
      this.afterLoad();
    });
  }

  beforeLoad() {
    switch (this.animationType) {
      case 'reveal_on_scroll':
        Motion.animate(this.image, { opacity: 0, scale: 1, clipPath: 'inset(0 100% 0 0)' }, { duration: 0 });
        break;
      case 'zoom-out':
        Motion.animate(this.image, { transform: 'scale(1.2)' }, { duration: 0 });
        break;
      case 'fade-in':
        Motion.animate(this.image, { opacity: 0 }, { duration: 0 });
        break;
    }
  }

  async afterLoad() {
    switch (this.animationType) {
      case 'reveal_on_scroll':
        await Motion.animate(this.image, { opacity: 1, scale: 1, clipPath: 'inset(0 0 0 0)' }, { duration: 1, delay: this.delay, easing: theme.config.easing }).finished;
        break;
      case 'zoom-out':
        await Motion.animate(this.image, { transform: 'scale(1)' }, { duration: 1, delay: this.delay, easing: theme.config.easing }).finished;
        break;
      case 'fade-in':
        await Motion.animate(this.image, { opacity: 1 }, { duration: 1, delay: this.delay, easing: theme.config.easing }).finished;
        break;
    }
  }
}
if (!customElements.get('animate-image')) customElements.define('animate-image', AnimateImage);

// Reveal highlight color underline on scroll
class HighlightText extends HTMLElement {
  constructor() {
    super();

    if (theme.config.motionReduced) return;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;
    Motion.inView(this, this.active.bind(this), { margin: '20px 0px 20px 0px' });
  }

  disconnectedCallback() {
    if (theme.config.motionReduced) return;
    this.classList.remove('highlight_text--active');
  }

  active() {
    this.classList.add('highlight_text--active');
  }
}
if (!customElements.get('highlight-text')) customElements.define('highlight-text', HighlightText);

// Animation footer scroll up/down according to window
class FooterParallax extends HTMLElement {
  constructor() {
    super();

    if (theme.config.motionReduced) return;
    if (this.mobileDisabled && (theme.config.isTouch || theme.config.mqlSmall)) return;
    this.parallax();
  }

  get mobileDisabled() {
    return true;
  }

  parallax() {
    Motion.scroll(
      Motion.animate(this, { transform: ['translateY(-50%)', 'translateY(0)'] }),
      { target: this, offset: Motion.ScrollOffset.Enter }
    );
  }
}
if (!customElements.get('footer-parallax')) customElements.define('footer-parallax', FooterParallax);

  /**
 * A custom element that formats rte content for easier styling
 */
class RTEFormatter extends HTMLElement {
  connectedCallback() {
    this.querySelectorAll("table").forEach(this.#formatTable);
  }

  /**
   * Formats a table for easier styling
   * @param {HTMLTableElement} table
   */
  #formatTable(table) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("rte-table-wrapper");
    const parent = table.parentNode;
    if (parent) {
      parent.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  }
}
if (!customElements.get("rte-formatter"))
  customElements.define("rte-formatter", RTEFormatter);

class StrokeText extends HTMLElement {
  constructor() {
    super();
    this._animation = null;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;

    this.style.backgroundSize = "0% 100%";
    this.style.backgroundRepeat = "no-repeat";
    this.style.transition = "none";

    if (theme.config.isTouch) return;

    this.addEventListener("mouseenter", (e) => {
      this.updatePosition(e);
      this.play(true);
    });

    this.addEventListener("mouseleave", (e) => {
      this.updatePosition(e);
      this.play(false);
    });

    this.addEventListener("mousemove", theme.utils.rafThrottle(this.updatePosition.bind(this)));
  }

  play(toFull) {
    if (this._animation) this._animation.cancel();

    this._animation = Motion.animate(
      this,
      { backgroundSize: toFull ? "100% 100%" : "0% 100%" },
      { duration: 0.4, easing: theme.config.easing }
    );
  }

  updatePosition(e) {
    const rect = this.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    this.style.backgroundPosition = `${xPercent}% 50%`;
  }
}
if (!customElements.get("stroke-text"))
  customElements.define("stroke-text", StrokeText);

class InfiniteScrolling extends HTMLElement {
  constructor() {
    super();
    this.isLoading = false;
    this.currentPage = 1;
    this.hasNextPage = true;
    this.productGrid = null;
    this.init();
  }

  init() {
    this.productGrid = document.querySelector('#ResultsList .product-grid');
    if (!this.productGrid) return;

    this.currentPage = parseInt(this.productGrid.dataset.currentPage) || 1;
    this.hasNextPage = parseInt(this.productGrid.dataset.totalPages) > this.currentPage;

    this.bindEvents();
  }

  bindEvents() {
    const infiniteButton = document.querySelector('[data-infinite-scrolling]');
    if (infiniteButton) {

      this.setupIntersectionObserver(infiniteButton);
    }

    window.addEventListener('scroll', theme.utils.rafThrottle(this.handleScroll.bind(this)));
  }

  setupIntersectionObserver(target) {
    const options = {
      root: null,
      rootMargin: '-100px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isLoading && this.hasNextPage) {
          this.loadNextPage();
        }
      });
    }, options);

    observer.observe(target);
  }

  handleScroll() {
    const infiniteButton = this.querySelector('[data-infinite-scrolling]');
    if (!infiniteButton || this.isLoading || !this.hasNextPage) return;

    const rect = infiniteButton.getBoundingClientRect();
    const height = rect.height + 100;
    const isVisible = rect.top <= window.innerHeight - height;

    if (isVisible) {
      this.loadNextPage();
    }
  }

  async loadNextPage() {
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const nextPage = this.currentPage + 1;
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('page', nextPage);

      const response = await fetch(currentUrl.toString());
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newProducts = doc.querySelectorAll('.product-grid__item');

      if (newProducts.length > 0 && this.productGrid) {
        newProducts.forEach(product => {
          const clonedProduct = product.cloneNode(true);
          clonedProduct.dataset.page = nextPage;
          this.productGrid.appendChild(clonedProduct);
        });

        this.currentPage = nextPage;

        const pagination = doc.querySelector('.pagination');
        if (pagination) {
          const nextButton = pagination.querySelector('.pagination__item--next');
          this.hasNextPage = !!nextButton;
        } else {
          this.hasNextPage = false;
        }

        this.productGrid.dataset.currentPage = this.currentPage;

        this.updatePaginationProgress();

        if (this.hasNextPage) {
          window.history.replaceState({}, '', currentUrl.toString());
        } else {
          const infiniteButton = this.querySelector('[data-infinite-scrolling]');
          if (infiniteButton) {
            infiniteButton.style.display = 'none';
          }
        }

        this.reinitializeComponents();

        this.dispatchProductsLoadedEvent();
      } else {
        this.hasNextPage = false;
      }

    } catch (error) {
      console.error('Error loading next page:', error);
      this.hasNextPage = false;
    } finally {
      this.hideLoadingState();
      this.isLoading = false;
    }
  }

  showLoadingState() {
    const infiniteButton = this.querySelector('[data-infinite-scrolling]');
    const spinner = infiniteButton.querySelector('.loading__spinner');
    if (infiniteButton) {
      infiniteButton.classList.add('loading');
      spinner.classList.remove('hidden');
      infiniteButton.disabled = true;
    }

    if (this.productGrid) {
      this.productGrid.classList.add('loading');
    }
  }

  hideLoadingState() {
    const infiniteButton = this.querySelector('[data-infinite-scrolling]');
    const spinner = infiniteButton.querySelector('.loading__spinner');
    const text = infiniteButton.querySelector('.text');
    if (infiniteButton) {
      if (!this.hasNextPage) {
        text.innerHTML = window.button_load_more.no_more;
      } else {
        text.innerHTML = window.button_load_more.default;
      }
      infiniteButton.classList.remove('loading');
      spinner.classList.add('hidden');
      infiniteButton.disabled = false;
    }

    if (this.productGrid) {
      this.productGrid.classList.remove('loading');
    }
  }

  reinitializeComponents() {
    if (window.lazyLoad) {
      window.lazyLoad.update();
    }

    if (window.animateOnScroll) {
      window.animateOnScroll.init();
    }

    this.reinitializeProductCards();

    if (typeof initMoreSwatchButtons === 'function') {
      initMoreSwatchButtons(this.productGrid || document);
    }
  }

  reinitializeProductCards() {
    const newProducts = this.productGrid.querySelectorAll(`[data-page="${this.currentPage}"]`);

    newProducts.forEach(product => {
      const quickAddButtons = product.querySelectorAll('[data-quick-add]');
      quickAddButtons.forEach(button => {
        if (window.QuickAdd) {
          window.QuickAdd.initButton(button);
        }
      });
    });
  }

  dispatchProductsLoadedEvent() {
    const event = new CustomEvent('productsLoaded', {
      detail: {
        page: this.currentPage,
        totalPages: parseInt(this.productGrid.dataset.totalPages),
        hasNextPage: this.hasNextPage
      }
    });
    document.dispatchEvent(event);
  }

  updatePaginationProgress() {
    const totalStartElement = this.querySelector('[data-total-start]');
    const totalEndElement = this.querySelector('[data-total-end]');
    const progressBar = this.querySelector('.pagination-total-item');

    if (totalStartElement && totalEndElement && progressBar) {
      const currentPage = this.currentPage;
      const pageSize = parseInt(this.productGrid.dataset.pageSize) || 24;
      const totalItems = parseInt(this.productGrid.dataset.totalItems) || 0;

      const newStart = (currentPage - 1) * pageSize + 1;
      const newEnd = Math.min(currentPage * pageSize, totalItems);

      totalEndElement.textContent = newEnd;

      const progressPercentage = (newEnd / totalItems) * 100;
      progressBar.style.width = `${Math.min(progressPercentage, 100)}%`;

      const progressText = this.querySelector('.pagination-total-progress');
      if (progressText) {
        progressText.setAttribute('aria-valuenow', newEnd);
        progressText.setAttribute('aria-valuemax', totalItems);
      }

      progressBar.style.transition = 'width 0.5s ease-in-out';

      this.animateProgressUpdate(totalStartElement, totalEndElement, newStart, newEnd);
    }
  }

  animateProgressUpdate(startElement, endElement, newStart, newEnd) {
    if (startElement && endElement) {
      startElement.classList.add('updating');
      endElement.classList.add('updating');

      setTimeout(() => {
        startElement.classList.remove('updating');
        endElement.classList.remove('updating');
      }, 500);
    }
  }

  getProgressInfo() {
    const currentPage = this.currentPage;
    const pageSize = parseInt(this.productGrid.dataset.pageSize) || 24;
    const totalItems = parseInt(this.productGrid.dataset.totalItems) || 0;

    return {
      currentPage,
      pageSize,
      totalItems,
      currentStart: (currentPage - 1) * pageSize + 1,
      currentEnd: Math.min(currentPage * pageSize, totalItems),
      progressPercentage: Math.min((Math.min(currentPage * pageSize, totalItems) / totalItems) * 100, 100),
      hasNextPage: this.hasNextPage
    };
  }

}
if (!customElements.get("infinite-scrolling")) customElements.define('infinite-scrolling', InfiniteScrolling);

document.addEventListener(
  'toggle',
  (event) => {
    if (event.target instanceof HTMLDialogElement || event.target instanceof HTMLDetailsElement) {
      if (event.target.hasAttribute('scroll-lock')) {
        const { open } = event.target;

        if (open) {
          document.body.classList.add('overflow-hidden');
          document.documentElement.setAttribute('scroll-lock', '');
        } else {
          document.body.classList.remove('overflow-hidden');
          document.documentElement.removeAttribute('scroll-lock');
        }
      }
    }
  },
  { capture: true }
);

function updateClonedProductAttributes(product, count) {
  const form = product.querySelector('.shopify-product-form');
  if (!form) return;
  const formId = form.getAttribute('id') || '';
  const newFormId = formId + count;
  form.setAttribute('id', newFormId);

  const radios = product.querySelectorAll('input[type="radio"]');
  radios.forEach(formInput => {

    let formLabel = null;
    if (formInput.id) {
      formLabel = form.querySelector(`label[for="${formInput.id}"]`);
    }
    if (!formLabel && formInput.nextElementSibling && formInput.nextElementSibling.tagName === 'LABEL') {
      formLabel = formInput.nextElementSibling;
    }

    const id = formInput.getAttribute('id') || '';
    const newId = id + count;
    const formInputName = formInput.getAttribute('name') || '';

    if (formLabel) {
      formLabel.setAttribute('for', newId);
    }

    formInput.setAttribute('id', newId);
    formInput.setAttribute('name', formInputName + count);
  });
}

Shopify.removeItem = function(variant_id, index, callback) {
  getCartUpdate(index, 0, callback)
}

Shopify.getCart = function(callback) {
  fetch('/cart.js', { method: 'GET', credentials: 'same-origin' })
  .then(response => response.text())
  .then(data => {
    const cart = JSON.parse(data);
    if ((typeof callback) === 'function') {
        callback(cart);
    } else {
        Shopify.onCartUpdate(cart);
    }
});
}

function getCartUpdate(line, quantity, callback) {
  const body = JSON.stringify({
    line,
    quantity,
    sections_url: window.location.pathname,
  });

  fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
  .then((response) => {
    return response.text();
  })
  .then((state) => {
    const parsedState = JSON.parse(state);

    if (parsedState.errors) return;

    if ((typeof callback) === 'function') {
      callback(parsedState);
    } else {
      Shopify.onCartUpdate(parsedState);
    }
  })
  .catch((e) => {
      console.error(e);
  })
}

Shopify.onCartUpdate = function(cart) {
}

class FilterFAQs extends HTMLElement {
  constructor() {
    super();
    this.faqsPopup = document.getElementById('halo-faqs-popup');
    this.filterToggle = this.querySelector('[data-faqs-filter]');
    this.filterDropdown = this.querySelector('.faqs-filterDropdown-menu');
    this.filterDropdownArrow = this.filterToggle?.querySelector('[data-dropdown-arrow]');
    this.hasInitializedDropdown = false;

    this.init();
  }

  init() {
    this.initDropdownItems();

    if (this.filterToggle) {
      this.filterToggle.addEventListener('click', this.onClickFilterHandler.bind(this));
    }

    if (this.filterDropdown.querySelector('.text')) {
      this.filterDropdown.querySelectorAll('.text').forEach((filterButton) => {
        filterButton.addEventListener('click', this.onClickFilterButtonHandler.bind(this));
      });
    }

    if (this.querySelector('.faqs')) {
      this.querySelectorAll('.card-header').forEach((headerButton) => {
        headerButton.addEventListener('click', this.onClickHeaderButtonHandler.bind(this));
      });
    }

    if (!document.body.classList.contains('template-index')) {
      document.body.addEventListener('click', this.onBodyClickEvent.bind(this));
    }
  }

  initDropdownItems() {
    if (this.hasInitializedDropdown) return;

    const existingKeys = [...this.filterDropdown.querySelectorAll("li[data-value]")]
      .map(li => li.getAttribute("data-value"));

    const handles = [...this.querySelectorAll("[data-title-handle]")]
      .map(el => el.getAttribute("data-title-handle"))
      .filter(Boolean);

    if (JSON.stringify(existingKeys) === JSON.stringify(handles)) {
      this.hasInitializedDropdown = true;
      return;
    }

    handles.forEach(handle => {
      if (!existingKeys.includes(handle)) {
        const li = document.createElement("li");
        li.setAttribute("data-value", handle);
        li.setAttribute("tabindex", "-1");
        li.innerHTML = `<span class="text">${handle.replace(/-/g, " ")}</span>`;
        this.filterDropdown.appendChild(li);
      }
    });

    this.hasInitializedDropdown = true;
  }

  onClickFilterHandler() {
    this.filterDropdown.classList.toggle('is-show');
    this.filterDropdownArrow?.classList.toggle('active');
  }

  onClickFilterButtonHandler(event) {
    const btn = event.target.closest('li');
    if (!btn || btn.classList.contains('active')) return;

    const filterValue = btn.getAttribute('data-value');
    const filterText = event.target.innerText;

    this.filterToggle.querySelector('.text').innerText = filterText;

    this.filterDropdown.querySelectorAll('li').forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');

    if (filterValue) {
      this.querySelectorAll('.filter-faqs-item').forEach((el) => {
        const id = el.getAttribute('data-title-handle');
        if (id === filterValue) {
          el.classList.remove('hidden');
          el.classList.add('active');
        } else {
          el.classList.remove('active');
          el.classList.add('hidden');
        }
      });
    } else {
      this.querySelectorAll('.filter-faqs-item').forEach((el) => {
        el.classList.remove('hidden', 'active');
      });
    }

    this.filterDropdown.classList.remove('is-show');
    this.filterDropdownArrow?.classList.remove('active');
  }

  onClickHeaderButtonHandler(event) {
    const btn = event.currentTarget;
    const content = btn.nextElementSibling;

    btn.classList.toggle('collapsed');
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  }

  onBodyClickEvent(event) {
    if (event.target.closest('[data-faqs-filter]')) return;
    if (this.filterDropdown.classList.contains('is-show')) {
      this.filterDropdown.classList.remove('is-show');
      this.filterDropdownArrow?.classList.remove('active');
    }
  }
}
if (!customElements.get("filter-faqs"))
  customElements.define('filter-faqs', FilterFAQs);

class TextLoaderComponent extends HTMLElement {
  spinner() {
    this.querySelector('.loading__spinner').classList.remove('hidden');
  }

  shimmer() {
    this.setAttribute('shimmer', '');
  }
}
if (!customElements.get('text-loader-component'))
  customElements.define('text-loader-component', TextLoaderComponent);

function resetSpinner(container = document.body) {
  const spinners = container.querySelectorAll('text-loader-component');
  spinners.forEach((item) => {
    const spinner = item.querySelector('.loading__spinner');
    if (spinner) {
      spinner.classList.add('hidden');
    }
  });
}

function resetShimmer(container = document.body) {
  const shimmers = container.querySelectorAll('text-loader-component');
  shimmers.forEach((item) => {
    if (item) {
      item.removeAttribute('shimmer');
    }
  });
}

class SlideshowAnimated extends HTMLElement {
  constructor() {
    super();

    this.image = this.querySelector('[data-image-trans] img')
    this.speed = parseFloat(this.dataset.speed) || 0.5;
  }

  connectedCallback() {
    if (theme.config.motionReduced) return;
    this.initAnimate()
  }

  initAnimate() {
    let n = this.image.offsetHeight - this.offsetHeight;
    let yUp = Math.round(n * this.speed)
    let yDown = Math.round(n * this.speed) * -1
    let sectionIdex = this.closest('.section')?.dataset.index;
    let offset = ["center start", "end start"];

    Motion.scroll(
      Motion.animate(
        this.image,
        { y: [0, yUp] },
        { easing: 'linear' },
      ),
      { target: this, offset: offset }
    );
  }
}
if (!customElements.get('slideshow-animated')) customElements.define('slideshow-animated', SlideshowAnimated);

class MarqueeComponent extends HTMLElement {
  constructor() {
    super();
    this.wrapper = this.querySelector(".marquee__wrapper");
    this.content = this.querySelector(".marquee__content");
    this.isDesktop = theme.config.mqlDesktop;
  }

  connectedCallback() {
    theme.initSectionVisible({
      element: this,
      callback: this.init.bind(this),
      threshold: 400,
    });
  }

  disconnectedCallback() {
    if (this.isDesktop) {
      window.removeEventListener("resize", this.#handleResize);
      this.removeEventListener("pointerleave", this.#speedUp);
    }
  }

  init() {
    if (this.content.firstElementChild?.children.length === 0) return;

    this.#addRepeatedItems();
    this.#duplicateContent();
    this.#setSpeed();

    if (this.isDesktop) {
      window.addEventListener("resize", this.#handleResize);
      this.addEventListener("pointerleave", this.#speedUp);
    }
  }

  #animation = null;
  #duration = 500;

  #slowDown = theme.utils.debounce(() => {
    if (this.#animation) return;

    const animation = this.wrapper.getAnimations()[0];

    if (!animation) return;

    this.#animation = animateValue({
      duration: this.#duration,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, this.#duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animation = this.wrapper.getAnimations()[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      duration: this.#duration,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }

  get clonedContent() {
    const lastChild = this.wrapper.lastElementChild;

    return this.content !== lastChild ? lastChild : null;
  }

  #setSpeed(value = this.#calculateSpeed()) {
    this.style.setProperty("--marquee-speed", `${value}s`);
  }

  #calculateSpeed() {
    const speedFactor = Number(this.getAttribute("data-speed-factor"));
    const marqueeWidth = this.offsetWidth;
    const speed = Math.ceil(marqueeWidth / speedFactor / 2);
    return speed;
  }

  #handleResize = theme.utils.debounce(() => {
    const newNumberOfCopies = this.#calculateNumberOfCopies();
    const currentNumberOfCopies = this.content.children.length;

    if (newNumberOfCopies > currentNumberOfCopies) {
      this.#addRepeatedItems(newNumberOfCopies - currentNumberOfCopies);
    } else if (newNumberOfCopies < currentNumberOfCopies) {
      this.#removeRepeatedItems(currentNumberOfCopies - newNumberOfCopies);
    }

    this.#duplicateContent();
    this.#setSpeed();
    this.#restartAnimation();
  }, 250);

  #restartAnimation() {
    const animations = this.wrapper.getAnimations();

    requestAnimationFrame(() => {
      for (const animation of animations) {
        animation.currentTime = 0;
      }
    });
  }

  #duplicateContent() {
    this.clonedContent?.remove();

    const clone = (
      this.content.cloneNode(true)
    );

    clone.setAttribute("aria-hidden", "true");

    this.wrapper.appendChild(clone);
  }

  #addRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {
    if (!this.wrapper) return;

    for (let i = 0; i < numberOfCopies - 1; i++) {
      const clone = this.wrapper.querySelector('.marquee__repeated-items').cloneNode(true);

      clone.setAttribute("aria-hidden", "true");

      this.content.appendChild(clone);
    }
  }

  #removeRepeatedItems(numberOfCopies = this.#calculateNumberOfCopies()) {

    for (let i = 0; i < numberOfCopies - 1; i++) {
      this.content.lastElementChild?.remove();
    }
  }

  #calculateNumberOfCopies() {
    const marqueeWidth = this.offsetWidth;
    const marqueeRepeatedItemWidth =
      this.content.firstElementChild instanceof HTMLElement
        ? this.content.firstElementChild.offsetWidth
        : 1;

    const baseCopies =
      marqueeRepeatedItemWidth === 0
        ? 1
        : Math.ceil(marqueeWidth / marqueeRepeatedItemWidth);

    const extraCopies = 1;

    return baseCopies + extraCopies;
  }
}
if (!customElements.get('marquee-component')) customElements.define('marquee-component', MarqueeComponent);

class MarqueeScroll extends HTMLElement {
  constructor() {
    super();

    this.speed = parseFloat(this.dataset.speed || 1.6),
    this.space = 100,
    this.isDesktop = theme.config.mqlDesktop;

    if (this.isDesktop) {
      Motion.inView(this, this.init.bind(this), { margin: '200px 0px 200px 0px' });
    }
  }

  connectedCallback() {
    if (this.isDesktop) {
      this.#toggleHoverEvents(true);
    }
  }

  disconnectedCallback() {
    if (this.isDesktop) {
      this.#toggleHoverEvents(false);
    }
  }

  get childElement() {
    return this.firstElementChild;
  }

  get maximum() {
    return parseInt(this.dataset.maximum || 10);
  }

  get direction() {
    return this.dataset.direction || 'left';
  }

  get parallax() {
    return this.dataset.parallax ? parseFloat(this.dataset.parallax) : false;
  }

  init() {
    if (this.parallax && this.isDesktop) {
      let translate = this.parallax * 100 / (1 + this.parallax);
      if (this.direction === 'right') {
        translate = translate * -1;
      }

      Motion.scroll(
        Motion.animate(this, { transform: [`translateX(${translate}%)`, `translateX(0px)`] }, { ease: 'linear' }),
        { target: this, offset: ['start end', 'end start'] }
      );
      return;
    }

    const observer = new IntersectionObserver((entries, _observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.classList.remove('paused');
        }
        else {
          this.classList.add('paused');
        }
      });
    }, { rootMargin: '0px 0px 50px 0px' });
    observer.observe(this);
  }

  #toggleHoverEvents(enable) {
    const action = enable ? 'addEventListener' : 'removeEventListener';
    this[action]("pointerleave", this.#speedUp);
  }

  #animation = null;
  #duration = 500;

  #slowDown = theme.utils.debounce(() => {
    if (this.#animation) return;

    const animation = this.querySelector('.marquee__content').getAnimations()[0];

    if (!animation) return;

    this.#animation = animateValue({
      duration: this.#duration,
      from: 1,
      to: 0,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }, this.#duration);

  #speedUp() {
    this.#slowDown.cancel();

    const animation = this.querySelector('.marquee__content').getAnimations()[0];

    if (!animation || animation.playbackRate === 1) return;

    const from = this.#animation?.current ?? 0;
    this.#animation?.cancel();

    this.#animation = animateValue({
      duration: this.#duration,
      from,
      to: 1,
      onUpdate: (value) => animation.updatePlaybackRate(value),
      onComplete: () => {
        this.#animation = null;
      },
    });
  }
}
if (!customElements.get('marquee-scroll')) customElements.define('marquee-scroll', MarqueeScroll);

function animateValue({
  from,
  to,
  duration,
  onUpdate,
  easing = (t) => t * t * (3 - 2 * t),
  onComplete,
}) {
  const startTime = performance.now();
  let cancelled = false;
  let currentValue = from;

  function animate(currentTime) {
    if (cancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  }

  requestAnimationFrame(animate);

  return {
    get current() {
      return currentValue;
    },
    cancel() {
      cancelled = true;
    },
  };
}

if (window.dynamicBrowserTitle && window.dynamicBrowserTitle.show && typeof window.dynamicBrowserTitle.text === "string" && window.dynamicBrowserTitle.text.trim() !== "") {
  const originalTitle = document.title;
  const customTitle = window.dynamicBrowserTitle.text;

  window.addEventListener("blur", function () {
    document.title = customTitle;
  });

  window.addEventListener("focus", function () {
    document.title = originalTitle;
  });
}

class AccordionCustom extends HTMLElement {
  /** @type {HTMLDetailsElement} */
  get details() {
    const details = this.querySelector('details');

    if (!(details instanceof HTMLDetailsElement)) throw new Error('Details element not found');

    return details;
  }

  /** @type {HTMLElement} */
  get summary() {
    const summary = this.details.querySelector('summary');

    if (!(summary instanceof HTMLElement)) throw new Error('Summary element not found');

    return summary;
  }

  /** @type {HTMLElement} */
  get contentElement() {
    const content = this.details.querySelector('.details-content');

    if (!(content instanceof HTMLElement)) throw new Error('Content element not found');

    return content;
  }

  /** @type {HTMLElement} */
  get summaryElement() {
    return this.summary;
  }

  get #disableOnMobile() {
    return this.dataset.disableOnMobile === 'true';
  }

  get #disableOnDesktop() {
    return this.dataset.disableOnDesktop === 'true';
  }

  get #closeWithEscape() {
    return this.dataset.closeWithEscape === 'true';
  }

  async transition(value) {
    if (value) {
      this.details.setAttribute("open", "");
      await Motion.timeline([
        [
          this.details,
          {
            height: this.contentElement.classList.contains(
              "floating-panel-component"
            )
              ? `${this.summaryElement.clientHeight}px`
              : [
              `${this.summaryElement.clientHeight}px`,
              `${this.summaryElement.clientHeight + this.contentElement.scrollHeight}px`,
            ],
          },
          { duration: 0.25, easing: "ease" },
        ],
        [
          this.contentElement,
          {
            opacity: [0, 1],
            height: [ 0, `${this.contentElement.scrollHeight}px`],
            transform: ["translateY(10px)", "translateY(0)"],
          },
          { duration: 0.15, at: "-0.1" },
        ],
      ]).finished;
    } else {
      this.summary.focus();

      await Motion.timeline([
        [this.contentElement, { opacity: 0, height: 0 }, { duration: 0.15 }],
        [
          this.details,
          {
            height: [
              `${this.details.clientHeight}px`,
              `${this.summaryElement.clientHeight}px`,
            ],
          },
          { duration: 0.25, at: "<", easing: "ease" },
        ],
      ]).finished;

      this.details.removeAttribute("open");
    }
  }

  #controller = new AbortController();

  connectedCallback() {
    const { signal } = this.#controller;

    this.#setDefaultOpenState();

    this.addEventListener('keydown', this.#handleKeyDown, { signal });
    this.summary.addEventListener('click', this.handleClick, { signal });
    window.matchMedia(theme.config.mql).addEventListener('change', this.#handleMediaQueryChange, { signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  handleClick = async (event) => {
    const isMobile = window.matchMedia(theme.config.mqlMobile).matches;
    const isDesktop = !isMobile;

    if ((isMobile && this.#disableOnMobile) || (isDesktop && this.#disableOnDesktop)) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    const isOpen = this.details.hasAttribute('open');
    await this.transition(!isOpen);
  };

  #handleMediaQueryChange = () => {
    this.#setDefaultOpenState();
  };

  #setDefaultOpenState() {
    const isMobile = window.matchMedia(theme.config.mqlMobile).matches;

    this.details.open =
      (isMobile && this.hasAttribute('open-by-default-on-mobile')) ||
      (!isMobile && this.hasAttribute('open-by-default-on-desktop'));
  }

  #handleKeyDown = async (event) => {
    if (event.key === 'Escape' && this.#closeWithEscape) {
      event.preventDefault();

      await this.transition(false);
      this.summary.focus();
    }
  }
}
if (!customElements.get('accordion-custom')) customElements.define('accordion-custom', AccordionCustom);

class VideoBackgroundComponent extends HTMLElement {
  requiredRefs = ["videoSources", "videoElement"];
  constructor() {
    super();
  }

  connectedCallback() {
    // Defer video loading until component is near/inside viewport
    theme.initSectionVisible({
      element: this,
      callback: this.loadVideo.bind(this),
      threshold: 400,
    });
  }

  loadVideo() {
    if (this._hasLoadedVideo) return;
    this._hasLoadedVideo = true;

    const videoElement = this.querySelector("video");
    if (!videoElement) return;

    const videoSources = this.querySelectorAll("[data-video]");
    for (let i = 0; i < videoSources.length; i++) {
      const source = videoSources[i];
      const videoSource = source.dataset.videoSource;
      if (videoSource) source.setAttribute("src", videoSource);
    }

    videoElement.load();
  }
}
if (!customElements.get('video-background-component')) customElements.define('video-background-component', VideoBackgroundComponent);

class TabsComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
    this.observeExternalHeader();
    this.initTabsHeader()
  }

  init() {
    this.tabs = this.querySelectorAll(".tabs-component-panel-trigger");
    this.tabContents = this.querySelectorAll(".tabs-component-content");

    this.initRender();
    this.tabs.forEach((tab) => {
      tab.addEventListener("click", this.handleTabClick.bind(this));
    });
  }

  handleTabClick(event) {
    event.preventDefault();

    let target = event.target.closest(".tabs-component-panel-trigger");
    if (!target) return;

    let tabId = target.getAttribute("href");
    if (!tabId) return;

    if (target.classList.contains("--active")) return;

    this.tabs.forEach((tab) => tab.classList.remove("--active"));
    target.classList.add("--active");

    this.tabContents.forEach((content) => {
      content.classList.remove("--active");

      if (content.id == tabId.substring(1)) {
        const template = content.querySelector("template.tabs-component-template");
        if (template && !content.hasAttribute("data-rendered")) {
          const templateContent = template.content.cloneNode(true);
          content.appendChild(templateContent);
          content.setAttribute("data-rendered", "true");
        }
        content.classList.add("--active");
      }
    });
  }

  initRender() {
    const activeTab = this.querySelector(
      ".tabs-component-panel-trigger.--active"
    );
    if (activeTab) {
      const activeTabId = activeTab.getAttribute("href");
      const activeContent = document.querySelector(activeTabId);

      if (activeContent) {
        const template = activeContent.querySelector("template.tabs-component-template");
        if (template && !activeContent.hasAttribute("data-rendered")) {
          const templateContent = template.content.cloneNode(true);
          activeContent.appendChild(templateContent);
          activeContent.setAttribute("data-rendered", "true");
        }
      }
    }
    this.hasInitialized = true;
  }

  observeExternalHeader() {
    const allHeaders = document.querySelectorAll("tabs-header");
    if (!allHeaders.length) return;

    allHeaders.forEach((header) => {
      const targetSelector = header.getAttribute("data-tabs-target");
      const targetTabs =
        (targetSelector && document.querySelector(targetSelector)) || this;

      if (targetTabs === this) {
        const headerButtons = header.querySelectorAll(".tabs-component-panel-trigger");
        headerButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const href = btn.getAttribute("href");
            if (!href) return;

            headerButtons.forEach((b) => b.classList.remove("--active"));
            btn.classList.add("--active");

            const internalTab = this.querySelector(
              `.tabs-component-panel-trigger[href="${href}"]`
            );
            if (internalTab) {
              internalTab.click();
            }
          });
        });
      }
    });
  }

  initTabsHeader() {
    const sectionHeaders = document.querySelectorAll('.section-global__header');

    sectionHeaders.forEach((header) => {
      const template = header.querySelector('template');
      if (!template) return;

      const tabsHeader = template.content.querySelector('tabs-header');
      if (!tabsHeader) return;

      const block = header.querySelector('.section-header--block');
      if (!block) return;

      if (!block.querySelector('tabs-header')) {
        const clone = tabsHeader.cloneNode(true);
        block.appendChild(clone);

        this.bindTabsEvents(clone);
      }
    });
  }

  bindTabsEvents(tabsHeader) {
    const buttons = tabsHeader.querySelectorAll('.tabs-component-panel-trigger');
    const tabContents = document.querySelectorAll('.tabs-component-content');

    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();

        const href = btn.getAttribute('href');
        if (!href) return;
        const targetId = href.replace('#', '');

        buttons.forEach((b) => b.classList.remove('--active', 'is-active'));
        btn.classList.add('--active', 'is-active');

        tabContents.forEach((content) => {
          const isMatch = content.id === targetId;
          content.classList.toggle('--active', isMatch);
          content.classList.toggle('is-active', isMatch);

          if (isMatch && !content.hasAttribute('data-rendered')) {
            const template = content.querySelector('template.tabs-component-template');
            if (template) {
              const templateContent = template.content.cloneNode(true);
              content.appendChild(templateContent);
              content.setAttribute('data-rendered', 'true');
            }
          }
        });

        const internalTabs = document.querySelectorAll(
          `.tabs-component-panel-trigger[href="${href}"]`
        );
        internalTabs.forEach((tab) => {
          tab.classList.remove('--active');
          if (tab.getAttribute('href') === href) tab.classList.add('--active');
        });
      });
    });
  }
}
if (!customElements.get("tabs-component"))
  customElements.define("tabs-component", TabsComponent);

class HeaderMobileTabs extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.tabs = this.querySelectorAll("[data-tab-heading]");
    this.tabContents = this.querySelectorAll("[data-tab-for]");

    this.tabs.forEach((tab) => {
      tab.addEventListener("click", this.handleTabClick.bind(this));
    });

    this.tabContents[0].classList.add("active");
  }

  handleTabClick(event) {
    event.preventDefault();

    let target = event.target.closest("a"),
      tabTarget = target.getAttribute("data-tab-heading-target");

    if (target.classList.contains("active")) return;

    this.tabs.forEach((tab) => tab.classList.remove("active"));

    target.classList.add("active");

    this.tabContents.forEach((content) => {
      content.style.display = "none";

      if (content.getAttribute("data-tab-for") == tabTarget) {
        content.style.display = "block";
      }
    });
  }
}
if (!customElements.get("header-mobile-tabs"))
  customElements.define("header-mobile-tabs", HeaderMobileTabs);

class HoverButton extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('mouseenter', this.onMouseEnter);
    this.addEventListener('mouseleave', this.onMouseLeave);
  }

  disconnectedCallback() {
    this.removeEventListener('mouseenter', this.onMouseEnter);
    this.removeEventListener('mouseleave', this.onMouseLeave);
  }

  onMouseEnter() {
    const hoverButton = event.currentTarget;
    const btnFill = hoverButton.querySelector('[data-fill-bg]');
    const dir = this.classList.contains('swiper-button-prev') ? 'left' : 'right';

    if (btnFill) {
      Motion.animate(btnFill, {x: dir === 'left' ? ['100%', '0%'] : ['-100%', '0%']}, { duration: 0.35 });
    }
  }

  onMouseLeave() {
    const hoverButton = event.currentTarget;
    const btnFill = hoverButton.querySelector('[data-fill-bg]');
    const dir = this.classList.contains('swiper-button-prev') ? 'left' : 'right';

    if (btnFill) {
      Motion.animate(btnFill, {x: dir === 'left' ? ['-100%'] : ['100%']}, { duration: 0.35 });

    }
  }
}

if (!customElements.get('hover-button')) customElements.define('hover-button', HoverButton);

class CollapsibleText extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.fullText = this.querySelector('[data-content-full]');
    this.previewText = this.querySelector('[data-content-preview]');
    this.buttonMore = this.querySelector('[data-collapse-button-more]');
    this.buttonLess = this.querySelector('[data-collapse-button-less]');

    this.heightFullText = this.fullText.offsetHeight;
    this.fullTextContent = this.fullText.innerHTML;
    this.heightPreviewText = this.previewText.scrollHeight;
    this.previewTextContent = this.previewText.innerHTML;

    if (this.heightPreviewText <= this.heightFullText) {
      this.classList.add('is-collapsed');

      this.previewText.dataset.contenMinHeight = this.heightPreviewText;
      this.previewText.dataset.contentMaxHeight = this.heightFullText;
      this.buttonMore.addEventListener('click', this.showMore.bind(this));
      this.buttonLess.addEventListener('click', this.showLess.bind(this));
    } else {
      this.classList.remove('is-collapsed');
      return
    }
  }

  showMore() {
    const heightFrom = this.previewText.dataset.contenMinHeight + 'px';
    const heightTo = this.previewText.dataset.contentMaxHeight + 'px';

    this.previewText.innerHTML = this.fullTextContent;
    Motion.animate(this.previewText, { height: [heightFrom, heightTo], minHeight: [heightFrom, heightTo] }, { duration: 0.35 });
    this.classList.add('is-expanded');
    this.classList.remove('is-collapsed');
  }

  showLess() {
    const heightFrom = this.fullText.dataset.contentMaxHeight + 'px';
    const heightTo = this.previewText.dataset.contenMinHeight + 'px';

    this.classList.remove('is-expanded');
    this.classList.add('is-collapsed');

    this.previewText.innerHTML = this.previewTextContent;
    Motion.animate(this.previewText, { height: [heightFrom, heightTo], minHeight: heightTo }, { duration: 0.35 });
  }
}
if (!customElements.get('collapsible-text')) customElements.define('collapsible-text', CollapsibleText);

class EmailSignup extends HTMLElement {
  constructor() {
    super();
    this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }

  connectedCallback() {
    this.form = this.querySelector('[id^="EmailSignup-"]');
    this.checkbox = this.form?.querySelector('[id^="agree_condition-"]');
    this.submitButton = this.form?.querySelector("button[id^='EmailSignup-submit-']");
    this.subscriptionForm = this.querySelector('.subscription-form');
    this.emailForm = this.querySelector('.email-signup__form');
    this.promoBtn = this.querySelector('.promo-btn');
    this.openNewsletterPopupButton = this.querySelector('.open-newsletter-popup-button');

    this.initAgreeCondition();
    this.initPromoToggle();
    this.openNewsletterPopup();

    if (window.location.search.includes('contact_posted=true')) {
      this.showEmailForm(true);
    }
  }

  initAgreeCondition() {
    if (!this.checkbox || !this.submitButton) return;

    this.submitButton.disabled = true;

    this.checkbox.addEventListener('change', () => {
      this.submitButton.disabled = !this.checkbox.checked;
    });

    this.form.addEventListener('submit', (e) => {
      if (!this.checkbox.checked) {
        e.preventDefault();
        alert('Please agree to the terms and conditions before submitting.');
      }
    });
  }

  initPromoToggle() {
    if (!this.subscriptionForm || !this.emailForm || !this.promoBtn) return;

    this.emailForm.style.display = 'none';

    this.promoBtn.addEventListener('click', () => this.showEmailForm());
  }

  openNewsletterPopup() {
    if (!this.openNewsletterPopupButton) return;
    this.openNewsletterPopupButton.addEventListener('click', (e) => {
      e.preventDefault();
      const popup = document.querySelector('.promotionPopup');
      if (popup) popup.setAttribute('open', '');
      const content = document.querySelector('.promotionPopup .popup__inner');
      Motion.timeline([
        [content, { opacity: [0, 1], transform: ['translate(-50%, -40%)', 'translate(-50%, -50%)'] }, { duration: 0.3, at: '-0.15' }]
      ]).finished;
    });
  }

  async showEmailForm(skipHideAnim = false) {
    if (!skipHideAnim) await this._animateHide(this.subscriptionForm);
    this.subscriptionForm.style.display = 'none';
    this.emailForm.style.display = '';
    await this._animateShow(this.emailForm);

    document.addEventListener('click', this._handleOutsideClick);
  }

  async showSubscriptionForm() {
    await this._animateHide(this.emailForm);
    this.emailForm.style.display = 'none';
    this.subscriptionForm.style.display = '';
    await this._animateShow(this.subscriptionForm);

    document.removeEventListener('click', this._handleOutsideClick);
  }

  _handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.showSubscriptionForm();
    }
  }

  async _animateShow(element) {
    element.style.overflow = 'hidden';
    await Motion.timeline([
      [
        element,
        { height: ['0px', `${element.scrollHeight}px`] },
        { duration: 0.15, easing: 'cubic-bezier(0.7, 0, 0.3, 1)' },
      ],
      [
        element,
        { opacity: [0, 1], transform: ['translateX(-1rem)', 'translateX(0)'] },
        { duration: 0.15, at: '-0.1' },
      ],
    ]).finished;
    element.style.height = 'auto';
    element.style.overflow = 'visible';
  }

  async _animateHide(element) {
    element.style.overflow = 'hidden';
    await Motion.timeline([
      [element, { opacity: 0, transform: ['translateX(0)', 'translateX(1rem)'] }, { duration: 0.15 }],
      [
        element,
        { height: [`${element.clientHeight}px`, '0px'] },
        { duration: 0.15, at: '<', easing: 'cubic-bezier(0.7, 0, 0.3, 1)' },
      ],
    ]).finished;
    element.style.height = 'auto';
    element.style.overflow = 'visible';
  }
}
if (!customElements.get('email-signup')) customElements.define('email-signup', EmailSignup);

class CollapsibleTextComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.content = this.querySelector('.collapsible-text-content');
    this.button = this.querySelector('.collapsible-text-button-wrapper');
    this.buttonText = this.button.querySelector('button');
    
    if (!this.button || !this.content) return;

    this.showText = this.buttonText.getAttribute('data-show-text');
    this.hideText = this.buttonText.getAttribute('data-hide-text');
    this.isExpanded = false;

    this.checkIfButtonNeeded();
    this.setupEventListeners();
  }

  checkIfButtonNeeded() {
    const contentHeight = this.content.scrollHeight;
    const previewHeight = this.content.getAttribute('data-content-height');
    
    if (contentHeight <= previewHeight) {
      this.button.style.display = 'none';
      this.content.classList.remove('collapsed');
    }
  }

  setupEventListeners() {
    this.button.addEventListener('click', () => {
      this.toggleContent();
    });
  }

  toggleContent() {
    this.isExpanded = !this.isExpanded;
    
    if (this.isExpanded) {
      this.content.classList.remove('collapsed');
      this.content.classList.add('expanded');
      this.buttonText.textContent = this.hideText;
      this.button.setAttribute('aria-expanded', 'true');
    } else {
      this.content.classList.remove('expanded');
      this.content.classList.add('collapsed');
      this.buttonText.textContent = this.showText;
      this.button.setAttribute('aria-expanded', 'false');
    }
  }
}
if (!customElements.get('collapsible-text-component')) customElements.define('collapsible-text-component', CollapsibleTextComponent);

class JumboText extends HTMLElement {
	#initObserver;
	#resizeObserver;
	intersectionObserver;
	connectedCallback() {
		this.#initObserver = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					this.#init();
					observer.unobserve(entry.target)
				}
			})
		}, {
			rootMargin: '500px 0px 500px 0px'
		});
		this.#initObserver.observe(this)
	}
	disconnectedCallback() {
		this.#initObserver?.disconnect();
		this.#resizeObserver?.disconnect();
		this.intersectionObserver?.disconnect()
	}
	#init = () => {
		this.#resizeObserver = new ResizeNotifier(this.#handleResize);
		requestAnimationFrame(this.#handleResize);
		if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
			this.#setIntersectionObserver()
		}
	};
	#setIntersectionObserver() {
		this.intersectionObserver = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					this.classList.add('jumbo-text-visible');
					if (this.dataset.animationRepeat === 'false') {
						this.intersectionObserver.unobserve(entry.target)
					}
				} else {
					this.classList.remove('jumbo-text-visible')
				}
			})
		}, {
			threshold: 0.3
		});
		this.intersectionObserver.observe(this)
	}
	#calculateOptimalFontSize = () => {
		if (!this.textContent?.trim()) {
			return
		}
		this.classList.remove('ready');
		if (this.offsetWidth <= 0) return;
		this.#resizeObserver?.disconnect();
		this.style.fontSize = '1px';
		const fontSize = findOptimalFontSize(this, this.offsetWidth);
		this.style.fontSize = `${fontSize}px`;
		this.#resizeObserver?.observe(this);
		this.classList.add('ready')
	};
	#handleResize = () => {
		this.#calculateOptimalFontSize();
	}
}
class ResizeNotifier extends ResizeObserver {
	#initialized = false;
	constructor(callback) {
		super((entries) => {
			if (this.#initialized) return callback(entries, this);
			this.#initialized = true
		})
	}
	disconnect() {
		this.#initialized = false;
		super.disconnect()
	}
}

function checkTextOverflow(element, containerWidth, size) {
	element.style.fontSize = `${size}px`;
	return element.scrollWidth > containerWidth
}

function findOptimalFontSize(element, containerWidth) {
	let minSize = 1;
	let maxSize = 500;
	const precision = 0.5;
	const textLength = element.textContent?.length || 0;
	let fontSize = Math.min(maxSize, Math.sqrt(containerWidth) * (15 / Math.sqrt(Math.max(1, textLength))));
	if (checkTextOverflow(element, containerWidth, fontSize)) {
		maxSize = fontSize
	} else {
		minSize = fontSize
	}
	let iterations = 0;
	const MAX_ITERATIONS = 30;
	while (maxSize - minSize > precision && iterations < MAX_ITERATIONS) {
		fontSize = (minSize + maxSize) / 2;
		if (checkTextOverflow(element, containerWidth, fontSize)) {
			maxSize = fontSize
		} else {
			minSize = fontSize
		}
		iterations++
	}
	return minSize * 0.99
}
if (!customElements.get('jumbo-text')) customElements.define('jumbo-text', JumboText);