// "use strict";

const express = require("express");
const cookieSession = require('cookie-session');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || "development"],
  maxAge: 24 * 60 * 60 * 1000
}));

app.set("view engine", "ejs");
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

app.use(function(req, res, next) {
  res.locals.user_id = req.session.user_id;
  res.locals.user = users[req.session.user_id];
  next();
});

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function urlsForUser(userID) {
  const urls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      urls[shortURL] = urlDatabase[shortURL];
    }
  }
  return urls;
}
app.get("/", (req, res) => {
  let user_ID = req.session['user_id'];
  if (users[user_ID]) {
    res.redirect("/urls");
  } else {
    res.redirect('/login');
  }
});

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

app.post("/urls", (req, res) => {
  let user_ID = req.session['user_id'];
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    id: shortURL,
    longURL: longURL,
    userID: user_ID
  };
  if (!user_ID) {
    res.status(401).send("Please <a href='/login'>login</a> to post a TinyUrl");
  } else {
    res.redirect('/urls/' + shortURL);
  }
});

app.get("/urls/new", (req, res) => {
  let user_ID = req.session['user_id'];
  if (users[user_ID]) {
    res.render("urls_new");
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:id", (req, res) => {
  let user_ID = req.session['user_id'];
  let filtered = urlsForUser(user_ID);
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

app.post('/urls/:id/', (req, res) => {
  let user_ID = req.session['user_id'];
  urlDatabase[req.params.id].longURL = req.body.newLongURL;
  if (!user_ID) {
    res.status(401).send("Please <a href='/login'>login</a>.");
  }
  if (urlDatabase[req.params.id].userID === users[req.session.user_id].id) {
    res.redirect('/urls');
  } else {
    res.status(401).send("Please <a href='/login'>login</a> and try again.");
  }
});

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

app.get('/login', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('login');
  }
});

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

app.get('/register', (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect('/urls');
  } else {
    res.render('urls_registration');
  }
});

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