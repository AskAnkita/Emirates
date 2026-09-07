class StepIndicator extends HTMLElement {
    constructor() {
        super();
        this.el = this;
        this.steps = parseInt(this.querySelector('.steps').getAttribute('steps')) || 3;
        this._step = 0;
    }

    connectedCallback() {
        document.addEventListener("click", this.clickAction.bind(this));
        this.displayStep(this.step);
        this.checkExtremes();
        this.setupFinalStepInputWatcher();
    }

    get step() {
        return this._step;
    }

    set step(value) {
        this._step = value;
        this.displayStep(value);
        this.checkExtremes();
    }

    clickAction(e) {
        const button = e.target.closest('a[data-action]');
        if (!button) return;

        const actionName = button.getAttribute("data-action");
        if (actionName === "prev") this.prev();
        else if (actionName === "next") this.next();
    }

    prev() {
        if (this.step > 0) this.step--;
    }

    next() {
        if (this.step < this.steps - 1) this.step++;
    }

    checkExtremes() {
        const prevBtn = this.querySelector(`[data-action="prev"]`);
        const nextBtn = this.querySelector(`[data-action="next"]`);
        const cartBtn = this.querySelector(`.add-to-cart-button`);

        if (prevBtn) prevBtn.setAttribute("aria-disabled", this.step <= 0 ? "true" : "false");
        if (nextBtn) nextBtn.setAttribute("aria-disabled", this.step >= this.steps - 1 ? "true" : "false");

        if (cartBtn) {
            cartBtn.style.display = (this.step >= this.steps - 1) ? 'inline-block' : 'none';
            if (nextBtn) nextBtn.style.display = (this.step >= this.steps - 1) ? 'none' : 'block';
        }
    }

    displayStep(targetStep) {
        const current = "steps__step--current";
        const done = "steps__step--done";

        for (let i = 0; i < this.steps; i++) {
            const stepEl = this.querySelector(`.steps__step[data-step="${i}"]`);
            const tabEl = this.querySelector(`.product-form__input[data-step="${i}"]`);

            stepEl?.classList.remove(current, done);
            tabEl?.classList.remove("active");

            if (i < targetStep) {
                stepEl?.classList.add(done);
            } else if (i === targetStep) {
                stepEl?.classList.add(current);
                tabEl?.classList.add("active");
            }
        }
    }

    setupFinalStepInputWatcher() {
        const lastTab = this.querySelector(`.product-form__input[data-step="${this.steps - 1}"]`);
        if (!lastTab) return;

        const fields = lastTab.querySelectorAll('textarea');

        const checkCompleted = () => {
            const isFilled = Array.from(fields).some(el => el.value.trim() !== '');
            const stepEl = this.querySelector(`.steps__step[data-step="${this.steps - 1}"]`);

            if (isFilled) {
                lastTab.classList.add('complete');
                if (stepEl?.classList.contains('steps__step--current')) {
                    stepEl.classList.remove('steps__step--current');
                    stepEl.classList.add('steps__step--done');
                }
            } else {
                lastTab.classList.remove('complete');
                if (stepEl?.classList.contains('steps__step--done')) {
                    stepEl.classList.remove('steps__step--done');
                    stepEl.classList.add('steps__step--current');
                }
            }
        };

        fields.forEach(field => {
            field.addEventListener('input', checkCompleted);
        });
    }
}

customElements.define("step-indicator", StepIndicator);