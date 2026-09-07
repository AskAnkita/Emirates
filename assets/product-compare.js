class CompareProductPopup extends HTMLElement {
  constructor() {
    super();
    this.compareItems = JSON.parse(localStorage.getItem("compareItem") || "[]");
    this.init();
  }

  init() {
    document.addEventListener("click", this.handleClick.bind(this));
    this.initCompareProduct();
    this.setupEventListeners();
    this.setLocalStorageProductForCompare();
  }

  getCompareDrawer() {
    return document.querySelector("#halo-compare-product-popup");
  }

  handleClick(event) {
    const target = event.target;
    if (target.matches("[data-compare-link]") || target.closest("[data-compare-link]")) {
      const opener = target.closest("[data-compare-link]");
      this.handleCompareLink(opener);
    } else if (target.matches("[data-compare-remove]")) {
      this.handleCompareRemove(target);
    }
  }

  initCompareProduct() {
    const closeBtn = document.querySelector(
      "[data-close-compare-product-popup]"
    );

    if (window.compare.show) {
      this.setLocalStorageProductForCompare();
      const drawer = this.getCompareDrawer();
      const hideComparePopup = () => drawer?.close?.();

      closeBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideComparePopup();
      });
    }
  }

  setupEventListeners() {
    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-product-compare] input")) this.handleCompareChange(event);
    });
  }

  setLocalStorageProductForCompare() {
    const items = document.querySelectorAll("[data-product-compare-handle]");

    if (!this.compareItems) return;

    items.forEach((element) => {
      const handle = element.dataset.productCompareHandle;
      const compareIcon = element.querySelector(".compare-button");
      const text = element.querySelector(".text .text-inner");
      const input = element.querySelector("input");

      if (this.compareItems.includes(handle)) {
        compareIcon?.classList.add("is-checked");
        if (text) text.textContent = window.compare.added;
        if (input) input.checked = true;
      } else {
        compareIcon?.classList.remove("is-checked");
        if (text) text.textContent = window.compare.add;
        if (input) input.checked = false;
      }
    });

    this.updateCounterCompare();
  }

  handleCompareChange(event) {
    const target = event.target;
    const item = target.closest(".card-compare");
    const handle = target.value;

    if (target.checked) {
      item.querySelector(".compare-icon")?.classList.add("is-checked");
      item.querySelector(".text").textContent = window.compare.added;
      target.checked = true;
      target.closest(".compare-button").classList.add("is-checked");
      this.incrementCounterCompare(handle);
    } else {
      item.querySelector(".compare-icon")?.classList.remove("is-checked");
      item.querySelector(".text").textContent = window.compare.add;
      target.checked = false;
      target.closest(".compare-button").classList.remove("is-checked");
      this.decrementCounterCompare(handle);
    }
  }

  handleCompareLink(opener) {
    if (this.compareItems.length <= 1) {
      alert(window.compare.message);
      return false;
    }
    opener?.classList?.add('loading');
    opener?.querySelector('.loading__spinner')?.classList?.remove('hidden');
    this.updateContentCompareProduct(this.compareItems, 0, opener);
  }

  handleCompareRemove(target) {
    const id = target.dataset.compareItem;
    const compareTable = document.querySelector(
      "[data-compare-product-popup] .compareTable"
    );
    const item = compareTable.querySelector(
      `.compare-table-row[data-product-compare-id="${id}"]`
    );
    const handle = item?.dataset.compareProductHandle;
    const drawer = this.getCompareDrawer();

    if (compareTable.querySelectorAll("tbody .compare-table-row").length === 1) {
      item?.remove();
      this.decrementCounterCompare(handle);
      drawer?.close?.();
    } else {
      item?.remove();
      this.decrementCounterCompare(handle);
    }

    document.querySelectorAll(`[data-compare-handle="${handle}"]`).forEach(itemHandle => {
      itemHandle.classList.remove("is-checked");
      itemHandle.querySelector(".text").textContent = window.compare.add;
      itemHandle.querySelector("input[name='compare']").checked = false;
    });
  }

  updateCounterCompare() {
    const compareLink = document.querySelector("[data-compare-link]");
    if (!compareLink) return;

    if (this.compareItems.length > 1) {
      compareLink.parentElement.classList.add("is-show");
      compareLink.querySelector("span.countPill").textContent =
        this.compareItems.length;
    } else {
      compareLink.parentElement.classList.remove("is-show");
    }
  }

  incrementCounterCompare(item) {
    if (!this.compareItems.includes(item)) {
      this.compareItems.push(item);
      localStorage.setItem("compareItem", JSON.stringify(this.compareItems));
      this.updateCounterCompare();
    }
  }

  decrementCounterCompare(item) {
    const index = this.compareItems.indexOf(item);
    if (index > -1) {
      this.compareItems.splice(index, 1);
      localStorage.setItem("compareItem", JSON.stringify(this.compareItems));
      this.updateCounterCompare();
    }
  }

  async updateContentCompareProduct(list, count, opener) {
    const compareTable = document.querySelector(
      "[data-compare-product-popup] .compareTable"
    );
    const rootUrl = window.routes?.root || window.routes?.shop_origin || window.shopUrl || '';
    const url = `${rootUrl}/products/${list[count]}?view=ajax_product_card_compare`;
    const drawer = this.getCompareDrawer();

    if (count === 0) {
      compareTable.querySelector("tbody").innerHTML = "";
    }

    if (list.length > count) {
      try {
        const response = await fetch(url);
        const data = await response.text();
        compareTable
          .querySelector("tbody")
          .insertAdjacentHTML("beforeend", data);
        count++;
        this.updateContentCompareProduct(list, count, opener);
      } catch (error) {
        console.error("Error fetching compare product:", error);
        opener?.classList?.remove('loading');
        opener?.querySelector('.loading__spinner')?.classList?.add('hidden');
      }
    } else {
      drawer?.open?.(opener);
      opener?.classList?.remove('loading');
      opener?.querySelector('.loading__spinner')?.classList?.add('hidden');
    }

    document.querySelectorAll("[data-compare-remove]").forEach((element) => {
      element.addEventListener("click", () => {
          this.handleCompareRemove(element);
      });
    });

  }
}
if (!customElements.get('compare-product-popup')) customElements.define('compare-product-popup', CompareProductPopup);