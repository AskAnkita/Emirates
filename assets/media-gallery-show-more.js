(function() {
  'use strict';

  // Cache DOM elements and use more descriptive names
  const showIcon = document.querySelector('.show-icon');
  const instagramGrid = document.querySelector('.instagram-grid');

  // Early return if required elements don't exist
  if (!showIcon || !instagramGrid) return;

  const instagramGridItems = instagramGrid.querySelectorAll('.grid__item');
  const totalItems = instagramGridItems.length;

  // Use object for responsive breakpoints
  const breakpoints = {
    desktop: 1024,
    tablet: 768
  };

  // Get max items based on screen size
  const getMaxItems = () => {
    if (window.innerWidth > breakpoints.desktop) {
      return parseInt(showIcon.dataset.rowDesktop) || 5;
    } else if (window.innerWidth > breakpoints.tablet) {
      return parseInt(showIcon.dataset.rowTablet) || 3;
    } else {
      return parseInt(showIcon.dataset.rowMobile) || 2;
    }
  };

  // Show/hide items based on max count
  const toggleItemsVisibility = (maxItems) => {
    instagramGridItems.forEach((item, index) => {
      item.style.display = index < maxItems ? 'block' : 'none';
    });

    // Show/hide the show icon based on whether there are hidden items
    showIcon.style.display = totalItems > maxItems ? 'block' : 'none';
  };

  // Initialize visibility
  const maxItems = getMaxItems();
  toggleItemsVisibility(maxItems);

  // Add click event listener with proper cleanup
  const handleShowIconClick = (e) => {
    e.preventDefault();

    // Show all items
    instagramGridItems.forEach(item => {
      item.style.display = 'block';
    });

    // Hide the show icon
    showIcon.style.display = 'none';
  };

  showIcon.addEventListener('click', handleShowIconClick);

  // Optional: Add resize listener for responsive behavior
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newMaxItems = getMaxItems();
      toggleItemsVisibility(newMaxItems);
    }, 250); // Debounce resize events
  };

  window.addEventListener('resize', handleResize);
})();