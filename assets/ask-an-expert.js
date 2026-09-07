document.addEventListener('DOMContentLoaded', function() {
  var form = document.querySelector('[data-contact-form-type="ask-an-expert"] .form-success');
  var forms = document.querySelectorAll('[data-contact-form-type="ask-an-expert"]');

  forms.forEach(function(wrapper) {
    var submit = wrapper.querySelector('button[type="submit"]');
    if (!submit) return;
    var hasEmail = !!wrapper.querySelector('[data-field-name="email"]');
    submit.disabled = !hasEmail;
    submit.setAttribute('aria-disabled', (!hasEmail).toString());
    wrapper.classList.toggle('ask-an-expert--disabled', !hasEmail);
  });

  if (!form) return;

  var openPopup = function() {
    var popup = form.closest('[id^="PopupModal-"]') || form.closest('side-drawer');
    if (!popup) return;
    if (typeof popup.open === 'function') {
      popup.open();
    } else {
      popup.setAttribute('open', 'true');
    }
    popup.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (
          node.nodeType === 1 &&
          node.classList.contains('form-success')
        ) {
          openPopup();
        }
      });
    });
  });

  observer.observe(form, { childList: true, subtree: true });

  openPopup();
});
