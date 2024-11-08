const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { Parser } = require("htmlparser2");
var querystring = require("querystring");
const session = require("express-session");
const {issue, jwk} = require("./sdjwt.js");

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/.well-known/web-identity", async (req, res) => {
  res.type("json");
  res.send({
    provider_urls: ["/fedcm.json"],
  });
});

app.use("/.well-known/jwks.json", async (req, res) => {
  res.type("json");
  const key = await jwk();

  // Some verifiers fail with these extra WebCrypto parameters.
  delete key.key_ops;
  delete key.ext;

  res.send({
    keys: [key],
  });
});

app.use("/fedcm.json", async function (req, res, next) {
  res.type("json");
  res.send({
    accounts_endpoint: "/accounts",
    id_token_endpoint: "/idtoken_endpoint.json",
    client_metadata_endpoint: "/client_metadata",
    id_assertion_endpoint: "/id_assertion_endpoint",
    revocation_endpoint: "/revoke_endpoint.json",
    metrics_endpoint: "/metrics_endpoint.json",
    login_url: "/",
    // types: ["indieauth"],
    scheme: "issuer",
    branding: {
	     background_color: "#1a73e8",
	     color: "#fff",
	     icons: [{
        url: "https://accounts.google.com/gsi-static/google-logo.png",
        size: 32
      }, {
        url: "https://accounts.google.com/gsi-static/google-logo_40.png",
        size: 40
      }]
    },
  });
});

function error(res, message) {
  return res.status(400).end();
}

app.use("/accounts", (req, res) => {
  res.type("json");
  res.send({
    accounts: [{
      id: "1234",
      account_id: "1234",
      email: "goto@google.com",
      name: "Sam Goto",
      given_name: "Sam",
      picture: "https://pbs.twimg.com/profile_images/920758039325564928/vp0Px4kC_400x400.jpg",
      approved_clients: [],
    },],
  });
});

app.use("/client_metadata", (req, res) => {
  // Check for the CORS headers
  res.type("json");
  res.send({
    privacy_policy_url: "https://rp.example/privacy_policy.html",
    terms_of_service_url: "https://rp.example/terms_of_service.html",
  });
});

const tokens = {};

app.post("/id_assertion_endpoint", async (req, res) => {
  res.type("json");
  res.set("Access-Control-Allow-Origin", req.headers.origin);
  res.set("Access-Control-Allow-Credentials", "true");

  console.log("What the Issuer got:");
  console.log(req.body);

  const holder = req.body.holder_key;

  const sdjwt = await issue(holder, [
    ["sub", "https://sgo.to"],
    ["email", "goto@google.com"],
    ["name", "Sam Goto"],
    ["picture", "https://pbs.twimg.com/profile_images/920758039325564928/vp0Px4kC_400x400.jpg"],
    ["firstName", "Sam"],
    ["lastName", "Goto"],
  ]);

  console.log(sdjwt);
  
  res.json({
    token: sdjwt
  });
});

app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.send(`
    This is the absolutely simplest FedCM IdP Implementation.
  `);
});

const listener = app.listen(process.env.PORT || 8080, async () => {
  console.log("Your app is listening on port " + listener.address().port);
});

