-- MySQL dump 10.13  Distrib 8.2.0, for Win64 (x86_64)
--
-- Host: aws.connect.psdb.cloud    Database: roombooking
-- ------------------------------------------------------
-- Server version	8.0.34-PlanetScale

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '50cc57ff-c5cb-11ee-b8ea-0e0f63437c8e:1-266,
5c667a10-b85e-11ee-9c97-92498ad8abd2:1-249,
5ce4eca1-b85e-11ee-9db5-52eaea5f96d0:1-160,
aa3e195f-c43e-11ee-9132-8a92493258c8:1-343';

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_start` datetime DEFAULT NULL,
  `booking_end` datetime DEFAULT NULL,
  `booking_reason` varchar(50) DEFAULT NULL,
  `booking_status` varchar(50) DEFAULT NULL,
  `is_risk_assessment_approved` tinyint(1) DEFAULT NULL,
  `confirmed_on` datetime DEFAULT NULL,
  `cancelled_on` datetime DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking`
--

LOCK TABLES `booking` WRITE;
/*!40000 ALTER TABLE `booking` DISABLE KEYS */;
INSERT INTO `booking` VALUES (95,'2024-02-16 10:00:00','2024-02-16 12:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,2,35),(96,'2024-02-16 13:00:00','2024-02-16 14:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,2,36),(97,'2024-02-16 14:00:00','2024-02-16 15:00:00',NULL,'Approved',1,NULL,NULL,2,37),(98,'2024-02-16 16:00:00','2024-02-16 17:00:00',NULL,'Approved',1,NULL,NULL,2,38),(99,'2024-02-16 15:00:00','2024-02-16 16:00:00',NULL,'Denied',0,NULL,NULL,2,39),(100,'2024-02-17 10:00:00','2024-02-16 12:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,2,35),(101,'2024-02-17 13:00:00','2024-02-16 14:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,2,36),(102,'2024-02-17 14:00:00','2024-02-16 15:00:00',NULL,'Approved',1,NULL,NULL,2,37),(103,'2024-02-17 16:00:00','2024-02-16 17:00:00',NULL,'Approved',1,NULL,NULL,2,38),(104,'2024-02-17 15:00:00','2024-02-16 16:00:00',NULL,'Denied',0,NULL,NULL,2,39),(105,'2024-03-16 10:00:00','2024-03-16 12:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,3,35),(106,'2024-03-16 13:00:00','2024-03-16 14:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,3,36),(107,'2024-03-16 14:00:00','2024-03-16 15:00:00',NULL,'Approved',1,NULL,NULL,3,37),(108,'2024-03-16 16:00:00','2024-03-16 17:00:00',NULL,'Approved',1,NULL,NULL,3,38),(109,'2024-03-16 15:00:00','2024-03-16 16:00:00',NULL,'Denied',0,NULL,NULL,3,39),(110,'2024-03-17 10:00:00','2024-03-16 12:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,3,35),(111,'2024-03-17 13:00:00','2024-03-16 14:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,3,36),(112,'2024-03-17 14:00:00','2024-03-16 15:00:00',NULL,'Approved',1,NULL,NULL,3,37),(113,'2024-03-17 16:00:00','2024-03-16 17:00:00',NULL,'Approved',1,NULL,NULL,3,38),(114,'2024-03-17 15:00:00','2024-03-16 16:00:00',NULL,'Denied',0,NULL,NULL,3,39),(115,'2024-04-16 10:00:00','2024-04-16 12:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,4,35),(116,'2024-04-16 13:00:00','2024-04-16 14:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,4,36),(117,'2024-04-16 14:00:00','2024-04-16 15:00:00',NULL,'Approved',1,NULL,NULL,4,37),(118,'2024-04-16 16:00:00','2024-04-16 17:00:00',NULL,'Approved',1,NULL,NULL,4,38),(119,'2024-04-16 15:00:00','2024-04-16 16:00:00',NULL,'Denied',0,NULL,NULL,4,39),(120,'2024-04-17 10:00:00','2024-04-16 12:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,4,35),(121,'2024-04-17 13:00:00','2024-04-16 14:00:00',NULL,'Awaiting Approval',NULL,NULL,NULL,4,36),(122,'2024-04-17 14:00:00','2024-04-16 15:00:00',NULL,'Approved',1,NULL,NULL,4,37),(123,'2024-04-17 16:00:00','2024-04-16 17:00:00',NULL,'Approved',1,NULL,NULL,4,38),(124,'2024-04-17 15:00:00','2024-04-16 16:00:00',NULL,'Denied',0,NULL,NULL,4,39),(125,'2024-02-27 13:00:00','2024-02-27 14:00:00',NULL,'Approved',1,'2024-03-03 17:34:42',NULL,4,48),(126,'2024-03-02 11:30:00','2024-03-02 12:30:00',NULL,'Approved',1,'2024-02-28 12:35:40',NULL,4,43),(127,'2024-03-06 17:30:00','2024-03-06 19:30:00',NULL,'Approved',1,'2024-03-03 16:17:34',NULL,4,46);
/*!40000 ALTER TABLE `booking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facility`
--

DROP TABLE IF EXISTS `facility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `facilty_description` varchar(50) DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facility`
--

LOCK TABLES `facility` WRITE;
/*!40000 ALTER TABLE `facility` DISABLE KEYS */;
INSERT INTO `facility` VALUES (1,'projector',1),(2,'microphone',1),(3,'Computer',1);
/*!40000 ALTER TABLE `facility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lookup_facility`
--

DROP TABLE IF EXISTS `lookup_facility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_facility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `facility_description` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lookup_facility`
--

LOCK TABLES `lookup_facility` WRITE;
/*!40000 ALTER TABLE `lookup_facility` DISABLE KEYS */;
INSERT INTO `lookup_facility` VALUES (1,'projector'),(2,'microphone'),(3,'Computer'),(4,'Piano');
/*!40000 ALTER TABLE `lookup_facility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lookup_room_type`
--

DROP TABLE IF EXISTS `lookup_room_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_room_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lookup_room_type`
--

LOCK TABLES `lookup_room_type` WRITE;
/*!40000 ALTER TABLE `lookup_room_type` DISABLE KEYS */;
INSERT INTO `lookup_room_type` VALUES (1,'Lecture Theatre'),(2,'Seminar Room'),(3,'Piano Room'),(4,'Promotional Table / Stall');
/*!40000 ALTER TABLE `lookup_room_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lookup_user_role`
--

DROP TABLE IF EXISTS `lookup_user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lookup_user_role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lookup_user_role`
--

LOCK TABLES `lookup_user_role` WRITE;
/*!40000 ALTER TABLE `lookup_user_role` DISABLE KEYS */;
INSERT INTO `lookup_user_role` VALUES (1,'society leader'),(2,'lecturer'),(3,'coordinator'),(4,'admin');
/*!40000 ALTER TABLE `lookup_user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `risk_assessment`
--

DROP TABLE IF EXISTS `risk_assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `risk_assessment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `risk1` varchar(200) DEFAULT NULL,
  `risk2` varchar(200) DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `booking_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `risk_assessment`
--

LOCK TABLES `risk_assessment` WRITE;
/*!40000 ALTER TABLE `risk_assessment` DISABLE KEYS */;
INSERT INTO `risk_assessment` VALUES (1,'1','2',0,NULL,36),(2,'3','4',0,NULL,37),(3,'33','333',0,NULL,38),(4,'','',0,NULL,39),(5,'','',0,NULL,40),(6,'','',0,NULL,41),(7,'','',0,NULL,42),(8,'','',0,NULL,43),(9,'','',0,NULL,44),(10,'','',0,NULL,45),(11,'','',0,NULL,46),(12,'','',0,NULL,47),(13,'','',0,NULL,48),(14,'','',0,NULL,49),(15,'','',0,NULL,50),(16,'','',0,NULL,51),(17,'','',0,NULL,52),(18,'','',0,NULL,53),(19,'','',0,NULL,54),(20,'','',0,NULL,55),(21,'','',0,NULL,56),(22,'','',0,NULL,57),(23,'','',0,NULL,58),(24,'','',0,NULL,59),(25,'','',0,NULL,60),(26,'','',0,NULL,61),(27,'','',0,NULL,62),(28,'','',0,NULL,63),(29,'','',0,NULL,64),(30,'this is risk assessment 1 for room 1000 \r\nBooked by: admin@123.com\r\nDate: 2024-02-27\r\nBuilding: RHB\r\nTimeslot: 13:00-14:00\r\nSeating Requested: 100\r\nedit4 28/02/2024  ','this is risk assessment 2 for room 1000 \r\nBooked by: admin@123.com\r\nDate: 2024-02-27\r\nBuilding: RHB\r\nTimeslot: 13:00-14:00\r\nSeating Requested: 100\r\nedit4 28/02/2024',1,3,125),(31,'11','22',1,3,126),(32,'Test input risk assessment for ordering by recently approved','Test input risk assessment for ordering by recently approved',1,3,127),(33,NULL,NULL,NULL,NULL,95),(34,NULL,NULL,NULL,NULL,96),(35,NULL,NULL,1,3,97),(36,NULL,NULL,1,3,98),(37,NULL,NULL,0,3,99),(38,NULL,NULL,NULL,NULL,100),(39,NULL,NULL,NULL,NULL,101),(40,NULL,NULL,1,3,102),(41,NULL,NULL,1,3,103),(42,NULL,NULL,0,3,104),(43,NULL,NULL,NULL,NULL,105),(44,NULL,NULL,NULL,NULL,106),(45,NULL,NULL,1,3,107),(46,NULL,NULL,1,3,108),(47,NULL,NULL,0,3,109),(48,NULL,NULL,NULL,NULL,110),(49,NULL,NULL,NULL,NULL,111),(50,NULL,NULL,1,3,112),(51,NULL,NULL,1,3,113),(52,NULL,NULL,0,3,114),(53,NULL,NULL,NULL,NULL,115),(54,NULL,NULL,NULL,NULL,116),(55,NULL,NULL,1,3,117),(56,NULL,NULL,1,3,118),(57,NULL,NULL,0,3,119),(58,NULL,NULL,NULL,NULL,120),(59,NULL,NULL,NULL,NULL,121),(60,NULL,NULL,1,3,122),(61,NULL,NULL,1,3,123),(62,NULL,NULL,0,3,124);
/*!40000 ALTER TABLE `risk_assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room` (
  `id` int NOT NULL AUTO_INCREMENT,
  `room_number` varchar(50) DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `picture_URL` varchar(300) DEFAULT NULL,
  `is_accepting_bookings` tinyint(1) DEFAULT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `building_name` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES (35,'258',18,'https://i.imgur.com/Z4H2s6D.png',1,'Lecture Theatre','RHB'),(36,'257',20,'https://i.imgur.com/sXfkTSb.png',1,'Seminar Room','RHB'),(37,'256',77,'https://i.imgur.com/pcE27w3.png',1,'Seminar Room','RHB'),(38,'203',8,'https://i.imgur.com/zgPIP3n.png',1,'Seminar Room','RHB'),(39,'112',40,'https://i.imgur.com/OPbJ5ob.jpg',1,'Seminar Room','RHB'),(40,'300a',42,'https://i.imgur.com/MOTYwtL.jpg',1,'Seminar Room','RHB'),(41,'308',31,'https://i.imgur.com/gfiWfjE.png',1,'Seminar Room','RHB'),(42,'355',25,'https://i.imgur.com/PBSpuPv.png',1,'Seminar Room','RHB'),(43,'309',109,'https://i.imgur.com/0qlH3ZT.jpeg',1,'Lecture Theatre','RHB'),(44,'144',46,'https://i.imgur.com/2Dqg4Pc.png',1,'Lecture Theatre','RHB'),(45,'342',60,'',1,'Lecture Theatre','RHB'),(46,'208',44,'https://i.imgur.com/SAjcIBP.png',1,'Seminar Room','WB'),(47,'219',45,'https://i.imgur.com/0VVR6By.png',1,'Seminar Room','WB'),(48,'1000',100,'https://i.imgur.com/OPbJ5ob.jpg',1,'Lecture Theatre','RHB');
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_account`
--

DROP TABLE IF EXISTS `user_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(50) DEFAULT NULL,
  `password` varchar(60) DEFAULT NULL,
  `user_role` varchar(50) DEFAULT NULL,
  `society_name` varchar(50) DEFAULT NULL,
  `module` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_account`
--

LOCK TABLES `user_account` WRITE;
/*!40000 ALTER TABLE `user_account` DISABLE KEYS */;
INSERT INTO `user_account` VALUES (2,'jake@123.com','$2b$10$lgIpFn3VZhDRaPsqiZDA0u9qEJYKNskmtlybrO2.K35a0wYb8XzB.','society leader','testing',NULL),(3,'coordinator@123.com','$2b$10$lgIpFn3VZhDRaPsqiZDA0u9qEJYKNskmtlybrO2.K35a0wYb8XzB.','coordinator','',''),(4,'admin@123.com','$2b$10$qBl3yz5wb.UfnSC8p.TgSe8vMpkhVCnvw7l2UUuE8VTbogXhTODvq','admin','n/a',NULL),(10,'security@123.com','$2b$10$NzIS2b4infjObfF9meaZXuJsdpQOI3dJo6FCFv1qngOqfe8wG3PqG','admin','n/a','n/a'),(11,'securitytest1@123.com','$2b$10$t.efCsfx3s8YWksUUgDaEuB7NP4gMGbuxWbVpFi9oHKssD.SNT0KW','admin','n/a','n/a'),(12,'admin@123.com','$2b$10$SWpVbxCqEr8RFCg7jzIw2edbqwGMkocoVfTFl78eTizKye7zDfbtq','society leader','test',''),(13,'test1@test.com','$2b$10$4iirG9G86bMw7N.TCtm0i.rnQe7xWZpmoYX2sVr/WvzbqfzOq5oH6','society leader','test',''),(14,'test2@test.com','$2b$10$dfzvaaDj8rZHXrU0EvQUbek28DhxTrxxwZUUTCy4ts84eKyYQK39O','society leader','test',''),(15,'passwordtest@123.com','$2b$10$ofII5VRAiR6QAnDdTj338e4ZtfTSvext3t2e7UKwXluNEh89uoJg6','lecturer','','');
/*!40000 ALTER TABLE `user_account` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-03-07  8:16:24
