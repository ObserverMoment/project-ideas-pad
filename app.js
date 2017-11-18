const express = require('express');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const buebird = require('bluebird');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const passport = require('passport');
const { databaseURI, localPort } = require('./config/envconfig');

const app = express();
// When deploying to heroku, they will provide a port number under this variable path.
// If running locally then this will not exist and you will fall back to locally defined port.
const port = process.env.PORT || localPort;

// Setp the session module and the server side session store in the database.
const session = require('express-session');
// Make a store object and connect it to the session module.
const MongoDBStore = require('connect-mongodb-session')(session);
// make a session store object and connect it to your MongoDb database.
const store = new MongoDBStore({
  uri: databaseURI,
  collection: 'ideapad-sessions'
});
// Initialise the local strategy by passing the passport instance to the init function from config/passport.
const initializePassport = require('./config/passport');
initializePassport(passport);

// Connect the session module as middleware.
app.use(session({
  secret: 'secret',
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    },
    store: store,
    // Boilerplate options, see:
    // * https://www.npmjs.com/package/express-session#resave
    // * https://www.npmjs.com/package/express-session#saveuninitialized
    resave: true,
    saveUninitialized: true
}));

// You also need to add the passport initialize (to start passport running) and session (to store auth cookie for the session) middleware.
// This must come after the session middleware is added (see above) as it is dependent on it to run.
app.use(passport.initialize());
app.use(passport.session());

// Connect the flash message module as middleware.
// This will allow you to add flash messages to the request object when making route requests.
// Useful for sending error messages or other info when using redirects after some database interaction.
app.use(flash());

// You can then set up a variable on the response stream object, via a middleware function.
// These variables, on the local attribute of the response object, are accessible as global variables in templates etc.
app.use((req, res, next) => {
  // When the middlewae runs it will use the flash getters to recover any message strings and add them to the response stream object.
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.formEmail = req.flash('form_email');
  res.locals.user = req.user || null;
  next();
});

// Mongoose's promise library is deprecated so you can use some other library. Here we will use the Bluebird library.
mongoose.Promise = buebird;

mongoose.connect(databaseURI, {
  useMongoClient: true
}).then(() => {
  console.log('Connected to database');
}).catch((err) => {
  console.log('Error connecting to database', err);
});

// Set up handlebars view engine.
// Make an engine and call it handlebars, using the express-handlebars constructor function
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
// Then set the view engine of your server and set it to check for .handlebars files.
app.set('view engine', 'handlebars');

// Set up the body parser middleware for both post forms and JSON responses.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// The methodOverride middleware will let you submit forms and make PUT and DELETE requests.
// You use a query string after the action endpoint. action="/routename?_method=PUT".
// The _method attribute of the query string can be named whatever you want it to be but like this is the convention.
app.use(methodOverride('_method'));

//// ROUTES ////
// Import ideas pages routes and create the middleware.
// The ideas routes all require authentication. So insert this check as middleware before the actual routes are invoked.
const { ensureAuthenticated } = require('./helpers/auth');
const ideasRoutes = require('./routes/ideasRoutes');
app.use('/ideas', ensureAuthenticated, ideasRoutes);

// Import users pages routes and create the middleware.
const usersRoutes = require('./routes/usersRoutes');
app.use('/users', usersRoutes);

// Index Route
app.get('/', (req, res) => {
  // .render will call the view engine and load the file of the name that you pass as an arg.
  // The default file for these files is called views.
  res.render("index");
});

// About Route
app.get('/help', (req, res) => {
  res.render("help");
});

// About Route
app.get('/about', (req, res) => {
  // The second arg here is the data that is passed to the template which can then be accessed via the {{ }} tags.
  res.render("about");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
