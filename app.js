require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT ||8000
var session = require('express-session');       // used for creating sessions so data can persist between pages like if a user is logged in
const mysql = require('mysql2')
var ejs = require('ejs'); 
const sanitiseHtml = require('sanitize-html');  // used to make sure there are no cross site scripting issues with the input
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');               // used for storing and comparing password hashes
const bcryptSaltRounds = 10;                    // the higher this is the more processing time - 20 is unworkable takes too long so changed to 10


// set up the database connection
const db = mysql.createConnection(process.env.DATABASE_URL);
db.connect()

// session middleware - used for login, used to create a unique persistent session
app.use(session({
  secret: 'secretforumkey',
  resave: false,
  saveUninitialized: true,
}));

// this allows processing of form data
app.use(bodyParser.urlencoded({ extended: true }))

// Set the directory where Express will pick up media files images - this will be accessable from \
// __dirname will get the current directory
app.use(express.static(__dirname + '/media'));

// Set up access to folder with css 
app.use(express.static(__dirname + '/public'));

// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set('views', __dirname + '/views');

// Tell Express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine('html', ejs.renderFile);


// function to hash a plain text password
function hashPassword(password) {
    try {
        var hash = bcrypt.hashSync(password, bcryptSaltRounds);
        return hash;
    } catch (error) {
        return null;
    }
}

// function to hash a plain text password
function isMatchingPassword(password,hashedPassword) {
    try {
        // Compare the provided password with the hashedPassword
        const match = bcrypt.compareSync(password, hashedPassword);
        return match;
    } catch (error) {
        return false;
    }
}

// this is used to display the currently logged in user in the top right of the form
function getLoggedInUser(req) {
  if (req.session && req.session.isLoggedIn) {
      return "logged in as " + req.session.email;
  } else {
      return "not logged in";
  }
}

// function to check if user is logged in - if they are not returns them to the home page (where the login form is)
// this is used in multiple routes eg. addpost, deletepost - so users cannot access those pages
// if not logged in
function isLoggedIn(req, res, next) {
    if (req.session && req.session.isLoggedIn) next();  // if user logged in then carry on in the route
    else { 
        res.render('login.ejs', {});     // if user is not logged in take them to the login page
    }
}

app.get('/', (req, res) => {
    res.render('login.ejs', {});    
})

app.get('/login', (req, res) => {
  res.render('login.ejs', {});    
})

// login-check route which is the target for the https post in login,ejs.ejs
    app.post('/login-check', function (req,res) {
      var email = sanitiseHtml(req.body.email);
      var password = req.body.password;   
      // just check that the email address exists (password hash checking comes after)
      let sqlquery = "SELECT email, id, password, user_role FROM user_account WHERE email=\""+ email.toLowerCase() +"\";" 
      db.query(sqlquery, (err, result) => {
          // if error display login-error page
          loggedInMessage = getLoggedInUser(req);
          if (err) {
              console.error(err.message);
              res.render('login-error.ejs',{}); 
          } else if (result === null || result.length === 0) {
              // no matching records at all
              console.error("user not found");
              res.render('login-error.ejs',{});
          }
          // if this is a valid user
          else {
              // now have to check the passwords matches the hashed password
              // take the first result from the sql query 
              if(isMatchingPassword(password,result[0].password)){
                  req.session.isLoggedIn = true;  // set the session variable to show logged in
                  req.session.userid = result[0].id;
                  req.session.email = result[0].email;
                  req.session.user_role = result[0].user_role;
                  loggedInMessage = getLoggedInUser(req);
                  res.redirect('/login-success');
              }else {
                  console.error("user details don't match");
                  loggedInMessage = getLoggedInUser(req);
                  res.render('login-error.ejs',{});
              }
          }
      });
  });

  app.get('/login-error', function (req,res) {
      forumMessage = getForumMessage(req);
      res.render('login-error.ejs',{forumName, forumMessage, htmlNav});
  }); 

  // this route is the template for all pages when the user is logged in
  // there is an extra check to make sure that the user is currently logged in
  // before displaying this route
  app.get('/login-success',isLoggedIn, function (req,res) {
      loggedInMessage = getLoggedInUser(req);      
      var userrole = req.session.user_role;
      var email = req.session.email;
      //console.log(loggedInMessage + " " + userrole);
      res.render('login-success.ejs',{loggedInMessage, userrole, email});
  }); 

  app.get('/logout', function (req,res) {
      req.session.destroy((err) => {
          if (err) {
            console.error('Error destroying session:', err);
            res.sendStatus(500); // Internal Server Error
          } else {
            forumMessage = "not logged in";
            res.render('login.ejs',{});      
          }
      });
  });

  
  // register page route - registers a new user and adds them as a member to the first topic
  // so they are able to post somewhere when they first join
  app.get('/register', function (req,res) {
      res.render('register.ejs',{});
  }); 
  // the form in register.ejs has a target of /registered which will get managed by this code.  
  // this form uses http POST
  app.post('/registered', function (req,res) {
      // before we send the input fields which will be displayed on the page
      // make sure they don't contain any dangerous HTML for cross site scripting 
      var email = sanitiseHtml(req.body.email);
      var password = sanitiseHtml(req.body.password);
      var userrole = sanitiseHtml(req.body.userrole);
      var societyname = sanitiseHtml(req.body.societyname);
      var hashedPassword = hashPassword(password);
      let sqlqueryuser = "INSERT INTO user_account (email, password, user_role, society_name) VALUES (?,?,?,?)"; 
      // execute sql query
      let newuser = [email.toLowerCase(), hashedPassword, userrole, societyname];
      db.query(sqlqueryuser, newuser, (err, result) => {
          // if error display login page
          if (err) {
              res.redirect('/'); 
              return console.error(err.message);
          }
          else {
              res.redirect('/'); 
          }
       });
  }); 

app.get('/test', (req, res) => {
  connection.query('SELECT * FROM user_account', function (err, rows, fields) {
    if (err) throw err

    res.send(rows)
  })
})




app.listen(port, () => {
  console.log(`Bookit app listening at http://localhost:${port}`)
})
