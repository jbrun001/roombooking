
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
    # added room_type and building_name to room, as these were missed in the orginal model
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    room_number VARCHAR(50),
    capacity INT,
    picture_URL VARCHAR(300),
    is_accepting_bookings BOOLEAN,
    room_type VARCHAR(50),
    building_name VARCHAR(50)
);

INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('258',18,'https://i.imgur.com/Z4H2s6D.png',1,'Lecture Theatre', 'RHB');  
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('257',20,'https://i.imgur.com/sXfkTSb.png',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('256',77,'https://i.imgur.com/pcE27w3.png',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('203',8,'https://i.imgur.com/zgPIP3n.png',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('112',40,'https://i.imgur.com/OPbJ5ob.jpg',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('300a',42,'https://i.imgur.com/MOTYwtL.jpg',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('307',65,'https://i.imgur.com/CaYpdDm.png',1,'Seminar Room',RHB);
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('308',31,'https://i.imgur.com/gfiWfjE.png',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('355',25,'https://i.imgur.com/PBSpuPv.png',1,'Seminar Room','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('309',109,'https://i.imgur.com/0qlH3ZT.jpeg',1,'Lecture Theatre','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('144',46,'https://i.imgur.com/2Dqg4Pc.png',1,'Lecture Theatre','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('342',60,'',1,'Lecture Theatre','RHB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('208',44,'https://i.imgur.com/SAjcIBP.png',1,'Seminar Room','WB');
INSERT INTO room (room_number, capacity,picture_URL, is_accepting_bookings, room_type, building_name)
VALUES  ('219',45,'https://i.imgur.com/0VVR6By.png',1,'Seminar Room','WB');


CREATE TABLE booking (
    # changed from booking_id to id so can see difference between primary and foreign keys
    # changed booking_status to varchar(50) from varchar(10) to allow for length of status values
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    booking_start DATETIME,
    booking_end DATETIME,
    booking_reason VARCHAR(50),
    booking_status VARCHAR(50),
    risk_assessment_approval_status VARCHAR(50),
    confirmed_on DATETIME,
    cancelled_on DATETIME,
    user_id INT,
    room_id INT
);

# test data - each user 2,3 & 4 has bookings the month of the booking is the same as the user_id
# which is a simple way of checking the data against the logged in user
# 2024-02 - is user 2 jake@123.com
# 2024-03 - is user 3 coordinator@123.com
# 2024-04 - is user 4 admin@123.com
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-16 10:00:00','2024-02-16 12:00:00','Awaiting Approval',2,35);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-16 13:00:00','2024-02-16 14:00:00','Awaiting Approval',2,36);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-16 14:00:00','2024-02-16 15:00:00','Approved',2,37);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-16 16:00:00','2024-02-16 17:00:00','Approved',2,38);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-16 15:00:00','2024-02-16 16:00:00','Denied',2,39);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-17 10:00:00','2024-02-16 12:00:00','Awaiting Approval',2,35);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-17 13:00:00','2024-02-16 14:00:00','Awaiting Approval',2,36);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-17 14:00:00','2024-02-16 15:00:00','Approved',2,37);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-17 16:00:00','2024-02-16 17:00:00','Approved',2,38);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-02-17 15:00:00','2024-02-16 16:00:00','Denied',2,39);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-16 10:00:00','2024-03-16 12:00:00','Awaiting Approval',3,35);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-16 13:00:00','2024-03-16 14:00:00','Awaiting Approval',3,36);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-16 14:00:00','2024-03-16 15:00:00','Approved',3,37);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-16 16:00:00','2024-03-16 17:00:00','Approved',3,38);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-16 15:00:00','2024-03-16 16:00:00','Denied',3,39);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-17 10:00:00','2024-03-16 12:00:00','Awaiting Approval',3,35);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-17 13:00:00','2024-03-16 14:00:00','Awaiting Approval',3,36);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-17 14:00:00','2024-03-16 15:00:00','Approved',3,37);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-17 16:00:00','2024-03-16 17:00:00','Approved',3,38);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-03-17 15:00:00','2024-03-16 16:00:00','Denied',3,39);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-16 10:00:00','2024-04-16 12:00:00','Awaiting Approval',4,35);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-16 13:00:00','2024-04-16 14:00:00','Awaiting Approval',4,36);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-16 14:00:00','2024-04-16 15:00:00','Approved',4,37);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-16 16:00:00','2024-04-16 17:00:00','Approved',4,38);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-16 15:00:00','2024-04-16 16:00:00','Denied',4,39);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-17 10:00:00','2024-04-16 12:00:00','Awaiting Approval',4,35);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-17 13:00:00','2024-04-16 14:00:00','Awaiting Approval',4,36);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-17 14:00:00','2024-04-16 15:00:00','Approved',4,37);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-17 16:00:00','2024-04-16 17:00:00','Approved',4,38);
INSERT INTO booking (booking_start, booking_end, booking_status, user_id, room_id) VALUES ('2024-04-17 15:00:00','2024-04-16 16:00:00','Denied',4,39);




CREATE TABLE risk_assessment (
    # changed from assessmentid to id so can see difference between primary and foreign keys
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    risk1 mediumtext,
    risk2 mediumtext,
    approval_status VARCHAR(50),
    # this will be an id from the user_account table from a user that has role health and safety
    reviewed_by INT,
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


# types of room
CREATE TABLE lookup_room_type (
    id INT AUTO_INCREMENT,
    PRIMARY KEY(id),
    room_type VARCHAR(50)
);

INSERT INTO lookup_room_type (room_type)
VALUES  ('Lecture Theatre');
INSERT INTO lookup_room_type (room_type)
VALUES  ('Seminar Room');
INSERT INTO lookup_room_type (room_type)
VALUES  ('Piano Room');
INSERT INTO lookup_room_type (room_type)
VALUES  ('Promotional Table / Stall');