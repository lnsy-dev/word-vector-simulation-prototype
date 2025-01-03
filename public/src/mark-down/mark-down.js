import DataroomElement  from '../dataroom-element.js';
import { hljs } from "./vendor/highlight/highlight.min.js";
import './vendor/mermaid.min.js';
import "./vendor/markdown-it.min.js";
import { wrapHashtags } from './hash-tag.js';
const md = markdownit({
  html: true,
  breaks: true,
  linkify: true,
  highlight: function (str, lang) {

    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch (__) {}
    }
    return ''; // use external default escaping
  }
});

mermaid.initialize({ 
  startOnLoad: false,   
  theme: 'base', // 'base' is the default theme that is monochrome
  themeVariables: {
    darkMode: 'true',
    backgroundColor: '#555555',
    primaryColor: '#ffffff',
    primaryTextColor: '#fff',
    primaryBorderColor: '#555555',
    lineColor: '#aaaaaa',
    secondaryColor: '#aaaaaa',
    tertiaryColor: '#999999',
    fontFamily: 'Atkinson Hyperlegible',
    fontSize: '12px'
  }
});

class MarkDown extends DataroomElement {
  async initialize(){
    const content = this.innerHTML;
    this.renderMarkdown(content);
    await mermaid.run({
      querySelector: '.language-mermaid',
    });
  }

  renderMarkdown(content) {
    const renderedContent = md.render(content);
    const hashtags = wrapHashtags(renderedContent);

    this.innerHTML = `<div>${hashtags}</div>`;
    
    // Highlight code blocks using hljs
    this.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightBlock(block);
    });
  }

}

customElements.define('mark-down', MarkDown)