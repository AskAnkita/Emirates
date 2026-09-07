class Toolbarmobile extends HTMLElement {
  constructor() {
    super();

    if (theme.config.mqlSmall || theme.config.isTouch) this.init();
  }

  init() {
    this.activate();
    this.setHeight();
    window.addEventListener('resize', theme.utils.rafThrottle(this.setHeight.bind(this)));
  }

  activate() {
    const header = document.querySelector(".header[data-sticky-state='inactive]");
    header === null
      ? this.classList.add("active")
      : this.classList.remove("active");
  }

  setHeight() {
    document.body.style.setProperty('--toolbar-mobile-height', `${this.clientHeight}px`);
  }
}
customElements.define("toolbar-mobile", Toolbarmobile);
