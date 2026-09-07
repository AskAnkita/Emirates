class PasswordModal extends DetailsModal {
  constructor() {
    super();

    if (this.querySelector('input[aria-invalid="true"]')) this.open({ target: this.querySelector('details') });
  }
}
if (!customElements.get('password-modal')) customElements.define('password-modal', PasswordModal);
