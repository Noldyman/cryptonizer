#!/usr/bin/env node

const CryptoJS = require("crypto-js");
const yargs = require("yargs");
const colors = require("colors");
const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const argv = yargs
  .option("action", {
    alias: "a",
    describe: '"enc" to encrypt, "dec" to decrypt',
    type: "string",
  })
  .option("path", {
    alias: "p",
    describe: "path to file",
    type: "string",
  }).argv;

const { action, path } = argv;

//Define path to keys.json: /Users/etc/etc/keys.json
const keysPath = "";
//Define path to general folder: /Users/<your name>
let fullPath = "";

let file = "";
let keys = JSON.parse(fs.readFileSync(keysPath, "utf-8"));

if (!action && !path) {
  console.log("Provide an action and a path".yellow);
  process.exit();
}

if (!action) {
  console.log('Provide an action: "enc" to encrypt; "dec" to decrypt'.yellow);
  process.exit();
} else if (action !== "enc" && action !== "dec") {
  console.log("Invalid action. Please use: [enc/dec].".red);
  process.exit();
}

if (!path) {
  console.log("Provide a path.".yellow);
  process.exit();
} else {
  fullPath += path;

  if (keys[path] && action === "enc") {
    console.log("Cannot encrypt. File has already been encrypted.".red);
    process.exit();
  }
  if (!keys[path] && action === "dec") {
    console.log("Cannot decrypt. File has never been encrypted.".red);
    process.exit();
  }

  try {
    file = fs.readFileSync(fullPath, "utf-8");
  } catch (err) {
    console.log(`No file found at path "${path}".`.red);
    process.exit();
  }
}

rl.question("Encryption key: ", (encKey) => {
  const hashedKey = CryptoJS.SHA3(encKey).toString();
  let newKeys = { ...keys };

  if (action === "enc") {
    newKeys[path] = hashedKey;

    const encryptedFile = CryptoJS.AES.encrypt(file, encKey).toString();
    fs.writeFile(fullPath, encryptedFile, "utf-8", () => {
      fs.writeFile(keysPath, JSON.stringify(newKeys), "utf-8", () => {
        console.log("\nFile has been encrypted".green);
        process.exit();
      });
    });
  } else {
    if (hashedKey !== keys[path]) {
      console.log("\nDecryption failed: key does not match.".red);
      process.exit();
    }
    const bytes = CryptoJS.AES.decrypt(file, encKey);
    const decryptedFile = bytes.toString(CryptoJS.enc.Utf8);
    delete newKeys[path];

    fs.writeFile(fullPath, decryptedFile, "utf-8", () => {
      fs.writeFile(keysPath, JSON.stringify(newKeys), "utf-8", () => {
        console.log("\nFile has been decrypted".green);
        process.exit();
      });
    });
  }
});

rl._writeToOutput = () => {
  rl.output.write("");
};
