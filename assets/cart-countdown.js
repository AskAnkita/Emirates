class cartCountdownComponent extends HTMLElement {
  constructor() {
    super();
    this.minutes = parseInt(this.getAttribute('data-minutes')) || 4;
    this.timeDisplay = this.querySelector('.time');
    this.storageKey = 'cartCountdownTime';
    this.intervalId = null;
    
    this.init();
  }

  init() {
    const storedTime = this.getStoredTime();
    const totalSeconds = storedTime !== null ? storedTime : this.minutes * 60;
    
    this.startCountdown(totalSeconds);
  }

  getStoredTime() {
    if (Shopify.designMode) return null;
    
    const stored = sessionStorage.getItem(this.storageKey);
    return stored ? parseInt(stored) : null;
  }

  setStoredTime(seconds) {
    if (!Shopify.designMode) {
      sessionStorage.setItem(this.storageKey, seconds.toString());
    }
  }

  clearStoredTime() {
    if (!Shopify.designMode) {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  updateDisplay(totalSeconds) {
    if (this.timeDisplay) {
      this.timeDisplay.textContent = this.formatTime(totalSeconds);
    }
  }

  async clearCart() {
    try {
      const response = await fetch(`${Shopify.routes.root}cart/clear.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        window.location.href = `${Shopify.routes.root}cart`;
      } else {
        throw new Error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      window.location.href = `${Shopify.routes.root}cart`;
    }
  }

  startCountdown(totalSeconds) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.updateDisplay(totalSeconds);

    this.intervalId = setInterval(() => {
      totalSeconds--;
      
      this.updateDisplay(totalSeconds);
      this.setStoredTime(totalSeconds);

      if (totalSeconds <= 0) {
        this.onCountdownComplete();
      }
    }, 1000);
  }

  onCountdownComplete() {
    clearInterval(this.intervalId);
    this.clearStoredTime();
    this.updateDisplay(0);
    
    this.clearCart();
  }

  disconnectedCallback() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
customElements.define('cart-countdown-component', cartCountdownComponent);