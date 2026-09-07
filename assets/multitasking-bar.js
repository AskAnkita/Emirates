class MultitaskingBar extends HTMLElement {
  constructor() {
    super();
    this.resizeObserver = null;
  }

  connectedCallback() {
    this.setInitLayout();
    this.init();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.handleScroll);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  init() {
    this.buttonToggle = this.querySelectorAll('.multi-t__button');
    this.onBodyClick = this.handleBodyClick.bind(this);

    if (this.querySelector('.button__back-to-top')) {
      this.backToTopButton = this.querySelector('.button__back-to-top');
      this.backToTopInnerButton = this.querySelector('.button__back-to-top .multi-t__button');

      this.updateScrollTopHeight();
      this.handleScroll = this.throttleScroll.bind(this);
      this.setupResizeObserver();
      window.addEventListener('scroll', this.handleScroll);
    }

    this.buttonToggle?.forEach((button) => {
      button.addEventListener('click', this.open.bind(this));
    });

    ['.drawer__close', '[id^="Drawer-Overlay-"]'].forEach((selector) => {
      this.querySelector(selector)?.addEventListener('click', this.close.bind(this));
    });
  }

  updateScrollTopHeight() {
    const target = this.backToTopInnerButton || this.querySelector('.button__back-to-top .multi-t__button');
    if (target) {
      const height = target.offsetHeight;
      if (height > 0) this.scrollTopHeight = height;
    }
  }

  setupResizeObserver() {
    if (!this.backToTopButton || typeof ResizeObserver === 'undefined') return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (height > 0) {
          this.scrollTopHeight = height;
          this.onScroll(); // sync CSS variable immediately
        }
      }
    });

    this.resizeObserver.observe(this.backToTopInnerButton || this.backToTopButton);
  }

  setInitLayout() {
    this.querySelectorAll('.target-block')[0].classList.add('active');
    this.querySelectorAll('.target-block').forEach((button, index) => {
      button.setAttribute('data-index', index + 1);
    });
  }

  open(event) {
    this.buttonToggle?.forEach((button) => {
      if (button != event.currentTarget) {
        button.closest('.target-block')?.classList.remove('active');
        button.closest('.target-block').querySelector('.multi-t__wrapper')?.classList.remove('active');
      } else {
        this.activeFirst = this.querySelector(`.target-block:first-child`);
        if (
          button.closest('.target-block').classList.contains('active') &&
          !this.activeFirst.classList.contains('active')
        ) {

          this.querySelectorAll('.target-block').forEach((button) => {
            button.classList.remove('active');
          });
          this.activeFirst.classList.add('active');
        } else {
          this.activeFirst.classList.remove('active');
        }
      }
    });

    const targetBlock = event.currentTarget.closest('.target-block');
    const _target = event.currentTarget.dataset.target;
    if (targetBlock) {
      targetBlock.classList.toggle('active');

      if (_target === 'multitasking-social-media') {
        targetBlock.querySelector('.multi-t__wrapper')?.classList.toggle('active');
      } else if (_target === 'back-to-top') {
        window.scroll({ top: 0, behavior: 'smooth' });
        return false;
      }
    }

    document.body.addEventListener('click', this.onBodyClick);
  }

  close() {
    this.querySelectorAll('.target-block.active').forEach((button) => {
      button.classList.remove('active');
      button.querySelector('.multi-t__wrapper')?.classList.remove('active');
      this.querySelector('.target-block:first-child').classList.add('active');
    });

    document.body.removeEventListener('click', this.onBodyClick);
  }

  handleBodyClick(event) {
    const target = event.target;
    if (
      !this.contains(target) &&
      target !== document.getElementsByClassName('popup__inner') &&
      !target.closest('.popup__inner')
    )
      this.close();
  }

  throttleScroll() {
    if (!this.isScrolling) {
      window.requestAnimationFrame(() => {
        this.onScroll();
        this.isScrolling = false;
      });
    }
    this.isScrolling = true;
  }

  onScroll() {
    const backToTopButton = this.backToTopButton || this.querySelector('.button__back-to-top');
    const firstTargetBlock = this.querySelector('.target-block:first-child');
    const onlyBackToTop = this.classList.contains('only-back-to-top');
    if (window.pageYOffset <= 300) {
      backToTopButton.classList.add('hide');
      if (!this.querySelector(`.button__back-to-top:first-child`) && backToTopButton.classList.contains('active')) {
        backToTopButton.classList.remove('active');
        firstTargetBlock?.classList.add('active');
      }
      if (!onlyBackToTop) {
        backToTopButton.style.setProperty('--h-cus', '0px');
      } else {
        const heightValue = this.scrollTopHeight || backToTopButton.offsetHeight || 0;
        backToTopButton.style.setProperty('--h-cus', `${heightValue}px`);
        this.style.setProperty('opacity', '0');
        this.style.setProperty('visibility', 'hidden');
      }
    } else {
      backToTopButton.classList.remove('hide');

      const heightValue = this.scrollTopHeight || backToTopButton.offsetHeight || 0;
      backToTopButton.style.setProperty('--h-cus', `${heightValue}px`);
      
      if (onlyBackToTop) {
        this.style.setProperty('opacity', '1');
        this.style.setProperty('visibility', 'visible');
      }
    }
  }
}
if (!customElements.get('multitasking-bar')) customElements.define('multitasking-bar', MultitaskingBar);