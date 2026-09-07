(function() {
  const countdownTimers = new WeakMap();

  function initCountDownForElement(countdown) {
    if (!countdown || countdownTimers.has(countdown)) return;

    const countdownAttr = countdown.dataset.countdown;
    if (!countdownAttr) return;

    const countDownDate = new Date(countdownAttr).getTime();
    if (isNaN(countDownDate)) return;

    const day = window.countdown && window.countdown.day ? window.countdown.day : 'd';

    function updateCountdown() {
      const now = Date.now();
      const distance = countDownDate - now;

      if (distance < 0) {
        clearInterval(timer);
        countdownTimers.delete(countdown);
        if (countdown.parentNode) {
          countdown.remove();
        }
        return;
      }

      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);

      if (countdown.classList.contains('product-countdown')) {
        const bar = countdown.querySelector('.product-countdown-bar');
        if (bar) {
          bar.innerHTML = `
            <span class="product-countdown-num"><span>${d}</span></span>
            <span class="divider">:</span>
            <span class="product-countdown-num"><span>${h}</span></span>
            <span class="divider">:</span>
            <span class="product-countdown-num"><span>${m}</span></span>
            <span class="divider">:</span>
            <span class="product-countdown-num"><span>${s}</span></span>
          `;
        }
      } else {
        countdown.innerHTML = `
          <span class="num">${d}<span>${day}</span></span>
          <span class="num">${h}<span class="icon">:</span></span>
          <span class="num">${m}<span class="icon">:</span></span>
          <span class="num">${s}</span>
        `;
      }
      countdown.classList.add('is_show');
    }

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);
    countdownTimers.set(countdown, timer);
  }

  function destroyCountDownForElement(countdown) {
    const timer = countdownTimers.get(countdown);
    if (timer) {
      clearInterval(timer);
      countdownTimers.delete(countdown);
    }
  }

  function initializeCountdownsInScope(scope) {
    const countdowns = (scope || document).querySelectorAll('.card__countdown [data-countdown-id]');
    if (countdowns.length > 0) {
      countdowns.forEach(initCountDownForElement);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeCountdownsInScope(document);

    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach(mutation => {
        mutation.addedNodes && mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches('.card__countdown [data-countdown-id]')) {
              initCountDownForElement(node);
            }
            const foundCountdowns = node.querySelectorAll && node.querySelectorAll('.card__countdown [data-countdown-id]');
            if (foundCountdowns && foundCountdowns.length > 0) {
              foundCountdowns.forEach(initCountDownForElement);
            }
          }
        });
        mutation.removedNodes && mutation.removedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && node.matches('.card__countdown [data-countdown-id]')) {
              destroyCountDownForElement(node);
            }
            const foundCountdowns = node.querySelectorAll && node.querySelectorAll('.card__countdown [data-countdown-id]');
            if (foundCountdowns && foundCountdowns.length > 0) {
              foundCountdowns.forEach(destroyCountDownForElement);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
})();
