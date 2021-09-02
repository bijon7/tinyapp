const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
app.use(cookieParser())
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
function generateRandomString() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"], };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"], };

  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  // const urlDatabase = {
  //   "b2xVn2": "http://www.lighthouselabs.ca",
  //   "9sm5xK": "http://www.google.com"
  // }; 
  //1. Creating a ShortURL Key
  let shortURL = generateRandomString();
  //Add the new LongURL with the ShortURL in the URlDatabase
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls/" + shortURL); //"urls/23tx"
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  console.log("here");
  const username = req.body.username;
  console.log(username);

  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  console.log(res);
  
  res.clearCookie("username");
  // res.clearCookie("username", username, {expire: Date.now()});
  res.redirect("/urls");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});