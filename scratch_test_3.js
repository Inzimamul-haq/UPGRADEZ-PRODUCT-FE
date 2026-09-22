const text = `1. a) Explain the following:
- A
- B
(13 Marks)

[[meta:{"CO":"CO3","RBT":"L4"}]]

2. What is a doubly linked list? Mention the primary advantage of using a prev pointer. (2 Marks)

[[meta:{"CO":"CO1","RBT":"L2"}]]
`;

const regex1 = /^\s*(\d+)\.\s+(.*?)\s*\(([\d\.]+)\s*Marks?\)([\s\S]*?)\[\[meta:(\{.*?\})\]\]/gmi;
console.log("Original regex:", [...text.matchAll(regex1)].length);

const regex2 = /^\s*(\d+)\.\s+([\s\S]*?)\s*\(([\d\.]+)\s*Marks?\)([\s\S]*?)\[\[meta:(\{.*?\})\]\]/gmi;
console.log("New regex:", [...text.matchAll(regex2)].length);
