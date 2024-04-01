require("dotenv").config();
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const express = require("express");
var path = require('path');
const app = express();
const port = process.env.PORT || 8000;
var session = require("express-session");         // used for creating sessions so data can persist between pages like if a user is logged in
const mysql = require("mysql2");
var ejs = require("ejs");
const sanitiseHtml = require("sanitize-html");     // used to make sure there are no cross site scripting issues with the input
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");                 // used for storing and comparing password hashes
const bcryptSaltRounds = 10;                      // the higher this is the more processing time - 20 is unworkable takes too long so changed to 10
const multer = require('multer');
app.disable("x-powered-by");                      // disable the x-powered-by:express header - had to do this here before other code

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'media/rooms/')
  },
  filename: function (req, file, cb) {
    const roomNumber = req.body.roomNumber;
    const buildingName = req.body.buildingName;
    const filename = `${roomNumber}-${buildingName}.jpeg`;
    cb(null, filename);
  }
});

// Accept image files only
const imageFilter = function(req, file, cb) {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new Error('Only image files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

//Two Factor Authentication
//THIS VARIABLE ACTIVATES TWO FACTOR ACROSS THE ENTIRE APP <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
let activateTwoFactor;
activateTwoFactor = true;

// override this value if there is a TWO_FACTOR=TRUE or TWO_FACTOR=FALSE in the .env file
if (process.env.TWO_FACTOR) {
  let mfa = process.env.TWO_FACTOR.toLowerCase();
  // have to do this as mfa is a string not a boolean
  if (mfa == "true") activateTwoFactor = true
  else if (mfa == "false") activateTwoFactor = false
  else console.log("INFO: invalid values for TWO_FACTOR in .env - TRUE and FALSE are the only valid values")
}

console.log("Two factor authentication activation is " + activateTwoFactor);

// 1) Make a secret key const generatedSecret using generateSecretKey() which returns secret, which generates a key based on the argument (user email)
// 2) Create a QR code URL using the qrToURL function which takes a secret key as its argument. This will be used to diplay the qr code as an image in the page
// 3) User scans the qr code using google authenticator - a user should input the code generated into a post box on the log in page,  which updates token in a POST method
// 4) Run verified on the ascii value of generatedSecret against the userinput taken from the GET method 

function generateSecretKey(email){
  this.email = String(email);
  var secret = speakeasy.generateSecret({
    name: String(this.email)
    });    
    return secret;
}

// Calling this function from the URL  package creates a data URL
//this dataUrl is an image that we can pass to a html file
//The google authenticator app can scan this image and generate 6 digit keys
function qrToURL(generatedSecret) {
  return new Promise((resolve, reject) => {
    qrcode.toDataURL(generatedSecret.otpauth_url, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// This function takes two arguments, user input and user secret. These will be session based and defined in the GET method and used in the Post method to verify the user. 
//speakeasy does the heavy lefting here - we are using ascii encoding for our keys
function verifyKey(token , userSecret){
  var verified = speakeasy.totp.verify({
    secret: String(userSecret),
    encoding: 'ascii',
    token: token 
  })
  return verified;
}
console.log(verifyKey());

// set up the database connection
// check to see if the .env has a variable LOCAL_DB=true  if this variable is present and set to true
// then we are in production mode and use localhost as the database with additional parameters from the .env
// else we are in development mode and use the shared cloud database 
let db;
if(process.env.LOCAL_DB && process.env.LOCAL_DB.toLowerCase() == "true") { 
  // local database - used for live system
  db = mysql.createConnection ({
    host: process.env.LOCAL_HOST,
    user: process.env.LOCAL_USER,
    password: process.env.LOCAL_PASSWORD,
    database: process.env.LOCAL_DATABASE
  });
  console.log("Using Local Database. Host: " +process.env.LOCAL_HOST + ",  Database: " + process.env.LOCAL_DATABASE);
} 
else {
  // cloud based development database  
  db = mysql.createConnection(process.env.DATABASE_URL);
  const url = new URL(process.env.DATABASE_URL);
  console.log("Using Cloud Database. Host: " + url.hostname + url.pathname);
}
db.connect();

// session middleware - used for login, used to create a unique persistent session
app.use(
  session({
    secret: "secretforumkey",
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: "strict",
    },
  })
);


// Set the security headers for anti-click jacking and set the content security policy
// these fix 2 medium security errors identified by OWASP Zap as part of Part E
app.use((req, res, next) => {
  // this is a very restrictive header only pages generated by this app.js. no plugins are allowed and no base tags are allowed
  // override this value if there is a TWO_FACTOR=TRUE or TWO_FACTOR=FALSE in the .env file
  let origin = 'http://localhost:' + port;  
  //note: PRODUCTION_URL=https://doc.gold.ac.uk/usr/199 is the correct entry for the uni production server 
  if (process.env.PRODUCTION_URL) {
    origin = process.env.PRODUCTION_URL.toLowerCase();
  }
  //console.log("The base URL being used for security is: " + origin);
  // week 4 security policies
  var cSPolicy = "default-src " + origin + "; "; // will need changing when installed
  cSPolicy =
    cSPolicy +
    "script-src " + origin + " https://ajax.googleapis.com 'unsafe-inline'; "; // unsafe-inline allows for script in the pages
  cSPolicy =
    cSPolicy +
    "img-src 'self' data: https://cdn3.iconfinder.com https://i.imgur.com; ";
  cSPolicy = cSPolicy + "style-src " + origin + " 'unsafe-inline'; ";
  cSPolicy = cSPolicy + "font-src " + origin + "; ";
  cSPolicy = cSPolicy + "frame-ancestors " + origin + "; "; // stops the page being used within external websites
  cSPolicy = cSPolicy + "form-action " + origin + "; "; // only allow form submission to the server running the app
  res.setHeader("Content-Security-Policy", cSPolicy);
  // week 5 security changes
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // week 6 security changes CORS stop the server getting requests from pages that are not generated from the server
// TO BE REINSTATED - NEEDS TO WORK FOR BOTH DEV TEAM AND IN PRODUCTION CONSIDER .ENV 
//  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8000");
  // restrict the types of access methods we allow - only need get and post, not options, put or delete
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, If-Modified-Since"
  );
  next(); // Pass control to the next middleware or route handler
});



// this allows processing of form data
// extended the limit to to 500kb so the post of the risk assessment is managed
// the risk assessment template is 223kb, so this allows for just over double the size
app.use(bodyParser.urlencoded({ limit: '500kb', extended: true }));

// Set the directory where Express will pick up media files images - this will be accessable from \
// __dirname will get the current directory
app.use(express.static(__dirname + "/media"));

// Set up access to folder with css
app.use(express.static(__dirname + "/public"));

/* New Route to the TinyMCE Node module */
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set("views", __dirname + "/views");

// Tell Express that we want to use EJS as the templating engine
app.set("view engine", "ejs");

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine("html", ejs.renderFile);

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
function isMatchingPassword(password, hashedPassword) {
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
  if (req.session && req.session.isLoggedIn)
    next(); // if user logged in then carry on in the route
  else {
    loggedInMessage = "not logged in";
    res.render("login.ejs", { loggedInMessage }); // if user is not logged in take them to the login page
  }
}

app.get("/", (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  res.render("login.ejs", { loggedInMessage });
});

app.get("/login", (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  res.render("login.ejs", { loggedInMessage });
});

// login-check route which is the target for the https post in login,ejs.ejs
app.post("/login-check", function (req, res) {
  var email = sanitiseHtml(req.body.email);
  email = email.toLowerCase();
  var password = req.body.password;
  // just check that the email address exists (password hash checking comes after)
  let sqlquery =
    'SELECT email, id, password, user_role FROM user_account WHERE email= ? ';
  db.query(sqlquery, email, (err, result) => {
    // if error display login-error page
    loggedInMessage = getLoggedInUser(req);
    if (err) {
      console.error(err.message);
      res.render("login-error.ejs", { loggedInMessage });
    } else if (result === null || result.length === 0) {
      // no matching records at all
      console.error("user not found");
      res.render("login-error.ejs", { loggedInMessage });
    }
    // if this is a valid user
    else {
      // now have to check the passwords matches the hashed password
      // take the first result from the sql query

        // v THIS v is the normal login
      if (isMatchingPassword(password, result[0].password)) {
        if(!activateTwoFactor){
            req.session.isLoggedIn = true; // set the session variable to show logged in
            req.session.userid = result[0].id;
            req.session.email = result[0].email;
            req.session.user_role = result[0].user_role;
            loggedInMessage = getLoggedInUser(req);
            res.redirect("login-success");
           
          // 2FA login conidtions
        } else if(activateTwoFactor){  // request the relevant session info (userid, email, user_role)
          req.session.userid = result[0].id;
          req.session.email = result[0].email;
          req.session.user_role = result[0].user_role;     
          res.redirect("login-2fa"); // redirect to the 2fa pge
        }
      } else {
        console.error("user details don't match");
        loggedInMessage = getLoggedInUser(req);
        res.render("login-error.ejs", { loggedInMessage });
      }
    }
  });
});

app.get("/login-2fa", async (req, res) => {
  let qrCodeUrl = req.session.qrCodeUrl; // default session qr code if a qr is present
  let secretKey = req.session.generatedSecret; // default session secret key if a qr is present
  try{
      if(!qrCodeUrl) { // if there is no qr is present 
        secretKey = generateSecretKey(req.session.email); // session email is used in the function that generates secret keys
        req.session.generatedSecret = secretKey; // update the session secretkey 
        
        qrCodeUrl = await qrToURL(secretKey); // generate a qr from the secret keys
        req.session.qrCodeUrl = qrCodeUrl; // update session qr code url
        
        loggedInMessage = "Complete Two Factor Authentication" // this will render on the page for 2fa
      // Pass the QR code URL to the template
      res.render("login-2fa.ejs", { loggedInMessage, qrCodeUrl }); // render the 2fa page
    }
  } catch (error) {
    console.error(error);
    loggedInMessage = "Failed to generate the QR Code - contact the administrator";
    res.render("login-error.ejs", { loggedInMessage });
  }
});

app.post("/login-2fa", async (req, res) =>{
  qrCodeUrl = req.session.qrCodeUrl // references the session qr url
  secretKey = req.session.generatedSecret.ascii // references the session secret key in ascii format
  const userToken = req.body.twoFactorCode; // references user input taken from the 2fa input box from the html

  // Verify the two-factor authentication code
  const isTokenValid = verifyKey(userToken, secretKey); // the deciding function - takes the session user token and secret key and verifies if there is a match 

  if (isTokenValid) { // login if true
    req.session.isLoggedIn = true; // Set the session variable to show logged in
    loggedInMessage = getLoggedInUser(req);`  `
    res.redirect("/login-success");
  } else {
    loggedInMessage = "Two-factor authentication failed, try again";
          // render the original 2fa page again with the orinal session qr url (this prevents a new qr code generated if incorrect form data is entered)
    res.render("login-2fa.ejs", { loggedInMessage, qrCodeUrl });
  }
});

app.get("/login-error", function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  res.render("login-error.ejs", { loggedInMessage });
});

app.get("/logout", function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.sendStatus(500); // Internal Server Error
    } else {
      loggedInMessage = "not logged in";
      res.render("login.ejs", { loggedInMessage });
    }
  });
});

// register page route - registers a new user and adds them as a member to the first topic
// so they are able to post somewhere when they first join
app.get("/register", isLoggedIn, function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  sqlquery = "select * from lookup_user_role";
  // execute sql query
  db.query(sqlquery, (err, data) => {
    if (err) {
      res.redirect("./");
      return console.error(err.message);
    }
    let newData = Object.assign(
      {},
      { loggedInMessage },
      { userrole },
      { email },
      { allUserRoles: data }
    );
    res.render("register.ejs", newData);
  });
});


// the form in register.ejs has a target of /registered which will get managed by this code.
// this form uses http POST
app.post("/registered", isLoggedIn, function (req, res) {
  var email = sanitiseHtml(req.body.email);
  var password = sanitiseHtml(req.body.password);
  var userrole = sanitiseHtml(req.body.userrole);
  var societyname = sanitiseHtml(req.body.societyname);
  var module = sanitiseHtml(req.body.module);

  //pasword regex to check if the password meets the requirements
  var passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

  // Check if the password meets the requirements
  if (!passwordRegex.test(password)) {
    db.query("SELECT * FROM lookup_user_role", (err, data) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/");
      }
      // render the register-error page with the error message
      res.render("register-error.ejs", {
        errorMessage: "Password must be at least 8 characters long and include at least one lowercase letter, one uppercase letter, and one digit.",
        formValues: { email, userrole, societyname, module }, 
        allUserRoles: data
      });
    });
  } else {
    var hashedPassword = hashPassword(password);
    let sqlqueryuser = "INSERT INTO user_account (email, password, user_role, society_name, module) VALUES (?,?,?,?,?)";
    let newuser = [email.toLowerCase(), hashedPassword, userrole, societyname, module];

    db.query(sqlqueryuser, newuser, (err, result) => {
      if (err) {
        console.error(err.message);
        res.redirect("./");
      } else {
        res.redirect("login-success");
      }
    });
  }
});

// register error page route
app.get("/register-error", function (req, res) {
  const errorMessage = "An error has occurred during registration. Please try again.";

  // Get all user roles from the database
  db.query("SELECT * FROM lookup_user_role", (err, data) => {
    if (err) {
      console.error(err.message);
      return res.redirect("./");
    }

    //render the register-error page with the error message
    res.render("register-error.ejs", {
      errorMessage: errorMessage,
      formValues: {}, 
      allUserRoles: data 
    });
  });
});


app.get("/credits", (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  res.render("credits.ejs", { loggedInMessage });
});

app.get("/report-bug", (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  res.render("report-bug.ejs", { loggedInMessage });
}); 

app.post('/send',
[
  // check('yourName').notEmpty().withMessage('Name is required'),
  // check('email').isEmail().withMessage('Email is required'),
  // check('bugTitle').notEmpty().withMessage('Title is required'),
  // check('bugDescription').notEmpty().withMessage('Description is required')
], (req, res) => {

// const errors = validationResult(req);
// if (!errors.isEmpty()) {
  res.render('contact');
//}
}
);

app.get("/faq", (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  res.render("faq.ejs", { loggedInMessage });
});

// this route is the template for all pages when the user is logged in
// there is an extra check to make sure that the user is currently logged in
// before displaying this route
app.get("/login-success", isLoggedIn, function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  //console.log(loggedInMessage + " " + userrole);
  res.render("login-success.ejs", { loggedInMessage, userrole, email });
});

/**
 * getBookings
 * this function gets bookings data this is called from the routes the function returns a data set from the MySQL database
 * the parameters control what data is returned.  Different routes require different data sets
 * @param {*} pageName  - specifies the calling route this is used to control which SQL statement is executed
 *                        valid values are       
 *                        - "bookings-list", "approved-list", "requests-list"
 * @param {*} userId    - the userID of the currently logged in user - some lists only show data for the current user
 * @param {*} filters   - this is an object containing the values of the filter on the page
 *                        it's required to make sure that when the results are returned the filters are applied to that data
 * @param {*} listOrder - this is the order of the list of data that is returned
 * @returns promise     - this returns a promise object, it's used here because we need multiple sql queries for each page
 *                      - getBookings is just one of those data sets.
 */
function getBookings(pageName, userId, filters, listOrder) {
  return new Promise((resolve, reject) => {
    var sqlquery = "";
    var sqlParameters = [];
    if (pageName === "bookings-list") {
      // this is the base query all additionl filters will be appended later in the code
      sqlParameters.push(userId);
      sqlquery = `
        SELECT 
        r.room_number as roomNumber, r.building_name as building, r.capacity as minSeats,
        r.room_type as roomType, DATE_FORMAT(b.booking_start, '%Y-%m-%d') as date,
        b.risk_assessment_approval_status as raApprovalStatus, 
        CONCAT(DATE_FORMAT(b.booking_start, '%H'),':',DATE_FORMAT(b.booking_start,'%i'),'-',DATE_FORMAT(b.booking_end, '%H'),':',DATE_FORMAT(b.booking_end,'%i')) as timeslot,
        r.picture_URL as pictureURL, u.email as bookedBy, b.booking_status as Status,
        b.id as bookingId, r.id as roomId, u.id as userId
        FROM booking b JOIN room r ON b.room_id = r.id JOIN user_account u ON b.user_id = u.id
        WHERE u.id = ?
        AND b.booking_status != 'Cancelled'
      `;
    }
    if (pageName === "requests-list") {
      // this is the base query all additionl filters will be appended later in the code
      // the requests list shows *all* bookings whith booking status of "Awaiting Approval"
      sqlquery = `
        SELECT 
        r.room_number as roomNumber, r.building_name as building, r.capacity as minSeats,
        r.room_type as roomType, DATE_FORMAT(b.booking_start, '%Y-%m-%d') as date,
        b.risk_assessment_approval_status as raApprovalStatus, 
        CONCAT(DATE_FORMAT(b.booking_start, '%H'),':',DATE_FORMAT(b.booking_start,'%i'),'-',DATE_FORMAT(b.booking_end, '%H'),':',DATE_FORMAT(b.booking_end,'%i')) as timeslot,
        r.picture_URL as pictureURL, u.email as bookedBy, b.booking_status as Status,
        b.id as bookingId, r.id as roomId, u.id as userId
        FROM booking b JOIN room r ON b.room_id = r.id JOIN user_account u ON b.user_id = u.id
        WHERE booking_status = "Awaiting Approval"
      `;
    }
    if (pageName === "approved-list") {
      // this is the base query all additionl filters will be appended later in the code
      // the requests list shows *all* bookings whith booking status of "Awaiting Approval"
      sqlquery = `
        SELECT 
        r.room_number as roomNumber, r.building_name as building, r.capacity as minSeats,
        r.room_type as roomType, DATE_FORMAT(b.booking_start, '%Y-%m-%d') as date,
        b.risk_assessment_approval_status as raApprovalStatus, 
        CONCAT(DATE_FORMAT(b.booking_start, '%H'),':',DATE_FORMAT(b.booking_start,'%i'),'-',DATE_FORMAT(b.booking_end, '%H'),':',DATE_FORMAT(b.booking_end,'%i')) as timeslot,
        r.picture_URL as pictureURL, u.email as bookedBy, b.booking_status as Status,
        b.id as bookingId, r.id as roomId, u.id as userId
        FROM booking b JOIN room r ON b.room_id = r.id JOIN user_account u ON b.user_id = u.id
        WHERE booking_status = "Approved"
      `;
    }
    
    // code from here applies to any page displaying bookings with a filter on it
    // add the selection criteria for selecting bookings on the selected date
    //console.log("filters date: >" + filters.date + "<");
    if (filters.date != '') {
      sqlParameters.push(filters.date);
      sqlParameters.push(filters.date);
      sqlquery =
        sqlquery +
        ` 
          AND (
            b.booking_start >= DATE_ADD( ?
              , INTERVAL '00:01' HOUR_MINUTE) 
            AND 
            b.booking_end <= DATE_ADD( ?
              , INTERVAL '23:59' HOUR_MINUTE)
          ) 
        `;
    }
    // if we have a timeslot and a date then add the selection criteria for this
    if (filters.timeslot != "-NaN:NaN" && filters.date != '') {
      // split the timeslot up so we have start and end times
      var selectedDate = filters.date;
      var timeslots = filters.timeslot.split("-");
      var startTime = timeslots[0];
      var endTime = timeslots[1];
      sqlParameters.push(selectedDate);
      sqlParameters.push(startTime);
      sqlParameters.push(selectedDate);
      sqlParameters.push(endTime);
      sqlquery =
        sqlquery +
        ` 
        AND (
          b.booking_start >= DATE_ADD( ?, INTERVAL ? HOUR_MINUTE) 
          AND 
          b.booking_end <= DATE_ADD( ?, INTERVAL ? HOUR_MINUTE)
        ) 
      `;
    }
    // add any other filters to the end of the query
    if (filters.building != "") {
      sqlParameters.push(filters.building);
      sqlquery =
        sqlquery + " AND r.building_name = ? ";
    }
    if (filters.roomType != "") {
      sqlParameters.push(filters.roomType);
      sqlquery = sqlquery + " AND r.room_type = ? ";
    }
    if (filters.minSeats != "") {
      sqlParameters.push(filters.minSeats);
      sqlquery = sqlquery + " AND r.capacity >=  ? ";

    }
    // add the "order by" string
    sqlquery = sqlquery + " " + listOrder;
    // console.log("get bookings sql: " + sqlquery);
    //console.log("get booking sqlParameters: " + sqlParameters);
    // execute sql query
    db.query(sqlquery, sqlParameters, (err, results) => {
      if (err) {
        console.error(err.message);
        reject(err); // if there is an error reject the Promise
      } else {
        resolve(results); // the Promise is resolved with the result of the query
      }
    });
  });
}

// gets the roomtypes to be displayed in the filter from the database
// some pages require all the roomtypes, others require this list to be filtered
// this function uses a Promise, which means that the code waits for a result when
// used with promise all in the route code.
function getRoomTypes(pageName, userId) {
  return new Promise((resolve, reject) => {
    sqlquery = "";
    if (pageName === "bookings-list") {
      // only get the room types that the logged in user has made bookings for
      sqlquery =
        "SELECT DISTINCT r.room_type as room_type FROM room r JOIN booking b ON b.room_id = r.id JOIN user_account u ON b.user_id = u.id WHERE u.id = ? ORDER BY room_type";
    } else {
      // get all room_types that are available
      sqlquery =
        "SELECT DISTINCT r.room_type as room_type FROM room r ORDER BY room_type";
    }
    // execute sql query
    db.query(sqlquery, [userId], (err, results) => {
      if (err) {
        console.error(err.message);
        reject(err); // if there is an error reject the Promise
      } else {
        resolve(results); // the Promise is resolved with the result of the query
      }
    });
  });
}

// gets the buildings to be displayed in the filter
// some pages require all the rooms, others require this list to be filtered
function getBuildingNames(pageName, userId) {
  return new Promise((resolve, reject) => {
    sqlquery = "";
    if (pageName === "bookings-list") {
      // only get the buildings that the logged in user has made bookings for
      sqlquery =
        "SELECT DISTINCT r.building_name as building_name FROM room r JOIN booking b ON b.room_id = r.id JOIN user_account u ON b.user_id = u.id WHERE u.id = ? ORDER BY building_name";
    } else {
      // get all buildings 
      sqlquery =
        "SELECT DISTINCT r.building_name as building_name FROM room r ORDER BY building_name";
    }
    // execute sql query
    db.query(sqlquery, [userId], (err, results) => {
      if (err) {
        console.error(err.message);
        reject(err); // if there is an error reject the Promise
      } else {
        resolve(results); // the Promise is resolved with the result of the query
      }
    });
  });
}

// get rooms the database for the book room page, and also apply filters if there are any
// if there is a date and a timeslot filled in then remove any rooms that have a booking that
// overlaps with the date and times we looking for
function getRooms(pageName, filters, listOrder, roomId) {
  return new Promise((resolve, reject) => {
    var sqlquery = "";
    var sqlParameters = [];
    // if calling from edit room we only need one record and there are no other where clauses
    if (pageName === "edit-room") {
      sqlParameters.push(roomId);
      sqlquery = `
        SELECT id as roomId, room_number as roomNumber, 
        building_name as buildingName, picture_URL as pictureURL,
        capacity, is_accepting_bookings as isAcceptingBookings,
        room_type as roomType FROM room r WHERE id = ?
      `;
    }
    else {
      // if the filter date OR there is no selecton for start time and duration then get all the rooms and other filter criteria are added after the if else
      if (filters.date == "" || filters.timeslot == "-NaN:NaN") {
        sqlquery = `
            SELECT r.id as roomId, r.room_number as roomNumber, r.building_name as building, r.capacity as capacity,
            r.picture_URL as pictureURL, r.room_type as roomType
            FROM room r WHERE r.is_accepting_bookings = 1 `;
      } else {
        // if we have a data and a timeslot do all the work to remove rooms that are already booked for the date, duration and timeslots in the filter
        // this needs a version of ben's code in the app post bookings-list-filtered to extract these values from the filter
        var selectedDate = filters.date;
        var timeslots = filters.timeslot.split("-");
        var startTime = timeslots[0];
        var endTime = timeslots[1];
        // calclate duration in mins from the filter timeslot
        var intStartTime = timeslots[0].split(":").map(Number);
        var durationStart = intStartTime[0] * 60 + intStartTime[1];
        var intEndTime = timeslots[1].split(":").map(Number);
        var durationEnd = intEndTime[0] * 60 + intEndTime[1];
        var overallDuration = durationEnd - durationStart;
        sqlParameters.push(selectedDate);
        sqlParameters.push(startTime);
        sqlParameters.push(selectedDate);
        sqlParameters.push(endTime);
        sqlParameters.push(selectedDate);
        sqlParameters.push(selectedDate);
        sqlParameters.push(startTime);
        sqlParameters.push(selectedDate);
        sqlParameters.push(endTime);
        sqlParameters.push(overallDuration);
        sqlParameters.push(selectedDate);
        sqlParameters.push(startTime);
        sqlquery =
          `
        SELECT r.id as roomId, r.room_number as roomNumber, r.building_name as building, r.capacity as capacity,
        r.picture_URL as pictureURL, r.room_type as roomType  
        FROM room r
        # If there are ANY number of bookings for this room that start before the timeslot
        # and end after the timeslot exclude the room.  The fixes the issue where multiple bookings on
        # a room in the timescale could create duplicate rooms.  Which would have happened if we joined rooms and bookings
        WHERE NOT EXISTS (
          SELECT 1
          FROM booking b
          WHERE b.room_id = r.id
          AND (
                (
                  b.booking_start <= DATE_ADD( ?, INTERVAL ? HOUR_MINUTE) 
                  AND 
                  b.booking_end >= DATE_ADD(?, INTERVAL ? HOUR_MINUTE)
                )
          )
          AND b.booking_status != 'Cancelled' 
        )   
        # from that list above
        # exlude any room that has a booking that starts before the timeslot and finishes after the timeslot
        # OR exclude any room that has a booking that overlaps with the timeslot
        AND r.id NOT IN (
          SELECT room_id
          FROM booking
          WHERE DATE(booking_start) = ?
          AND (
                (
                  booking_start <= DATE_ADD( ? , INTERVAL ? HOUR_MINUTE) 
                  AND 
                  booking_end >= DATE_ADD( ? , INTERVAL ? HOUR_MINUTE)
                )
              OR (
                booking_end >= DATE_ADD(booking_start, INTERVAL ? MINUTE)
                AND booking_start <= DATE_ADD( ? , INTERVAL ? HOUR_MINUTE)
              )
          )
          AND booking_status != 'Cancelled' 
        ) AND r.is_accepting_bookings = 1 `;
      }
      // add any other filters to the end of the query
      if (filters.building != "") {
        sqlParameters.push(filters.building);
        sqlquery =
          sqlquery + " AND r.building_name = ? ";
      }
      if (filters.roomType != "") {
        sqlParameters.push(filters.roomType);
        sqlquery = sqlquery + " AND r.room_type = ? ";
      }
      if (filters.minSeats != "") {
        sqlParameters.push(filters.minSeats);
        sqlquery = sqlquery + " AND r.capacity >=  ? ";

      }
    }

    // add the "order by" string
    sqlquery = sqlquery + " " + listOrder;

    // execute sql query
    //console.log("getRooms sqlquery: " + sqlquery);
    //console.log("getrooms sqlParameters: " + sqlParameters);
    db.query(sqlquery, sqlParameters, (err, results) => {
      if (err) {
        console.error(err.message);
        reject(err); // if there is an error reject the Promise
      } else {
        resolve(results); // the Promise is resolved with the result of the query
      }
    });
  });
}

// sort booking functions:
function sortByBuilding(bookings) {
  bookings.sort(function (a, b) {
    // sort by rooms alphabetically:
    if (a.building < b.building) {
      return -1;
    }
    if (a.building > b.building) {
      return 1;
    }
    // If the bookings are in the same building sort by room number:
    if (a.building === b.building) {
      return a.roomNumber - b.roomNumber;
    }
  });
  return bookings;
}
function sortByTime(bookings) {
  bookings.sort(function (a, b) {
    // Convert the date strings into date objects:
    var aDateSplit = a.date.split("/"); // form is YYYY/MM/DD - split at "/"
    var bDateSplit = b.date.split("/");
    var aDate = new Date(
      parseInt(aDateSplit[0]),
      parseInt(aDateSplit[1]) - 1,
      parseInt(aDateSplit[2])
    );
    var bDate = new Date(
      parseInt(bDateSplit[0]),
      parseInt(bDateSplit[1]) - 1,
      parseInt(bDateSplit[2])
    );
    // Compare the dates
    if (aDate < bDate) {
      return -1;
    }
    if (aDate > bDate) {
      return 1;
    }
    // If the dates the same date then order by ascending timeslots from starting time
    var startingTimeA = a.timeslot.split("-")[0]; // remove central dash and second time
    var startingTimeB = b.timeslot.split("-")[0];
    var aTimeSlot = parseInt(startingTimeA.split(":")[0]);
    var bTimeSlot = parseInt(startingTimeB.split(":")[0]);
    return aTimeSlot - bTimeSlot;
  });
  return bookings;
}
function sortByStatus(bookings) {
  // sorts bookings as follows - Approved, Awaiting Approval, Denied
  var sortedBookings = [];
  var awaitingApprovalBookings = [];
  for (let i = 0; i < bookings.length; i++) {
    switch (bookings[i].Status) {
      case "Approved":
        sortedBookings.unshift(bookings[i]);
        break;
      case "Awaiting Approval":
        awaitingApprovalBookings.push(bookings[i]);
        break;
      case "Denied":
        sortedBookings.push(bookings[i]);
        break;
    }
  }
  var lastApproved = -1;
  for (let i = 0; i < sortedBookings.length; i++) {
    if (sortedBookings[i].Status !== "Approved") {
      lastApproved = i;
      break;
    }
  }
  // insert the awaiting approval bookings at the appropriate index:
  Array.prototype.splice.apply(
    sortedBookings,
    [lastApproved, 0].concat(awaitingApprovalBookings)
  );
  return sortedBookings;
}

// booking list route 
app.get("/bookings-list", isLoggedIn, (req, res) => {
  var loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  // get the filters from the user session, else initialise the filters
  // commented code that loaded the filters from the session
  // when the user opens this page or refreshes the page the filters are now reset
  var filters = {};
  // if (req.session.bookingListFilters) filters = req.session.bookingListFilters;
  // else {
    filters = {
      date: "",
      timeslot: "-NaN:NaN",
      building: "",
      roomType: "",
      minSeats: 1,
      duration: "",
    };
    // save the current filters in the user session
    req.session.bookingListFilters = filters;
  // }
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  switch (req.session.bookingListOrder) {
    case "o_b_Room":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    case "o_b_Time":
      listOrder = " ORDER BY b.booking_start";
      break;
    case "o_b_Status":
      listOrder = " ORDER BY b.booking_status";
      break;
    default:
      listOrder = " ORDER BY b.booking_start";
      break;
  }
  Promise.all([
    getRoomTypes("bookings-list", userId), // Promise.all[0]
    getBuildingNames("bookings-list", userId), // Promise.all[1]
    getBookings("bookings-list", userId, filters, listOrder), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, bookings]) => {
      // if you had more data just add the name of it here first variable is the result of promise.all[0] etc.
      res.render("bookings-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        bookings,
        roomTypes,
        buildingNames,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

// this route is re-used for filtering AND ordering, if there no req.body.orderSelection
// then we are processing filtering, otherwise we are processing ordering
app.post("/bookings-list-filtered", isLoggedIn, function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  var filters = {};
  // work out if we are posting to filter the list or order the list
  // if the POST doesn't contain req.body.orderSelection then we are have a post that is filtering
  if (!req.body.orderSelection) {
    var startingTimeslot = req.body.timeslot.replace("starting from ", "");
    var bookingDuration = req.body.durationRange;
    var bookingHours = Math.floor(bookingDuration / 60);
    var bookingMinutes = bookingDuration % 60;
    var startingTimeSplit = startingTimeslot.split(":");
    var endingTimeslot =
      String(parseInt(startingTimeSplit[0]) + bookingHours).padStart(2, "0") +
      ":" +
      String(parseInt(startingTimeSplit[1]) + bookingMinutes).padStart(2, "0");
    filters = {
      date: req.body.date,
      timeslot: startingTimeslot + "-" + endingTimeslot,
      building: req.body.building,
      roomType: req.body.roomType,
      minSeats: req.body.seating,
      duration: req.body.durationRange,
    };
    // save the current filters in the user session, this is so they can be re-used when there is no filter POSTED
    req.session.bookingListFilters = filters;
  } else {
    filters = req.session.bookingListFilters;
    // save the orderSelection
    req.session.bookingListOrder = req.body.orderSelection;
  }
  // get the current list order from the session and if not present initialise the order
  // if (!req.session.bookingListOrder) req.session.bookingListOrder = ""
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  //console.log("session.roomListOrder: " + req.session.bookingListOrder);
  switch (req.session.bookingListOrder) {
    case "o_b_Room":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    case "o_b_Time":
      listOrder = " ORDER BY b.booking_start";
      break;
    case "o_b_Status":
      listOrder = " ORDER BY b.booking_status";
      break;
    default:
      listOrder = " ORDER BY b.booking_start";
      break;
  }
  Promise.all([
    getRoomTypes("bookings-list", userId), // Promise.all[0]
    getBuildingNames("bookings-list", userId), // Promise.all[1]
    getBookings("bookings-list", userId, filters, listOrder), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, bookings]) => {
      // if you had more data calls above you name it here, the first variable is the result of promise.all[0] etc.
      console.log(filters);
      res.render("bookings-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        bookings,
        roomTypes,
        buildingNames,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

/**
 * requests-list route
 * this route is used to display the bookings that are awaiting approval by the co-ordinator
 * requests-list-filtered route is used by this rendered page to filter the list when 
 * the filter is applied
 *  */ 
app.get("/requests-list", isLoggedIn, (req, res) => {
  var loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  // get the filters from the user session, else initialise the filters
  var filters = {};
  //if (req.session.requestsListFilters) filters = req.session.requestsListFilters;
  //else {
    filters = {
      date: "",
      timeslot: "-NaN:NaN",
      building: "",
      roomType: "",
      minSeats: 1,
      duration: "",
    };
    // save the current filters in the user session
    req.session.requestsListFilters = filters;
  //}
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  switch (req.session.requestsListOrder) {
    case "o_b_Room":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    case "o_b_Time":
      listOrder = " ORDER BY b.booking_start";
      break;
    case "o_b_Status":
      listOrder = " ORDER BY b.booking_status";
      break;
    case "o_b_Risk_Approved":
      listOrder = " ORDER BY b.risk_assessment_approval_status DESC, b.confirmed_on ASC, b.booking_start ASC"
      break;
    default:
      listOrder = " ORDER BY b.booking_start";
      break;
  }
  Promise.all([
    getRoomTypes("requests-list", userId), // Promise.all[0]
    getBuildingNames("requests-list", userId), // Promise.all[1]
    getBookings("requests-list", userId, filters, listOrder), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, bookings]) => {
      // if you had more data just add the name of it here first variable is the result of promise.all[0] etc.
      res.render("requests-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        bookings,
        roomTypes,
        buildingNames,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

/** 
 * requests-list-filtered route
 * this route is the target for the filter form, and the order by form in the requests-lists page
*/
app.post("/requests-list-filtered", isLoggedIn, function (req, res) {
  var loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  var filters = {};
  // work out if we are posting to filter the list or order the list
  // if the POST doesn't contain req.body.orderSelection then we are have a post that is filtering
  if (!req.body.orderSelection) {
    var startingTimeslot = req.body.timeslot.replace("starting from ", "");
    var bookingDuration = req.body.durationRange;
    var bookingHours = Math.floor(bookingDuration / 60);
    var bookingMinutes = bookingDuration % 60;
    var startingTimeSplit = startingTimeslot.split(":");
    var endingTimeslot =
      String(parseInt(startingTimeSplit[0]) + bookingHours).padStart(2, "0") +
      ":" +
      String(parseInt(startingTimeSplit[1]) + bookingMinutes).padStart(2, "0");
    filters = {
      date: req.body.date,
      timeslot: startingTimeslot + "-" + endingTimeslot,
      building: req.body.building,
      roomType: req.body.roomType,
      minSeats: req.body.seating,
      duration: req.body.durationRange,
    };
    // save the current filters in the user session, this is so they can be re-used when there is no filter POSTED
    req.session.requestsListFilters = filters;
  } else {
    filters = req.session.requestsListFilters;
    // save the orderSelection
    req.session.requestsListOrder = req.body.orderSelection;
  }
  // get the current list order from the session and if not present initialise the order
  // if (!req.session.requestListOrder) req.session.requestListOrder = ""
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  //console.log("session.requestListOrder: " + req.session.requestListOrder);
  switch (req.session.requestsListOrder) {
    case "o_b_Room":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    case "o_b_Time":
      listOrder = " ORDER BY b.booking_start";
      break;
    case "o_b_Status":
      listOrder = " ORDER BY b.booking_status";
      break;
    case "o_b_Risk_Approved":
      listOrder = " ORDER BY b.risk_assessment_approval_status DESC, b.confirmed_on ASC, b.booking_start ASC"
      break;
    default:
      listOrder = " ORDER BY b.booking_start";
      break;
  }
  Promise.all([
    getRoomTypes("requests-list", userId), // Promise.all[0]
    getBuildingNames("requests-list", userId), // Promise.all[1]
    getBookings("requests-list", userId, filters, listOrder), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, bookings]) => {
      // if you had more data calls above you name it here, the first variable is the result of promise.all[0] etc.
      console.log(filters);
      res.render("requests-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        bookings,
        roomTypes,
        buildingNames,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});


/**
 * approved-list route
 * this route renders a list page with a filter and shows ALL approved bookings
 * approved bookings are those with a booking_status of "Approved"
 *  */ 
app.get("/approved-list", isLoggedIn, (req, res) => {
  var loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  // get the filters from the user session, else initialise the filters
  var filters = {};
  //if (req.session.approvedListFilters) filters = req.session.approvedListFilters;
  //else {
    filters = {
      date: "",
      timeslot: "-NaN:NaN",
      building: "",
      roomType: "",
      minSeats: 1,
      duration: "",
    };
    // save the current filters in the user session
    req.session.approvedListFilters = filters;
  //}
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  console.log(req.session.approvedListOrder);
  switch (req.session.approvedListOrder) {
    case "o_b_Room":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    case "o_b_Time":
      listOrder = " ORDER BY b.booking_start";
      break;
    case "o_b_Status":
      listOrder = " ORDER BY b.booking_status";
      break;
    case "o_b_Recent_Approved":
      listOrder = " ORDER BY b.confirmed_on DESC";
      break;
    default:
      listOrder = " ORDER BY b.booking_start";
      break;
  }
  Promise.all([
    getRoomTypes("approved-list", userId), // Promise.all[0]
    getBuildingNames("approved-list", userId), // Promise.all[1]
    getBookings("approved-list", userId, filters, listOrder), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, bookings]) => {
      // if you had more data just add the name of it here first variable is the result of promise.all[0] etc.
      res.render("approved-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        bookings,
        roomTypes,
        buildingNames,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

/**
 * approved-list-filtered
 * this route is the target for the filter form and the order by form in approved-list.ejs
 */
app.post("/approved-list-filtered", isLoggedIn, function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  var filters = {};
  // work out if we are posting to filter the list or order the list
  // if the POST doesn't contain req.body.orderSelection then we are have a post that is filtering
  if (!req.body.orderSelection) {
    var startingTimeslot = req.body.timeslot.replace("starting from ", "");
    var bookingDuration = req.body.durationRange;
    var bookingHours = Math.floor(bookingDuration / 60);
    var bookingMinutes = bookingDuration % 60;
    var startingTimeSplit = startingTimeslot.split(":");
    var endingTimeslot =
      String(parseInt(startingTimeSplit[0]) + bookingHours).padStart(2, "0") +
      ":" +
      String(parseInt(startingTimeSplit[1]) + bookingMinutes).padStart(2, "0");
    filters = {
      date: req.body.date,
      timeslot: startingTimeslot + "-" + endingTimeslot,
      building: req.body.building,
      roomType: req.body.roomType,
      minSeats: req.body.seating,
      duration: req.body.durationRange,
    };
    // save the current filters in the user session, this is so they can be re-used when there is no filter POSTED
    req.session.approvedListFilters = filters;
  } else {
    filters = req.session.approvedListFilters;
    // save the orderSelection
    req.session.approvedListOrder = req.body.orderSelection;
  }
  // get the current list order from the session and if not present initialise the order
  // if (!req.session.approvedListOrder) req.session.approvedListOrder = ""
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  //console.log("session.approvedListOrder: " + req.session.approvedListOrder);
  switch (req.session.approvedListOrder) {
    case "o_b_Room":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    case "o_b_Time":
      listOrder = " ORDER BY b.booking_start";
      break;
    case "o_b_Status":
      listOrder = " ORDER BY b.booking_status";
      break;
    case "o_b_Recent_Approved":
      listOrder = " ORDER BY b.confirmed_on DESC";
      break;
    default:
      listOrder = " ORDER BY b.booking_start";
      break;
  }
  Promise.all([
    getRoomTypes("approved-list", userId), // Promise.all[0]
    getBuildingNames("approved-list", userId), // Promise.all[1]
    getBookings("approved-list", userId, filters, listOrder), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, bookings]) => {
      // if you had more data calls above you name it here, the first variable is the result of promise.all[0] etc.
      console.log(filters);
      res.render("approved-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        bookings,
        roomTypes,
        buildingNames,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});


//this route is used to display the add-room page
app.get("/add-room", isLoggedIn, (req, res) => {
  // checking for admin role
  if (req.session.user_role !== "admin") {
    return res.send("Unauthorized access");
  }

  // get the room types from the database
  const query = "SELECT room_type FROM lookup_room_type";
  db.query(query, (err, roomTypes) => {
    if (err) {
      console.error(err.message);
      return res.send("Error fetching room types");
    }
    // pass the roomTypes to the add-room page
    res.render("add-room", { roomTypes: roomTypes });
  });
});

app.post("/add-room", isLoggedIn, upload.single('roomImageFile'), (req, res) => {
  if (req.session.user_role !== "admin") {
    return res.send("Unauthorized access");
  }

  // Sanitize the input
  const roomNumber = sanitiseHtml(req.body.roomNumber);
  const buildingName = sanitiseHtml(req.body.buildingName);
  const roomType = sanitiseHtml(req.body.roomType);
  const capacity = parseInt(req.body.capacity);
  let pictureURL = req.body.pictureURL ? sanitiseHtml(req.body.pictureURL) : null;
  const isAcceptingBookings = req.body.isAcceptingBookings === "true";

  //Check if a file was uploaded
  if (req.file) {
    //Uploads to the rooms folder
    pictureURL = `/rooms/${req.file.filename}`; 
  }

  let sqlQuery = "INSERT INTO room (room_number, building_name, room_type, capacity, picture_URL, is_accepting_bookings) VALUES (?, ?, ?, ?, ?, ?)";

  // Execute SQL query
  db.query(sqlQuery, [roomNumber, buildingName, roomType, capacity, pictureURL, isAcceptingBookings], (err, result) => {
    if (err) {
      console.error(err.message);
      return res.send("Error in adding room");
    }
    res.redirect("add-room-success");
  });
});

//----------------------------------------VIEW BOOKING--------------------------------------------------------
app.get("/view-booking", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  //console.log(loggedInMessage + " " + userrole);
  res.render("view-booking.ejs", { loggedInMessage, userrole, email });
});

function getBookingById(bookingId) {
  return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM booking WHERE id = ?';
      db.query(query, [bookingId], (error, results) => {
          if (error) {
              reject(error);
          } else {
              if (results.length > 0) {
                  resolve(results[0]); // Assuming booking ID is unique
              } else {
                  resolve(null); // No booking found for the given ID
              }
          }
      });
  });
}


app.get("/view-booking/:id", isLoggedIn, (req, res) => {  
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  //console.log(loggedInMessage + " " + userrole);  
    try{
    // get the booking id from the url
    const bookingId = req.params.id;
    getBookingById(bookingId);
      const query =
    `
        SELECT 
        r.room_number as roomNumber, 
        r.building_name as building, r.capacity as minSeats,
        r.room_type as roomType, 
        DATE_FORMAT(b.booking_start, '%Y-%m-%d') as date,
        CONCAT(DATE_FORMAT(b.booking_start, '%H'),
        ':',
        DATE_FORMAT(b.booking_start,'%i'),
        '-',
        DATE_FORMAT(b.booking_end, '%H'),
        ':'
        ,DATE_FORMAT(b.booking_end,'%i')) as timeslot,
        r.picture_URL as pictureURL, 
        u.email as bookedBy, 
        b.booking_status as Status,
        b.id as bookingId, 
        r.id as roomId, 
        u.id as userId,
        ra.risk1 as risk1,
        ra.risk2 as risk2,
        ra.approval_status as approvalStatus,
        ra.reviewed_by as reviewedBy
        FROM booking b
        JOIN user_account u ON b.user_id = u.id
        JOIN room r ON b.room_id = r.id
        LEFT JOIN risk_assessment ra ON b.id = ra.booking_id
        WHERE b.id = ?
      `;

    db.query(query, [bookingId], (err, result) => {
      if(err){
        console.log(err)
      } else{
        //var bookingDetails = result;
        console.log(result);
        res.render("view-booking.ejs", {loggedInMessage, userrole, email, result});
      }
    })
  } catch(error){
  console.error("Error retrieving booking details:", error);
 /*  res.status(500).send("Internal Server Error"); */
  }  
});

app.get("/review-booking/:id", isLoggedIn, (req, res) => {  
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  const bookingId = sanitiseHtml(req.params.id);
  const query =
  `
    SELECT 
    r.room_number as roomNumber, 
    r.building_name as building, r.capacity as minSeats,
    r.room_type as roomType, 
    DATE_FORMAT(b.booking_start, '%Y-%m-%d') as date,
    CONCAT(DATE_FORMAT(b.booking_start, '%H'),
    ':',
    DATE_FORMAT(b.booking_start,'%i'),
    '-',
    DATE_FORMAT(b.booking_end, '%H'),
    ':'
    ,DATE_FORMAT(b.booking_end,'%i')) as timeslot,
    r.picture_URL as pictureURL, 
    u.email as bookedBy, 
    b.booking_status as Status,
    b.id as bookingId, 
    r.id as roomId, 
    u.id as userId,
    ra.risk1 as risk1,
    ra.risk2 as risk2,
    ra.approval_status as approvalStatus,
    ra.reviewed_by as reviewedBy
    FROM booking b
    JOIN user_account u ON b.user_id = u.id
    JOIN room r ON b.room_id = r.id
    LEFT JOIN risk_assessment ra ON b.id = ra.booking_id
    WHERE b.id = ?
  `;

  db.query(query, [bookingId], (err, result) => {
    if(err){
      console.log(err)
    } else{
      console.log(result);
      res.render("review-booking.ejs", {loggedInMessage, userrole, email, result});
    }
  }) 
});


/**
 * review-booking-submit
 * target for the actions on the review booking page
 * reviewActions: rejectRisk, approveRisk, approveBooking, rejectBooking
 */
app.post("/review-booking-submit", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  var userId = req.session.userid;
  var bookingId = sanitiseHtml(req.body.bookingId);
  var reviewAction = sanitiseHtml(req.body.reviewAction);
  var bookingData = [];
  var riskAssessmentData = [];
  var bookingUpdateResult = "";
  // Format the current date and time so it can be used in the update statements 
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const nowDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  // manage booking approval and rejection
  if (reviewAction == "rejectBooking" || reviewAction == "approveBooking") {
    // we need to update the confirmed_date and the booking_status and we are updating the bookingId
    bookingData = [nowDateTime];
    if (reviewAction == "rejectBooking") bookingData.push("Denied")
    else bookingData.push("Approved")
    bookingData.push(bookingId);
    console.log(reviewAction + " booking data: " + bookingData[0] + ", " + bookingData[1] + ", " +  bookingData[2] );
    insertUpdateBooking("UPDATE_STATUS_CONFIRMED_ON", bookingData)
      .then((bookingUpdateResult) => {
        res.redirect("./requests-list");
      })
      .catch((error) => {
        console.error("update booking status: An error occurred:", error);
      });
  }
  // manage risk assessment approval and rejection
  // the risk assessment needs updating in the risk assessment table
  // this requires that we know the current user who is the approver
  // we also need to update a field in the booking table that shows if the risk assessment is approved.
  if (reviewAction == "rejectRisk" || reviewAction == "approveRisk") {
    // current user is the reviewed_by
    riskAssessmentData = [userId];
    if (reviewAction == "rejectRisk") riskAssessmentData.push(0)
    else riskAssessmentData.push(1)
    // this is the record we are updating
    riskAssessmentData.push(bookingId);
    console.log(reviewAction + " riskAssessmentData: " + riskAssessmentData[0] + ", " + riskAssessmentData[1] + ", " + riskAssessmentData[2] );
    insertUpdateRiskAssessment("UPDATE_APPROVED_REVIEWED_BY", riskAssessmentData)
      // when that update is complete update the bookings table 
      .then((bookingUpdateResult) => {
        if (reviewAction == "approveRisk") bookingData = ["Risk Assessment Approved",bookingId];
        if (reviewAction == "rejectRisk") bookingData = ["Risk Assessment Rejected",bookingId];
        insertUpdateBooking("UPDATE_RISK_ASSESS_APPROVAL",bookingData)
      })
      // when that update is complete - redirect
      .then((riskAssessmentResult) => {
        res.redirect("./requests-list");
      })
      .catch((error) => {
        console.error("update booking status: An error occurred:", error);
      });
  }
});

app.post("/edit-booking", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  var bookingId = sanitiseHtml(req.body.bookingId);
  const query =  `
    SELECT 
    r.room_number as roomNumber, 
    r.building_name as building, r.capacity as minSeats,
    r.room_type as roomType, 
    DATE_FORMAT(b.booking_start, '%Y-%m-%d') as date,
    CONCAT(DATE_FORMAT(b.booking_start, '%H'),
    ':',
    DATE_FORMAT(b.booking_start,'%i'),
    '-',
    DATE_FORMAT(b.booking_end, '%H'),
    ':'
    ,DATE_FORMAT(b.booking_end,'%i')) as timeslot,
    r.picture_URL as pictureURL, 
    u.email as bookedBy, 
    b.booking_status as Status,
    b.id as bookingId, 
    r.id as roomId, 
    u.id as userId,
    ra.risk1 as risk1,
    ra.risk2 as risk2,
    ra.approval_status as approvalStatus,
    ra.reviewed_by as reviewedBy
    FROM booking b
    JOIN user_account u ON b.user_id = u.id
    JOIN room r ON b.room_id = r.id
    LEFT JOIN risk_assessment ra ON b.id = ra.booking_id
    WHERE b.id = ?
  `;

  db.query(query, [bookingId], (err, result) => {
    if(err) console.log("edit-booking: error in sql query: " + err)
    else {
      console.log("edit-booking result data: " + result);
      res.render("edit-booking.ejs", {loggedInMessage, userrole, email, result});
    } 
  })
});

app.post("/edit-booking-submit", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  var bookingId = sanitiseHtml(req.body.bookingId);
  //var risk1 = sanitiseHtml(req.body.risk1);
  var risk1 = sanitiseHtml(req.body.risk1, {
    allowedTags: sanitiseHtml.defaults.allowedTags.concat(['span','table','td','tr','p']),
    allowedAttributes: {
      '*': ['style','width','colspan','border','border-left','border-right','border-top','border-bottom']
    },
    allowedStyles: {
      '*': {
        // Allow color and background-color for any element
        'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, /^(red|black|yellow|white)$/i],
        'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, /^(red|black|yellow|white)$/i],
        'background': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/, /^hsl\(/, /^hsla\(/, /^(red|black|yellow|white)$/i]
      }
    }
  });
  var risk2 = sanitiseHtml(req.body.risk2);

  const query =  `
    UPDATE risk_assessment SET risk1 = ?, risk2 = ? WHERE booking_id = ?
  `;

  // select statement for testing before adding in update
  //const query = 'select * from risk_assessment where ? != 0 and ? !=0 and ? = booking_id'

  db.query(query, [risk1, risk2, bookingId], (err, result) => {
    if(err) console.log("edit-booking: error in sql query: " + err)
    else {
      res.redirect("/bookings-list");
    } 
  })
});

app.post("/cancel-booking", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  var bookingId = sanitiseHtml(req.body.bookingId);
  updateCancelledQuery = "UPDATE booking " +
    "SET booking_status = 'Cancelled' " +
    "WHERE id = ?;";
  db.query(updateCancelledQuery, [bookingId], (err, result) => {
    if (err) {
      console.log("cancel-booking: error in sql query: " + err);
    } else {
      res.send('<p>Booking ' + bookingId + ' cancelled successfully.</p></br><a href="/login-success">Click to go back to the menu</a>');
    } 
  });
  //res.send(updateCancelledQuery);
});

// this displays the room details from the database and the
// booking information passed into the page from the room-list is roomId, selectedDate and selectedTimeSlot
app.post("/add-booking", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  // console.log("add_booking email: " + req.session.email + "userrole: " + req.session.user_role);
  // get the data from the URL that is POSTED to this page
  var roomId = req.body.roomId;
  var selectedDate = req.body.selectedDate;
  var selectedTimeslot = req.body.selectedTimeslot;
  // get the room data - we have the userrole and the email aready from the session data
  let sqlquery = `
    SELECT  r.id AS roomId, r.room_number AS roomNumber, r.building_name AS building, 
            r.capacity AS capacity, r.picture_URL AS pictureURL, 
            r.room_type AS roomType
    FROM room r 
    WHERE r.id = ?`;
  // execute sql query
  db.query(sqlquery, roomId, (err, result) => {
    if (err) {
      console.log("add-booking db query error");
      console.error(err.message);
      res.render("bookings-list");
    }
    let pageData = Object.assign(
      {},
      { loggedInMessage },
      { userrole },
      { email },
      { room: result },
      { selectedDate },
      { selectedTimeslot }
    );
    res.render("add-booking.ejs", pageData);
  });
});

/**
 * Inserts or updates a booking.
 * the mode parameter is checked and based on that different SQL can be run
 * this was implemented as a function so it can return the id of any insert that it performs
 * but it can also be used for updates it can be used in a Promise.All if the queries can come back in any order
 * or it can be used
 * @param {*} mode                 mode can be INSERT or UPDATE_STATUS or UPDATE_RISK_ASSESS_APPROVAL
 * @param {*} changedDataFields    Array: The fields, in order, that are to replaced the SQLQuery parameters
 * @returns                        id of record inserted only if this is an insertion, else returns the record set
 */
function insertUpdateBooking(mode, changedDataFields) {
  return new Promise((resolve, reject) => {
    var sqlquery = "";
    if (mode == "INSERT") {
      sqlquery = `
        INSERT INTO booking 
          (booking_start, booking_end, booking_reason, booking_status,
          risk_assessment_approval_status, confirmed_on, cancelled_on, user_id, room_id)
          VALUES (
          ?, ?, NULL, "Awaiting Approval",
          0, NULL, NULL, ?, ?)
        `;
    }
    if (mode == "UPDATE_STATUS") {
      sqlquery = `
        UPDATE booking SET booking_status = ? where id = ?
      `;
    }
    if (mode == "UPDATE_STATUS_CONFIRMED_ON") {
      sqlquery = `
        UPDATE booking SET confirmed_on = ?, booking_status = ? where id = ? 
      `;
    }
    if (mode == "UPDATE_RISK_ASSESS_APPROVAL") {
      sqlquery = `
        UPDATE booking SET risk_assessment_approval_status = ? where id = ? 
      `;
    }
    console.log("insertUpdateBooking: " + sqlquery);
    // add more modes here as necessary
    // execute sql query
    db.query(sqlquery, changedDataFields, (err, results) => {
      if (err) {
        console.error(err.message);
        reject(err); // if there is an error reject the Promise
      } else {
        if (mode == "INSERT") {
          resolve(results.insertId); // this returns the id for the record inserted which we can use in other queries
        } else {
          resolve(results);
        }
      }
    });
  });
}

/**
 * Inserts or updates a risk assessment.
 * the mode parameter is checked and based on that different SQL can be run
 * this was implemented as a function so it can return the id of any insert that it performs
 * but it can also be used for updates it can be used in a Promise.All if the queries can come back in any order
 * or it can be used
 * @param {*} mode                 mode can be INSERT
 * @param {*} changedDataFields    Array: The fields, in order, that are to replaced the SQLQuery parameters
 * @returns                        record set from the database
 */
// inserts the new risk assessment, same logic as insertUpdateBooking
function insertUpdateRiskAssessment(mode, changedDataFields) {
  return new Promise((resolve, reject) => {
    var sqlquery = "";
    if (mode == "INSERT") {
      sqlquery = `
        INSERT INTO risk_assessment 
          (risk1, risk2, approval_status, reviewed_by, booking_id)
        VALUES (?, ?, 0, NULL, ?)
      `;
    }
    // add more modes here as necessary for updating etc
    if (mode == "UPDATE_APPROVED_REVIEWED_BY") {
      sqlquery = `
        UPDATE risk_assessment SET  reviewed_by = ?, approval_status = ?
        WHERE booking_id = ?
      `;
    }
    // execute sql query
    console.log("insertUpdateRiskAssessment: " + sqlquery);
    db.query(sqlquery, changedDataFields, (err, results) => {
      if (err) {
        console.error(err.message);
        reject(err); // if there is an error reject the Promise
      } else {
        resolve(results); // the Promise is resolved with the result of the query
      }
    });
  });
}

// this processes the booking when the confirm button is pressed
app.post("/add-booking-submit", isLoggedIn, (req, res) => {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var email = req.session.email;
  var userId = req.session.userid;

  // sanitising the input
  const selectedDate = sanitiseHtml(req.body.selectedDate);
  const selectedTimeslot = sanitiseHtml(req.body.selectedTimeslot);
  const roomId = sanitiseHtml(req.body.roomId);
  const bookingStart = selectedDate + " " + selectedTimeslot.split("-")[0];
  const bookingEnd = selectedDate + " " + selectedTimeslot.split("-")[1];
  const risk1 = sanitiseHtml(req.body.risk1);
  const risk2 = sanitiseHtml(req.body.risk2);
  //console.log("selected timeslot:" + selectedTimeslot);
  //console.log("booking start: " + bookingStart);
  //console.log("booking end: " + bookingEnd);
  var bookingData = [bookingStart, bookingEnd, userId, roomId];
  var riskAssessmentData = [risk1, risk2];
  //console.log("booking data: " + bookingData);
  //console.log("riskAssessmentData data: " + riskAssessmentData);

  // these updates need to happen sequentially so this doesn't use promise.all
  // the booking needs to be created and then the id that was just created in the booking table
  // needs to be used to then create the risk assessment table entry
  // there are two functions the first is called (it returns bookingId)
  // then this is used for the second function
  insertUpdateBooking("INSERT", bookingData)
    .then((bookingId) => {
      // add the bookingId that has been returned from the booking insert to the end of the
      // data passed to the insertUpdateRiskAssessment
      riskAssessmentData.push(bookingId);
      return insertUpdateRiskAssessment("INSERT", riskAssessmentData);
    })
    .then((riskAssessmentResult) => {
      console.log("Risk assessment updated with result:", riskAssessmentResult);
      res.send(
        '<p>Booking and risk assessment inserted successfully!</p></br><a href="/login-success">Click to go back to the menu</a>'
      );
    })
    .catch((error) => {
      console.error("An error occurred:", error);
    });
});

//this route displays when a room has been added successfully
app.get("/add-room-success", isLoggedIn, (req, res) => {
  res.send(
    '<p>Room added successfully!</p><a href="/login-success">Return to Dashboard</a>'
  );
});

// this is the route that displays all the rooms so a user can select one and make a booking - renamed from book-room to match other list pages
app.get("/rooms-list", isLoggedIn, (req, res) => {
  var loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  // get the filters from the user session, else initialise the filters
  var filters = {};
  //if (req.session.roomListFilters) filters = req.session.roomListFilters;
  //else {
    filters = {
      date: "",
      timeslot: "-NaN:NaN",
      building: "",
      roomType: "",
      minSeats: 1,
      duration: "",
    };
    // save the current filters in the user session
    req.session.roomListFilters = filters;
  //}
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  switch (req.session.roomListOrder) {
    case "o_b_Capacity":
      listOrder = " ORDER BY r.capacity DESC";
      break;
    case "o_b_Building":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    default:
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
  }
  // if the filter has a date and a timeslot then create a string to be passed to the page which gets shown inside the book button
  var selectedTimeslot = "";
  var selectedDate = "";
  if (filters.timeslot != "-NaN:NaN" && filters.date != "") {
    selectedTimeslot = filters.timeslot;
    selectedDate = filters.date;
  }
  Promise.all([
    getRoomTypes("rooms-list", userId), // Promise.all[0]
    getBuildingNames("rooms-list", userId), // Promise.all[1]
    getRooms("rooms-list",filters, listOrder,""), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, rooms]) => {
      // if you had more data just add the name of it here first variable is the result of promise.all[0] etc.
      res.render("rooms-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        rooms,
        roomTypes,
        buildingNames,
        selectedTimeslot,
        selectedDate,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

// route for the filter and ordering in the rooms-list page
// this route is re-used for filtering AND ordering, if there no req.body.orderSelection
// then we are processing filtering, otherwise we are processing ordering
app.post("/rooms-list-filtered", isLoggedIn, function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  var filters = {};
  // work out if we are posting to filter the list or order the list
  // if the POST doesn't contain req.body.orderSelection then we are have a post that is filtering
  if (!req.body.orderSelection) {
    var startingTimeslot = req.body.timeslot.replace("starting from ", "");
    var bookingDuration = req.body.durationRange;
    var bookingHours = Math.floor(bookingDuration / 60);
    var bookingMinutes = bookingDuration % 60;
    var startingTimeSplit = startingTimeslot.split(":");
    var endingTimeslot =
      String(parseInt(startingTimeSplit[0]) + bookingHours).padStart(2, "0") +
      ":" +
      String(parseInt(startingTimeSplit[1]) + bookingMinutes).padStart(2, "0");
    filters = {
      date: req.body.date,
      timeslot: startingTimeslot + "-" + endingTimeslot,
      building: req.body.building,
      roomType: req.body.roomType,
      minSeats: req.body.seating,
      duration: req.body.durationRange,
    };
    // save the current filters in the user session, this is so they can be re-used when there is no filter POSTED
    req.session.roomListFilters = filters;
  } else {
    filters = req.session.roomListFilters;
    // save the orderSelection
    req.session.roomListOrder = req.body.orderSelection;
  }
  // get the current list order from the session and if not present initialise the order
  // if (!req.session.roomListOrder) req.session.roomListOrder = ""
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  //console.log("session.roomListOrder: " + req.session.roomListOrder);
  switch (req.session.roomListOrder) {
    case "o_b_Capacity":
      listOrder = " ORDER BY r.capacity DESC";
      break;
    case "o_b_Building":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    default:
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
  }
  var selectedTimeslot = "";
  var selectedDate = "";
  if (filters.timeslot != "-NaN:NaN" && filters.date != "") {
    selectedTimeslot = filters.timeslot;
    selectedDate = filters.date;
  }
  console.log(filters);
  Promise.all([
    getRoomTypes("rooms-list", userId), // Promise.all[0]
    getBuildingNames("rooms-list", userId), // Promise.all[1]
    getRooms("rooms-list",filters, listOrder,""), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, rooms]) => {
      // if you had more data calls above you name it here, the first variable is the result of promise.all[0] etc.
      console.log(filters);
      res.render("rooms-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        rooms,
        roomTypes,
        buildingNames,
        selectedTimeslot,
        selectedDate,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});


/**
 * edit-rooms-list
 * this list shows all rooms so a user can select which room they want to edit
 */
app.get("/edit-rooms-list",upload.single('roomImageFile'), isLoggedIn, (req, res) => {
  var loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  // get the filters from the user session, else initialise the filters
  var filters = {};
  //if (req.session.editRoomListFilters) filters = req.session.editRoomListFilters;
  //else {
    filters = {
      date: "",
      timeslot: "-NaN:NaN",
      building: "",
      roomType: "",
      minSeats: 1,
      duration: "",
    };
    // save the current filters in the user session
    req.session.editRoomListFilters = filters;
  //}
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  switch (req.session.roomListOrder) {
    case "o_b_Capacity":
      listOrder = " ORDER BY r.capacity DESC";
      break;
    case "o_b_Building":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    default:
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
  }
  // if the filter has a date and a timeslot then create a string to be passed to the page which gets shown inside the book button
  var selectedTimeslot = "";
  var selectedDate = "";
  if (filters.timeslot != "-NaN:NaN" && filters.date != "") {
    selectedTimeslot = filters.timeslot;
    selectedDate = filters.date;
  }
  Promise.all([
    getRoomTypes("edit-rooms-list", userId), // Promise.all[0]
    getBuildingNames("edit-rooms-list", userId), // Promise.all[1]
    getRooms("edit-rooms-list",filters, listOrder,""), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, rooms]) => {
      // if you had more data just add the name of it here first variable is the result of promise.all[0] etc.
      res.render("edit-rooms-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        rooms,
        roomTypes,
        buildingNames,
        selectedTimeslot,
        selectedDate,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

/**
 * edit-rooms-list-filtered
 * this is the target page for the filter and the order by forms
 */
app.post("/edit-rooms-list-filtered", isLoggedIn, function (req, res) {
  loggedInMessage = getLoggedInUser(req);
  var userrole = req.session.user_role;
  var userId = req.session.userid;
  var email = req.session.email;
  var filters = {};
  // work out if we are posting to filter the list or order the list
  // if the POST doesn't contain req.body.orderSelection then we are have a post that is filtering
  if (!req.body.orderSelection) {
    var startingTimeslot = req.body.timeslot.replace("starting from ", "");
    var bookingDuration = req.body.durationRange;
    var bookingHours = Math.floor(bookingDuration / 60);
    var bookingMinutes = bookingDuration % 60;
    var startingTimeSplit = startingTimeslot.split(":");
    var endingTimeslot =
      String(parseInt(startingTimeSplit[0]) + bookingHours).padStart(2, "0") +
      ":" +
      String(parseInt(startingTimeSplit[1]) + bookingMinutes).padStart(2, "0");
    filters = {
      date: req.body.date,
      timeslot: startingTimeslot + "-" + endingTimeslot,
      building: req.body.building,
      roomType: req.body.roomType,
      minSeats: req.body.seating,
      duration: req.body.durationRange,
    };
    // save the current filters in the user session, this is so they can be re-used when there is no filter POSTED
    req.session.editRoomListFilters = filters;
  } else {
    filters = req.session.editRoomListFilters;
    // save the orderSelection
    req.session.editRoomListOrder = req.body.orderSelection;
  }
  // get the current list order from the session and if not present initialise the order
  // if (!req.session.editRoomListOrder) req.session.editRoomListOrder = ""
  // manage the ordering of the data - if the user has re-ordered the list
  var listOrder = "";
  //console.log("session.editRoomListOrder: " + req.session.editRoomListOrder);
  switch (req.session.editRoomListOrder) {
    case "o_b_Capacity":
      listOrder = " ORDER BY r.capacity DESC";
      break;
    case "o_b_Building":
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
    default:
      listOrder = " ORDER BY r.building_name, r.room_number";
      break;
  }
  var selectedTimeslot = "";
  var selectedDate = "";
  if (filters.timeslot != "-NaN:NaN" && filters.date != "") {
    selectedTimeslot = filters.timeslot;
    selectedDate = filters.date;
  }
  console.log(filters);
  Promise.all([
    getRoomTypes("edit-rooms-list", userId), // Promise.all[0]
    getBuildingNames("edit-rooms-list", userId), // Promise.all[1]
    getRooms("edit-rooms-list",filters, listOrder,""), // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, rooms]) => {
      // if you had more data calls above you name it here, the first variable is the result of promise.all[0] etc.
      console.log(filters);
      res.render("edit-rooms-list.ejs", {
        loggedInMessage,
        userrole,
        email,
        rooms,
        roomTypes,
        buildingNames,
        selectedTimeslot,
        selectedDate,
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});


/**
 * edit-room
 * called from a post using the edit button on edit-rooms-list passing the roomId in the body
 */
app.post("/edit-room", isLoggedIn, (req, res) => {
  // checking for admin role
  if (req.session.user_role !== "admin") {
    return res.send("Unauthorized access");
  }
  var userrole = req.session.user_role;
  var email = req.session.email;
  var userId = req.session.userid;
  // sanitising the input
  const roomId = parseInt(sanitiseHtml(req.body.roomId));
  // because we're using getRooms to get the room data we need to initialise these params
  // that the function uses
  const listOrder = " ORDER BY r.id";
  const filters = {};
  Promise.all([
    getRoomTypes("edit-room", userId),                   // Promise.all[0]
    getBuildingNames("edit-room", userId),               // Promise.all[1]
    getRooms("edit-room",filters, listOrder,roomId),           // Promise.all[2]
  ])
    .then(([roomTypes, buildingNames, rooms]) => {
      // if you had more data calls above you name it here, the first variable is the result of promise.all[0] etc.
      console.log(filters);
      res.render("edit-room", {
        loggedInMessage,
        userrole,
        email,
        rooms,
        roomTypes,
        buildingNames
      });
    })
    .catch((error) => {
      console.log(
        "Error getting data from database calls or in the code above"
      );
    });
});

app.post("/edit-room-success", isLoggedIn, upload.single('roomImageFile'), (req, res) => {
  //sql changes to room table
  var userrole = req.session.user_role;
  var email = req.session.email;
  var userId = req.session.userid;
  const roomId = parseInt(sanitiseHtml(req.body.roomId));
  const roomNumber = sanitiseHtml(req.body.roomNumber);
  const buildingName = sanitiseHtml(req.body.buildingName);
  const roomType = sanitiseHtml(req.body.roomType);
  const capacity = sanitiseHtml(req.body.capacity);
  let pictureURL = req.body.pictureURL ? sanitiseHtml(req.body.pictureURL) : null;
  const isAcceptingBookings = sanitiseHtml(req.body.isAcceptingBookings);
  console.log("edit room sucess: " + roomId);

    // Check if a file was uploaded
  if (req.file) {
    pictureURL = `/rooms/${req.file.filename}`; // Update the file path as needed
  }

  sqlquery = `
    UPDATE room SET room_number = ?, building_name = ?, room_type = ?, 
                    capacity = ?, picture_URL = ?, is_accepting_bookings = ? 
                    WHERE id = ? `;

  /* run the query as a select to test all the field names before making it an update statement
  sqlquery = `
  select * from room where room_number = ? and building_name = ? and room_type = ? and 
                  capacity = ? and picture_URL = ? and is_accepting_bookings = ? 
                  and id = ? `;
  */
    db.query(
    sqlquery,
    [
      roomNumber,
      buildingName,
      roomType,
      capacity,
      pictureURL,
      isAcceptingBookings,
      roomId
    ],
    (err, result) => {
      if (err) {
        console.error(err.message);
        return res.send("Error in updating room");
      }
      // redirecting to the menu when successful
      // NB returning to edit-rooms-list is harder because we don't have roomType or buildingName data sets at
      // this point but it could be done with a promise all again. 
      res.render("login-success.ejs", {
        loggedInMessage,
        userrole,
        email
          });
        }
      );
  });

app.post("/delete-room", isLoggedIn, (req, res) => {
  if (req.session.user_role !== "admin") {
    return res.send("Unauthorized access");
  }
  const roomId = parseInt(req.body.roomId);

  const deleteQuery = 'DELETE FROM room WHERE id = ?';

  db.query(deleteQuery, [roomId], (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Error deleting room");
    }
    console.log("Deleted Room ID:", roomId);
    res.redirect('./edit-rooms-list'); 
  });
});

app.listen(port, () => {
  console.log(`Bookit app listening at http://localhost:${port}`);
});




