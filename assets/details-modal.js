class DetailsModal extends HTMLElement {
  constructor() {
    super();

    this.detailsContainer = this.querySelector('details');
    this.summaryToggle = this.querySelector('summary');
    this.contentContainer = this.detailsContainer.lastElementChild;
    this.contentWrapper = this.contentContainer.querySelector('.details-modal__content');
    this.overlay = this.querySelector('#Details-Modal-Overlay');
    this._open = this.detailsContainer.hasAttribute('open');
    this.ease = [.7, 0, .2, 1];

    if (this.detailsContainer) {
      this.detailsContainer.addEventListener('keyup', (event) => event.code === 'Escape' && this.close());
    }

    if (this.summaryToggle) {
      this.summaryToggle.addEventListener('click', this.onSummaryClick.bind(this));
      this.summaryToggle.setAttribute('role', 'button');
    }

    const closeButton = this.querySelector('button[type="button"]');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.open = false);
    }
  }

  set open(value) {
    if (value !== this._open) {
      this._open = value;

      if (this.isConnected) {
        this.animate(value);
      }
    }
  }

  get open() {
    return this._open;
  }

  onSummaryClick(event) {
    event.preventDefault();
    this.open = !this.open;
  }

  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains('modal-overlay')) this.open = false;
  }

  async animate(value) {
    if (value) {
      this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);

      this.detailsContainer.setAttribute('open', true);
      document.body.addEventListener('click', this.onBodyClickEvent);
      document.body.classList.add('overflow-hidden');
      document.documentElement.setAttribute('scroll-lock', '');

      if (this.detailsContainer) {
        trapFocus(
          this.detailsContainer.querySelector('[tabindex="-1"]'),
          this.detailsContainer.querySelector('input:not([type="hidden"])')
        );
      }
      await this.animateOpen();
    }
    else {
      removeTrapFocus(this.summaryToggle);
      document.body.removeEventListener('click', this.onBodyClickEvent);
      document.body.classList.remove('overflow-hidden');
      document.documentElement.removeAttribute('scroll-lock');
      await this.animateClose();

      if (this.detailsContainer && !this.open) {
        setTimeout(() => {
          this.detailsContainer.removeAttribute('open');
        }, 50);
      }
    }
  }


  async animateOpen() {
    Motion.timeline([
      [this.contentContainer, { opacity: [0, 1], visibility: 'visible' }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: this.ease }],
      [this.contentWrapper, { transform: ['translateY(-100%)', 'translateY(0)'] }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: this.ease }],
    ]).finished
  }

  async animateClose() {
    Motion.timeline([
      [this.contentWrapper, {transform: 'translateY(-100%)'}, { duration: theme.config.motionReduced ? 0 : 0.3, easing: this.ease }],
      [this.contentContainer, { opacity: 0, visibility: 'hidden' }, { duration: theme.config.motionReduced ? 0 : 0.3, easing: this.ease }]
    ]).finished;
  }
}
if (!customElements.get('details-modal')) customElements.define('details-modal', DetailsModal);
