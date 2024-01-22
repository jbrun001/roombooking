## roombooking

roombooking project kelvin's kittens

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

the test login is
 - u: jake@123.com
 - p: test

to create new users use 
 /register
there is no link in the current pages to this

