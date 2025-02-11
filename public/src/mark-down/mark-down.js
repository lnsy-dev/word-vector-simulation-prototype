import DataroomElement from '../dataroom.js';
import { parseDataroomMarkup } from './dataroom-markup.js';
import { hljs } from "./vendor/highlight/highlight.min.js";


class dataroomCompiler extends DataroomElement {
  async initialize(){
    console.log(this.attrs["src"]);
    if(typeof this.attrs["src"] !== 'undefined'){
      this.content = await fetch(this.attrs["src"])
        .then(res => res.text())
    } else {
      this.content = this.textContent;
      this.innerHTML = ' ';
    }
    await this.render();

  }
  async render(){
    const parsed_markup = await parseDataroomMarkup(this.content.trim());
    Object.keys(parsed_markup.data).forEach(key => {
      this.setAttribute(key, parsed_markup.data[key]);
    });
    this.innerHTML = parsed_markup.html;

    this.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });

  }
}

customElements.define('mark-down', dataroomCompiler)