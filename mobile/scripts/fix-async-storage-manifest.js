const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml");
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("package=")) {
    content = content.replace(/package="com\.reactnativecommunity\.asyncstorage"/g, "");
    fs.writeFileSync(file, content);
    console.log("[POSTINSTALL] Successfully removed package attribute from @react-native-async-storage AndroidManifest.xml");
  }
}
