/**
 * A custom element that automatically sizes text to fit its container width.
 */
class TextAnimation extends HTMLElement {
  connectedCallback() {
    // Initial calculation
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.#setIntersectionObserver();
    }
  }

  disconnectedCallback() {
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.intersectionObserver?.disconnect();
    }
  }

  /**
   * Sets the intersection observer to calculate the optimal font size when the text is in view
   */
  #setIntersectionObserver() {
    // The threshold could be different based on the repetition of the animation.
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add('text-animation-visible');
            if (this.dataset.animationRepeat === 'false') {
              this.intersectionObserver.unobserve(entry.target);
            }
          } else {
            this.classList.remove('text-animation-visible');
          }
        });
      },
      { threshold: 0.3 }
    );

    this.intersectionObserver.observe(this);
  }
}
if (!customElements.get('text-animation')) customElements.define('text-animation', TextAnimation);

class TypingText {
  constructor(el) {
    this.el = el;
    this.texts = (JSON.parse(el.dataset.texts || '[]')).filter(t => t.trim() !== '');
    this.contentEl = el.querySelector('.typing-text__content');
    this.index = 0;
    this.charIndex = 0;
    this.isDeleting = false;
    this.typeSpeed = 90;     // typing speed
    this.deleteSpeed = 50;   // deleting speed
    this.pauseDelay = 1000;  // typing completion delay
    this.baseHeight = this.el.offsetHeight - this.contentEl.offsetHeight;
    this.prevContentHeight = this.contentEl.offsetHeight;
    this.el.style.height = `${this.el.offsetHeight}px`;

    this.type();
  }

  animateHeight() {
    let newContentHeight = this.contentEl.offsetHeight;
    if (newContentHeight === this.prevContentHeight) return;
    if (newContentHeight === 0 && this.prevContentHeight) {
      newContentHeight = this.prevContentHeight;
    }
    const targetHeight = newContentHeight + this.baseHeight;
    Motion.timeline([
      [this.el, {
        height: [`${targetHeight}px`],
        duration: 0.01,
        easing: 'cubic-bezier(0.7, 0, 0.3, 1)'
      }]
    ]).finished;
    this.prevContentHeight = newContentHeight;
  }

  type() {
    const currentText = this.texts[this.index];
    !this.isDeleting ? this.enterText(currentText) : this.updateText(currentText);

    this.animateHeight();

    const delay = this.isDeleting ? this.deleteSpeed : this.typeSpeed;
    setTimeout(() => this.type(), delay);
  }

  enterText(currentText) {
    this.contentEl.textContent = currentText.substring(0, this.charIndex + 1);
    this.charIndex++;

    if (this.charIndex === currentText.length) {
      setTimeout(() => this.isDeleting = true, this.pauseDelay);
    }
  }

  updateText(currentText) {
    this.contentEl.textContent = currentText.substring(0, this.charIndex - 1);
    this.charIndex--;

    if (this.charIndex === 0) {
      this.isDeleting = false;
      this.index = (this.index + 1) % this.texts.length;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        new TypingText(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.typing-text').forEach(el => observer.observe(el));
});