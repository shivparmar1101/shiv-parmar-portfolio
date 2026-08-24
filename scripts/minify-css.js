const fs = require('fs');
const css = fs.readFileSync('D:\\xampp\\htdocs\\portfolio\\style.css', 'utf8');

const minified = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,])\s*/g, '$1')
  .trim();

fs.writeFileSync('D:\\xampp\\htdocs\\portfolio\\style.min.css', minified);
console.log('Original:', css.length, 'bytes');
console.log('Minified:', minified.length, 'bytes');
console.log('Savings:', Math.round((1 - minified.length/css.length) * 100) + '%');
