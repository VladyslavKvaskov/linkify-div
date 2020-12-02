class LinkifyElement extends HTMLElement {
  #urlRegex = /(https?:\/\/[^\s]+)/g;
  #linkify = (text) => {
    return text.replace(/([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/.\?\=\&\#]?[\w-]+)*\/?/gmi, (a) => {
      a = a.trim();
      return `<a href="${!a.startsWith('http://') && !a.startsWith('https://') ? `http://${a}` : a}" target="_blank" class="url-from-txt">${a}</a>`;
    });
  }

  #validJSON = false;
  #linksPreviewer = document.createElement('expandable-element');
  #prevAnchors = [];
  #previewsLimit = -1;
  #previewsCounter;
  #tmpHTML = '';
  #i;
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

      console.log(location.hostname);
      fetch(location.hostname === 'linkify-element' ? '../links-info.php' : 'https://resume.vkvaskov.com/links-info.php', {
          method: 'POST',
          body: this.fData
        }).then(r => r.text())
        .then(data => {
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
                  if ((this.d.favicon || this.d.title || this.d.description) && (this.#previewsCounter < this.#previewsLimit || this.#previewsLimit == -1)) {
                    this.#tmpHTML += `
                      <div class="link-info">
                        ${this.d.favicon || data.host ? `<div class="link-t">${this.d.favicon ? `<span class="fav"><span class="link-favicon" style="background-image:url('${this.d.favicon}')"></span></span>`:''} ${this.d.host ? `<span class="link-host">${this.d.host}</span>` : ''}</div>` : ''}
                        ${this.d.title ? `<div class="link-title"><a href="${this.anchor.href}" target="_blank">${this.d.title}</a></div>` : ''}
                        ${this.d.description ? `<div class="link-description">${this.d.description}</div>` : ''}
                      </div>
                    `;
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
  }

  constructor() {
    super();
    this.#linksPreviewer.classList.add('link-previewer');
    this.after(this.#linksPreviewer);
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
}

customElements.define('linkify-element', LinkifyElement);



class ExpandableElement extends HTMLElement {
  #viewMoreButton = document.createElement('button');
  constructor() {
    super();
    this.#viewMoreButton.classList.add('view-more');
    this.#viewMoreButton.type = 'button';

    this.#viewMoreButton.onclick = () => {
      if (this.previews.length > 0) {
        this.#viewMoreButton.classList.toggle('expanded');
        if (this.#viewMoreButton.classList.contains('expanded')) {
          this.height = 0;
          for (this.d of this.querySelectorAll('div.link-info')) {
            this.height += this.d.offsetHeight + 20;
          }

          this.#viewMoreButton.innerHTML = 'view less';
          this.style.height = this.height + 'px';
        } else {
          this.style.height = this.previews[0].offsetHeight + 20 + 'px';
          this.#viewMoreButton.innerHTML = 'view more';
        }
      }
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
        this.style.height = this.previews[0].offsetHeight + 20 + 'px';
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