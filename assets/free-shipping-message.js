class FreeShippingComponent extends HTMLElement {
  constructor() {
    super();
  }

  static freeShippingText = window.free_shipping_text.free_shipping_message;
  static freeShippingText1 = window.free_shipping_text.free_shipping_message_1;
  static freeShippingText2 = window.free_shipping_text.free_shipping_message_2;
  static freeShippingText3 = window.free_shipping_text.free_shipping_message_3;
  static freeShippingText4 = window.free_shipping_text.free_shipping_message_4;
  static classLabel1 = 'progress-30';
  static classLabel2 = 'progress-60';
  static classLabel3 = 'progress-100';
  static freeShippingPrice = Currency.convert(parseInt(window.free_shipping_price), window.free_shipping_default_currency, Shopify.currency.active);

  connectedCallback() {
    this.freeShippingEligible = 0;
    this.progressBar = this.querySelector('[data-shipping-progress]');
    this.messageElement = this.querySelector('[data-shipping-message]');
    this.textEnabled = this.progressBar?.dataset.textEnabled === 'true';
    this.shipVal = window.free_shipping_text.free_shipping_1;
    this.progressMeter = this.querySelector('[ data-free-shipping-progress-meter]');

    // this.addEventListener('change', this.onCartChange.bind(this));

    document.addEventListener('cart:updated', () => this.initialize());

    this.initialize();
  }

  initialize() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        this.cart = cart;
        this.calculateProgress(cart);
      })
      .catch(error => {
        console.error('Error fetching cart:', error);
      });
  }

  onCartChange(e) {
    this.initialize();
  }

  calculateProgress(cart) {
    let totalPrice = cart.total_price;

    if (document.body.classList.contains('setup_shipping_delivery')) {
      const giftCardItems = document.querySelectorAll(".cart-item[data-price-gift-card], .previewCartItem[data-price-gift-card]");
      if (giftCardItems.length > 0) {
        giftCardItems.forEach(item => {
          totalPrice -= parseFloat(item.getAttribute("data-price-gift-card"));
        });
      }
    }

    const cartTotalPrice = parseInt(totalPrice) / 100;
    const cartTotalPriceFormatted = cartTotalPrice;
    const cartTotalPriceRounded = parseFloat(cartTotalPriceFormatted);

    let freeShipBar = Math.abs((cartTotalPriceRounded * 100) / FreeShippingComponent.freeShippingPrice);
    if (freeShipBar >= 100) {
      freeShipBar = 100;
    }

    const text = this.getText(cartTotalPriceFormatted, freeShipBar);
    const classLabel = this.getClassLabel(freeShipBar);

    this.setProgressWidthAndText(freeShipBar, text, classLabel);
  }

  getText(cartTotalPrice, freeShipBar) {
    let text;

    if (cartTotalPrice == 0) {
      this.progressBar.classList.add('progress-hidden');
      text = '<span>' + FreeShippingComponent.freeShippingText + ' ' + Shopify.formatMoney(FreeShippingComponent.freeShippingPrice.toFixed(2) * 100, window.money_format) + '!</span>';
    } else if (cartTotalPrice >= FreeShippingComponent.freeShippingPrice) {
      this.progressBar.classList.remove('progress-hidden');
      this.freeShippingEligible = 1;
      text = FreeShippingComponent.freeShippingText1;
    } else {
      this.progressBar.classList.remove('progress-hidden');
      const remainingPrice = Math.abs(FreeShippingComponent.freeShippingPrice - cartTotalPrice);
      text = '<span>' + FreeShippingComponent.freeShippingText2 + ' </span>' + Shopify.formatMoney(remainingPrice.toFixed(2) * 100, window.money_format) + '<span> ' + FreeShippingComponent.freeShippingText3 + ' </span><span class="text">' + FreeShippingComponent.freeShippingText4 + '</span>';
      this.shipVal = window.free_shipping_text.free_shipping_2;
    }

    return text;
  }

  getClassLabel(freeShipBar) {
    let classLabel;

    if (freeShipBar === 0) {
      classLabel = 'none';
    } else if (freeShipBar <= 30) {
      classLabel = FreeShippingComponent.classLabel1;
    } else if (freeShipBar <= 60) {
      classLabel = FreeShippingComponent.classLabel2;
    } else if (freeShipBar < 100) {
      classLabel = FreeShippingComponent.classLabel3;
    } else {
      classLabel = 'progress-free';
    }

    return classLabel;
  }

  resetProgressClass(classLabel) {
    this.progressBar.classList.remove('progress-30');
    this.progressBar.classList.remove('progress-60');
    this.progressBar.classList.remove('progress-100');
    this.progressBar.classList.remove('progress-free');

    this.progressBar.classList.add(classLabel);
  }

  setProgressWidthAndText(freeShipBar, text, classLabel) {
    setTimeout(() => {
      this.resetProgressClass(classLabel);

      this.progressMeter.style.width = `${freeShipBar}%`;

      if (this.textEnabled) {
        const textWrapper = this.progressMeter.querySelector('.text');
        textWrapper.innerHTML = `${freeShipBar.toFixed(2)}%`;
      }

      this.messageElement.innerHTML = text;
    }, 400);
  }

}

window.addEventListener('load', () => {
  customElements.define('free-shipping-component', FreeShippingComponent);
});