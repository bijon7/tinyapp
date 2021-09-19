//This program lets users create and maintain short URLs for their website.
/*********************************************************************************/

const express = require("express");
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers.js');
const app = express();
const PORT = 8080; // default port 8080
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["cookieSessionID"],
  maxAge: 24 * 1000000
}));
app.set("view engine", "ejs");

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

//Directs user to the website of the long URL.
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(`http://${longURL}`);
});
//Lets user enter a specific short URL as part of the requested path and displays correspnding
//long URL with an option to update the long URL on that same page.
app.get("/urls/:shortURL", (req, res) => {

  const templateVars = {
    user: users[req.session.user_id],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
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

  //Creates a ShortURL Key
  let shortURL = generateRandomString();
  //Add the new LongURL with the ShortURL in the URlDatabase
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };

  res.redirect("/urls/" + shortURL);

});

//Gives out options to looged in users to delete short URLs.
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id]
  const shortURL = req.params.shortURL;
  if (!user) {
    res.status(403);
  } else {

    if (user.id === urlDatabase[shortURL].userID) {
      delete urlDatabase[shortURL];
    }

    res.redirect("/urls");
  }
});

//Updates the long URL 
app.post("/urls/:shortURL", (req, res) => {

  const user = users[req.session.user_id]
  let shortURL = req.params.shortURL;
  let updatedLongURL = req.body.longURL;
  //Checks for authentication

  if (!user) {
    res.redirect("/login");
  } else {

    if (user.id === urlDatabase[shortURL].userID) {
      urlDatabase[shortURL].longURL = updatedLongURL;
    }
    res.redirect("/urls");
  }
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

  req.session.user_id = null;
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