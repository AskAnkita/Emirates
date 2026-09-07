(function(){
  // Add CSS for cursor blinking animation
  if (!document.querySelector('#typing-cursor-styles')) {
    const style = document.createElement('style');
    style.id = 'typing-cursor-styles';
    style.textContent = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
      .typing-cursor {
        color: inherit;
        font-weight: bold;
      }
      .typing-complete {
        /* Add any completion styles here */
      }
    `;
    document.head.appendChild(style);
  }

  // Intersection Observer for triggering typing effect
  const observerOptions = {
    threshold: 0.3, // Trigger when 30% of the element is visible
    rootMargin: '0px 0px -50px 0px' // Trigger slightly before element comes into view
  };

  const typingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const item = entry.target;
        if (item.hasAttribute('data-typing-content') && !item.classList.contains('typing-active')) {
          startTypingEffect(item);
        }
      }
    });
  }, observerOptions);

  // Function to start typing effect
  function startTypingEffect(item) {
    item.classList.add('typing-active');
    const content = item.querySelector('.instagram-item__content');
    const textBlocks = content.querySelectorAll('.text-block');

    // Collect all text elements in order for sequential typing
    const allTextElements = [];
    textBlocks.forEach((textBlock, blockIndex) => {
      const allTexts = textBlock.querySelectorAll('p');
      allTexts.forEach((textElement, textIndex) => {
        allTextElements.push({
          element: textElement,
          blockIndex: blockIndex,
          textIndex: textIndex
        });
      });
    });

    // Store original text content for infinite loop
    const originalTexts = allTextElements.map(textData => textData.element.textContent);

    // Hide all text elements before starting typing
    allTextElements.forEach((textData) => {
      textData.element.style.opacity = '0';
      textData.element.style.visibility = 'hidden';
    });

    // Type text sequentially from first to last
    let currentTextIndex = 0;

    function typeNextText() {
      if (currentTextIndex >= allTextElements.length) {
        // All text has been typed, start reverse typing effect
        setTimeout(() => {
          reverseTypeAllTexts();
        }, 2000); // 2 second pause before starting reverse effect
        return;
      }

      const textData = allTextElements[currentTextIndex];
      const textElement = textData.element;
      const originalText = originalTexts[currentTextIndex];

      // Show the text element and clear the text, then add cursor
      textElement.style.opacity = '1';
      textElement.style.visibility = 'visible';
      textElement.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      cursor.textContent = '_';
      cursor.style.animation = 'blink 1s infinite';
      textElement.appendChild(cursor);

      // Type the text character by character
      let charIndex = 0;
      const typeInterval = setInterval(() => {
        if (charIndex < originalText.length) {
          const charSpan = document.createElement('span');
          charSpan.textContent = originalText[charIndex];
          textElement.insertBefore(charSpan, cursor);
          charIndex++;
        } else {
          clearInterval(typeInterval);
          // Remove cursor after typing is complete
          setTimeout(() => {
            cursor.remove();
            // Move to next text after a short delay
            setTimeout(() => {
              currentTextIndex++;
              typeNextText();
            }, 500);
          }, 300);
        }
      }, 80); // Faster typing speed
    }

    function reverseTypeAllTexts() {
      // Start reverse typing from the last text element
      let currentReverseIndex = allTextElements.length - 1;

      function reverseTypeNextText() {
        if (currentReverseIndex < 0) {
          // All text has been reversed, start over
          setTimeout(() => {
            currentTextIndex = 0;
            typeNextText();
          }, 1000); // 1 second pause before restarting
          return;
        }

        const textData = allTextElements[currentReverseIndex];
        const textElement = textData.element;
        const currentText = textElement.textContent;

        if (currentText.length === 0) {
          // Text is already empty, move to previous
          currentReverseIndex--;
          reverseTypeNextText();
          return;
        }

        // Remove last character
        textElement.textContent = currentText.slice(0, -1);

        // If text is now empty, hide the element
        if (textElement.textContent.length === 0) {
          textElement.style.opacity = '0';
          textElement.style.visibility = 'hidden';
        }

        // Continue removing characters
        setTimeout(() => {
          reverseTypeNextText();
        }, 50); // Faster reverse typing speed
      }

      // Start reverse typing
      reverseTypeNextText();
    }

    function clearAllTexts() {
      // Clear all text elements completely
      allTextElements.forEach((textData) => {
        textData.element.textContent = '';
      });
    }

    function resetTexts() {
      // Reset all text elements to their original state and hide them
      allTextElements.forEach((textData, index) => {
        textData.element.textContent = originalTexts[index];
        textData.element.style.opacity = '0';
        textData.element.style.visibility = 'hidden';
      });
    }

    // Start the infinite typing loop
    if (allTextElements.length > 0) {
      typeNextText();
    }
  }

  // Observe all Instagram items with typing content enabled
  const instagramItems = document.querySelectorAll('.instagram-item[data-typing-content="true"]');
  instagramItems.forEach(item => {
    typingObserver.observe(item);
  });

  // Cleanup function (optional)
  function cleanup() {
    typingObserver.disconnect();
  }
})();