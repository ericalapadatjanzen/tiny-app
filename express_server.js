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
  res.locals.username = req.cookies.username;
  next();
});

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( let i = 0; i < 6; i++ ){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
    return text;

}




app.get("/urls", (req, res) => {
  const username = req.cookies["username"];
  let templateconsts = {
  urls: urlDatabase,
  username
};
  res.render("urls_index", templateconsts);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls/' + shortURL);
});
app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let templateconsts = { shortURL: shortURL, longURL: urlDatabase[shortURL] };
  res.render("urls_show", templateconsts);
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
app.post('/login', (req, res) =>{
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});
app.post('/logout', (req, res) =>{
  res.clearCookie('username');
  res.redirect('/urls');
});



app.get('/register', (req, res) =>{
  res.render('urls_registration');
});

app.post('/register', (req, res) =>{
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});