//This program lets users create and maintain short URLs for their website.
/*********************************************************************************/
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
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//GET URLS FOR THE USER WHO IS LOGGED IN
const urlsForUser = function(id) {
  let result = {};
  for(let url in urlDatabase) {
    if (urlDatabase[url].userID === id){
      result[url] = urlDatabase[url];
    }
  }
  return result;
}
////

app.get("/urls", (req, res) => {
  //const templateVars = { urls: urlDatabase, username: req.cookies["username"], };
  //if the user is logged in, then a cookie will be available here. that's because we "set" at the log in.
  // see near line 99.
  let user = users[req.cookies["user_id"]];
  // const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  
  if (!user) {
    //res.send("You are not registered! Please register here.");
    res.redirect("/login")
  } else {
    let urlsResult = urlsForUser(req.cookies["user_id"]); 
    console.log("RD",urlsResult);
    templateVars = {urls: urlsResult, user: users[req.cookies["user_id"]]}  
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {

  let user = users[req.cookies["user_id"]];
  const templateVars = { user: user };

  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login")
  }

});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);


  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  console.log("Hello")
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("user_registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("user_login", templateVars);
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
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.cookies["user_id"]};

  res.redirect("/urls/" + shortURL); //"urls/23tx"
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  //console.log("here");
  const email = req.body.email;
  const password = req.body.password;
  //console.log(req.body);

  if (!email) {
    res.status(403).send("whatever");
  }

  for (let element in users) {

    if (email === users[element].email && password === users[element].password) {

      let userID = element;
      res.cookie("user_id", userID);
      return res.redirect("/urls");
    }

  }

  res.send("error 403");



});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");

  res.redirect("/login");

});
//CHECK EMAIL DUPLICATE
const checkEmail = (email) =>{
  for(let key in users){
    if(users[key].email === email){
      return true;
    }
  }
  return false;
}
//

app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  //1. Check for the Email and Password are not empty
  if (!email || !password) {
    res.send("You need to provide email and password for registration");
  }

  //2. Check for the email has already been taken
  if(checkEmail(email)){
    res.send("Email has already been taken");
  } else {
    //Everything is fine, we need to register
    const userID = generateRandomString();
    const user = { id: userID, email: email, password: password };
    
    users[userID] = user;
    res.cookie("user_id", userID);
    res.redirect("/urls");
    //console.log(users);

  }
 
})



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});