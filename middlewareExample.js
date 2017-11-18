const express = require('express');

const app = express();
const port = 5000;

const middleware1 = (req, res, next) => {
  console.log("Middleware1");
  next();
};

const middleware2 = (req, res, next) => {
  console.log("Middleware2");
  next();
};

const middleware3 = (req, res, next) => {
  console.log("Middleware3");
  next();
};

// At each point in the middleware stack (or chain) that function gets access to the request object.
// It can add to it or modify it then send it on to the next thing.
// This can be very useful for authentication and allowing a username to be available from any page
// and / or whenever a request to the server is sent.
// e.g. req.username = "Jonny", req.accessLevel = "everything", req.status = "Logged In" etc.
const injectName = (req, res, next) => {
  req.injectedName = "Rich Beans";
  next();
};

const reverseName = (req, res, next) => {
  let splitName = req.injectedName.split(" ");
  req.reversedName = `${splitName[1]} ${splitName[0]}`;
  next();
};

// This is how middleware works. You can also specify the routes on which particular middleware runs.
app.use('/', [middleware1]);
app.use('/about', [middleware2, middleware3]);
app.use('/myname', injectName, reverseName);

//// ROUTES ////
// Index Route
app.get('/', (req, res) => {
  res.send("INDEX");
});

// About Route
app.get('/about', (req, res) => {
  res.send("ABOUT");
});

// Myname Route, which collects the name attribute from the req object which was injected by the customer middleware.
app.get('/myname', (req, res) => {
  // Will show "Rich Beans"
  res.send(`${req.injectedName} is a dude. And ${req.reversedName} is a dude also`);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
