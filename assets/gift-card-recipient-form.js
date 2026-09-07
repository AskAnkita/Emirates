if (!customElements.get('gift-card-recipient-form')) {
  customElements.define(
    'gift-card-recipient-form',
    class GiftCardRecipientForm extends HTMLElement {
      constructor() {
        super();
        this.recipientFieldsLiveRegion = this.querySelector(`#Recipient-fields-live-region-${this.dataset.sectionId}`);
        this.checkboxInput = this.querySelector(`#Recipient-checkbox-${this.dataset.sectionId}`);
        this.checkboxInput.disabled = false;
        this.hiddenControlField = this.querySelector(`#Recipient-control-${this.dataset.sectionId}`);
        this.hiddenControlField.disabled = true;
        this.emailInput = this.querySelector(`#Recipient-email-${this.dataset.sectionId}`);
        this.nameInput = this.querySelector(`#Recipient-name-${this.dataset.sectionId}`);
        this.messageInput = this.querySelector(`#Recipient-message-${this.dataset.sectionId}`);
        this.sendOnInput = this.querySelector(`#Recipient-send-on-${this.dataset.sectionId}`);
        this.offsetProperty = this.querySelector(`#Recipient-timezone-offset-${this.dataset.sectionId}`);
        if (this.offsetProperty) this.offsetProperty.value = new Date().getTimezoneOffset().toString();

        this.errorMessageWrapper = this.querySelector('.product-form__recipient-error-message-wrapper');
        this.errorMessageList = this.errorMessageWrapper?.querySelector('ul');
        this.errorMessage = this.errorMessageWrapper?.querySelector('.error-message');
        this.defaultErrorHeader = this.errorMessage?.innerText;
        this.currentProductVariantId = this.dataset.productVariantId;

        this.refs = {
          recipientMessage: this.querySelector('textarea[name="properties[Message]"]'),
          characterCount: this.querySelector('[data-character-count]'),
        };
        if (this.refs.recipientMessage) {
          this.refs.recipientMessage.addEventListener('input', this.updateCharacterCount.bind(this));
          if (!this.refs.recipientMessage.maxLength) {
            const dataMax = Number(this.refs.characterCount?.getAttribute('data-max'));
            if (!Number.isNaN(dataMax) && dataMax > 0) {
              this.refs.recipientMessage.maxLength = dataMax;
            }
          }
        }

        this.addEventListener('change', this.onChange.bind(this));
        this.onChange();
      }

      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;
      cartErrorUnsubscriber = undefined;

      connectedCallback() {
        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
          if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
            this.resetRecipientForm();
          }
        });

        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (event.data.sectionId === this.dataset.sectionId) {
            this.currentProductVariantId = event.data.variant.id.toString();
          }
        });

        this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartError, (event) => {
          if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
            this.displayErrorMessage(event.message, event.errors);
          }
        });
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }

        if (this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }

        if (this.cartErrorUnsubscriber) {
          this.cartErrorUnsubscriber();
        }
      }

      onChange() {
        if (this.checkboxInput.checked) {
          this.enableInputFields();
          this.recipientFieldsLiveRegion.innerText = window.accessibilityStrings.recipientFormExpanded;
          this.updateCharacterCount();
        } else {
          this.clearInputFields();
          this.disableInputFields();
          this.clearErrorMessage();
          this.recipientFieldsLiveRegion.innerText = window.accessibilityStrings.recipientFormCollapsed;
          this.updateCharacterCount();
        }
      }

      inputFields() {
        return [this.emailInput, this.nameInput, this.messageInput, this.sendOnInput];
      }

      disableableFields() {
        return [...this.inputFields(), this.offsetProperty];
      }

      clearInputFields() {
        this.inputFields().forEach((field) => {
          if (field) field.value = '';
        });
      }

      enableInputFields() {
        this.disableableFields().forEach((field) => {
          if (field) field.disabled = false;
        });
      }

      disableInputFields() {
        this.disableableFields().forEach((field) => {
          if (field) field.disabled = true;
        });
      }

      displayErrorMessage(title, body) {
        this.clearErrorMessage();
        this.errorMessageWrapper.hidden = false;
        if (typeof body === 'object') {
          this.errorMessage.innerText = this.defaultErrorHeader;
          return Object.entries(body).forEach(([key, value]) => {
            const errorMessageId = `RecipientForm-${key}-error-${this.dataset.sectionId}`;
            const fieldSelector = `#Recipient-${key}-${this.dataset.sectionId}`;
            const message = `${value.join(', ')}`;
            const errorMessageElement = this.querySelector(`#${errorMessageId}`);
            const errorTextElement = errorMessageElement?.querySelector('.error-message');
            if (!errorTextElement) return;

            if (this.errorMessageList) {
              this.errorMessageList.appendChild(this.createErrorListItem(fieldSelector, message));
            }

            errorTextElement.innerText = `${message}.`;
            errorMessageElement.classList.remove('hidden');

            const inputElement = this[`${key}Input`];
            if (!inputElement) return;

            inputElement.setAttribute('aria-invalid', true);
            inputElement.setAttribute('aria-describedby', errorMessageId);
          });
        }

        this.errorMessage.innerText = body;
      }

      createErrorListItem(target, message) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.setAttribute('href', target);
        a.innerText = message;
        li.appendChild(a);
        li.className = 'error-message';
        return li;
      }

      clearErrorMessage() {
        this.errorMessageWrapper.hidden = true;

        if (this.errorMessageList) this.errorMessageList.innerHTML = '';

        this.querySelectorAll('.recipient-fields .form__message').forEach((field) => {
          field.classList.add('hidden');
          const textField = field.querySelector('.error-message');
          if (textField) textField.innerText = '';
        });

        [this.emailInput, this.messageInput, this.nameInput, this.sendOnInput].forEach((inputElement) => {
          if (!inputElement) return;
          inputElement.setAttribute('aria-invalid', false);
          inputElement.removeAttribute('aria-describedby');
        });
      }

      updateCharacterCount() {
        if (!this.refs || !this.refs.characterCount || !this.refs.recipientMessage) return;
        const currentLength = this.refs.recipientMessage.value.length;
        const maxLength = this.refs.recipientMessage.maxLength > 0 ? this.refs.recipientMessage.maxLength : Number(this.refs.characterCount.getAttribute('data-max')) || 0;
        const template = this.refs.characterCount.getAttribute('data-template');
        if (!template) return;
        const updatedText = template.replace('[current]', currentLength.toString()).replace('[max]', maxLength.toString());
        this.refs.characterCount.textContent = updatedText;
      }

      resetRecipientForm() {
        if (this.checkboxInput.checked) {
          this.checkboxInput.checked = false;
          this.clearInputFields();
          this.clearErrorMessage();
        }
      }
    }
  );
}
