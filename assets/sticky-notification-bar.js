class StickyNotification extends HTMLElement {
  constructor() {
    super()
  }
  connectedCallback() {
    this.NOTIFICATION_COOKIE = 'notification'
    this.action = this.dataset.linkAction;
    this.closeBtn = this.querySelector('[data-close-notification-btn]')
    if (this.closeBtn) {
      this._closeHandler = this.hideNotification.bind(this)
      this.closeBtn.addEventListener('click', this._closeHandler)
    }
    this.currentScroll = 0;
    this.displayType = this.dataset.displayType
    this.hideInterval = parseInt(this.dataset.hideInterval)
    if (this.displayType === 'refresh') {
      this.style.removeProperty('display')
    } else {
      const isClosedNotification = this.getCookie(this.NOTIFICATION_COOKIE) === 'closed'
      if (!isClosedNotification || window.innerWidth < 768) {
        this.style.removeProperty('display')
      }
    }
    this._scrollHandler = this.scrollHandler.bind(this)
    document.addEventListener('scroll', this._scrollHandler)
    if (this.action === 'popup'){
      this._selfClickHandler = this.handleSelfClick.bind(this)
      this.addEventListener('click', this._selfClickHandler)
    }
    this.calculateNotificationBottomPosition()
    this.showNotificationWithTime(1500)
    this.setTextHeightOnMobile()
    this.setPositionIfPreview()
    this.initIframeHandler()
  }
  handleSelfClick(e) {
    if (e.target.matches('[data-close-notification-btn]') || e.target.closest('[data-close-notification-btn]')) return

    const link = this.querySelector('[data-main-link]')
    if (!link) return;
    link.click()
  }
  showNotificationWithTime(time) {
    setTimeout(() => {
      this.showNotification()
    }, time)
  }
  showNotification() {
    this.dataset.show = true
  }
  hideNotification() {
    delete this.dataset.show
    if (this.displayType === 'time') {
      this.setCookie(this.NOTIFICATION_COOKIE, 'closed', this.hideInterval)
    }
  }
  scrollHandler() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.setPositionIfPreview();
    if (scrollTop <= 100) {
      this.currentScroll = scrollTop;
      return;
    }
    if (scrollTop < this.currentScroll) {
      requestAnimationFrame(() => {
        this.classList.remove('temporary-hide')
      })
    } else if (scrollTop > this.currentScroll) {
      requestAnimationFrame(() => {
        this.classList.add('temporary-hide')
      })
    }
    this.currentScroll = scrollTop
  }

  calculateNotificationBottomPosition() {
    const toolbar = document.getElementById('shopify-section-halo-toolbar-mobile');
    if (!toolbar || !toolbar.querySelector('.halo-sticky-toolbar-mobile')) return;
    const totalToolbarHeight = toolbar.querySelector('.halo-sticky-toolbar-mobile').getBoundingClientRect().height + 'px';
    this.style.setProperty('--bottom-position', totalToolbarHeight)
  }
  getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }
  setCookie(cname, cvalue, exMinutes) {
    const d = new Date();
    d.setTime(d.getTime() + (exMinutes * 60 * 1000));
    const expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
  }
  setTextHeightOnMobile() {
    if (window.innerWidth > 767) return;
    this.textWrapper = this.querySelector('[data-text-wrapper]')
    const mainLink = this.textWrapper.querySelector('[data-main-link]')
    this.textWrapper.style.setProperty('--height', mainLink.scrollHeight + 'px')
    this.startTextSlideOnMobile();
  }
  startTextSlideOnMobile() {
    if (this.textSlideInterval) {
      clearInterval(this.textSlideInterval)
    }
    this.textSlideInterval = setInterval(() => {
      this.textWrapper.classList.toggle('slide-down')
    }, 4000)
  }
  disconnectedCallback() {
    if (this.textSlideInterval) {
      clearInterval(this.textSlideInterval)
    }
    if (this.closeBtn && this._closeHandler) {
      this.closeBtn.removeEventListener('click', this._closeHandler)
    }
    if (this._scrollHandler) {
      document.removeEventListener('scroll', this._scrollHandler)
    }
    if (this._selfClickHandler) {
      this.removeEventListener('click', this._selfClickHandler)
    }
  }
  setPositionIfPreview() {
    const previewBar = document.getElementById('preview-bar-iframe');
    if (window.innerWidth < 767 || !previewBar) return;
    let bottom = 15;
    const previewBarVisible = getComputedStyle(previewBar).display === 'block';
    if (previewBar && previewBarVisible) {
      bottom = bottom + 60
    }
    this.style.bottom = bottom + 'px'
  }
  initIframeHandler() {
    if (window.innerWidth < 767) return;
    const iframe = document.getElementById('preview-bar-iframe')
    if (!iframe) return
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc || !iframeDoc.body) {
        setTimeout(() => this.initIframeHandler(), 500)
        return
      }
      const hidePreviewBarButton = iframeDoc.body.querySelectorAll('[data-hide-bar-button]')
      hidePreviewBarButton.forEach((element) => {
        element.addEventListener('click', () => {
          this.style.bottom = '15px'
        })
      })
    } catch (e) {
      console.error('Cannot access iframe content:', e)
    }
  }
}
window.addEventListener('load', () => {
  customElements.define('sticky-notification', StickyNotification)
})