const fs = require("fs");
const path = require("path");

const src = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-O-quchi-13-OneDrive",
  "assets",
  "c__Users_O_quchi-13_AppData_Roaming_Cursor_User_workspaceStorage_f98a65987536a0c9868c3d231a42fe9f_images_image-d733902b-ac09-4451-9438-2034d73b49c2.png"
);

const publicDest = path.join(__dirname, "..", "public", "multiflora-logo.png");
const iconDest = path.join(__dirname, "..", "src", "app", "icon.png");
const appleDest = path.join(__dirname, "..", "src", "app", "apple-icon.png");

if (!fs.existsSync(src)) {
  console.error("Logo source not found:", src);
  process.exit(1);
}

fs.mkdirSync(path.dirname(publicDest), { recursive: true });
fs.copyFileSync(src, publicDest);
fs.copyFileSync(src, iconDest);
fs.copyFileSync(src, appleDest);

console.log("Logo copied to:");
console.log("-", publicDest);
console.log("-", iconDest);
console.log("-", appleDest);
