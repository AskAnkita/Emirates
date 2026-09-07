(function() {
  class CountdownTimer extends HTMLElement {
    constructor() {
      super();
      this.endDate = new Date(this.dataset.endDate).getTime();
      this.timer = null;
    }

    connectedCallback() {
      this.timerElement = this.querySelector('.countdown-timer');
      this.expiredElement = this.querySelector('.countdown-expired');
      this.daysElement = this.querySelector('[data-days]');
      this.hoursElement = this.querySelector('[data-hours]');
      this.minutesElement = this.querySelector('[data-minutes]');
      this.secondsElement = this.querySelector('[data-seconds]');

      this.startCountdown();
    }

    disconnectedCallback() {
      if (this.timer) {
        clearInterval(this.timer);}
    }

    startCountdown() {
      this.updateCountdown();
      this.timer = setInterval(() => {
        this.updateCountdown();
      }, 1000);
    }

    updateCountdown() {
      const now = new Date().getTime();
      const distance = this.endDate - now;

      if (distance < 0) {
        this.showExpired();
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (this.daysElement) {
        this.daysElement.textContent = this.padZero(days);
      }
      if (this.hoursElement) {
        this.hoursElement.textContent = this.padZero(hours);
      }
      if (this.minutesElement) {
        this.minutesElement.textContent = this.padZero(minutes);
      }
      if (this.secondsElement) {
        this.secondsElement.textContent = this.padZero(seconds);
      }
    }

    showExpired() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.timerElement.style.display = 'none';
      this.expiredElement.style.display = 'block';
    }

    padZero(num) {
      return num.toString().padStart(2, '0');
    }
  }
  if (!customElements.get('countdown-timer')) customElements.define('countdown-timer', CountdownTimer);
})();