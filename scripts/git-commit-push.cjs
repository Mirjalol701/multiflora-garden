const { execSync } = require("child_process");
const path = require("path");

const cwd = path.join(__dirname, "..");
const run = (c) => {
  console.log("$ " + c);
  console.log(execSync(c, { cwd, encoding: "utf8" }));
};

run(
  "git add src/config src/app/contacts/page.tsx src/app/garden/page.tsx src/app/layout.tsx src/components/layout/footer.tsx src/components/layout/header.tsx src/components/seo/site-json-ld.tsx src/lib/utils.ts scripts/git-commit-push.cjs"
);
run(
  'git commit -m "Add white-label brand config for easy rebranding and EUR/locale support"'
);
run("git push");
run("git status");
