const fs = require("fs");
const path = require("path");

const src = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-O-quchi-13-OneDrive",
  "assets",
  "c__Users_O_quchi-13_AppData_Roaming_Cursor_User_workspaceStorage_f98a65987536a0c9868c3d231a42fe9f_images_image-c2d65b5b-e18b-4011-80d2-5df0933bbb37.png"
);
const dest = path.join(__dirname, "..", "public", "multiflora-logo.png");

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("Logo copied to", dest);
