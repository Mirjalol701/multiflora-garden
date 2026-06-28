import { sanitizeMarkdown } from './src/lib/sanitize.ts';
const cases = [['[click](javascript:alert(1))'], ['[link](data:text/html,x)'], ['[safe](https://google.com)']];
for (const item of cases) { const c = item.at(0); console.log(c, '=>', sanitizeMarkdown(c)); }