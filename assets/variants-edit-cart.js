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

    var inventory = this.currentVariant?.inventory_management;

    if (inventory != null) {
      var productId = this.item
          ? this.item.getAttribute("data-cart-edit-id")
          : null,
        arrayInVarName = "edit_cart_inven_array_" + productId,
        inven_array = window[arrayInVarName];

      if (inven_array !== undefined && this.currentVariant) {
        var inven_num = inven_array[this.currentVariant.id],
          inventoryQuantity = parseInt(inven_num);

        let quantityInput = this.item
          ? this.item.querySelector('input[name="updates[]"]')
          : null;
        if (quantityInput) {
          quantityInput.setAttribute(
            "data-inventory-quantity",
            inventoryQuantity
          );
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
      this.renderProductInfo();
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
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      let checkedRadio = Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      );
      return checkedRadio ? checkedRadio.value : "";
    });
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

    if (!input) return;

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
    var inventory = this.currentVariant?.inventory_management;

    if (inventory != null) {
      var productId = this.item
          ? this.item.getAttribute("data-cart-edit-id")
          : null,
        arrayInVarName = "edit_cart_inven_array_" + productId,
        inven_array = window[arrayInVarName];

      if (inven_array !== undefined && this.currentVariant) {
        var inven_num = inven_array[this.currentVariant.id],
          inventoryQuantity = parseInt(inven_num);

        let quantityInput = this.item
          ? this.item.querySelector('input[name="quantity"]')
          : null;
        if (quantityInput) {
          quantityInput.setAttribute(
            "data-inventory-quantity",
            inventoryQuantity
          );
        }

        let hotStock = this.item
          ? this.item.querySelector(".product-edit-hotStock")
          : null;
        if (hotStock) {
          let maxStock = parseInt(
            hotStock.getAttribute("data-edit-cart-hot-stock")
          );
          if (inventoryQuantity > 0 && inventoryQuantity <= maxStock) {
            var textStock = window.inventory_text.hotStock.replace(
              "[inventory]",
              inventoryQuantity
            );
            hotStock.textContent = textStock;
            hotStock.style.display = "";
          } else {
            hotStock.style.display = "none";
          }
        }
      }
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

    if (titleVariant) titleVariant.textContent = this.currentVariant.title;
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

  updateAttribute(unavailable = true, disable = true) {
    let alertBox = this.item ? this.item.querySelector(".alertBox") : null,
      quantityInput = this.item
        ? this.item.querySelector('input[name="quantity"]')
        : null,
      notifyMe = this.item
        ? this.item.querySelector(".product-edit-notifyMe")
        : null,
      hotStock = this.item
        ? this.item.querySelector(".productView-hotStock")
        : null;

    if (unavailable) {
      if (this.item) this.item.classList.remove("isChecked");
      if (quantityInput) quantityInput.setAttribute("disabled", true);
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
        if (quantityInput) quantityInput.setAttribute("disabled", true);
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
          if (notifyVariant) notifyVariant.value = this.currentVariant.title;
          let notifyText = notifyMe.querySelector(".notifyMe-text");
          if (notifyText) notifyText.textContent = "";
          notifyMe.style.display = "";
        }
      } else {
        if (this.item) this.item.classList.add("isChecked");
        if (quantityInput) quantityInput.removeAttribute("disabled");
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

customElements.define("variant-edit-selects", VariantEditCartSelects);

class VariantEditCartRadios extends VariantEditCartSelects {
  constructor() {
    super();
  }

  setInputAvailability(
    optionInputs,
    optionInputsValue,
    availableOptionInputsValue
  ) {
    optionInputs.forEach((input) => {
      let label = input.nextSibling;
      // skip text nodes
      while (label && label.nodeType !== 1) label = label.nextSibling;
      if (!label) return;
      if (availableOptionInputsValue.includes(input.getAttribute("value"))) {
        label.classList.remove("soldout", "unavailable");
        label.classList.add("available");
      } else {
        label.classList.remove("available", "unavailable");
        label.classList.add("soldout");

        if (
          window.variantStrings.hide_variants_unavailable &&
          !optionInputsValue.includes(input.getAttribute("value"))
        ) {
          label.classList.add("unavailable");
          if (!input.checked) return;
          let inputsValue;
          if (availableOptionInputsValue.length > 0) {
            inputsValue = availableOptionInputsValue;
          } else {
            inputsValue = optionInputsValue;
          }
          let parentInput = input.closest(".product-form__input");
          if (parentInput) {
            let firstInput = parentInput.querySelector(
              `input[value="${inputsValue[0]}"]`
            );
            if (firstInput) firstInput.checked = true;
            this.dispatchEvent(new Event("change"));
          }
        }
      }
    });
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      let checkedRadio = Array.from(fieldset.querySelectorAll("input")).find(
        (radio) => radio.checked
      );
      return checkedRadio ? checkedRadio.value : "";
    });
  }
}

customElements.define("variant-edit-radios", VariantEditCartRadios);

class QuantityEditCartInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.item = this.closest(".product-edit-item");
    if (this.input) {
      this.input.addEventListener("change", this.onInputChange.bind(this));
    }
    this.querySelectorAll(".btn-quantity").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    if (!this.input) return;
    var inputValue = Number(this.input.value);
    var maxValue = parseInt(this.input.dataset.inventoryQuantity);
    const value = Number(this.input.value);
    let newVal;
    if (event.target.classList.contains("plus")) {
      newVal = value + 1;
    } else {
      newVal = value - 1;
    }

    if (inputValue < 1) {
      newVal = 1;
      this.input.value = newVal;
    }

    if (inputValue > maxValue) {
      var arrayInVarName = `quick_view_selling_array_${this.input.dataset.product}`,
        itemInArray = window[arrayInVarName],
        currentId = this.input.value,
        itemStatus = itemInArray ? itemInArray[currentId] : null;

      if (itemStatus == "deny") {
        newVal = maxValue;
        this.input.value = newVal;
      }
    }

    this.input.value = newVal;
    this.input.dispatchEvent(this.changeEvent);
  }

  onInputChange(event) {
    event.preventDefault();
    if (!this.input) return;
    var inputValue = Number(this.input.value);
    var inventoryQuantity = Number(this.input.dataset.quantity);

    let quantityMsg = this.item
      ? this.item.querySelector(".quantity__message")
      : null;

    if (inputValue < 1) {
      inputValue = 1;
      this.input.value = inputValue;
    } else {
      if (inventoryQuantity < inputValue) {
        var message = window.inventory_text.warningQuantity.replace(
          "[inventory]",
          inventoryQuantity
        );

        inputValue = inventoryQuantity;
        this.input.value = inputValue;

        if (quantityMsg) {
          quantityMsg.textContent = message;
          quantityMsg.style.display = "";
        }
        if (this.item) this.item.classList.remove("isChecked");
      } else {
        if (this.item) this.item.classList.add("isChecked");
        if (quantityMsg) {
          quantityMsg.textContent = "";
          quantityMsg.style.display = "none";
        }
      }
    }
  }
}

customElements.define("quantity-edit-cart-input", QuantityEditCartInput);
