class EditCart extends HTMLElement {
  constructor() {
    super();
    this.checkLoadEC = true;
    this.handleOpenEditCart = this.handleOpenEditCart.bind(this);
    this.handleCloseEditCart = this.handleCloseEditCart.bind(this);
    this.handleDocumentClick = this.handleDocumentClick.bind(this);
    this.handleRemoveItem = this.handleRemoveItem.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  getDrawer() {
    return document.querySelector('[data-edit-cart-popup]');
  }

  init() {
    document.addEventListener('click', this.handleOpenEditCart);
    document.addEventListener('click', this.handleCloseEditCart);
    document.addEventListener('click', this.handleDocumentClick);
    document.addEventListener('click', this.handleRemoveItem);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleOpenEditCart);
    document.removeEventListener('click', this.handleCloseEditCart);
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('click', this.handleRemoveItem);
  }

  handleOpenEditCart(event) {
    const openBtn = event.target.closest('[data-open-edit-cart]');
    if (!openBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const url = openBtn.getAttribute('data-edit-cart-url');
    const itemId = openBtn.getAttribute('data-edit-cart-id');
    const itemLine = openBtn.getAttribute('data-line');
    const itemIndex = openBtn.getAttribute('data-index');
    const quantity = openBtn.getAttribute('data-edit-cart-quantity');
    let option = '';
    const previewCartItem = openBtn.closest('.previewCartItem');
    if (previewCartItem) {
      const variant = previewCartItem.querySelector('previewCartItem-variant');
      if (variant) option = variant.textContent;
    }

    const modal = document.querySelector('[data-edit-cart-popup]');
    const modalContent = modal ? modal.querySelector('.halo-popup-content') : null;

    if (url && modalContent) {
      fetch(url, { method: 'GET', credentials: 'same-origin' })
        .then(response => response.text())
        .then(data => {
          modalContent.innerHTML = data;
          const cartEdit = modalContent.querySelector('[data-template-cart-edit]');
          if (cartEdit) {
            cartEdit.setAttribute('data-cart-update-id', itemId);
            cartEdit.setAttribute('data-line', itemLine);
            cartEdit.setAttribute('data-index', itemIndex);
          }
          const productItem = modalContent.querySelector('.product-edit-item');
          if (productItem) {
            const qtyInput = productItem.querySelector('input[name="updates[]"]');
            if (qtyInput) qtyInput.value = quantity;

            const minusBtn = productItem.querySelector('.quantity__button[name="minus"]');
            if (minusBtn) minusBtn.classList.remove('disabled');
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          const drawer = document.querySelector(openBtn.getAttribute('data-modal')) || this.getDrawer();
          drawer?.open?.(openBtn);
        });
    }
  }

  handleCloseEditCart(event) {
    const closeBtn = event.target.closest('[data-close-edit-cart]');
    if (!closeBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const drawer = closeBtn.closest('[data-edit-cart-popup]') || this.getDrawer();
    drawer?.close?.();
  }

  handleDocumentClick(event) {
    const drawer = this.getDrawer();
    if (!drawer?.classList?.contains('active')) return;
    const isInsidePopup = event.target.closest('[data-edit-cart-popup]');
    const isOpenBtn = event.target.closest('[data-open-edit-cart]');
    if (!isInsidePopup && !isOpenBtn) drawer?.close?.();
  }

  handleRemoveItem(event) {
    const removeBtn = event.target.closest('[data-edit-cart-remove]');
    if (!removeBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const currentItem = removeBtn.closest('.product-edit-item');
    if (currentItem) {
      currentItem.remove();
    }
  }
}

if (!customElements.get("edit-cart"))
  customElements.define('edit-cart', EditCart);

class VariantEditCartSelects extends HTMLElement {
  constructor() {
    super();
    this.variantSelect = this;
    this.item = this.closest(".product-edit-item");

    if (this.variantSelect.classList.contains("has-default")) {
      this.updateOptions();
      this.updateMasterId();
      this.renderProductInfo();
    }

    if (!this.currentVariant) {
      if (this.item) this.item.dataset.inStock = "false";
    } else {
      if (this.item) {
        this.item.dataset.inStock = this.currentVariant.available
          ? "true"
          : "false";
      }
    }

    if (this.currentVariant) {
      const inventory = this.currentVariant?.inventory_management;
      if (inventory != null) {
        const productId = this.item?.getAttribute("data-cart-edit-id");
        if (productId) {
          this.updateInventoryArray(productId);

          const inventoryMapKey = `edit_cart_inven_array_${productId}`;
          const inventoryMap = window[inventoryMapKey] || {};
          const variantId = String(this.currentVariant.id);
          const inventoryQuantity = variantId ? Number(inventoryMap[variantId] ?? inventoryMap[this.currentVariant.id] ?? 0) : 0;

          this.updateQuantityInput(inventoryQuantity);
        }
      }
    }

    this.onVariantInit();
    this.addEventListener("change", this.onVariantChange.bind(this));
  }

  onVariantInit() {
    this.updateVariantStatuses();
  }

  onVariantChange(event) {
    this.updateOptions();
    this.updateMasterId();
    this.updateVariantStatuses();

    if (!this.currentVariant) {
      this.updateAttribute(true);
    } else {
      this.updateMedia();
      this.updateVariantInput();
      this.updatePrice();
      this.updateInventoryFromServer();
      this.updateAttribute(false, !this.currentVariant.available);
    }

    this.updateAddToCartButton();

    if (document.querySelectorAll(".dropdown-item[data-currency]").length) {
      if (
        (window.show_multiple_currencies &&
          Currency.currentCurrency != shopCurrency) ||
        window.show_auto_currency
      ) {
        let activeCurrency = document.querySelector("#currencies .active");
        let activeCurrencyValue = activeCurrency
          ? activeCurrency.getAttribute("data-currency")
          : null;
        Currency.convertAll(
          window.shop_currency,
          activeCurrencyValue,
          "span.money",
          "money_format"
        );
      }
    }
  }

  updateOptions() {
    const selects = Array.from(this.querySelectorAll("select.variant-option__select"));
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    
    this.options = [];
    
    if (selects.length > 0) {
      this.options = selects.map((select) => {
        const selectedOption = select.options[select.selectedIndex];
        return selectedOption ? selectedOption.value : "";
      });
    } else if (fieldsets.length > 0) {
      this.options = fieldsets.map((fieldset) => {
        let checkedRadio = Array.from(fieldset.querySelectorAll("input")).find(
          (radio) => radio.checked
        );
        return checkedRadio ? checkedRadio.value : "";
      });
    }
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant || !this.currentVariant?.featured_image) return;
    const itemImage = this.item
      ? this.item.querySelector(".product-edit-image")
      : null;
    const image = this.currentVariant?.featured_image;

    if (!itemImage) return;

    let img = itemImage.querySelector("img");
    if (img) {
      img.setAttribute("src", image.src);
      img.setAttribute("srcset", image.src);
      img.setAttribute("alt", image.alt);
    }
  }

  updateVariantInput() {
    const productForm =
      this.closest(".product-edit-itemRight")?.querySelector("form") ||
      document.querySelector(`#product-form-edit-${this.dataset.product}`);

    if (!productForm) return;

    const input = productForm.querySelector('input[name="id"]');

    if (!input || !this.currentVariant) return;

    input.value = this.currentVariant.id;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  updatePrice() {
    const itemPrice = this.item
      ? this.item.querySelector(".product-edit-price")
      : null;

    if (!itemPrice) return;

    var price = this.currentVariant?.price,
      compare_at_price = this.currentVariant?.compare_at_price;

    let priceEl = itemPrice.querySelector(".price");
    let comparePriceEl = itemPrice.querySelector(".compare-price");

    if (priceEl) {
      priceEl.innerHTML = Shopify.formatMoney(price, window.money_format);
      priceEl.style.display = "";
    }

    if (compare_at_price > price) {
      if (comparePriceEl) {
        comparePriceEl.innerHTML = Shopify.formatMoney(
          compare_at_price,
          window.money_format
        );
        comparePriceEl.style.display = "";
      }
      if (priceEl) priceEl.classList.add("new-price");
    } else {
      if (comparePriceEl) comparePriceEl.style.display = "none";
      if (priceEl) priceEl.classList.remove("new-price");
    }
  }

  renderProductInfo() {
    if (!this.currentVariant) return;

    const inventory = this.currentVariant?.inventory_management;
    if (inventory == null) return;

    const productId = this.item?.getAttribute("data-cart-edit-id");
    if (!productId) return;
  }

  updateInventoryFromServer() {
    if (!this.currentVariant) return;

    const inventory = this.currentVariant?.inventory_management;
    if (inventory == null) return;

    const productUrl = this.dataset.productUrl;
    if (!productUrl) return;

    const productId = this.item?.getAttribute("data-cart-edit-id");
    if (!productId) return;

    const variantId = this.currentVariant.id;
    const requestUrl = `${productUrl}?variant=${variantId}`;

    fetch(requestUrl, { method: 'GET', credentials: 'same-origin' })
      .then(response => response.text())
      .then(htmlText => {
        const html = new DOMParser().parseFromString(htmlText, 'text/html');
        this.handleInventoryUpdateFromHtml(html, productId, variantId);
      })
      .catch((e) => {
        console.error('Error fetching inventory:', e);
      });
  }

  handleInventoryUpdateFromHtml(html, productId, variantId) {
    try {
      const quantityInputUpdated = html.querySelector(`product-form-component .quantity__input`);
      
      let inventoryQuantity = 0;

      if (quantityInputUpdated) {
        const qtyAttr = quantityInputUpdated.getAttribute('data-inventory-quantity');
        if (qtyAttr !== null && qtyAttr !== '') {
          inventoryQuantity = Number(qtyAttr);
        }
      }

      if (!Number.isNaN(inventoryQuantity)) {
        this.updateQuantityInput(inventoryQuantity);
        this.handleHotStock(productId, variantId, inventoryQuantity);
      }
    } catch (e) {
      console.error('Error handling inventory update:', e);
    }
  }

  updateInventoryArray(productId) {
    if (!productId || !this.currentVariant) return;

    const arrayInVarName = `edit_cart_inven_array_${productId}`;
    if (!window[arrayInVarName]) window[arrayInVarName] = {};
    const inventoryMap = window[arrayInVarName];
    const variantId = String(this.currentVariant.id);

    const existing = inventoryMap[variantId] ?? inventoryMap[this.currentVariant.id];
    if (typeof existing !== 'undefined' && existing !== null && existing !== '' && !Number.isNaN(Number(existing))) {
      if (!inventoryMap[variantId]) inventoryMap[variantId] = existing;
      if (!inventoryMap[this.currentVariant.id]) inventoryMap[this.currentVariant.id] = existing;
      return;
    }

    let qty = NaN;
    if (typeof this.currentVariant?.inventory_quantity !== 'undefined' && 
        this.currentVariant.inventory_quantity !== null) {
      qty = Number(this.currentVariant.inventory_quantity);
    }
    
    if (Number.isNaN(qty)) {
      const quantityInput = this.item?.querySelector('input[name="updates[]"]');
      const qtyAttr = quantityInput?.getAttribute('data-inventory-quantity');
      if (typeof qtyAttr !== 'undefined' && qtyAttr !== null && qtyAttr !== '') {
        qty = Number(qtyAttr);
      }
    }

    if (!Number.isNaN(qty)) {
      inventoryMap[variantId] = qty;
      inventoryMap[this.currentVariant.id] = qty;
    }
  }

  updateInventoryArrayForVariant() {
    if (!this.currentVariant) return 0;

    let inventoryQuantity = 0;

    if (typeof this.currentVariant?.inventory_quantity !== 'undefined' && 
        this.currentVariant.inventory_quantity !== null) {
      inventoryQuantity = Number(this.currentVariant.inventory_quantity);
    }
    
    if (inventoryQuantity === 0 || Number.isNaN(inventoryQuantity)) {
      const quantityInput = this.item?.querySelector('input[name="updates[]"]');
      const qtyAttr = quantityInput?.getAttribute('data-inventory-quantity');
      if (typeof qtyAttr !== 'undefined' && qtyAttr !== null && qtyAttr !== '') {
        inventoryQuantity = Number(qtyAttr);
      }
    }

    return Number.isNaN(inventoryQuantity) ? 0 : inventoryQuantity;
  }

  updateQuantityInput(inventoryQuantity) {
    const quantityInput = this.item?.querySelector('input[name="updates[]"]');
    if (quantityInput) {
      quantityInput.setAttribute("data-inventory-quantity", inventoryQuantity);
    }
  }

  handleHotStock(productId, variantId, inventoryQuantity) {
    if (!productId || !variantId) return;

    const hotStock = this.item?.querySelector(".product-edit-hotStock");
    if (!hotStock) return;

    const maxStock = Number(hotStock.getAttribute("data-edit-cart-hot-stock")) || 0;
    const inventoryQty = inventoryQuantity !== undefined ? inventoryQuantity : 0;

    if (maxStock > 0 && inventoryQty > 0 && inventoryQty <= maxStock) {
      const textStock = String(window.inventory_text?.hotStock || '').replace('[inventory]', inventoryQty);
      const hotStockText = hotStock.querySelector(".hotStock-text");

      if (hotStockText) {
        hotStockText.innerHTML = textStock;
      } else {
        hotStock.textContent = textStock;
      }
      
      hotStock.classList.remove('hidden');
      hotStock.style.display = "";
    } else {
      hotStock.classList.add('hidden');
      hotStock.style.display = "none";
    }
  }

  updateVariantStatuses() {
    const selectedOptionOneVariants = this.variantData.filter(
      (variant) => this.querySelector(":checked").value === variant.option1
    );
    const inputWrappers = [...this.querySelectorAll(".product-form__input")];
    const inputLength = inputWrappers.length;
    const variant_swatch = [...this.querySelectorAll(".product-form__swatch")];
    inputWrappers.forEach((option, index) => {
      let headerOption = option.querySelector("[data-selected-value]");
      let checkedInput = option.querySelector(":checked");
      if (headerOption && checkedInput)
        headerOption.innerText = checkedInput.value;
      if (index === 0 && inputLength > 1) return;
      const optionInputs = [
        ...option.querySelectorAll('input[type="radio"], option'),
      ];
      const previousOptionSelected =
        inputLength > 1
          ? inputWrappers[index - 1].querySelector(":checked").value
          : inputWrappers[index].querySelector(":checked").value;
      const optionInputsValue =
        inputLength > 1
          ? selectedOptionOneVariants
              .filter(
                (variant) =>
                  variant[`option${index}`] === previousOptionSelected
              )
              .map((variantOption) => variantOption[`option${index + 1}`])
          : this.variantData.map(
              (variantOption) => variantOption[`option${index + 1}`]
            );
      const availableOptionInputsValue =
        inputLength > 1
          ? selectedOptionOneVariants
              .filter(
                (variant) =>
                  variant.available &&
                  variant[`option${index}`] === previousOptionSelected
              )
              .map((variantOption) => variantOption[`option${index + 1}`])
          : this.variantData
              .filter((variant) => variant.available)
              .map((variantOption) => variantOption[`option${index + 1}`]);
      this.setInputAvailability(
        optionInputs,
        optionInputsValue,
        availableOptionInputsValue
      );
      if (variant_swatch.length > 1) {
        this.updateImageSwatch(selectedOptionOneVariants);
      }

      this.updateTitleVariant();
    });
  }

  updateTitleVariant() {
    const titleVariant = this.closest(".product-edit-item").querySelector("[data-change-title]");

    if (titleVariant && this.currentVariant) titleVariant.textContent = this.currentVariant.title;
  }

  updateImageSwatch(selectedOptionOneVariants) {
    const inputWrappers = this.querySelectorAll(".product-form__input");
    if (inputWrappers) {
      inputWrappers.forEach((element, inputIndex) => {
        const imageSpan = element.querySelectorAll("label>span.pattern");
        const imageLabel = element.querySelectorAll("label");
        const imageSpanImage = element.querySelectorAll(
          "label>span.expand>img"
        );
        const inputList = element.querySelectorAll("input");

        inputList.forEach((item, index) => {
          const image = selectedOptionOneVariants.filter((tmp) => {
            if (inputIndex == 0) return tmp.option1 == item.value;
            if (inputIndex == 1) return tmp.option2 == item.value;
            if (inputIndex == 2) return tmp.option3 == item.value;
          });

          if (image.length > 0) {
            if (imageLabel[index])
              imageLabel[index].style.display = "inline-block";
            if (
              imageSpan[index] !== undefined &&
              image[0].featured_image != null
            )
              imageSpan[
                index
              ].style.backgroundImage = `url("${image[0].featured_image.src}")`;
            if (
              imageSpanImage[index] !== undefined &&
              image[0].featured_image != null
            )
              imageSpanImage[index].srcset = image[0].featured_image.src;
          }
        });
      });
    }
  }

  updateAttribute(unavailable, disable) {
    if (unavailable === undefined) unavailable = true;
    if (disable === undefined) disable = true;

    let alertBox = this.item ? this.item.querySelector(".alertBox") : null,
      quantityInput = this.item
        ? this.item.querySelector('quantity-input')
        : null,
      notifyMe = this.item
        ? this.item.querySelector(".product-edit-notifyMe")
        : null,
      hotStock = this.item
        ? this.item.querySelector(".product-edit-hotStock")
        : null;

    if (unavailable) {
      if (this.item) this.item.classList.remove("isChecked");
      if (quantityInput) quantityInput.classList.add("disabled");
      if (alertBox) {
        let alertMsg = alertBox.querySelector(".alertBox-message");
        if (alertMsg)
          alertMsg.textContent = window.variantStrings.unavailable_message;
        alertBox.style.display = "";
      }
      if (notifyMe) notifyMe.style.display = "none";

      if (hotStock) {
        hotStock.style.display = "none";
      }
    } else {
      if (disable) {
        if (this.item) this.item.classList.remove("isChecked");
        if (quantityInput) quantityInput.classList.add("disabled");
        if (alertBox) {
          let alertMsg = alertBox.querySelector(".alertBox-message");
          if (alertMsg)
            alertMsg.textContent = window.variantStrings.soldOut_message;
          alertBox.style.display = "";
        }
        let quantityMsg = this.item
          ? this.item.querySelector(".quantity__message")
          : null;
        if (quantityMsg) {
          quantityMsg.textContent = "";
          quantityMsg.style.display = "none";
        }
        if (notifyMe) {
          let notifyVariant = notifyMe.querySelector(
            ".halo-notify-product-variant"
          );
          if (notifyVariant && this.currentVariant) notifyVariant.value = this.currentVariant.title;
          let notifyText = notifyMe.querySelector(".notifyMe-text");
          if (notifyText) notifyText.textContent = "";
          notifyMe.style.display = "";
        }
      } else {
        if (this.item) this.item.classList.add("isChecked");
        if (quantityInput) quantityInput.classList.remove("disabled");
        if (alertBox) {
          let alertMsg = alertBox.querySelector(".alertBox-message");
          if (alertMsg) alertMsg.textContent = "";
          alertBox.style.display = "none";
        }
        if (notifyMe) notifyMe.style.display = "none";
      }
    }
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  updateAddToCartButton() {
    const editCartWrapper = this.variantSelect.closest(
      "[data-template-cart-edit]"
    );
    if (!editCartWrapper) return;
    const productItems = [
      ...editCartWrapper.querySelectorAll(".product-edit-item"),
    ];
    const editCartPopup = this.variantSelect.closest("[data-edit-cart-popup]");
    if (!editCartPopup) return;
    const updateEditCartButton = editCartPopup.querySelector(
      "[data-update-cart-edit]"
    );
    const allValid = productItems.every(
      (productItem) => productItem.dataset.inStock == "true"
    );

    if (updateEditCartButton) {
      updateEditCartButton.disabled = !allValid;
    }
  }

  setInputAvailability(
    optionInputs,
    optionInputsValue,
    availableOptionInputsValue
  ) {
    optionInputs.forEach((input) => {
      if (availableOptionInputsValue.includes(input.getAttribute("value"))) {
        input.classList.remove("soldout");
        input.innerText = input.getAttribute("value");
      } else {
        input.classList.add("soldout");
        if (optionInputsValue.includes(input.getAttribute("value"))) {
          input.innerText = input.getAttribute("value") + " (Sold out)";
        } else {
          input.innerText =
            window.variantStrings.unavailable_with_option.replace(
              "[value]",
              input.getAttribute("value")
            );
        }
      }
    });
  }
}

if (!customElements.get("variant-edit-selects"))
  customElements.define("variant-edit-selects", VariantEditCartSelects);

class EditCartAddMore extends HTMLElement {
  constructor() {
    super();
    this.handleAddMore = this.handleAddMore.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.addEventListener('click', this.handleAddMore);
  }

  handleAddMore(event) {
    const addMoreBtn = event.target.closest('[data-edit-cart-add-more]');
    if (!addMoreBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const itemWrapper = document.querySelector('[data-template-cart-edit]');
    const currentItem = addMoreBtn.closest('.product-edit-item');
    if (!itemWrapper || !currentItem) return;

    let count = parseInt(itemWrapper.getAttribute('data-count'), 10) || 1;
    const cloneProduct = currentItem.cloneNode(true);
    cloneProduct.classList.remove('product-edit-itemFirst');
    const cloneProductId = (cloneProduct.getAttribute('id') || '') + count;
    cloneProduct.setAttribute('id', cloneProductId);

    if (typeof updateClonedProductAttributes === 'function') {
      updateClonedProductAttributes(cloneProduct, count);
    }

    const variantSelects = cloneProduct.querySelectorAll('select.variant-option__select');
    variantSelects.forEach((select) => {
      const oldId = select.getAttribute('id');
      if (oldId) {
        const newId = oldId + count;
        select.setAttribute('id', newId);
        
        const label = cloneProduct.querySelector(`label[for="${oldId}"]`);
        if (label) {
          label.setAttribute('for', newId);
        }
      }
    });

    const variantEditSelects = cloneProduct.querySelector('variant-edit-selects');
    if (variantEditSelects) {
      const oldVariantSelectId = variantEditSelects.getAttribute('id');
      if (oldVariantSelectId) {
        variantEditSelects.setAttribute('id', oldVariantSelectId + count);
      }
    }

    const productEditOptions = cloneProduct.querySelector('.product-edit-options');
    if (productEditOptions) {
      const oldOptionsId = productEditOptions.getAttribute('id');
      if (oldOptionsId) {
        productEditOptions.setAttribute('id', oldOptionsId + count);
      }
    }

    const productForm = cloneProduct.querySelector('form[id^="product-form-edit-"]');
    if (productForm) {
      const oldFormId = productForm.getAttribute('id');
      if (oldFormId) {
        productForm.setAttribute('id', oldFormId + count);
      }
    }

    variantSelects.forEach((select) => {
      const formAttr = select.getAttribute('form');
      if (formAttr && productForm) {
        select.setAttribute('form', productForm.getAttribute('id'));
      }
    });

    currentItem.parentNode.insertBefore(cloneProduct, currentItem.nextSibling);

    requestAnimationFrame(() => {
      const clonedVariantSelect = cloneProduct.querySelector('variant-edit-selects');
      if (clonedVariantSelect) {
        if (clonedVariantSelect.updateOptions && clonedVariantSelect.updateMasterId) {
          clonedVariantSelect.updateOptions();
          clonedVariantSelect.updateMasterId();
          
          if (clonedVariantSelect.currentVariant) {
            clonedVariantSelect.updateVariantInput();
            clonedVariantSelect.updatePrice();
            clonedVariantSelect.updateMedia();
            clonedVariantSelect.updateVariantStatuses();
            clonedVariantSelect.updateAttribute(false, !clonedVariantSelect.currentVariant.available);
            clonedVariantSelect.updateAddToCartButton();
            
            const productId = cloneProduct.getAttribute('data-cart-edit-id');
            if (productId) {
              const inventory = clonedVariantSelect.currentVariant?.inventory_management;
              if (inventory != null) {
                clonedVariantSelect.updateInventoryArray(productId);
                const inventoryMapKey = `edit_cart_inven_array_${productId}`;
                const inventoryMap = window[inventoryMapKey] || {};
                const variantId = String(clonedVariantSelect.currentVariant.id);
                const inventoryQuantity = variantId ? Number(inventoryMap[variantId] ?? inventoryMap[clonedVariantSelect.currentVariant.id] ?? 0) : 0;
                clonedVariantSelect.updateQuantityInput(inventoryQuantity);
                clonedVariantSelect.handleHotStock(productId, clonedVariantSelect.currentVariant.id, inventoryQuantity);
              }
            }
          } else {
            clonedVariantSelect.updateAttribute(true);
          }
        }
      }
    });

    count = count + 1;
    itemWrapper.setAttribute('data-count', count);
  }
}

if (!customElements.get("edit-cart-add-more"))
  customElements.define('edit-cart-add-more', EditCartAddMore);

class AddAllEditCart extends HTMLElement {
  constructor() {
    super();
    this.handleAddAll = this.handleAddAll.bind(this);
  }

  connectedCallback() {
    this.init();
  }

  init() {
    this.addEventListener('click', this.handleAddAll);
  }

  handleAddAll(event) {
    const addAllBtn = event.target.closest('[data-update-cart-edit]');
    if (!addAllBtn) return;

    event.preventDefault();
    event.stopPropagation();

    const cartEdit = addAllBtn.closest('edit-cart-modal')?.querySelector('[data-template-cart-edit]');
    if (!cartEdit) return;

    const selectedProducts = cartEdit.querySelectorAll('.product-edit-item.isChecked');
    const productLine = cartEdit.getAttribute('data-line');
    const index = cartEdit.getAttribute('data-index');

    if (selectedProducts.length === 0) {
      alert(window.variantStrings.addToCart_message);
      return;
    }

    const spinner = addAllBtn.querySelector('.loading__spinner');
    addAllBtn.classList.add('loading');
    if (spinner) spinner.classList.remove('hidden');

    Shopify.removeItem(productLine, index, (cart)  => {
      if (cart && Object.keys(cart).length > 0) {
        const productHandleQueue = [];
        const selectedProductsArray = Array.from(selectedProducts);
        const variantIds = [];
        
        const variantMap = new Map();
        
        selectedProductsArray.forEach((element) => {
          const variantId = element.querySelector('input[name="id"]').value;
          
          let qtyInput = element.querySelector('input[name="updates[]"]');
          const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
          
          if (variantMap.has(variantId)) {
            variantMap.set(variantId, variantMap.get(variantId) + qty);
          } else {
            variantMap.set(variantId, qty);
          }
        });

        const cartDrawerItems = document.querySelector('cart-drawer-items');
        const mainCartItems = document.querySelector('cart-items-component');
        const sectionsToUpdate = [];
        
        if (cartDrawerItems) {
          const sectionId = cartDrawerItems?.sectionId || cartDrawerItems?.dataset?.sectionId;
          if (sectionId) sectionsToUpdate.push(sectionId);
        }
        
        if (mainCartItems && mainCartItems.sectionId) {
          sectionsToUpdate.push(mainCartItems.sectionId);
        }

        let lastResponseWithSections = null;
        let requestIndex = 0;
        const totalRequests = variantMap.size;

        variantMap.forEach((totalQty, variantId) => {
          variantIds.push(variantId);
          
          const productItem = Array.from(selectedProductsArray).find(el => {
            const idInput = el.querySelector('input[name="id"]');
            return idInput && idInput.value === variantId;
          });
          
          if (productItem) {
            const qtyInput = productItem.querySelector('input[name="updates[]"]');
            if (qtyInput) {
              const inventoryQuantity = Number(qtyInput.getAttribute('data-inventory-quantity')) || 0;
              const cartQuantity = Number(qtyInput.getAttribute('data-cart-quantity')) || 0;
              const availableQuantity = inventoryQuantity - cartQuantity;
              
              if (inventoryQuantity > 0 && totalQty > availableQuantity) {
                const maxAvailable = Math.max(0, availableQuantity);
                if (maxAvailable > 0) {
                  totalQty = maxAvailable;
                } else {
                  alert(window.variantStrings?.unavailable_message);
                  return;
                }
              }
            }
          }
          
          requestIndex++;
          const isLastRequest = requestIndex === totalRequests;
          
          const formData = new URLSearchParams();
          formData.append('id', variantId);
          formData.append('quantity', totalQty);
          
          if (isLastRequest && sectionsToUpdate.length > 0) {
            formData.append('sections', sectionsToUpdate.join(','));
            formData.append('sections_url', window.location.pathname);
          }

          const rootUrl = window.routes?.root || window.routes?.shop_origin || window.shopUrl || '';
          productHandleQueue.push(
            fetch(`${rootUrl}/cart/add.js`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
              body: formData.toString(),
              credentials: 'same-origin',
            })
              .then(async (response) => {
                const data = await response.json();
                if (data.status || data.errors || data.description) {
                  const errorMessage = data.description || data.errors;
                  throw new Error(errorMessage);
                }
                if (isLastRequest && data.sections) {
                  lastResponseWithSections = data.sections;
                }
                return data;
              })
          );
        });

        if (productHandleQueue.length > 0) {
          Promise.all(productHandleQueue)
            .then(async (results) => {
              Shopify.getCart(async (cart) => {
                const cartDrawerItems = document.querySelector('cart-drawer-items');
                const isCartPage = window.location.pathname.includes('/cart') || document.querySelector('cart-items-component');

                if (cartDrawerItems && !isCartPage) {
                  if (lastResponseWithSections && typeof cartDrawerItems.updateSections === 'function') {
                    try {
                      cartDrawerItems.updateSections(lastResponseWithSections);
                    } catch (e) {
                      console.error('Failed to update cart drawer sections after edit cart:', e);
                      const sectionId = cartDrawerItems?.sectionId || cartDrawerItems?.dataset?.sectionId;
                      if (sectionId && typeof cartDrawerItems.renderSection === 'function') {
                        try {
                          await cartDrawerItems.renderSection(sectionId);
                        } catch (e2) {
                          console.error('Failed to re-render cart drawer section after edit cart:', e2);
                        }
                      }
                    }
                  } else {
                    const sectionId = cartDrawerItems?.sectionId || cartDrawerItems?.dataset?.sectionId;
                    if (sectionId && typeof cartDrawerItems.renderSection === 'function') {
                      try {
                        await cartDrawerItems.renderSection(sectionId);
                      } catch (e) {
                        console.error('Failed to re-render cart drawer section after edit cart:', e);
                      }
                    }
                  }
                }

                const bubbleEls = document.querySelectorAll('.cart-count-bubble [data-cart-count]');
                if (bubbleEls && bubbleEls.length > 0) {
                  bubbleEls.forEach(item => {
                    if (cart.item_count >= 100) {
                      item.textContent = window.cartStrings.item_99;
                    } else {
                      item.textContent = cart.item_count;
                    }
                  });
                }

                const textEls = document.querySelectorAll('[data-cart-text]');
                if (textEls && textEls.length > 0) {
                  textEls.forEach(item => {
                    item.textContent = cart.item_count === 1
                      ? window.cartStrings.item.replace('[count]', cart.item_count)
                      : window.cartStrings.items.replace('[count]', cart.item_count);
                  });
                }

                const mainCartItems = document.querySelector('cart-items-component');
                if (mainCartItems) {
                  if (lastResponseWithSections && typeof mainCartItems.updateSections === 'function') {
                    try {
                      mainCartItems.updateSections(lastResponseWithSections);
                    } catch (e) {
                      console.error('Failed to update main cart sections after edit cart:', e);
                      if (mainCartItems.sectionId && typeof mainCartItems.renderSection === 'function') {
                        try {
                          await mainCartItems.renderSection(mainCartItems.sectionId);
                        } catch (e2) {
                          console.error('Failed to re-render main cart section after edit cart:', e2);
                        }
                      }
                    }
                  } else if (mainCartItems.sectionId && typeof mainCartItems.renderSection === 'function') {
                    try {
                      await mainCartItems.renderSection(mainCartItems.sectionId);
                    } catch (e) {
                      console.error('Failed to re-render main cart section after edit cart:', e);
                    }
                  }
                }

                addAllBtn.classList.remove('loading');
                if (spinner) spinner.classList.add('hidden');
                const drawer = this.closest('side-drawer') || this.closest('[data-edit-cart-popup]');
                drawer?.close?.();

                publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items-component', cartData: cart, variantIds: variantIds });
                publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-drawer-items', cartData: cart, variantIds: variantIds });
            });
          });
        }
      }
    });
  }
}

if (!customElements.get("add-all-edit-cart"))
  customElements.define('add-all-edit-cart', AddAllEditCart);