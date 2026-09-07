document.querySelectorAll(".coupon-code-block .coupon-code-icon").forEach(function (btn) {
  btn.addEventListener("click", function () {
    const parent = btn.closest(".coupon-code-block");
    const text = parent.getAttribute("data-text") || "";
    if (!text) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }

    if (btn.querySelector(".tooltip") && btn.querySelector(".tooltip").dataset.success_message) {
      btn.querySelector(".tooltip").textContent = btn.querySelector(".tooltip").dataset.success_message;
      setTimeout(() => {
        btn.querySelector(".tooltip").textContent = window.theme?.strings?.copy || 'Copy';
      }, 1500);
    }

    parent.classList.add("copied");
    setTimeout(() => {
      parent.classList.remove("copied");
    }, 1500);
  });
});