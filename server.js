const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const { Parser } = require("htmlparser2");
var querystring = require("querystring");
const session = require("express-session");

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/.well-known/web-identity", async (req, res) => {
  res.type("json");
  res.send({
    provider_urls: ["/fedcm.json"],
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

app.post("/id_assertion_endpoint", (req, res) => {
  res.type("json");
  res.set("Access-Control-Allow-Origin", req.headers.origin);
  res.set("Access-Control-Allow-Credentials", "true");

  console.log("What the Issuer got:");
  console.log(req.body);
  
  res.json({
    //token: JSON.stringify({
    //  hello: "world",
    //}),
    token: "eyJhbGciOiJFUzI1NiIsInR5cCI6InNkLWp3dCJ9." +
      "eyJfc2QiOlsiSlpwQjQ1QVdyZExNd19fX1U0bHRVRTFmbWNCOEtDWFQwRW9MVGNkM2xLbyJd" +
      "LCJjbmYiOnsiandrIjp7ImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiTEZpWFBGWmpB" +
      "R0kzR2pEaHIxSDlwNnN6c182d0pUT1Y0d3E5c2JVZ2hwRSIsInkiOiJfMEtxU2RZYkJsbGJs" +
      "a2JmdWpGc3gtQ0FsbUJhV1VjcV9ZQXVCRjRmNkNJIn19LCJpYXQiOjEyMzQsImlzcyI6Imh0" +
      "dHBzOi8vaXNzdWVyLmV4YW1wbGUiLCJzdWIiOiJnb3RvQGdvb2dsZS5jb20ifQ." +
      "lp7bazjJLzCaEDTOZ9mKdfM0ao-" +
      "9hLfVRQ233NAaum4fiFTVqNRLKGDs93WQFBh1P8WeI4z7kV9c65ZotIitvg~" +
      "WyJoQzg5cnV1OWJvTDFVM1hyckRTekdrTlRuVjVUMERVOVVHOGZOY202bmJVIiwibmFtZSIs" +
      "IlNhbSJd~"
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

