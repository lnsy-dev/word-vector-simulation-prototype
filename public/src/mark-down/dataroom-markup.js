import yaml from './vendor/js-yaml.js'; 
import markdownit from './vendor/markdown-it.js';
import markdownItAttribution from './vendor/markdown-it-attribution.min.js';


const md = markdownit({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true

}).use(markdownItAttribution, {
  marker: 'cite:',
});


export function extractYamlFrontMatter(inputString) {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = inputString.match(frontMatterRegex);
    if (match) {
        // Parse the YAML front matter
        const yamlContent = match[1];
        try {
            return yaml.load(yamlContent);  // Parse YAML content and return as an object
        } catch (e) {
            console.error("Failed to parse YAML front matter:", e);
            return null;
        }
    }
    return {};
}

export function removeYamlFrontMatter(inputString) {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
    return inputString.replace(frontMatterRegex, '').trim();
}

const variablePattern = /\$[a-zA-Z_][a-zA-Z0-9_-]*/g;

function replaceVariables(str, attributes) {
  return str.replace(variablePattern, (match) => {
    const varName = match.substring(1);
    return attributes[varName] || match;
  });
}


export async function parseDataroomMarkup(content, attributes = {}) {
  const data = extractYamlFrontMatter(content);
  const template_without_yaml = removeYamlFrontMatter(content);
  const new_value = replaceVariables(template_without_yaml, data)
  const renderedContent = md.render(new_value);
  return {data:data, html: renderedContent};
}

