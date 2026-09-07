function hideProductModal() {
  const productModal = document.querySelectorAll('product-modal[open]');
  productModal && productModal.forEach((modal) => modal.hide());
}

function headerHeight() {
  const header = document.querySelector('.header');
  // const slideshowContent = document.querySelectorAll('.slideshow__text-wrapper');

  if (header && document.querySelector('.header__inline-menu')) {
    const headerHeight = header.offsetHeight - 1 + 'px';
    // const headerHeightSlideshow = header.offsetHeight + 27 + 'px';
    var listMenuWrapper = document.querySelectorAll('.list-menu--wrapper');
    var sectionHeader = document.querySelector('.list-menu-desktop').offsetHeight;
    var listMenu = document.querySelector('.list-menu-desktop');

    if (sectionHeader > 52) {
      listMenuWrapper.forEach((summary) => {
        summary.style.setProperty('--top-position', 'auto');
        summary.style.setProperty('--margin-top', '3.1rem');
      })
      listMenu.style.setProperty('--list-menu-height', '4rem');
    } else {
      listMenuWrapper.forEach((summary) => {
        summary.style.setProperty('--top-position', headerHeight);
        summary.style.setProperty('--margin-top', '0');
      })
      listMenu.style.setProperty('--list-menu-height', headerHeight);
    }

    // if (slideshowContent) {
    //   slideshowContent.forEach((slide) => {
    //     slide.style.paddingTop = headerHeightSlideshow;
    //   })
    // }
  }
}

document.addEventListener('shopify:section:load', () => {
  hideProductModal();
  headerHeight();
  const zoomOnHoverScript = document.querySelector('[id^=EnableZoomOnHover]');
  if (!zoomOnHoverScript) return;
  if (zoomOnHoverScript) {
    const newScriptTag = document.createElement('script');
    newScriptTag.src = zoomOnHoverScript.src;
    zoomOnHoverScript.parentNode.replaceChild(newScriptTag, zoomOnHoverScript);
  }
});

document.addEventListener('shopify:section:unload', (event) => {
  document.querySelectorAll(`[data-section="${event.detail.sectionId}"]`).forEach((element) => {
    element.remove();
    document.body.classList.remove('overflow-hidden');
    document.documentElement.removeAttribute('scroll-lock');
  });
});

document.addEventListener('shopify:section:unload', (event) => {
  document.querySelectorAll(`[data-section="${event.detail.sectionId}"]`).forEach((element) => {
    element.remove();
  });
});

document.addEventListener('shopify:section:reorder', () => hideProductModal());

document.addEventListener('shopify:section:select', () => hideProductModal());

document.addEventListener('shopify:section:deselect', () => hideProductModal());

document.addEventListener('shopify:inspector:activate', () => hideProductModal());

document.addEventListener('shopify:inspector:deactivate', () => hideProductModal());

document.addEventListener('shopify:section:select', () => headerHeight());
