
# Create database script for roombooking 

# removed foreign keys because planetscale wouldnt allow them
# changed sizes of some fields as they were too small in original design - pictureURL and room_name - comments in line

# Create the database
CREATE DATABASE roomBooking;
USE roombooking;


CREATE TABLE user_account (
    # changed from user_id to id so can see difference between primary and foreign keys
    id INT AUTO_INCREMENT,
    PRIMARY KEY (id),
    email VARCHAR(50),
    password VARCHAR(60),
    # types of role are Society Leader, Lecturer, Coordinator, Facilites Staff, Health and Safety Staff
    # created a lookup table lookup_user_role to hold valid values for this
    user_role VARCHAR(50),
    # from subclass SocietyLeader
    society_name VARCHAR(50),
    # from subclass Lecturer
    module VARCHAR(50)
);   

# this bcrypt password is "test" - use for testing
INSERT INTO user_account (email, password, society_name, module, user_role)
VALUES  ('jake@123.com', '$2b$10$lgIpFn3VZhDRaPsqiZDA0u9qEJYKNskmtlybrO2.K35a0wYb8XzB.', 'societynametest','','society leader');
INSERT INTO user_account (email, password, society_name, module, user_role)
VALUES  ('coordinator@123.com', '$2b$10$lgIpFn3VZhDRaPsqiZDA0u9qEJYKNskmtlybrO2.K35a0wYb8XzB.', '','','coordinator');


CREATE TABLE room (
    # increased pictureURL to 300 as 100 not long enough
    # increased room number to 50 as 10 not long enough if including building references
    # changed from room_id to id so can see difference between primary and foreign keys
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    room_number VARCHAR(50),
    capacity INT,
    picture_URL VARCHAR(300),
    is_accepting_bookings BOOLEAN
);

INSERT INTO room (room_number, capacity, picture_URL, is_accepting_bookings)
VALUES  ('Main 309', 10, 'https://commons.wikimedia.org/wiki/File:5th_Floor_Lecture_Hall.jpg#/media/File:5th_Floor_Lecture_Hall.jpg',TRUE);

CREATE TABLE booking (
    # changed from booking_id to id so can see difference between primary and foreign keys
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    booking_start DATETIME,
    booking_end DATETIME,
    booking_reason VARCHAR(50),
    booking_status VARCHAR(10),
    is_risk_assessment_approved BOOLEAN,
    confirmed_on DATETIME,
    cancelled_on DATETIME,
    user_id INT,
    room_id INT
);

CREATE TABLE risk_assessment (
    # changed from assessmentid to id so can see difference between primary and foreign keys
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    risk1 VARCHAR(200),
    risk2 VARCHAR(200),
    is_approved BOOLEAN,
    # this will be an id from the user_account table from a user that has role health and safety
    approved_by INT,
    # a risk_assessment must be related to one booking
    booking_id INT
);


# created new table for faclitly which was not in the draft class diagram 
CREATE TABLE facility (
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    facilty_description VARCHAR(50),
    # each facility is related to a room
    room_id INT
);

INSERT INTO facility (facilty_description, room_id)
VALUES  ('projector', 1);
INSERT INTO facility (facilty_description, room_id)
VALUES  ('microphone', 1);
INSERT INTO facility (facilty_description, room_id)
VALUES  ('Computer', 1);

# created lists to be used as lookups 
# for user selectable options

# facilities that can be in a room
CREATE TABLE lookup_facility (
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    facility_description VARCHAR(50)
);

INSERT INTO lookup_facility (facility_description)
VALUES  ('projector');
INSERT INTO lookup_facility (facility_description)
VALUES  ('microphone');
INSERT INTO lookup_facility (facility_description)
VALUES  ('Computer');
INSERT INTO lookup_facility (facility_description)
VALUES  ('Piano');


# types of user role
CREATE TABLE lookup_user_role (
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    role_name VARCHAR(50)
);

INSERT INTO lookup_user_role (role_name)
VALUES  ('society Leader');
INSERT INTO lookup_user_role (role_name)
VALUES  ('lecturer');
INSERT INTO lookup_user_role (role_name)
VALUES  ('coordinator');
INSERT INTO lookup_user_role (role_name)
VALUES  ('admin');

