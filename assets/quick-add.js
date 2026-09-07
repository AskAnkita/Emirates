if (!customElements.get('quick-add-modal')) {
  customElements.define('quick-add-modal', class QuickAddModal extends ModalDialog {
    constructor() {
      super();
      this.modalContent = this.querySelector('#QuickStandardModal');

      this.addEventListener('product-info:loaded', ({ target }) => {
        target.addPreProcessCallback(this.preprocessHTML.bind(this));
      });
    }

    hide(preventFocus = false) {
      const cartNotification = document.querySelector('cart-drawer');
      if (cartNotification) cartNotification.setActiveElement(this.openedBy);
      setTimeout(() => this.modalContent.innerHTML = '', 500);

      if (preventFocus) this.openedBy = null;
      super.hide();
    }

    show(opener) {
      opener.setAttribute('aria-disabled', true);
      opener.classList.add('loading');
      opener.querySelector('.loading__spinner').classList.remove('hidden');

      fetch(opener.getAttribute('data-product-url').split('?')[0] + '?view=quick_add')
        .then((response) => response.text())
        .then((responseText) => {
          const responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
          const productElement = responseHTML.querySelector('product-info');

          this.preprocessHTML(productElement);
          HTMLUpdateUtility.setInnerHTML(this.modalContent, productElement.outerHTML);
          if (window.Shopify && Shopify.PaymentButton) Shopify.PaymentButton.init();
          if (window.ProductModel) window.ProductModel.loadShopifyXR();

          super.show(opener);
        })
        .finally(() => {
          opener.removeAttribute('aria-disabled');
          opener.classList.remove('loading');
          opener.querySelector('.loading__spinner').classList.add('hidden');
        });

    }

    preprocessHTML(productElement) {
      productElement.classList.forEach((classApplied) => {
        if (classApplied.startsWith('color-') || classApplied === 'gradient')
          this.modalContent.classList.add(classApplied);
      });
      this.preventDuplicatedIDs(productElement);
      this.removeDOMElements(productElement);
      this.removeGalleryListSemantic(productElement);
      this.preventVariantURLSwitching(productElement);
    }

    preventVariantURLSwitching(productElement) {
      productElement.setAttribute('data-update-url', 'false');
    }

    removeDOMElements(productElement) {
      const pickupAvailability = productElement.querySelector('pickup-availability');
      if (pickupAvailability) pickupAvailability.remove();

      const shareButton = productElement.querySelector('share-button');
      if (shareButton) shareButton.remove();

      const productModal = productElement.querySelector('product-modal');
      if (productModal) productModal.remove();

      const modalDialog = productElement.querySelectorAll('modal-dialog');
      if (modalDialog) modalDialog.forEach((modal) => modal.remove());

      const sideDrawerOpener = productElement.querySelectorAll('side-drawer-opener');
      if (sideDrawerOpener) {
        sideDrawerOpener.forEach((button) => {
          if (!button.classList.contains('product-popup-modal__opener--keep')) button.remove()
        })
      };

      const sideDrawer = productElement.querySelectorAll('side-drawer');
      if (sideDrawer) {
        sideDrawer.forEach((drawer) => {
           if (!drawer.classList.contains('product-popup-modal__drawer--keep')) drawer.remove()
        })
      };
    }

    preventDuplicatedIDs(productElement) {
      const sectionId = productElement.dataset.section;

      const oldId = sectionId;
      const newId = `quickadd-${sectionId}`;
      productElement.innerHTML = productElement.innerHTML.replaceAll(oldId, newId);
      Array.from(productElement.attributes).forEach((attribute) => {
        if (attribute.value.includes(oldId)) {
          productElement.setAttribute(attribute.name, attribute.value.replace(oldId, newId));
        }
      });

      productElement.dataset.originalSection = sectionId;
    }

    removeGalleryListSemantic(productElement) {
      const galleryList = productElement.querySelector('[id^="Slider-Gallery"]');
      if (!galleryList) return;

      galleryList.setAttribute('role', 'presentation');
      galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute('role', 'presentation'));
    }
  });
}
