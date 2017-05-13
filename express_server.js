// "use strict";

const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

app.use(function(req, res, next){
  res.locals.user_id = req.cookies.user_id;
  next();
});

var urlDatabase = {
   "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://lighthouselabs.ca",
    userID: "userRandomID"
  },
   "9sm5xK": {
    id: "b2xVn2",
    longURL: "http://www.google.com",
    userID: "user2RandomId"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "bob"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "poop"
  }
}

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( let i = 0; i < 6; i++ ){
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




app.get("/urls", (req, res) => {
  let userid = req.cookies["user_id"];
  let filtered = urlsForUser(userid);
  console.log(filtered)
  let templateVars = {
     urls: filtered,
     user: users[userid]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let user_ID = req.cookies['user_id'];
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {id: shortURL, longURL: longURL, userID: user_ID};
  res.redirect('/urls/' + shortURL);
});

app.get("/urls/new", (req, res) => {
 let user_ID = req.cookies['user_id'];
 if (users[user_ID]) {
   res.render("urls_new");
  } else{
    res.redirect('/login');
  }
});



app.get("/urls/:id", (req, res) => {
  let userAccess = req.cookies['user_id'];
  if(!urlDatabase[userAccess]){
    res.status(401).send('You do not have access to this page');
   }
  let filtered = urlsForUser(userAccess);
  let shortURL = req.params.id;
  let longURL = urlDatabase[shortURL].longURL;

  let templateVars = { shortURL: shortURL, longURL: longURL};
  res.render("urls_show", templateVars);
});

app.post('/urls/:id/', (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.newLongURL;
  console.log("urlDatabase[req.params.id].longURL", urlDatabase[req.params.id].longURL)
  res.redirect('/urls');
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  let longURL = urlDatabase[short].longURL;
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  let userID = req.cookies['user_id'];
   if (users[userID]) {
   delete urlDatabase[req.params.id];
    res.redirect('/urls');
    return;
  } else{
    res.redirect('/login');
  }
});

app.get('/login', (req, res) =>{
  res.render('login');
});

app.post('/login', (req, res) =>{
  if(!req.body.email || !req.body.password){
    res.status(403).send('Please enter both email and password');
    return;
  }
  for(let user in users){
    if(users[user].email === req.body.email){
      if(users[user].password === req.body.password){
        res.cookie('user_id', users[user].id);
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

app.post('/logout', (req, res) =>{
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get('/register', (req, res) =>{
  res.render('urls_registration');
});

app.post('/register', (req, res) =>{
  if(!req.body.email || !req.body.password){
    res.status(400).send('Email or Password not entered');
      return;
  }
  for(let user in users){
    if(users[user].email === req.body.email ){
      res.status(400).send('Email already exists');
        return;
    }
  }
  let randomUserID = generateRandomString();
  users[randomUserID] = {id: randomUserID, email: req.body.email, password: req.body.password}
  res.cookie("user_id", randomUserID)
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});