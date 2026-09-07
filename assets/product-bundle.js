class ProductBundle extends HTMLElement {
  constructor() {
    super();

    this.listItem = this.querySelectorAll('.bundle-product-item');
    this.form = this.querySelector('form');

    this.updateBundleTotalPrice();
    this.updateBundleText();

    this.form.addEventListener('change', this.onVariantChange.bind(this));
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));

    if (this.querySelector('.card--block-title')) {
      this.querySelectorAll('.card--block-title').forEach((checkbox) => {
        checkbox.addEventListener('click', this.onHandleCheckedProduct.bind(this));
      });

      document.body.addEventListener('click', this.onBodyClickEvent.bind(this));
    }

    if (this.querySelector('.bundle-product-toggle')) {
      this.querySelectorAll('.bundle-product-toggle').forEach((button) => {
        button.addEventListener('click', this.onHandleToggleProduct.bind(this));
      });

      document.body.addEventListener('click', this.onBodyClickEvent.bind(this));
    }

    if (this.querySelector('.bundle-option-close')) {
      this.querySelectorAll('.bundle-option-close').forEach((button) => {
        button.addEventListener('click', this.onHandleCloseProduct.bind(this));
      });
    }
  }

  onVariantChange(event) {
    this.changeSwatch(event);
    this.updateVariants(event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const previewCartList = document.querySelector('.previewCartList');
    const addToCart = () => {
      const $this = this,
        btnAddTocart = $this.querySelector('[data-bundle-addtocart]');
      const productId = typeof meta == 'object' ? meta.product.id : this.form.querySelector('[name="product-id"]').value;

      var waitMessage = window.variantStrings.addingToCart;

      this.querySelector('form>div').classList.add('has-halo-block-loader');

      const bundleItem = this.querySelectorAll('.bundle-product-item.isChecked');
      const discountCode = "FBT-BUNDLE-" + productId;
      let data = '';
      let hint = ',';
      let attributes = {};

      const rootUrl = window.routes?.root || window.routes?.shop_origin || window.shopUrl || '';
      fetch(`${rootUrl}/cart`)
        .then(response => response.text())
        .then(responseText => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const cartItem = html.querySelectorAll('.cart-item');

          if (cartItem) {
            cartItem.forEach(element => {
              const variantId = element.querySelector('input.quantity__input').dataset.quantityVariantId,
                qty = parseInt(element.querySelector('input.quantity__input').value);

              if (variantId) {
                data = `${variantId}:${qty}${hint}${data}`;
              }
            });
          }

          bundleItem.forEach((item, index) => {
            const variantId = item.querySelector('[name=group_id]').value;

            if (variantId) {
              data = `${data}${variantId}:1${index == (bundleItem.length - 1) ? '' : hint}`;
            }
          });

          fetch("/cart", {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
            .then(response => response.json())
            .then(async responseData => {
              btnAddTocart.value = waitMessage;
              attributes = responseData.attributes;

              const addProductsToCart = async () => {
                await fetch(`/cart/${data}`, { mode: 'no-cors' });
              };

              const updateBundleDiscountData = async () => {
                if (!$this.querySelector('[data-bundle-discount-rate]')) return;
                const bundleDiscountRate = parseFloat($this.querySelector('[data-bundle-discount-rate]').dataset.bundleDiscountRate);

                const items = [...bundleItem].map(item => parseInt(item.dataset.bundleProductItemId));

                const new_checkout_level_applications = [{ name: discountCode, bundleDiscountRate, items }];
                const newAttributes = { ...attributes, checkout_level_applications: new_checkout_level_applications };
                const attributesBody = JSON.stringify({ attributes: newAttributes });
                localStorage.setItem('storedDiscount', discountCode);

                await fetch(`${routes.cart_update_url}`, { method: 'POST', body: attributesBody, headers: { 'Content-Type': 'application/json' } });
              };

              const applyDiscountCodeToServer = async () => {
                await fetch(`/discount/${discountCode}?redirect=cart`);
              };

              try {
                await addProductsToCart();

                if (bundleItem.length == $this.form.querySelectorAll('.bundle-product-item').length) {
                  await updateBundleDiscountData();
                  await applyDiscountCodeToServer();
                }

                $this.querySelector('form>div').classList.remove('has-halo-block-loader');
                window.location.href = `${window.routes?.cart_url}`;
              } catch (err) {
                console.error(err);
              }
            });
        });
    };
    addToCart();
  }

  onHandleCheckedProduct(event) {
    event.preventDefault();
    const thisElement = event.currentTarget;
    const item = event.target.closest('.bundle-product-item');
    const id = item.getAttribute('data-bundle-product-item-id');

    const itemElement = this.querySelector(`[data-bundle-product-item-id="${id}"]`);

    if (!itemElement.classList.contains('isChecked')) {
      itemElement.classList.add('isChecked');
      item.classList.add('isChecked');
      thisElement.querySelector('input').setAttribute('checked', true);
    } else {
      itemElement.classList.remove('isChecked');
      item.classList.remove('isChecked');
      thisElement.querySelector('input').removeAttribute('checked');
    }

    this.updateBundleTotalPrice();
  }

  onHandleToggleProduct(event) {
    event.preventDefault();

    this.listItem.forEach((item) => {
      if (item.contains(event.target)) {
        if (!item.classList.contains('is-open')) {
          item.classList.add('is-open');
          this.updateVariants(event);
        } else {
          item.classList.remove('is-open');
        }
      } else {
        item.classList.remove('is-open');
      }
    });
  }

  onHandleCloseProduct(event) {
    event.preventDefault();

    var item = event.currentTarget.closest('.bundle-product-item');

    item.classList.remove('is-open');
  }

  updateBundleText(showBundleText = true) {
    if (showBundleText) {
      if (this.querySelector('.bundle-price')) {
        const bundlePrice = this.querySelector('.bundle-price');
        const discountRate = bundlePrice.getAttribute('data-bundle-discount-rate') * 100;
        const discountText = this.querySelector('.bundle-product-text');

        discountText.innerHTML = discountText.textContent.replace('[discount]', discountRate);
        discountText.style.display = 'block';
      }
    }
  }

  updateBundleTotalPrice(showBundleTotalPrice = true) {
    if (showBundleTotalPrice) {
      const bundleItem = this.querySelectorAll('.bundle-product-item.isChecked');
      const maxProduct = this.listItem.length;

      var totalPrice = 0;

      if (this.querySelector('.bundle-price')) {
        const bundlePrice = this.querySelector('.bundle-price');
        const oldPrice = this.querySelector('.bundle-old-price');
        const discountRate = bundlePrice.getAttribute('data-bundle-discount-rate');
      }

      if (bundleItem.length > 0) {
        bundleItem.forEach((item) => {
          const selectElement = item.querySelector('select[name=group_id]'),
            inputElement = item.querySelector('input[name=group_id]');

          if (selectElement) {
            var price = selectElement[selectElement.selectedIndex].getAttribute('data-price');
          } else {
            if (inputElement) {
              var price = inputElement.getAttribute('data-price');
            } else {
              var price = item.querySelector('input[name=id]').getAttribute('data-price');
            }
          }

          if (price) {
            totalPrice = totalPrice + parseFloat(price);

            if (this.querySelector('.bundle-price')) {
              const bundlePrice = this.querySelector('.bundle-price');
              const oldPrice = this.querySelector('.bundle-old-price');
              const discountRate = bundlePrice.getAttribute('data-bundle-discount-rate');

              if (bundlePrice && oldPrice) {
                oldPrice.innerHTML = Shopify.formatMoney(totalPrice, window.money_format);
                bundlePrice.innerHTML = Shopify.formatMoney(totalPrice * (1 - discountRate), window.money_format);

                if (bundleItem.length == maxProduct) {
                  bundlePrice.style.display = 'inline-block';
                  oldPrice.style.display = 'inline-block';
                  this.querySelector('[data-bundle-product-total]').style.display = 'none';
                } else {
                  bundlePrice.style.display = 'none';
                  oldPrice.style.display = 'none';
                  this.querySelector('[data-bundle-product-total]').style.display = 'block';
                }
              }
            }

            if (bundleItem.length == maxProduct) {
              this.querySelector('[data-bundle-addtocart]').value = window.total_btn.add_all_item;
            } else {
              if (bundleItem.length > 2) {
                this.querySelector('[data-bundle-addtocart]').value = window.total_btn.add_items.replace('[item]', bundleItem.length);
              } else {
                this.querySelector('[data-bundle-addtocart]').value = window.total_btn.add_item.replace('[item]', bundleItem.length);
              }
            }

            this.querySelector('[data-bundle-product-total]').innerHTML = Shopify.formatMoney(totalPrice, window.money_format);
          }
        });
      } else {
        this.querySelector('[data-bundle-addtocart]').value = window.total_btn.add_item.replace('[item]', bundleItem.length);
        this.querySelector('[data-bundle-product-total]').innerHTML = Shopify.formatMoney(totalPrice, window.money_format);
      }
    }
  }

  updateVariants(event) {
    const item = event.target.closest('.bundle-product-item');
    const productId = item.getAttribute('data-bundle-product-item-id');
    const variants = window.productVariants[productId];
    const fieldsets = event.target.closest('.bundle-product-item').querySelectorAll('.variant-option');

    let selectedOption1;
    let selectedOption2;
    let selectedOption3;

    if (variants) {
      if (fieldsets[0]) selectedOption1 = Array.from(fieldsets[0].querySelectorAll('input')).find((radio) => radio.checked).value;
      if (fieldsets[1]) selectedOption2 = Array.from(fieldsets[1].querySelectorAll('input')).find((radio) => radio.checked).value;
      if (fieldsets[2]) selectedOption3 = Array.from(fieldsets[2].querySelectorAll('input')).find((radio) => radio.checked).value;

      var checkStatus = (optionSoldout, optionUnavailable, swatch) => {
        if (optionSoldout == undefined) {
          if (optionUnavailable == undefined) {
            swatch.classList.add('soldout');
            swatch.setAttribute('disabled', true);
          } else {
            swatch.classList.add('soldout');
            swatch.setAttribute('disabled', true);
          }
        } else {
          swatch.classList.remove('soldout');
          swatch.removeAttribute('disabled');
        }
      };

      var renderSwatch = (optionIndex, element) => {
        const swatchs = element.querySelectorAll('input[type=radio]');

        swatchs.forEach((swatch) => {
          const swatchVal = swatch.getAttribute('value');

          const optionSoldout = variants.find((variant) => {
            switch (optionIndex) {
              case 0: return variant.option1 == swatchVal && variant.available;
              case 1: return variant.option1 == selectedOption1 && variant.option2 == swatchVal && variant.available;
              case 2: return variant.option1 == selectedOption1 && variant.option2 == selectedOption2 && variant.option3 == swatchVal && variant.available;
            }
          });

          const optionUnavailable = variants.find((variant) => {
            switch (optionIndex) {
              case 0: return variant.option1 == swatchVal;
              case 1: return variant.option1 == selectedOption1 && variant.option2 == swatchVal;
              case 2: return variant.option1 == selectedOption1 && variant.option2 == selectedOption2 && variant.option3 == swatchVal;
            }
          });

          checkStatus(optionSoldout, optionUnavailable, swatch);
        });
      };

      fieldsets.forEach((element) => {
        const optionIndex = parseInt(element.getAttribute('data-option-idx'));

        renderSwatch(optionIndex, element);
      });
    }
  }

  changeSwatch(event) {
    const item = event.target.closest('.bundle-product-item');
    const fieldsets = Array.from(item.querySelectorAll('.variant-option'));
    const productId = item.getAttribute('data-bundle-product-item-id');
    const variantList = window.productVariants[productId];
    const optionIndex = parseInt(event.target.closest('[data-option-idx]').getAttribute('data-option-idx'));
    const swatches = Array.from(item.querySelectorAll('.swatch-element'));
    const thisValue = event.target.value;
    const productPrice = item.querySelector('.card--bundle .price');
    const priceSale = productPrice.querySelector('.price-sale');
    const priceOld = productPrice.querySelector('.old-price');
    const priceRegular = productPrice.querySelector('.price-item');
    const productInput = item.querySelector('[name=group_id]');
    const hotStock = item.querySelector('.bundle-hotStock');

    let selectedVariant;
    let selectedSwatchOption1;
    let selectedSwatchOption2;
    let selectedSwatchOption3;

    if (fieldsets[0]) selectedSwatchOption1 = Array.from(fieldsets[0].querySelectorAll('input')).find((radio) => radio.checked).value;
    if (fieldsets[1]) selectedSwatchOption2 = Array.from(fieldsets[1].querySelectorAll('input')).find((radio) => radio.checked).value;
    if (fieldsets[2]) selectedSwatchOption3 = Array.from(fieldsets[2].querySelectorAll('input')).find((radio) => radio.checked).value;

    swatches.forEach((swatche) => {
      swatche.classList.remove('soldout');
      swatche.querySelector('input').setAttribute('disabled', false);
    });

    switch (optionIndex) {
      case 0:
        var availableVariants = variantList.find((variant) => {
          return variant.option1 == thisValue && variant.option2 == selectedSwatchOption2 && variant.available;
        });

        if (availableVariants != undefined) {
          selectedVariant = availableVariants;
        } else {
          var altAvailableVariants = variantList.find((variant) => {
            return variant.option1 == thisValue && variant.available;
          });

          selectedVariant = altAvailableVariants;
        }

        break;
      case 1:
        var availableVariants = variantList.find((variant) => {
          return variant.option1 == selectedSwatchOption1 && variant.option2 == thisValue && variant.available;
        });

        if (availableVariants != undefined) {
          selectedVariant = availableVariants;
        } else {
          console.log('Bundle Error: variant was soldout, on option selection #2');
        }

        break;
      case 2:
        var availableVariants = variantList.find((variant) => {
          return variant.option1 == selectedSwatchOption1 && variant.option2 == selectedSwatchOption2 && variant.option3 == thisValue && variant.available;
        });

        if (availableVariants != undefined) {
          selectedVariant = availableVariants;
        } else {
          console.log('Bundle Error: variant was soldout, on option selection #3');
        }

        break;
    }

    productInput.value = selectedVariant.id;
    priceRegular.innerHTML = Shopify.formatMoney(selectedVariant.price, window.money_format);
    if (selectedVariant.compare_at_price > selectedVariant.price) {
      priceRegular.classList.add('special-price');

      if (priceOld) {
        priceOld.innerHtml = Shopify.formatMoney(selectedVariant.compare_at_price, window.money_format);
        priceOld.style.display = 'inline-block';
      }
    } else {
      if (priceOld) {
        priceOld.style.display = 'none';
      }

      priceRegular.classList.remove('special-price');
    }

    item.querySelector('select').value = selectedVariant.id;

    this.updateBundleTotalPrice();

    if (selectedVariant.inventory_management != null) {
      if (hotStock) {
        var arrayInVarName = 'bundle_inven_array_' + productId,
          inven_array = window[arrayInVarName],
          maxStock = parseInt(hotStock.getAttribute('data-bundle-hot-stock'));

        if (inven_array != undefined) {
          var inven_num = inven_array[selectedVariant.id],
            inventoryQuantity = parseInt(inven_num);
        }

        if (inventoryQuantity > 0 && inventoryQuantity <= maxStock) {
          var textStock = window.inventory_text.hotStock.replace('[inventory]', inventoryQuantity);

          hotStock.innerText = textStock;
          hotStock.style.display = 'block';
        } else {
          hotStock.style.display = 'none';
        }
      }
    }

    if (selectedVariant.featured_image) {
      const productImage = this.querySelector(`[data-bundle-product-item-id="${productId}"] img`);

      productImage.setAttribute('src', selectedVariant.featured_image.src);
      productImage.setAttribute('srcset', selectedVariant.featured_image.src);
    }
  }

  onBodyClickEvent(event) {
    if (this.querySelector('.bundle-product-item.is-open')) {
      this.listItem.forEach((item) => {
        if (!item.contains(event.target)) {
          item.classList.remove('is-open');
        }
      });
    }
  }

  isRunningInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  redirectTo(url) {
    if (this.isRunningInIframe() && !window.iframeSdk && !Shopify.designMode) {
      window.top.location = url;
    } else {
      window.location = url;
    }
  }
}

customElements.define('product-bundle', ProductBundle);