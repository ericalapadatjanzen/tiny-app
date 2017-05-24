 "use strict";
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware

// Parses the body of forms submitted
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

// Handles cookies
const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || "development"],
  maxAge: 24 * 60 * 60 * 1000
}));

// Lets user_id and user cookies be used locally (in all .ejs files)
app.use(function(req, res, next) {
  res.locals.user_id = req.session.user_id;
  res.locals.user = users[req.session.user_id];
  next();
});

// Encrypts cookies
const bcrypt = require('bcrypt');
app.set("view engine", "ejs");

// Hardcoded database objects containing url information and user information
var urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("bob", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("poop", 10)
  }
};

// Generates a random 6 character string for short URLs
function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Checks if current user id cookie matches the user id in the database and returns urls
function urlsForUser(userID) {
  const urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}

// GET END POINTS

// Root page
app.get("/", (req, res) => {
  let user_ID = req.session['user_id'];
  if (users[user_ID]) {
    res.redirect("/urls");
  } else {
    res.redirect('/login');
  }
});

// Main url page, if user is logged in renders their urls, else error message
app.get("/urls", (req, res) => {
  let user_ID = req.session["user_id"];
  let filtered = urlsForUser(user_ID);
  let templateVars = {
    urls: filtered,
    user: users[user_ID]
  };
  if (users[user_ID]) {
    res.render("urls_index", templateVars);
  } else {
    res.status(403).send("Please <a href='/login'>login</a> or <a href='/register'>register</a> to post a TinyUrl");
    return;
  }
});

// New link page
app.get("/urls/new", (req, res) => {
  let user_ID = req.session['user_id'];
  if (users[user_ID]) {
    res.render("urls_new");
  } else {
    res.redirect('/login');
  }
});

// URL edit page
app.get("/urls/:id", (req, res) => {
  let user_ID = req.session['user_id'];
  let shortURL = req.params.id;
  let longURL = urlDatabase[shortURL].longURL;
  let templateVars = {
    shortURL: shortURL,
    longURL: longURL
  };
  if (!user_ID) {
    res.status(401).send("Please <a href='/login'>login</a> to view this TinyUrl edit page.");
  }
  if (urlDatabase[shortURL].userID === users[req.session.user_id].id) {
    res.render("urls_show", templateVars);
  } else {
    res.status(401).send("To edit this TinyUrl you must <a href='/login'>login</a> and try again.");
  }
});

//Short link that redirects to long url website
app.get("/u/:shortURL", (req, res) => {
  let user_ID = req.session['user_id'];
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;
  if (!user_ID) {
    res.status(401).send("Please <a href='/login'>login</a> to go to this URL");
  }
  if (urlDatabase[shortURL].userID === users[req.session.user_id].id) {
    res.redirect(longURL);
  } else {
    res.status(403).send("You are not authorized. To go to this URL you must <a href='/login'>login</a> and try again.");
  }
});

// Login page
app.get('/login', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

// Register page
app.get('/register', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('urls_registration');
  }
});

// POSTS

//Create url
app.post("/urls", (req, res) => {
  let user_ID = req.session['user_id'];
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  if (!user_ID) {
    res.status(401).send("Please <a href='/login'>login</a> to post a TinyUrl");
  } else {
    urlDatabase[shortURL] = {
      id: shortURL,
      longURL: longURL,
      userID: user_ID
    };
    res.redirect('/urls/' + shortURL);
  }
});


// Change url
app.post('/urls/:id/', (req, res) => {
  let user_ID = req.session['user_id'];
  if (!user_ID) {
    res.status(401).send("Please <a href='/login'>login</a>.");
  }
  if (urlDatabase[req.params.id].userID === users[req.session.user_id].id) {
    urlDatabase[req.params.id].longURL = req.body.newLongURL;
    res.redirect('/urls');
  } else {
    res.status(401).send("Please <a href='/login'>login</a> and try again.");
  }
});

// Delete url
app.post('/urls/:id/delete', (req, res) => {
  let userID = req.session['user_id'];
  if (urlDatabase[req.params.id].userID === users[req.session.user_id].id) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
    return;
  } else {
    res.status(403).send("You are not authorized to delete this URL. You must <a href='/login'>login</a> and try again.");
  }
});


// Login
app.post('/login', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(403).send('Please enter both email and password.');
    return;
  }
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session['user_id'] = users[user].id;
        res.redirect('/urls');
        return;
      } else {
        res.status(403).send('User password is not a match');
        return;
      }
    }
  }
  res.status(403).send('Email does not exist');
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// Register
app.post('/register', (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Email or Password not entered');
    return;
  }
  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).send('Email already exists');
      return;
    }
  }
  let randomUserID = generateRandomString();
  users[randomUserID] = {
    id: randomUserID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session["user_id"] = randomUserID;
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
