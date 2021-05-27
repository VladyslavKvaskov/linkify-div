class LinkifyElement extends HTMLElement {
    #styleElement = document.createElement('style');
    #styles = `
    div.linkify-element-wrapper * {
      box-sizing: border-box;
      line-height: 150%;
    }

    div.linkify-element-wrapper{
      margin: 10px 0;
    }

    div.linkify-element-wrapper linkify-element{
      display: block;
      background: #eee;
      padding: 10px;
    }

    div.linkify-element-wrapper linkify-element a{
      word-break: break-all;
    }

    div.linkify-element-wrapper div.expandable-element-wrapper{
      padding: 0 10px;
      background: #fff;
    }

    div.linkify-element-wrapper .link-info{
      padding: 5px;
      border-left: 4px solid #999;
      margin-bottom: 15px;
    }

    div.linkify-element-wrapper .link-info:first-child{
      margin-top: 10px;
    }

    div.linkify-element-wrapper .link-info:last-child{
      margin-bottom: 10px;
    }

    div.linkify-element-wrapper expandable-element {
      display: block;
      overflow: hidden;
      transition: 0.3s;
    }

    div.linkify-element-wrapper button.view-more {
      background: #fff;
      color: #000;
      font-size: 13px;
      border-radius: 7px;
      margin-bottom: 20px;
      -webkit-appearance: button;
      appearance: button;
      border: none;
      outline: none;
      cursor: pointer;
    }

    div.linkify-element-wrapper expandable-element .link-t{
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;
    }

    div.linkify-element-wrapper .link-favicon{
      display: inline-block;
      width: 16px;
      height: 16px;
      background-position: 50% 50%;
      background-repeat: no-repeat;
      background-size: cover;
      background-color: #fff;
      border-radius: 50%;
    }

    div.linkify-element-wrapper .link-host{
      width: calc(100% - 16px);
      padding-left: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    div.linkify-element-wrapper linkify-element a.not-found{
      color: #dc3545;
    }

    div.linkify-element-wrapper linkify-element a.has-preview{
      color: #007bff;
    }
  `;

    #urlRegex = /(https?:\/\/[^\s]+)/g;
    #linkify = (text) => {
        return text.replace(/([\w]*\:?\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/.\?\=\&\#]?[\w-]+)*\/?/gim, (a) => {
            a = a.trim();
            a = a.startsWith('//') ? 'http:' + a : a;
            return `<a href="${!a.startsWith('http://') && !a.startsWith('https://') ? `http://${a}` : a}" target="_blank" class="url-from-txt">${a}</a>`;
        });
    };

    #validJSON = false;
    #linksPreviewer = document.createElement('expandable-element');
    #prevAnchors = [];
    #previewsLimit = -1;
    #previewsCounter;
    #tmpHTML = '';
    #i;
    #wrapper;
    #controller = new AbortController();
    #signal = this.#controller.signal;

    #fetchURL = () => {
        this.urlsToFetch = super.querySelectorAll('a');
        this.anchorHrefs = [];
        this.anchors = [];
        for (this.d of this.urlsToFetch) {
            this.anchors.push(this.d);
            this.anchorHrefs.push(this.d.href);
        }

        if (this.anchors.length > 0 && this.#prevAnchors.join() != this.anchorHrefs.join()) {
            this.fData = new FormData();
            this.fData.append('links', JSON.stringify(this.anchorHrefs));

            this.#controller.abort();
            this.#controller = new AbortController();
            this.#signal = this.#controller.signal;

            fetch(location.hostname === 'linkify-element' ? '../links-info.php' : 'https://resume.vkvaskov.com/links-info.php', {
                method: 'POST',
                body: this.fData,
                signal: this.#signal,
            })
                .then((r) => r.text())
                .then((data) => {
                    try {
                        data = JSON.parse(data);
                        this.#validJSON = true;
                    } catch (err) {
                        this.#validJSON = false;
                    }

                    if (this.#validJSON) {
                        this.#previewsCounter = 0;
                        this.previewed = false;
                        this.#tmpHTML = '';
                        for (this.#i = 0; this.#i < data.length; this.#i++) {
                            this.d = data[this.#i];
                            this.anchor = this.anchors[this.#i];
                            if (this.anchor && this.anchor.href == this.d.original_url) {
                                if (this.d.not_found) {
                                    this.anchor.classList.add('not-found');
                                } else {
                                    if ((this.d.favicon || this.d.title || this.d.description) && (this.#previewsCounter < this.#previewsLimit || this.#previewsLimit < 0)) {
                                        this.#tmpHTML += `
                      <div class="link-info">
                        ${this.d.favicon || data.host ? `<div class="link-t">${this.d.favicon ? `<span class="link-favicon" style="background-image:url('${this.d.favicon}')"></span>` : ''} ${this.d.host ? `<span class="link-host">${this.d.host}</span>` : ''}</div>` : ''}
                        ${this.d.title ? `<div class="link-title"><a href="${this.anchor.href}" target="_blank">${this.d.title}</a></div>` : ''}
                        ${this.d.description ? `<div class="link-description">${this.d.description}</div>` : ''}
                      </div>
                    `;

                                        this.anchor.classList.add('has-preview');
                                    }

                                    this.#previewsCounter++;
                                }
                            }

                            if (this.#previewsCounter === this.#previewsLimit) {
                                break;
                            }
                        }

                        if (this.#linksPreviewer.innerHTML != this.#tmpHTML) {
                            this.#linksPreviewer.innerHTML = this.#tmpHTML;
                        }
                    }
                });
        } else if (this.anchors.length === 0) {
            this.#linksPreviewer.innerHTML = '';
        }

        this.#prevAnchors = this.anchorHrefs;
    };

    constructor() {
        super();
        if (!document.getElementById('linkify_element_styles')) {
            this.#styleElement.textContent = this.#styles;
            this.#styleElement.setAttribute('id', 'linkify_element_styles');
            document.head.prepend(this.#styleElement);
        }

        this.#wrapper = document.createElement('div');
        this.#wrapper.classList.add('linkify-element-wrapper');

        this.#linksPreviewer.classList.add('link-previewer');

        super.innerHTML = this.#linkify(this.innerText.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        this.#fetchURL();
    }

    get innerHTML() {
        return super.innerHTML;
    }
    set innerHTML(html) {
        super.innerHTML = this.#linkify(html.replace(/<[^>]*>?/gm, ''));
        this.#fetchURL();
    }

    connectedCallback() {
        if (this.parentNode !== this.#wrapper) {
            this.parentNode.insertBefore(this.#wrapper, this);
            this.#wrapper.appendChild(this);
            this.after(this.#linksPreviewer);
        }
    }
}

customElements.define('linkify-element', LinkifyElement);

class ExpandableElement extends HTMLElement {
    #viewMoreButton = document.createElement('button');
    #wrapper;
    #d;
    #elHeight;
    #getAbsoluteHeight = (el) => {
        this.#elHeight = el.offsetHeight;
        this.#elHeight += parseInt(window.getComputedStyle(el).getPropertyValue('margin-top'));
        this.#elHeight += parseInt(window.getComputedStyle(el).getPropertyValue('margin-bottom'));

        return this.#elHeight;
    };
    constructor() {
        super();
        this.#wrapper = document.createElement('div');
        this.#wrapper.classList.add('expandable-element-wrapper');

        this.#viewMoreButton.classList.add('view-more');
        this.#viewMoreButton.type = 'button';

        this.#viewMoreButton.onclick = () => {
            if (this.previews.length > 0) {
                this.#viewMoreButton.classList.toggle('expanded');
                if (this.#viewMoreButton.classList.contains('expanded')) {
                    this.height = 0;
                    for (this.#d of this.querySelectorAll('div.link-info')) {
                        this.height += this.#getAbsoluteHeight(this.#d);
                    }

                    this.#viewMoreButton.innerHTML = 'view less';
                    this.style.height = this.height + 'px';
                } else {
                    this.style.height = this.#getAbsoluteHeight(this.previews[0]) + 'px';
                    this.#viewMoreButton.innerHTML = 'view more';
                }
            }
        };
    }

    connectedCallback() {
        if (this.parentNode !== this.#wrapper) {
            this.parentNode.insertBefore(this.#wrapper, this);
            this.#wrapper.appendChild(this);
        }
    }

    get innerHTML() {
        return super.innerHTML;
    }

    set innerHTML(html) {
        super.innerHTML = html;
        if (this.innerHTML.trim() != '') {
            this.previews = this.querySelectorAll('div.link-info');
            if (this.previews.length > 0) {
                // console.log(this.#getAbsoluteHeight(this.previews[0]));
                this.style.height = this.#getAbsoluteHeight(this.previews[0]) + 'px';
                if (this.previews.length > 1) {
                    this.#viewMoreButton.innerHTML = 'view more';
                    this.#viewMoreButton.classList.remove('expanded');
                    this.after(this.#viewMoreButton);
                } else {
                    this.#viewMoreButton.remove();
                }
            }
        } else {
            this.#viewMoreButton.remove();
        }
    }

    // attributeChangedCallback(attrName, oldVal, newVal) {
    //   console.log(attrName);
    // }
}

customElements.define('expandable-element', ExpandableElement);
