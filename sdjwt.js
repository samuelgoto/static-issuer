const jwt = require("jsonwebtoken");
const { createHash, randomBytes } = require("crypto");

const sha256 = (message) =>
      Base64Url.encode(createHash("sha256").update(message).digest("base64"));

const salt = () => Base64Url.encode(randomBytes(32).toString('base64'));

class Base64Url {
  static encode(base64) {
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  static decode(base64) {
    return base64
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  }
}

//console.log(salt());
//console.log(token);
//console.log();


function issue(secret, holder, frame = []) {
  const holderKey = JSON.parse(
    Buffer.from(Base64Url.decode(holder), "base64").toString()
  );

  const disclose = (name, value) =>
        Base64Url.encode(Buffer.from(JSON.stringify([salt(), name, value])).toString('base64'));

  const disclosures = frame.map(([name, value]) => disclose(name, value));
  
  const payload = {
    cnf: holderKey,
    _sd: disclosures.map((disclosure) => sha256(disclosure))
  };

  const token = jwt.sign(payload, secret);

  const prefix = disclosures.length > 0 ? "~" : "";
  return token + prefix + disclosures.join("~") + "~";
}

module.exports = {
  issue: issue
}
