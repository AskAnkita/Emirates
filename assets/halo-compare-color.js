if (typeof window.compareColor === 'undefined') {

    window.compareColor = function () {
        class CompareColor extends HTMLElement {
            constructor() {
                super();

                this.init();
            }

            init() {
                this.imageList = this.querySelector('.halo-compare-colors-image');
                this.textList = this.querySelector('[class*="compare-colors-text"]');
                this.sortTable = document.getElementById('sortTableList');

                this.debouncedOnChange = this.debounce((event) => {
                    this.onChangeHandler(event);
                    if (!this.classList.contains('node-loaded')) {
                        this.loadNode();
                    }
                }, 0);

                const list = this.querySelectorAll('ul li');

                list.forEach((item) => {
                    item.addEventListener('click', this.debouncedOnChange.bind(this));
                });
            }

            debounce(fn, delay) {
                let timer;
                return function (...args) {
                    clearTimeout(timer);
                    timer = setTimeout(() => fn.apply(this, args), delay);
                };
            }

            loadNode() {
                this.classList.add('node-loaded');

                if (document.body.classList.contains('template-product')) {
                    const urlScriptCC = this.dataset.urlScriptCompareColor;

                    if (urlScriptCC && !document.body.classList.contains('sortable-loader')) {
                        document.body.classList.add('sortable-loader');
                        const loadScript = document.createElement("script");
                        loadScript.src = urlScriptCC;
                        document.body.appendChild(loadScript);
                    }

                    setTimeout(() => {
                        if (window.innerWidth >= 1025 && this.sortTable) {
                            new Sortable(this.sortTable, {
                                animation: 150
                            });
                        } else {
                            this.onRemoveHandler();
                        }
                    }, 200);
                }
            }

            onChangeHandler(event) {
                event.preventDefault();

                const itemSwatch = event.target;
                const label = itemSwatch.closest('.swatch');
                const id = label.getAttribute('data-value');

                if (!itemSwatch.classList.contains('active')) {
                    const title = label.getAttribute('data-title');
                    const image = label.getAttribute('data-variant-img');
                    const item = document.createElement('div');
                    item.className = `item item-${id} item-compare-color`;
                    item.innerHTML = `
                        <span class="image"><img src="${image}" alt="${title}"></span>
                        <span class="title center">${title}</span>
                    `;
                    this.imageList.appendChild(item);
                    itemSwatch.classList.add('active');
                } else {
                    const item = this.imageList.querySelector(`.item-${id}`);
                    if (item) item.remove();
                    itemSwatch.classList.remove('active');
                }

                if (this.imageList.children.length > 0) {
                    this.textList.style.display = 'none';
                } else {
                    this.textList.style.display = 'block';
                }
            }

            onRemoveHandler() {
                this.imageList.addEventListener('click', (event) => {
                    const item = event.target.closest('.item');
                    if (item) {
                        event.preventDefault();
                        const classList = Array.from(item.classList);
                        const itemIdClass = classList.find(cls => cls.startsWith('item-') && !cls.includes('compare-color'));
                        const itemId = itemIdClass?.replace('item-', '');
                        const optionId = `swatch-compare-color-${itemId}`;
                        const input = document.getElementById(optionId);

                        if (input) {
                            input.click();
                        }
                    }
                });
            }

            onBodyClickEvent(event) {
                if (document.body.classList.contains('compare-color-show')) {
                    if (!this.contains(event.target) && !event.target.closest('[data-open-compare-color-popup], .halo-popup-content')) {
                        this.setClosePopup(event);
                    }
                }
            }
        }

        customElements.define('compare-color', CompareColor);
    };

    window.compareColor();
}
