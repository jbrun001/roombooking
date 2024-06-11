## bookit - kelvin's kittens

## Install process - linux server local database

`sudo apt-get update`

`sudo apt install mysql-server`

`sudo apt install nodejs`

`sudo apt install npm`

`wget https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh`

`bash ./install.sh`

disconnect and log back in

`nvm install v16.17.0`

`node --version` 

`sudo apt install git`

`mkdir project`

`cd project`

`git clone https://github.com/jbrun001/roombooking`

`cd roombooking`

`npm init`

use nano to create .env file (contains security details so not synced with git)

`sudo mysql`

`mysql> source ./database-backups/gscreate.sql`

`mysql> quit`

`npm install dotenv mysql2 express express-session ejs sanitize-html body-parser bcrypt path cookie-parser morgan tinymce@^6 multer speakeasy qrcode`

`sudo apt install -g forever`

`forever start app.js`

to stop the application

`forever stop app.js`

# hardware and software requirements

Disk for install of libraries and dependencies: 1Gib - this may vary depending on your target platform treat this as a minimum.

Disk for room images: 1Gib recommended. Will grow dependent on size and volume of images stored in /media/rooms  

Disk for application code: 100Mib

O/S: Ubuntu 18.04.6 LTS or higher 

Architecture: x86_64 (64-bit support required)

Processor: Intel Core Processor, Broadwell generation or later

Cores: At least 1 core (Note: More cores are recommended for improved performance)

Threads per Core: At least 1

Virtualization Support: If running in a virtualized environment, a hypervisor supporting full virtualization (e.g., KVM) is required.

CPU Frequency: Minimum 2.0 GHz 

Cache: Minimum L1 cache of 32K for data and 32K for instructions, L2 cache of 4096K (4MB)

Memory: minimum 512MiB (for O/S and just this application running)

# demo system login credentials and roles

the test login, for a society leader, is
 - u: jake@123.com
 - p: test

the test login, for a coordinator, is
 - u: coordinator@123.com
 - p: test

the test login, for an administrator, is
 -u: admin@123.com
 -p: admintest
