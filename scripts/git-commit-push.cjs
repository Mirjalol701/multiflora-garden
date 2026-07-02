const { execSync } = require("child_process");
const path = require("path");

const cwd = path.join(__dirname, "..");
const run = (c) => {
  console.log("$ " + c);
  console.log(execSync(c, { cwd, encoding: "utf8" }));
};

const message =
  process.argv[2] ||
  "Add EN localization, AI gardener with catalog access, and photo-to-plan feature";

run("git add -A");
run(`git commit -m "${message}"`);
run("git push");
run("git status");
