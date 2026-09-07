if (!customElements.get("product-recommendations")){
  class ProductRecommendations extends HTMLElement {
    observer = undefined;

    constructor() {
      super();
    }

    connectedCallback() {
      this.initializeRecommendations(this.dataset.productId);
    }

    initializeRecommendations(productId) {
      this.observer?.unobserve(this);
      this.observer = new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.unobserve(this);
          this.loadRecommendations(productId);
        },
        { rootMargin: "0px 0px 400px 0px" }
      );
      this.observer.observe(this);
    }

    loadRecommendations(productId) {
      fetch(
        `${this.dataset.url}&product_id=${productId}&section_id=${this.dataset.sectionId}`
      )
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector("product-recommendations");

          if (recommendations?.innerHTML.trim().length) {
            this.innerHTML = recommendations.innerHTML;
          }

          if (this.classList.contains("complementary-products")) {
            this.remove();
          }

          if (html.querySelector(".grid__item")) {
            this.classList.add("product-recommendations--loaded");
          }
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }
  
  customElements.define("product-recommendations", ProductRecommendations);
}