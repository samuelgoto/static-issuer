# static-fedcm

This is the simplest FedCM server that serves static and hardcoded information. It is useful for testing purposes.

Installing:

```bash
npm install
npm run-script start
```

Then, in a browser, call:

```javascript
await navigator.credentials.get({
  mediation: "required",
  identity: {
    context: "signup",
    mode: "button",
    providers: [{
      configURL: "http://localhost:8080/fedcm.json",
      clientId: "1234",
      nonce: "5678",
    }]
  } 
})
```
