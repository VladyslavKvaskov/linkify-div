class LinkifyDiv extends HTMLDivElement{
  #linkify = (text) => {
    return text.replace(/([\w+]+\:\/\/)?([\w\d-]+\.)*[\w-]+[\.\:]\w+([\/.\?\=\&\#]?[\w-]+)*\/?/gmi, (a) => {
      return `<a href="${!a.startsWith('http://') && !a.startsWith('https://') ? `http://${a}` : a}" target="_blank" class="url-from-txt">${a}</a>`;
    });
  }
  #tmpDiv = document.createElement('div');
  #tmp;

  constructor(){
    super();
    super.innerHTML = this.#linkify(this.innerText);
  }

  get innerHTML() {
    return super.innerHTML;
  }
  
  set innerHTML(html) {
    this.#tmpDiv.innerHTML = html;
    for(this.#tmp of this.#tmpDiv.querySelectorAll('a')){
      this.#tmp.insertAdjacentText('beforebegin', this.#tmp.textContent);
      this.#tmp.remove();
    }
    super.innerHTML = this.#linkify(this.#tmpDiv.innerHTML);
  }

  get innerText() {
    return super.innerText;
  }

  set innerText(text) {
    super.innerHTML = this.#linkify(text.replace(/<[^>]*>?/gm, ''));
  }
}

customElements.define('linkify-div', LinkifyDiv, {
  extends: 'div'
});
