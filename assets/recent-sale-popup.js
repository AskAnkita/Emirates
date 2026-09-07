class RecentSalePopup extends HTMLElement {
  constructor() {
    super();

    this.productList = this.getAttribute('data-product-list');
    this.timeToShow = parseInt(this.getAttribute('data-time-to-show')) || 10;
    this.timeAppear = parseInt(this.getAttribute('data-time-appear')) || 10;
    this.randomHours = this.getAttribute('data-random-hours');
    this.customerList = this.getAttribute('data-customer-list');
    this.locationList = this.getAttribute('data-location-list');
    this.showOnMobile = this.getAttribute('data-show-on-mobile');

    this.isVisible = false;
    this.currentTimeout = null;
    this.progressInterval = null;

    this.init();
  }

  init() {
    // Parse arrays from pipe-separated strings
    this.products = this.parseProductList();
    this.customers = this.parseArray(this.customerList);
    this.locations = this.parseArray(this.locationList);
    this.timeOptions = this.parseArray(this.randomHours);

    // Bind methods
    this.showNotification = this.showNotification.bind(this);
    this.hideNotification = this.hideNotification.bind(this);
    this.closePopup = this.closePopup.bind(this);

    // Add event listeners
    this.addEventListener('click', this.closePopup);

    // Start the notification cycle
    if (window.innerWidth > 750) {
      this.startNotificationCycle();
    }

    if (window.innerWidth <= 749 && this.showOnMobile) {
      this.startNotificationCycle();
    }
  }

  parseProductList() {
    // First try to get products from the hidden product list in DOM
    const productItems = this.querySelectorAll('.recent-sale-product-item');
    if (productItems.length > 0) {
      return Array.from(productItems).map(item => ({
        title: item.getAttribute('data-product-title') || '',
        url: item.getAttribute('data-product-url') || '#',
        image: item.getAttribute('data-product-image') || '',
        alt: item.getAttribute('data-product-alt') || ''
      }));
    }

    // Fallback to JSON parsing if available
    if (this.productList) {
      try {
        const products = JSON.parse(this.productList);
        return products.map(product => ({
          title: product.title || '',
          url: product.url || '#',
          image: product.featured_image || product.images?.[0] || '',
          alt: product.title || ''
        }));
      } catch (e) {
        console.warn('Could not parse product list:', e);
      }
    }

    return [];
  }

  parseArray(str) {
    if (!str) return [];

    // Try different separators
    let separator = '|';
    if (str.includes(',')) separator = ',';
    if (str.includes(';')) separator = ';';

    // Split and clean up each item
    const items = str.split(separator)
      .map(item => item.trim())
      .filter(item => item && item.length > 0);

    return items;
  }

  getRandomItem(array) {
    if (!array || array.length === 0) return '';
    return array[Math.floor(Math.random() * array.length)];
  }

  getRandomTime() {
    const timeOption = this.getRandomItem(this.timeOptions);
    if (!timeOption) return '2 minutes ago';

    // Extract number and unit from time option
    const match = timeOption.match(/(\d+)\s*(minute|hour|second)s?/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
    }

    return timeOption;
  }

  updateNotificationContent() {
    const product = this.getRandomItem(this.products);
    const customer = this.getRandomItem(this.customers);
    const location = this.getRandomItem(this.locations);
    const time = this.getRandomTime();

    // Update product image
    const productImage = this.querySelector('.random-product-image');
    if (productImage) {
      if (product.image) {
        productImage.src = product.image;
        productImage.alt = product.alt || product.title || 'Product';
      }
    }

    // Update product name and link
    const productName = this.querySelector('.random-product-name');
    const productLink = this.querySelector('.recent-sale-popup-content-view a');
    if (productName) productName.textContent = product.title || 'Product';
    if (productLink) productLink.href = product.url || '#';

    // Update customer name
    const customerElement = this.querySelector('.random-customer');
    if (customerElement) {
      // Fallback: if no customers parsed, use default names
      const customerName = customer || this.getDefaultCustomer();
      customerElement.textContent = customerName;
    }

    // Update location
    const locationElement = this.querySelector('.random-location');
    if (locationElement) {
      const locationText = location ? `in ${location}` : 'in Unknown Location';
      locationElement.textContent = locationText;
    }

    // Update time
    const timeElement = this.querySelector('.random-time');
    if (timeElement) timeElement.textContent = time;
  }

  getDefaultCustomer() {
    const defaultCustomers = ['Someone'];
    return defaultCustomers[Math.floor(Math.random() * defaultCustomers.length)];
  }

  showNotification() {
    this.updateNotificationContent();
    this.classList.add('is-show');
    this.isVisible = true;

    // Start progress bar animation
    this.startProgressBar();

    // Hide notification after time_appear
    this.currentTimeout = setTimeout(() => {
      this.hideNotification();
    }, this.timeAppear * 1000);
  }

  hideNotification() {
    this.classList.remove('is-show');
    this.isVisible = false;

    // Stop progress bar
    this.stopProgressBar();

    // Clear current timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Show next notification after time_to_show
    this.currentTimeout = setTimeout(() => {
      this.showNotification();
    }, this.timeToShow * 1000);
  }

  startProgressBar() {
    const progressBar = this.querySelector('.recent-sale-popup-progress-bar');
    if (!progressBar) return;

    // Reset progress bar
    progressBar.style.width = '0%';
    progressBar.style.transition = 'none';

    // Start animation
    setTimeout(() => {
      progressBar.style.transition = `width ${this.timeAppear}s linear`;
      progressBar.style.width = '100%';
    }, 10);
  }

  stopProgressBar() {
    const progressBar = this.querySelector('.recent-sale-popup-progress-bar');
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
    }
  }

  startNotificationCycle() {
    // Show first notification after a short delay
    setTimeout(() => {
      this.showNotification();
    }, this.timeToShow * 1000);
  }

  closePopup(event) {
    // Only close if clicking the close button
    if (event.target.closest('.recent-sale-popup-close')) {
      event.preventDefault();
      this.hideNotification();

      // Stop the cycle
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }
    }
  }

  disconnectedCallback() {
    // Clean up timeouts when element is removed
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }
}
if (!customElements.get('recent-sale-popup')) customElements.define('recent-sale-popup', RecentSalePopup);