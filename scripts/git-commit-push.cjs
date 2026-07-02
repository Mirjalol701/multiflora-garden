const { execSync } = require("child_process");
const path = require("path");

const cwd = path.join(__dirname, "..");
const run = (c) => {
  console.log("$ " + c);
  console.log(execSync(c, { cwd, encoding: "utf8" }));
};

const message =
  process.argv[2] ||
  "Localize AI chat welcome/sidebar/input to garden-expert theme (RU/EN)";

run("git add -A");
run(`git commit -m "${message}"`);
run("git push");
run("git status");
