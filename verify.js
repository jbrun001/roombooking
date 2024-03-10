const speakeasy = require("speakeasy");

var secretKey = "ON2C64CPKNTFQYSTEZYTMIJYHE2G2I2BNFVXQ6C2PNXVC42IJE7A"; // Use the key from console.log

// Verify token
var generatedToken = "815527"; // Temp Token value (testing)

const verified = speakeasy.totp.verify({
  secret: secretKey,
  encoding: "base32",
  token: generatedToken,
});

console.log(verified);
