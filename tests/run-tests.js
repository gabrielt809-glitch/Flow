import process from "node:process";

const suites = [
  "./utils.test.js",
  "./selectors.test.js",
  "./timeblocks.test.js",
  "./storage.test.js",
  "./state.test.js"
];

let failures = 0;

for (const suitePath of suites) {
  try {
    const suite = await import(suitePath);
    if (typeof suite.run !== "function") {
      throw new Error(`Suite sem export run(): ${suitePath}`);
    }
    await suite.run();
    console.log(`PASS ${suitePath}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${suitePath}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`\n${failures} suite(s) falharam.`);
  process.exit(1);
}

console.log("\nTodos os testes passaram.");
