const jwt = require("jsonwebtoken");
const { createHash, randomBytes } = require("crypto");
const jwkToPem = require('jwk-to-pem');
const crypto = globalThis.crypto;

const sha256 = (message) =>
      Base64Url.encode(createHash("sha256").update(message).digest("base64"));

const salt = () => Base64Url.encode(randomBytes(32).toString('base64'));

const keys = crypto.subtle.generateKey({
  name: 'ECDSA',
  namedCurve: 'P-256',
}, true, ['sign', 'verify']);

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

function base64urlencode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urldecode(b64) {
  return atob(b64.replace(/_/g, '/').replace(/-/g, '+'));
}

function stripurlencoding(b64) {
  return b64.replace(/_/g, '/').replace(/-/g, '+');
}

function base64ToArrayBuffer(b64) {
  var byteString = atob(b64);
  var byteArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return byteArray.buffer;
}

function textToArrayBuffer(str) {
  var buf = unescape(encodeURIComponent(str)) // 2 bytes for each char
  var bufView = new Uint8Array(buf.length)
  for (var i=0; i < buf.length; i++) {
    bufView[i] = buf.charCodeAt(i)
  }
  return bufView
}

function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return binary;
}

const algo = {
  name: "ECDSA",
  namedCurve: "P-256", // secp256r1 
};
const hash = {name: "SHA-256"};
const signAlgo = {...algo, hash};

async function sign(str) {
  const encoded = new TextEncoder().encode(str);
  const {publicKey, privateKey} = await keys;
  const result = await crypto.subtle.sign(signAlgo, privateKey, encoded);
  return base64urlencode(arrayBufferToBase64(result));
};

async function verify(signature, data, pub) { // base64
  console.log('verify()', signature, data)
  //const pub =  await window.crypto.subtle.importKey(
  //  "spki",
  //  base64ToArrayBuffer(spki),
  //  algo,
  //  true, // extractable
  //  ["verify"]
  //)
  console.log({pub});
  const bufSignature = base64ToArrayBuffer(stripurlencoding(signature));
  const bufData = textToArrayBuffer(data);
  const result = await crypto.subtle.verify(signAlgo, pub, bufSignature, bufData);
  console.log({bufSignature, bufData, result});
  return result;
}

// @see https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-structure
async function generateJWT(p) {
  const header = JSON.stringify({ alg: 'ES256', typ: 'JWT' });
  const payload = JSON.stringify(p);
  const input = `${base64urlencode(header)}.${base64urlencode(payload)}`;
  const signature = await sign(input);
  return `${input}.${signature}`;
}

async function verifyJWT(jwt, pub) {
  const [header, payload, signature] = String(jwt).split('.');
  const base64signature = stripurlencoding(signature);
  return await verify(base64signature, `${header}.${payload}`, pub);
}

async function issue(holder, frame = []) {
  const holderKey = JSON.parse(holder);

  const disclose = (name, value) =>
        Base64Url.encode(Buffer.from(JSON.stringify([salt(), name, value])).toString('base64'));

  const disclosures = frame.map(([name, value]) => disclose(name, value));
  
  const payload = {
    cnf: holderKey,
    _sd: disclosures.map((disclosure) => sha256(disclosure))
  };

  const token = await generateJWT(payload);
  // const pem = jwkToPem(jwk, {private: true});
  // console.log(privateKey);
  
  const prefix = disclosures.length > 0 ? "~" : "";
  return token + prefix + disclosures.join("~") + "~";
}

(async () => {
  return;  
  const holder = "eyJjcnYiOiJQLTI1NiIsImt0eSI6IkVDIiwieCI6ImhfTGI2bGkzc05CU281RjB1TDNZa1BUemtZby1peEpGZmdqWWp4Z2thbk0iLCJ5IjoiNzZpZ3dsMkp3WkdBc3dMbVpwMjZ4a3B2Ulk4YmhxemhoVW9tUEhDMWdsVSJ9";

  const sdjwt = await issue(holder, [
    ["sub", "https://sgo.to"],
    ["email", "goto@google.com"],
    ["name", "Sam Goto"],
    ["picture", "https://pbs.twimg.com/profile_images/920758039325564928/vp0Px4kC_400x400.jpg"],
    ["firstName", "Sam"],
    ["lastName", "Goto"],
  ]);

  console.log(sdjwt);
  const {publicKey} = await keys;
  console.log(jwkToPem(await crypto.subtle.exportKey("jwk", publicKey)));
  
  return;
  // 1. Create payload
  const payload = {iss: 'test-issuer', hello: 'world', iat: 1691779304};
  console.log('PAYLOAD', payload);

  // 2. Generate JWT
  
  console.log(jwkToPem(await crypto.subtle.exportKey("jwk", publicKey)));
  console.log(await crypto.subtle.exportKey("jwk", publicKey));

  const jwt = await generateJWT(payload);
  console.log('JWT', jwt);

  // 3. Verify JWT
  const verified = await verifyJWT(jwt, publicKey);
  console.log('VERIFIED', verified);
})();

module.exports = {
  issue: issue,
  // keys: keys,
  jwk: async () => await crypto.subtle.exportKey("jwk", (await keys).publicKey)
}
