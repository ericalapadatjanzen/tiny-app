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
  "userRandomID": {
    "b2xVn2": "http://www.lighthouselabs.ca"
  },
  "user2RandomID": {
    "9sm5xK": "http://www.google.com"
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




app.get("/urls", (req, res) => {
  let userid = req.cookies["user_id"];
  let templateVars = {
     urls: urlDatabase[userid],
     user: users[userid]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
 let user_ID = req.cookies['user_id'];
 if (users[user_ID]) {
   res.render("urls_new");
  } else{
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  let user_ID = req.cookies['user_id'];
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  if (!urlDatabase[user_ID]) { urlDatabase[user_ID] = {}; }
  urlDatabase[user_ID][shortURL]= longURL
  res.redirect('/urls/' + shortURL);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let short = req.params.shortURL;
  let longURL = urlDatabase[short];
  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  let keyId = req.params.id;
  delete urlDatabase[keyId];
  res.redirect('/urls');
});

app.post('/urls/:id/', (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  res.redirect('/urls');
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