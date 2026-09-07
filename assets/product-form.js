if (!customElements.get('product-form-component')) {
  customElements.define(
    'product-form-component',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.init();
      }

      init() {
        this.form = this.querySelector('form');
        if (!this.form) return;
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-drawer');
        this.submitButton = this.form?.querySelector('.add-to-cart-button');
        this.submitButtonText = this.submitButton ? this.submitButton.querySelector('span') : null;
        this.checkbox = this.form?.querySelector('[id^="agree_condition-"]');
        this.buyItNowButton = this.form?.querySelector('.shopify-payment-button');

        if (document.querySelector('cart-drawer') && this.submitButton) {
          this.submitButton.setAttribute('aria-haspopup', 'dialog');
        }

        this.hideErrors = this.dataset.hideErrors === 'true';

        this.initAgreeCondition();

        // Sync error messages to sticky add-to-cart error area (same section)
        this.setupErrorSync();
      }

      setupErrorSync() {
        try {
          const productInfo = this.closest('product-info');
          const sectionId = productInfo?.dataset.section || productInfo?.dataset.originalSection;
          if (!sectionId) return;

          const stickyATC = document.querySelector(`sticky-atc[data-sticky-section-id="${sectionId}"]`);
          if (!stickyATC) return;

          const mainErrorWrapper = this.querySelector('.product-form__error-message-wrapper');
          const stickyErrorWrapper = stickyATC.querySelector('.product-form__error-message-wrapper');
          if (!mainErrorWrapper || !stickyErrorWrapper) return;

          const syncFromMain = () => {
            const isVisible = !mainErrorWrapper.hasAttribute('hidden');
            const errorMessage = mainErrorWrapper.querySelector('.product-form__error-message')?.textContent;
            stickyErrorWrapper.toggleAttribute('hidden', !isVisible || !errorMessage);
            if (isVisible && errorMessage) {
              const stickyErrorMessage = stickyErrorWrapper.querySelector('.product-form__error-message');
              if (stickyErrorMessage) stickyErrorMessage.textContent = errorMessage;
            }
          };

          // Initial sync
          syncFromMain();

          // Observe changes on main error wrapper
          this._errorObserver = new MutationObserver(syncFromMain);
          this._errorObserver.observe(mainErrorWrapper, {
            attributes: true,
            attributeFilter: ['hidden'],
            childList: true,
            subtree: true,
          });

          // Also listen to cartError pub/sub to copy message
          this.cartErrorUnsubscriber = subscribe(PUB_SUB_EVENTS.cartError, () => {
            syncFromMain();
          });
        } catch (e) {
          // silent
        }
      }

      initAgreeCondition() {
        if (!this.checkbox || !this.buyItNowButton) return;

        this.buyItNowButton.classList.add('disabled');

        this.checkbox.addEventListener('change', () => {
          this.buyItNowButton.classList.toggle('disabled', !this.checkbox.checked);
        });

        this.form.addEventListener('submit', (e) => {
          if (!this.checkbox.checked) {
            e.preventDefault();
          }
        });
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.submitButton.querySelector('.loading__spinner').classList.remove('hidden');

        // Also reflect loading state on the sticky add-to-cart button (if present)
        const productInfo = this.closest('product-info');
        const sectionId = productInfo?.dataset.section || productInfo?.dataset.originalSection;
        const stickyAddButton = sectionId
          ? document.getElementById(`StickyCart-ProductSubmitButton-${sectionId}`)
          : undefined;
        const stickyLoadingSpinner = stickyAddButton?.querySelector('.loading__spinner');
        if (stickyAddButton && stickyLoadingSpinner) {
          stickyAddButton.classList.add('loading');
          stickyLoadingSpinner.classList.remove('hidden');
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);

        if (this.cart) {
          formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }

        const properties = document.querySelectorAll('.product-form__input [name^="properties"]')

        properties.forEach(property => {
          if (property.type === 'file') {
            if (!property.files || property.files.length === 0 || !property.files[0]) return;
            formData.append(property.name, property.files[0]);
            return;
          }

          if (property.value == null || property.value === '') return;
          formData.append(property.name, property.value);
        })

        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form-component',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = `${window.routes?.cart_url}`;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form-component',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener('modalClosed', () => {
                setTimeout(() => {
                  if (this.cart && typeof this.cart.renderContents === 'function') {
                    this.cart.renderContents(response);
                  }
                });
              },{ once: true });
              quickAddModal.hide(true);
            } else {
              if (this.cart && typeof this.cart.renderContents === 'function') {
                this.cart.renderContents(response);
              }
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.submitButton.querySelector('.loading__spinner').classList.add('hidden');

            // Clear loading state on the sticky add-to-cart button (if present)
            const productInfo = this.closest('product-info');
            const sectionId = productInfo?.dataset.section || productInfo?.dataset.originalSection;
            const stickyAddButton = sectionId
              ? document.getElementById(`StickyCart-ProductSubmitButton-${sectionId}`)
              : undefined;
            const stickyLoadingSpinner = stickyAddButton?.querySelector('.loading__spinner');
            if (stickyAddButton && stickyLoadingSpinner) {
              stickyAddButton.classList.remove('loading');
              stickyLoadingSpinner.classList.add('hidden');
            }
          });
      }

      disconnectedCallback() {
        try {
          this.cartErrorUnsubscriber?.();
          this._errorObserver?.disconnect();
        } catch (e) {
          // silent
        }
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) this.errorMessage.textContent = errorMessage;
      }

      toggleSubmitButton(disable = true, text) {
        if (!this.submitButton) return;
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
