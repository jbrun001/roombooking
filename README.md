## roombooking

## roombooking project kelvin's kittens

## Prerequisites

- Create planetscale "hobby account"
- Create roombooking database in planetscale
- Use MySql command line to connect to the planetscale database - credentials available within planetscale
- the connection format for windows is
-> mysql -h aws.connect.psdb.cloud -D roombooking -u <USERNAMEHERE> -p<PASSWORDHERE>
- use createdb sql scripts to create tables and insert test data
- clone the repository from git hub
- git clone https://github.com/jbrun001/roombooking 
- copy the .env file provided to the folder (this is not included in github because it contains credentials)
- Install [Node.js](https://nodejs.org/en/download/)
- npm install
- npm install dotenv
- npm install mysql2
- npm install express
- npm install express-session
- npm install ejs
- npm install sanitize-html
- npm install body-parser
- npm install bcrypt


to run
- node app.js

the test login, for a society leader, is
 - u: jake@123.com
 - p: test

the test login, for a coordinator, is
 - u: coordinator@123.com
 - p: test


to create new users use 
 /register
there is no link in the current pages to this

Front end pages/routes required & status
route               prototyped      connected to database       societyleader   coordinator     comment
- login             Yes             Yes                         n/a             n/a
- login-success     Yes             Yes                         Yes             Yes
- login-error       Yes             Yes                         n/a             n/a
- login-check       Yes             Yes                         n/a             n/a
- register          Yes             Yes                         n/a             n/a             no link to this page from others
- registered        Yes             Yes                         n/a             n/a             just renders login after - no feedback
- book-room                                                     Yes             Yes
- view-bookings                                                 Yes             Yes             needs more work when zooming in and out
- view-booking                                                  Yes             Yes
- edit-booking                                                  Yes             Yes
- view-requests                                                 No              Yes
- view-accepted                                                 No              Yes
