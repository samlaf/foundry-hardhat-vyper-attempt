import fs from "fs";

function writeAddresses(addresses: Record<string, string>, path = "/tmp/addresses.json") {
  fs.writeFileSync(path, JSON.stringify(addresses));
  console.log("Wrote addresses to", path);
}

function readAddresses(path = "/tmp/addresses.json") {
  const addresses = fs.readFileSync(path).toString();
  return JSON.parse(addresses);
}

module.exports = {
  writeAddresses,
  readAddresses,
};
