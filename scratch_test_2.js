const q = { text: "Why do linked queues achieve O(1) time complexity for enqueue and dequeue operations?\n\n(2 Marks)\nCO3\n•\nL4", marks: 2 };

let text = q.text || '';
let metadata = {};

let extractedMarks = q.marks;
const marksRegex = /\s*[\(\[]\s*(\d+)\s*[M|m]arks?\s*[\)\]]/g;
let matchMarks;
while ((matchMarks = marksRegex.exec(text)) !== null) {
  extractedMarks = parseInt(matchMarks[1], 10);
}
text = text.replace(/\s*[\(\[]\s*\d+\s*[M|m]arks?\s*[\)\]]/g, '').trim();

const metaJsonMatch = text.match(/\{[^{}]*(?:CO|PO|RBT|Marks|marks)[^{}]*\}/i);
if (metaJsonMatch) {
  try {
    const raw = metaJsonMatch[0].replace(/([a-zA-Z0-9_]+):/g, '"$1":').replace(/'/g, '"');
    metadata = { ...metadata, ...JSON.parse(raw) };
    text = text.replace(metaJsonMatch[0], '');
  } catch (e) {}
}

const coMatch = text.match(/\b(CO[1-6])\b/gi);
if (coMatch) metadata['CO'] = Array.from(new Set(coMatch.map((s) => s.toUpperCase()))).join(', ');

const rbtMatch = text.match(/\b(L[1-6])\b/gi);
if (rbtMatch) metadata['RBT'] = Array.from(new Set(rbtMatch.map((s) => s.toUpperCase()))).join(', ');

text = text.replace(/\b(CO[1-6]|PO\d+|L[1-6])\b/gi, '');
text = text.replace(/[•\s\-,]+$/g, '').trim();

console.log("TEXT:", text);
console.log("METADATA:", metadata);
