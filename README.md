install dotenv## roombooking

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
- npm install dotenv mysql2 express express-session ejs sanitize-html body-parser bcrypt

tinyMCE install:
npm install path cookie-parser morgan tinymce@^6

QR Code install
npm speakeasy qrcode 

File upload install
npm multer

All installs:
npm install dotenv mysql2 express express-session ejs sanitize-html body-parser bcrypt path cookie-parser morgan tinymce@^6 multer


to run
- node app.js

the test login, for a society leader, is
 - u: jake@123.com
 - p: test

the test login, for a coordinator, is
 - u: coordinator@123.com
 - p: test

the test login, for an administrator, is
 -u: admin@123.com
 -p: admintest
