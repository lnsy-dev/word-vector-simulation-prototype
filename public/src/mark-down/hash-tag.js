/*

This regex modification uses a negative lookahead ((?![^<>]*>)) 
to ensure that the match does not occur inside angle 
brackets (< and >), effectively excluding matches 
within an <svg> tag. The (^|[^<]) part ensures that 
the match is either at the beginning of the string or not preceded by a <.

 */
export function wrapHashtags(text) {
  // Regular expression to find hashtags (words starting with #) excluding those preceded by a character
  const hashtagRegex = /(^|[^#\w])#([a-zA-Z0-9\-./]+)(?![^<>]*>)/g;
  // Replace hashtags with <hash-tag>...</hash-tag>
  const result = text.replace(hashtagRegex, '$1<hash-tag>$2</hash-tag>');
  return result;
}

class HashTag extends HTMLElement {
  connectedCallback(){
    const hash_id = this.innerText;
    this.innerHTML = `<a href="/${hash_id}">${hash_id}</a>`
  }
}

customElements.define('hash-tag', HashTag);