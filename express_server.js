//This program lets users create and maintain short URLs for their website.
/*********************************************************************************/

const express = require("express");
const cookieSession = require('cookie-session')
//const cookieParser = require('cookie-parser')
const app = express();
//app.use(cookieParser())
app.use(cookieSession({
  name: 'session',
  keys: ["cookieSessionID"],
  maxAge: 24 * 1000000
}));
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
app.use(bodyParser.urlencoded({ extended: true }));
const { getUserByEmail } = require('./helpers.js');

//Generale random numbers to be used in creating short URLs and user IDs.
function generateRandomString() {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//Gives users data in json format.
app.get("/users.json", (req, res) => { res.json(users); });




//Database of short URLs with corresponding objects containing associated long URLs and user IDs.
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

// Users database with attributes to be used for authentication.
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//Default display of the home page that will show up on user's browser.
app.get("/", (req, res) => {
  res.send("Hello!");
});

//Displays JSON formatted data to the user.
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//This specific URL returns an html coded "hello world" greetings.
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Checks for user ID to match with the IDs in the objects within urlDatabase and returns
//an object that contains the long URL of the matching user ID.
const urlsForUser = function (id) {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      result[url] = urlDatabase[url];
    }
  }
  return result;
}

//Reads user cookie and renders urls_index page only if cookie mateches user ID.
app.get("/urls", (req, res) => {
  let user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login")
  } else {
    //Checks user cookie and sets function value to the object that is associated with the ID fetched from the cookie.
    let urlsResult = urlsForUser(req.session.user_id);
    templateVars = { urls: urlsResult, user: users[req.session.user_id] }
    res.render("urls_index", templateVars);
  }
});

//If user's request has the cookie, then displays option to create new short URLs otherwise
//directs user to the log in page.
app.get("/urls/new", (req, res) => {

  let user = users[req.session.user_id];
  const templateVars = { user: user };

  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }

});

//Lets user enter a specific short URL as part of the requested path and displays correspnding
//long URL with an option to update the long URL on that same page.
app.get("/urls/:shortURL", (req, res) => {

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});
//Renders registration page to a new user.
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  res.render("user_registration", templateVars);

});

//Displays login page with header file showing corresponding login status.
app.get("/login", (req, res) => {

  const templateVars = { user: users[req.session.user_id] };
  res.render("user_login", templateVars);

});

//Generates short URLs for logged in users and updates database with corresponding long URLs.
app.post("/urls", (req, res) => {

  //1. Creating a ShortURL Key
  let shortURL = generateRandomString();
  //Add the new LongURL with the ShortURL in the URlDatabase
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };

  res.redirect("/urls/" + shortURL); //"urls/23tx"

});

//Gives out options to looged in users to delete short URLs.
app.post("/urls/:shortURL/delete", (req, res) => {

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];

  res.redirect("/urls");

});

//Updates the long URL if necessary and brings database up to date.
app.post("/urls/:shortURL", (req, res) => {

  let shortURL = req.params.shortURL;
  let updatedLongURL = req.body.longURL;
  //Update the longurl in the UrlDatabase
  urlDatabase[shortURL] = updatedLongURL;
  res.redirect("/urls");

});
//Lets user log in only if the email and hashed password match.
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;


  if (!email) {
    res.send("error 403");
  }

  for (let element in users) {
    //hashes user password and matches with corresponding hashed password in the database.
    const verified = bcrypt.compareSync(password, users[element]["password"]);

    if (email === users[element].email && (verified)) {
      let userID = element;
      req.session.user_id = userID;
      return res.redirect("/urls");
    }
  }
  res.send("error 403");

});

app.post("/logout", (req, res) => {

  res.clearCookie("user_id");
  res.redirect("/login");

});
//Registration is done by setting up a session cookie ID and storing hashed password in database.
app.post("/register", (req, res) => {

  const password = req.body.password;
  const email = req.body.email;
  //Check for the Email and Password are not empty
  if (!email || !password) {
    res.send("You need to provide email and password for registration");
  }
  const getUser = getUserByEmail(email, users)
  //Check for the email has already been taken
  if (getUserByEmail(email, users)) {
    res.send("Email has already been taken");
  } else {
    //If everything is fine, we need to register with user passwords hashed and stored in database.
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userID = generateRandomString();
    const user = { id: userID, email: email, password: hashedPassword };

    users[userID] = user;
    //Sets up session ID cookie.
    req.session.user_id = userID;
    res.redirect("/urls");
  }

})
// Server listening to default port.
app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);

});