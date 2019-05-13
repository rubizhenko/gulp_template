import "./partials/chunk.js";

console.log(`${1 + 2}` + "hello world");

let a = 5,
  b = 12;
console.log(`a=${a}, b=${b}`);

[b, a] = [a, b];

console.log(`a=${a}, b=${b}`);
