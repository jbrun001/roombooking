require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT || 8000
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

// Set the security headers for anti-click jacking and set the content security policy
// these fix 2 medium security errors identified by OWASP Zap as part of Part E 
//app.use((req, res, next) => {
    // this is a very restrictive header only pages generated by this app.js. no plugins are allowed and no base tags are allowed
    //res.setHeader(
    //    'Content-Security-Policy', 
    //    "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none';"
    //);
    // this stops any frames being used in the pages at all.  If we need frames we can change this to be SAMEORIGIN and not DENY
    //res.setHeader('X-Frame-Options', "DENY");
    //res.setHeader('X-Content-Type-Options','nosniff');
    //next(); // Pass control to the next middleware or route handler
//});

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
app.post('/login-check', function (req, res) {
    var email = sanitiseHtml(req.body.email);
    var password = req.body.password;
    // just check that the email address exists (password hash checking comes after)
    let sqlquery = "SELECT email, id, password, user_role FROM user_account WHERE email=\"" + email.toLowerCase() + "\";"
    db.query(sqlquery, (err, result) => {
        // if error display login-error page
        loggedInMessage = getLoggedInUser(req);
        if (err) {
            console.error(err.message);
            res.render('login-error.ejs', {});
        } else if (result === null || result.length === 0) {
            // no matching records at all
            console.error("user not found");
            res.render('login-error.ejs', {});
        }
        // if this is a valid user
        else {
            // now have to check the passwords matches the hashed password
            // take the first result from the sql query 
            if (isMatchingPassword(password, result[0].password)) {
                req.session.isLoggedIn = true;  // set the session variable to show logged in
                req.session.userid = result[0].id;
                req.session.email = result[0].email;
                req.session.user_role = result[0].user_role;
                loggedInMessage = getLoggedInUser(req);
                res.redirect('/login-success');
            } else {
                console.error("user details don't match");
                loggedInMessage = getLoggedInUser(req);
                res.render('login-error.ejs', {});
            }
        }
    });
});

app.get('/login-error', function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    res.render('login-error.ejs', { loggedInMessage });
});


app.get('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.sendStatus(500); // Internal Server Error
        } else {
            loggedInMessage = "not logged in";
            res.render('login.ejs', {});
        }
    });
});


// register page route - registers a new user and adds them as a member to the first topic
// so they are able to post somewhere when they first join
app.get('/register', isLoggedIn, function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    sqlquery = "select * from lookup_user_role"
    // execute sql query
    db.query(sqlquery, (err, data) => {
        if (err) {
            res.redirect('./');
            return console.error(err.message);
        }
        let newData = Object.assign({}, { loggedInMessage }, { userrole }, { email }, { allUserRoles: data });
        res.render('register.ejs', newData);
    });
});
// the form in register.ejs has a target of /registered which will get managed by this code.  
// this form uses http POST
app.post('/registered', isLoggedIn, function (req, res) {
    // before we send the input fields which will be displayed on the page
    // make sure they don't contain any dangerous HTML for cross site scripting 
    var email = sanitiseHtml(req.body.email);
    var password = sanitiseHtml(req.body.password);
    var userrole = sanitiseHtml(req.body.userrole);
    var societyname = sanitiseHtml(req.body.societyname);
    var module = sanitiseHtml(req.body.module);
    var hashedPassword = hashPassword(password);
    let sqlqueryuser = "INSERT INTO user_account (email, password, user_role, society_name, module) VALUES (?,?,?,?,?)";
    // execute sql query
    let newuser = [email.toLowerCase(), hashedPassword, userrole, societyname, module];
    db.query(sqlqueryuser, newuser, (err, result) => {
        // if error display login page
        if (err) {
            res.redirect('/');
            return console.error(err.message);
        }
        else {
            res.redirect('/login-success');
        }
    });
});

// test route to display the user_account table - remove in final version.
app.get('/test', (req, res) => {
    db.query('SELECT * FROM user_account', function (err, rows, fields) {
        if (err) throw err
        res.send(rows)
    })
})

// this route is the template for all pages when the user is logged in
// there is an extra check to make sure that the user is currently logged in
// before displaying this route
app.get('/login-success', isLoggedIn, function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    res.render('login-success.ejs', { loggedInMessage, userrole, email });
});

// temporary booking data:
var bookings = [];
// temporarily fill bookings:
var tempBooking1 = {
    roomNumber: 256,
    building: "RHB",
    date: "2024/01/16",
    timeslot: "10:00-12:00",
    bookedBy: "Emily Rain",
    Status: "Awaiting Approval"
};
var tempBooking2 = {
    roomNumber: 306,
    building: "RHB",
    date: "2024/01/16",
    timeslot: "11:00-13:00",
    bookedBy: "Noah Tambala",
    Status: "Awaiting Approval"
};
var tempBooking3 = {
    roomNumber: "LG02",
    building: "PSH",
    date: "2024/01/16",
    timeslot: "10:00-12:00",
    bookedBy: "Spike Elliot",
    Status: "Approved"
};
var tempBooking4 = {
    roomNumber: 124,
    building: "WHB",
    date: "2024/01/16",
    timeslot: "14:00-17:00",
    bookedBy: "Syed Sahaf",
    Status: "Approved"
};
var tempBooking5 = {
    roomNumber: "BLK3",
    building: "RHB",
    date: "2024/01/16",
    timeslot: "16:00-18:00",
    bookedBy: "Abdul Jinadu",
    Status: "Denied"
};
bookings.push(tempBooking1);
bookings.push(tempBooking2);
bookings.push(tempBooking3);
bookings.push(tempBooking4);
bookings.push(tempBooking5);
//for (let i = 0; i < 5; i++) {
//    bookings.push(tempBooking);
//}

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
        var aDate = new Date(parseInt(aDateSplit[0]), parseInt(aDateSplit[1]) - 1, parseInt(aDateSplit[2]));
        var bDate = new Date(parseInt(bDateSplit[0]), parseInt(bDateSplit[1]) - 1, parseInt(bDateSplit[2]));
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
function sortByStatus(bookings) { // sorts bookings as follows - Approved, Awaiting Approval, Denied
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
    Array.prototype.splice.apply(sortedBookings, [lastApproved, 0].concat(awaitingApprovalBookings));
    return sortedBookings;
}

app.get('/bookings-list', isLoggedIn, function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    res.render('bookings-list.ejs', { loggedInMessage, userrole, email, bookings });
});

app.post('/bookings-list', isLoggedIn, function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    var queryProcess;
    switch (req.body.orderSelection) {
        case "o_b_Room":
            bookings = sortByBuilding(bookings);
            res.render('bookings-list.ejs', { loggedInMessage, userrole, email, bookings });
            break;
        case "o_b_Time":
            bookings = sortByTime(bookings);
            res.render('bookings-list.ejs', { loggedInMessage, userrole, email, bookings });
            break;
        case "o_b_Status":
            bookings = sortByStatus(bookings);
            res.render('bookings-list.ejs', { loggedInMessage, userrole, email, bookings });
            break;
        default:
            console.log("Invalid input for ordering bookings");
            res.send(req.body);
    }
});

//this route is used to display the add-room page
app.get('/add-room', isLoggedIn, (req, res) => {
    // checking for admin role
    if (req.session.user_role !== 'admin') {
        return res.send('Unauthorized access');
    }

    // get the room types from the database
    const query = "SELECT room_type FROM lookup_room_type";
    db.query(query, (err, roomTypes) => {
        if (err) {
            console.error(err.message);
            return res.send('Error fetching room types');
        }
        // pass the roomTypes to the add-room page
        res.render('add-room', { roomTypes: roomTypes });
    });
});


// this route is used to add a room to the database
app.post('/add-room', isLoggedIn, (req, res) => {
    // checking for admin role
    if (req.session.user_role !== 'admin') {
        return res.send('Unauthorized access');
    }

    // sanitising the input
    const roomNumber = sanitiseHtml(req.body.roomNumber);
    const buildingName = sanitiseHtml(req.body.buildingName);
    const roomType = sanitiseHtml(req.body.roomType);
    const capacity = parseInt(req.body.capacity);
    const pictureURL = sanitiseHtml(req.body.pictureURL);
    const isAcceptingBookings = req.body.isAcceptingBookings === 'true';

    // inserting the room into the database
    let sqlquery = "INSERT INTO room (room_number, building_name, room_type, capacity, picture_URL, is_accepting_bookings) VALUES (?, ?, ?, ?, ?, ?)";

    // execute sql query
    db.query(sqlquery, [roomNumber, buildingName, roomType, capacity, pictureURL, isAcceptingBookings], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.send('Error in adding room');
        }
        // redirecting to a success page if the room was added successfully
        res.redirect('/add-room-success');
    });
});

app.get('/view-booking', isLoggedIn, (req, res) => {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    res.render('view-booking.ejs', { loggedInMessage, userrole, email });
})

app.get('/edit-booking', isLoggedIn, (req, res) => {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    res.render('edit-booking.ejs', { loggedInMessage, userrole, email });
})


//this route displays when a room has been added successfully
app.get('/add-room-success', isLoggedIn, (req, res) => {
    res.send('<p>Room added successfully!</p><a href="/login-success">Return to Dashboard</a>');
});

app.get('/filter', isLoggedIn, (req, res) => {
    res.render('filter.ejs');
});
app.post('/filtered', isLoggedIn, (req, res) => {
    //  returned a value called capacity which is the capacity of the room

    const capacity = parseInt(req.body.capacity);
    let sqlquery = "SELECT * FROM room WHERE capacity >= ? ";
    // execute sql query
    db.query(sqlquery, [capacity], (err, result) => {
        if (err) {
            console.error(err.message);
            return res.send('Error in adding room');
        }
        // redirecting to a success page if the room was added successfully
        res.render('filtered.ejs', { result });
    });

});
app.get('/book-room', isLoggedIn, (req, res) => {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    var bookings = [];
    // temporarily fill bookings:
    var tempBooking = {
        roomNumber: 256,
        building: "RHB",
        Layout: "Small Tiered Lecture Room",
    };
    for (let i = 0; i < 5; i++) {
        bookings.push(tempBooking);
    }
    res.render('book-room.ejs', { loggedInMessage, userrole, email, bookings });
});

app.get('/view-requests', isLoggedIn, function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    var bookings = [];
    // temporarily fill bookings:
    var tempBooking = {
        roomNumber: 256,
        building: "RHB",
        date: "16 Jan 2024",
        timeslot: "10:00-12:00",
        bookedBy: "Emily Rain",
        Status: "Awaiting Approval"
    };
    for (let i = 0; i < 5; i++) {
        bookings.push(tempBooking);
    }
    res.render('view-requests.ejs', { loggedInMessage, userrole, email, bookings });
});

app.get('/view-accepted', isLoggedIn, function (req, res) {
    loggedInMessage = getLoggedInUser(req);
    var userrole = req.session.user_role;
    var email = req.session.email;
    //console.log(loggedInMessage + " " + userrole);
    var bookings = [];
    // temporarily fill bookings:
    var tempBooking = {
        roomNumber: 256,
        building: "RHB",
        date: "16 Jan 2024",
        timeslot: "10:00-12:00",
        bookedBy: "Emily Rain",
        Status: "Awaiting Approval"
    };
    for (let i = 0; i < 5; i++) {
        bookings.push(tempBooking);
    }
    res.render('view-accepted.ejs', { loggedInMessage, userrole, email, bookings });
});

app.listen(port, () => {
    console.log(`Bookit app listening at http://localhost:${port}`)
})
