/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50505
Source Host           : localhost:3306
Source Database       : skill

Target Server Type    : MYSQL
Target Server Version : 50505
File Encoding         : 65001

Date: 2026-08-26 00:33:12
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for activity
-- ----------------------------
DROP TABLE IF EXISTS `activity`;
CREATE TABLE `activity` (
  `activityId` varchar(20) NOT NULL,
  `activityName` varchar(100) DEFAULT NULL,
  `description` text,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `endTime` time DEFAULT NULL,
  `hours` decimal(5,2) DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `organizer` varchar(100) DEFAULT NULL,
  `term` varchar(20) DEFAULT NULL,
  `status` enum('active','past') DEFAULT 'active',
  `confirmationEnabled` tinyint(1) DEFAULT '0',
  `hasEvaluation` tinyint(1) DEFAULT '0',
  `evaluation` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `confirmationCode` varchar(20) DEFAULT NULL,
  `verification_code` varchar(10) DEFAULT NULL,
  `code_expires_at` datetime DEFAULT NULL,
  `createdBy` varchar(20) DEFAULT NULL,
  `templateId` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`activityId`),
  KEY `fk_activity_template` (`templateId`),
  CONSTRAINT `fk_activity_template` FOREIGN KEY (`templateId`) REFERENCES `template` (`templateId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of activity
-- ----------------------------
INSERT INTO `activity` VALUES ('0OkoXvG4Hi0EEfo5VVAo', 'กิจกรรมอาจารย์1', 'ทดสอบกิจกรรมอาจารย์ 1', '2026-08-26', '21:00:00', '2026-08-26', '22:00:00', '1.00', 'ลานmf1', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '0', null, '2026-08-25 21:04:11', '2026-08-25 21:04:11', null, null, null, null, null);
INSERT INTO `activity` VALUES ('AtH9JUrfwqvlSc6J3k5L', 'test8', 'aaa', '2026-08-19', '00:17:00', null, null, null, 'aa', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'active', '0', '1', '[{\"id\":\"1787073444322\",\"question\":\"8\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการสื่อสาร\"}]', '2026-08-19 00:17:22', '2026-08-19 00:49:12', null, null, null, null, null);
INSERT INTO `activity` VALUES ('c4SyZyY4oQNSCQuLxpnA', 'อาจารย์ 1', 'ฟหกหฟก', '2026-08-26', '21:10:00', '2026-08-27', '21:10:00', '24.00', 'หฟกหฟก', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '0', null, '2026-08-25 21:11:00', '2026-08-25 21:11:00', null, null, null, null, null);
INSERT INTO `activity` VALUES ('cjBhBW9F-WWEr8EAHUHd', 'qasa', 'asa', '2026-08-25', '21:04:00', '2026-08-27', '21:04:00', '48.00', 'as', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '0', null, '2026-08-25 21:04:36', '2026-08-25 21:04:36', null, null, null, null, null);
INSERT INTO `activity` VALUES ('EDeAixkvD0sipyS2P35s', 'test1', 'ทดสอบ111111111', '2026-08-13', '13:30:00', null, null, null, 'ลานอเนก', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'active', '0', '1', '[{\"id\":\"1786455373370\",\"question\":\"aa\",\"options\":[\"qq\",\"ww\",\"ee\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการใช้ปัญญาประดิษฐ์\"},{\"id\":\"17864553960440.9871648840703113\",\"question\":\"กา\",\"options\":[\"ww\",\"หห\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ\"}]', '2026-08-11 20:36:07', '2026-08-12 13:18:29', null, null, null, null, null);
INSERT INTO `activity` VALUES ('FyCieVtI5UlN07JhWx-L', 'test6', 'ytryh', '2026-08-18', '23:47:00', null, null, null, 'tyt', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'active', '0', '1', '[{\"id\":\"1787071659980\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ\"},{\"id\":\"17870716703580.8727017949583402\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"},{\"id\":\"17870716836750.6674706612129905\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17870716936340.10019747762701181\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการใช้เครื่องมือวิทยาศาสตร์\"}]', '2026-08-18 23:47:37', '2026-08-19 00:49:13', null, null, null, null, null);
INSERT INTO `activity` VALUES ('HzYesQVxph43a6Dz6PIF', '7', 'rrtgh', '2026-08-18', '23:51:00', null, null, null, 'tryt', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '1', '[{\"id\":\"1787071902036\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการทำงานเป็นทีม\"},{\"id\":\"17870719065810.6965373467160937\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17870719074410.16973427547648623\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"}]', '2026-08-18 23:51:14', '2026-08-19 00:49:14', null, null, null, null, null);
INSERT INTO `activity` VALUES ('IC4kmdADcCnHqUP8pOs5', 'test9', '99', '2026-09-05', '05:48:00', null, null, null, '99', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '1', '[{\"id\":\"1787075340346\",\"question\":\"99\",\"options\":[\"9\",\"9\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการใช้ปัญญาประดิษฐ์\"}]', '2026-08-19 00:48:59', '2026-08-25 23:45:23', null, null, null, null, null);
INSERT INTO `activity` VALUES ('jTFlI3b7HbbnU71Sxz2z', 'test5', 'ทดสอบบบบบบ5', '2026-08-20', '12:30:00', null, null, null, 'mf', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'active', '0', '1', '[{\"id\":\"1787070816200\",\"question\":\"111111\",\"options\":[\"1\",\"1\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17870708320920.4778373606085745\",\"question\":\"2222\",\"options\":[\"2\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"}]', '2026-08-18 23:33:34', '2026-08-25 16:42:13', null, null, null, null, null);
INSERT INTO `activity` VALUES ('JuSJ9cXwjiSLt-iRI7h8', 'ทดสอบขอเพิ่มกิจกรรรมนิสิต', 'เทส', '2026-08-20', null, '2026-08-20', null, '0.00', 'กิจกรรมภายนอก', 'มทัก', 'ภายนอก', 'past', '0', '0', null, '2026-08-19 02:40:28', '2026-08-19 02:40:28', null, null, null, null, null);
INSERT INTO `activity` VALUES ('n2eKat-qpXkcUFojvdYd', 'test2', 'ทดสอบ2222222', '2026-08-11', '20:00:00', null, null, null, 'mf2000', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'active', '0', '1', '[{\"id\":\"1786457816450\",\"question\":\"กก\",\"options\":[\"a\",\"b\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"},{\"id\":\"17864578433180.8101648407539315\",\"question\":\"ขข\",\"options\":[\"ก\",\"ข\",\"ค\"],\"correctAnswer\":2,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"},{\"id\":\"17864578739880.0806751326324705\",\"question\":\"3\",\"options\":[\"1\",\"2\",\"3\",\"4\"],\"correctAnswer\":3,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17864579065510.7625623169280454\",\"question\":\"4\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการสร้างนวัตกรรมสังคม\"},{\"id\":\"17864579237850.9213275513100571\",\"question\":\"5\",\"options\":[\"1\",\"2\",\"3\",\"4\",\"5\"],\"correctAnswer\":4,\"skillName\":\"ทักษะการสร้างนวัตกรรมสังคม\"}]', '2026-08-11 20:43:33', '2026-08-18 23:47:06', null, null, null, null, null);
INSERT INTO `activity` VALUES ('UaPs6yuy4NTXgZ9mZZkM', 'test4', 'ทดสอบคำอธิบาย4', '2026-08-13', '13:30:00', null, null, null, 'หอประุม', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '1', '[{\"id\":\"1786517051881\",\"question\":\"เทส1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"}]', '2026-08-12 13:18:11', '2026-08-18 23:31:24', null, null, null, null, null);
INSERT INTO `activity` VALUES ('W0RowmTBk-gQueYpJyoo', 'test10', 'เทสคำอธิบายอิๆๆๆๆ', '2026-08-20', '01:00:00', '2026-08-20', '02:00:00', '1.00', 'mf3200', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '3', 'active', '0', '1', '[{\"id\":\"1787080442274\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะความปลอดภัยไซเบอร์\"},{\"id\":\"17870804508580.8406773773856789\",\"question\":\"1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการใช้เครื่องมือวิทยาศาสตร์\"}]', '2026-08-19 02:13:52', '2026-08-25 16:42:12', null, null, null, null, null);
INSERT INTO `activity` VALUES ('xJepYAXRNqb4tM4YA-qE', 'กิจกรรมทดสอบเกียรติบัตร 1', '11', '2026-08-26', '23:42:00', '2026-08-27', '13:45:00', '14.05', 'mf', 'เจดีฟาม', '1', 'active', '1', '1', '[{\"id\":\"1787676291461\",\"question\":\"q\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17876763042350.58650156600515\",\"question\":\"w\",\"options\":[\"1\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"}]', '2026-08-25 23:44:36', '2026-08-25 23:45:28', null, '713020', '2026-08-26 23:45:28', null, null);
INSERT INTO `activity` VALUES ('zg47jrSj6lC6uwHgObMo', 'test3', 'ทดสอบคำอธิบาย3', '2026-08-13', '01:30:00', null, null, null, 'หอใน', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '1', '[{\"id\":\"1786469190279\",\"question\":\"a\",\"options\":[\"a\",\"b\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17864692108980.5822148406628919\",\"question\":\"b\",\"options\":[\"a\",\"b\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการทำงานเป็นทีม\"},{\"id\":\"17864692295200.4873147474297371\",\"question\":\"c\",\"options\":[\"a\",\"b\",\"c\"],\"correctAnswer\":2,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"}]', '2026-08-12 00:26:23', '2026-08-18 23:38:41', null, null, null, null, null);
INSERT INTO `activity` VALUES ('_K4xSXCyCZbSU3l_bcwT', 'อาจารย? 2', 'หกดกหดหกดกหด', '2026-08-26', '21:21:00', '2026-08-26', '23:21:00', '2.00', 'ฟหกหฟก', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', '0', '1', '[{\"id\":\"1787667733783\",\"question\":\"a\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"},{\"id\":\"17876677473850.17380747793181206\",\"question\":\"b\",\"options\":[\"1\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"}]', '2026-08-25 21:21:52', '2026-08-25 23:45:20', null, null, null, '5JkZtifImH-UzZHtBPq3', null);

-- ----------------------------
-- Table structure for activityskill
-- ----------------------------
DROP TABLE IF EXISTS `activityskill`;
CREATE TABLE `activityskill` (
  `ActivitySkillId` varchar(20) NOT NULL,
  `activityId` varchar(20) DEFAULT NULL,
  `skillId` varchar(20) DEFAULT NULL,
  `skillname` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ActivitySkillId`),
  KEY `fk_activityskill_activity` (`activityId`) USING BTREE,
  KEY `fk_activityskill_skill` (`skillId`) USING BTREE,
  CONSTRAINT `activityskill_ibfk_1` FOREIGN KEY (`activityId`) REFERENCES `activity` (`activityId`),
  CONSTRAINT `activityskill_ibfk_2` FOREIGN KEY (`skillId`) REFERENCES `skill` (`skillId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of activityskill
-- ----------------------------
INSERT INTO `activityskill` VALUES ('-5W_HdvavhqGdsLiybyr', 'n2eKat-qpXkcUFojvdYd', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('-_SiP99NgdWxdESrFKGh', 'cjBhBW9F-WWEr8EAHUHd', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('0CtzqxCm40OJnsDOiKb3', 'FyCieVtI5UlN07JhWx-L', 'sk002', 'ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ', 'กลาง');
INSERT INTO `activityskill` VALUES ('41uRXizZK8xCwTUNtQTx', 'cjBhBW9F-WWEr8EAHUHd', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง');
INSERT INTO `activityskill` VALUES ('50PfH8Z0QiYdq4ixZXQJ', 'jTFlI3b7HbbnU71Sxz2z', 'sk011', 'ทักษะดิจิทัล', 'สูง');
INSERT INTO `activityskill` VALUES ('7q7LfoR9N-OhUijHaBa-', 'W0RowmTBk-gQueYpJyoo', 'sk006', 'ทักษะความปลอดภัยไซเบอร์', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('8KNvd2n2DYZmXEWx-zQE', 'c4SyZyY4oQNSCQuLxpnA', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('8y4XaoKoE3SdEdLeRh8J', 'EDeAixkvD0sipyS2P35s', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('9NZldetxNKrjh3Qn-815', 'EDeAixkvD0sipyS2P35s', 'sk005', 'ทักษะการใช้ปัญญาประดิษฐ์', 'สูง');
INSERT INTO `activityskill` VALUES ('9Z9wvnyiFbPl9NJoTEoU', 'JuSJ9cXwjiSLt-iRI7h8', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('c5FxJ_9VpYnN2_qzcqFa', 'n2eKat-qpXkcUFojvdYd', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'สูง');
INSERT INTO `activityskill` VALUES ('cJU8ODGIMDlKWdoSGKR8', '_K4xSXCyCZbSU3l_bcwT', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง');
INSERT INTO `activityskill` VALUES ('CQagO3h8fsRh14pDPHtu', '0OkoXvG4Hi0EEfo5VVAo', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('cVuratADorhzI16pkb5n', 'HzYesQVxph43a6Dz6PIF', 'sk009', 'ทักษะการทำงานเป็นทีม', 'กลาง');
INSERT INTO `activityskill` VALUES ('cXKHVDK0EA3xr0VuJF13', 'IC4kmdADcCnHqUP8pOs5', 'sk005', 'ทักษะการใช้ปัญญาประดิษฐ์', 'สูง');
INSERT INTO `activityskill` VALUES ('CYsjq7wvV0mNyywWmHf4', 'jTFlI3b7HbbnU71Sxz2z', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('DS7pkd12TgY2SHeYZP0s', 'zg47jrSj6lC6uwHgObMo', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('EEmwskZMPLvRNKAPjXHI', 'UaPs6yuy4NTXgZ9mZZkM', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('eFWNR9VBF4P3jxM4iaND', 'UaPs6yuy4NTXgZ9mZZkM', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('eqc8vUDZt5x5vcLMVhXE', 'xJepYAXRNqb4tM4YA-qE', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง');
INSERT INTO `activityskill` VALUES ('EXKQFCmFnH3yFsFJpSWO', 'AtH9JUrfwqvlSc6J3k5L', 'sk007', 'ทักษะการสื่อสาร', 'สูง');
INSERT INTO `activityskill` VALUES ('F29fdEEgp-sK9npxAMQX', '_K4xSXCyCZbSU3l_bcwT', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('g2Pn-IskDlWAI1zkZxFQ', '0OkoXvG4Hi0EEfo5VVAo', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('GM3dt7DHX5uY2WWdXDyU', 'c4SyZyY4oQNSCQuLxpnA', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง');
INSERT INTO `activityskill` VALUES ('grptXYSf_Y5qczgLLnPv', '0OkoXvG4Hi0EEfo5VVAo', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง');
INSERT INTO `activityskill` VALUES ('I0wWkdfhF6Lrxv7vT6F8', 'xJepYAXRNqb4tM4YA-qE', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'สูง');
INSERT INTO `activityskill` VALUES ('Ky4PAiWVFLebkSmkQV9t', 'n2eKat-qpXkcUFojvdYd', 'sk001', 'ทักษะการสร้างนวัตกรรมสังคม', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('KZRg6k_Ip5es8-IRbzsO', 'FyCieVtI5UlN07JhWx-L', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('KzxcUJVRh-dQz2nfiouj', 'zg47jrSj6lC6uwHgObMo', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง');
INSERT INTO `activityskill` VALUES ('m3759vKjqcU8tvhsX7l2', 'HzYesQVxph43a6Dz6PIF', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง');
INSERT INTO `activityskill` VALUES ('MATEVbmG-vbRPHemNq8V', 'HzYesQVxph43a6Dz6PIF', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `activityskill` VALUES ('N8yFZ_WlhUy5rUNNeala', 'UaPs6yuy4NTXgZ9mZZkM', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง');
INSERT INTO `activityskill` VALUES ('oaFDRoY6bwZW3mRaBDGi', 'FyCieVtI5UlN07JhWx-L', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'สูง');
INSERT INTO `activityskill` VALUES ('pdC2StbJszawKHvh2nBj', 'FyCieVtI5UlN07JhWx-L', 'sk004', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 'กลาง');
INSERT INTO `activityskill` VALUES ('rBv180oaxowbwZknkKUJ', 'c4SyZyY4oQNSCQuLxpnA', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('sC_Yp3CsRbnB32LNHvH2', 'jTFlI3b7HbbnU71Sxz2z', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'สูง');
INSERT INTO `activityskill` VALUES ('sTCa40p3iZNHEapmysZc', 'JuSJ9cXwjiSLt-iRI7h8', 'sk007', 'ทักษะการสื่อสาร', 'กลาง');
INSERT INTO `activityskill` VALUES ('tMpxo3bQILg1MW2Cgc1N', 'EDeAixkvD0sipyS2P35s', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง');
INSERT INTO `activityskill` VALUES ('UpyXO0nTv0t-hBRtUL0L', 'EDeAixkvD0sipyS2P35s', 'sk002', 'ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('uV5gbr9HwliizrST7VPf', 'W0RowmTBk-gQueYpJyoo', 'sk004', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 'สูง');
INSERT INTO `activityskill` VALUES ('YDR7ryKReRwukg74SQ65', 'zg47jrSj6lC6uwHgObMo', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน');
INSERT INTO `activityskill` VALUES ('zo69JmbS9C318izaH44G', 'cjBhBW9F-WWEr8EAHUHd', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง');

-- ----------------------------
-- Table structure for activity_request
-- ----------------------------
DROP TABLE IF EXISTS `activity_request`;
CREATE TABLE `activity_request` (
  `requestId` varchar(20) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `activityName` varchar(255) NOT NULL,
  `organizer` varchar(255) NOT NULL,
  `activityDate` date NOT NULL,
  `activityEndDate` date DEFAULT NULL,
  `description` text NOT NULL,
  `evidenceFiles` longtext,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reason` text,
  `approvedActivityId` varchar(20) DEFAULT NULL,
  `reviewedAt` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`requestId`),
  KEY `idx_activity_request_student` (`studentId`),
  KEY `idx_activity_request_status` (`status`),
  CONSTRAINT `fk_activity_request_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of activity_request
-- ----------------------------
INSERT INTO `activity_request` VALUES ('l4k9CayH-AtiGR-uCkbm', '112121212', 'อบรมคอมพิวเตอร์ ', 'มศว', '2026-08-21', null, 'เทสรายละเอียด', '[\"หลังประเมิน.png\",\"เพิ่ม กิจกรรม.png\",\"แดชบอรดเจ้าหน้าที่.pdf\",\"ใบงานบทที่ 5 (1).pdf\",\"หลังประเมิน.png\"]', 'pending', null, null, null, '2026-08-19 02:24:38', '2026-08-19 02:24:38');
INSERT INTO `activity_request` VALUES ('YY4qJVxE4ZnrhvxAPmVl', '112121212', 'ทดสอบขอเพิ่มกิจกรรรมนิสิต', 'มทัก', '2026-08-20', '2026-08-20', 'เทส', '[{\"name\":\"หลังประเมิน.png\",\"url\":\"/uploads/activity-requests/Pv6TxYdLOU/uWyq4lST-หลังประเมิน.png\",\"type\":\"image/png\"},{\"name\":\"class1.pdf\",\"url\":\"/uploads/activity-requests/Pv6TxYdLOU/WHj0YlGA-class1.pdf\",\"type\":\"application/pdf\"},{\"name\":\"หลังประเมิน.png\",\"url\":\"/uploads/activity-requests/Pv6TxYdLOU/xjd4oIo4-หลังประเมิน.png\",\"type\":\"image/png\"},{\"name\":\"อนุมัติคำขอเพิ่มทักษะ.png\",\"url\":\"/uploads/activity-requests/Pv6TxYdLOU/m7JJJF0y-อนุมัติคำขอเพิ่มทักษะ.png\",\"type\":\"image/png\"},{\"name\":\"ยังไม่มีแบบประเมิน.png\",\"url\":\"/uploads/activity-requests/Pv6TxYdLOU/zjBq56iX-ยังไม่มีแบบประเมิน.png\",\"type\":\"image/png\"}]', 'approved', null, 'JuSJ9cXwjiSLt-iRI7h8', '2026-08-19 02:40:28', '2026-08-19 02:39:49', '2026-08-19 02:40:28');

-- ----------------------------
-- Table structure for activity_request_skill
-- ----------------------------
DROP TABLE IF EXISTS `activity_request_skill`;
CREATE TABLE `activity_request_skill` (
  `requestSkillId` varchar(20) NOT NULL,
  `requestId` varchar(20) NOT NULL,
  `skillname` varchar(100) NOT NULL,
  `level` varchar(50) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`requestSkillId`),
  KEY `idx_activity_request_skill_request` (`requestId`),
  CONSTRAINT `fk_activity_request_skill_request` FOREIGN KEY (`requestId`) REFERENCES `activity_request` (`requestId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of activity_request_skill
-- ----------------------------
INSERT INTO `activity_request_skill` VALUES ('jRhv4eBqqTbPyzXHOGtq', 'YY4qJVxE4ZnrhvxAPmVl', 'ทักษะการสื่อสาร', 'กลาง', '2026-08-19 02:40:28');
INSERT INTO `activity_request_skill` VALUES ('ZB0NgbEbgzA0U845zRY3', 'YY4qJVxE4ZnrhvxAPmVl', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน', '2026-08-19 02:40:28');

-- ----------------------------
-- Table structure for advisor
-- ----------------------------
DROP TABLE IF EXISTS `advisor`;
CREATE TABLE `advisor` (
  `AdvisorId` varchar(20) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `advisorUserId` varchar(20) NOT NULL,
  PRIMARY KEY (`AdvisorId`),
  KEY `idx_advisor_student` (`studentId`),
  KEY `idx_advisor_user` (`advisorUserId`),
  CONSTRAINT `fk_advisor_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`) ON DELETE CASCADE,
  CONSTRAINT `fk_advisor_user` FOREIGN KEY (`advisorUserId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of advisor
-- ----------------------------
INSERT INTO `advisor` VALUES ('72bvQDw-_C7nBzVZGjk6', '6720210099', '5JkZtifImH-UzZHtBPq3');
INSERT INTO `advisor` VALUES ('Qhay7SHDM1HQ8cJBxeif', 'ุ662021085', '4WZ35zQjuFr8u40oTQsI');
INSERT INTO `advisor` VALUES ('YDvXDG1eKn6yCk_a-Bak', '6720210099', 'GnDJs_qvcwysf58sCIii');

-- ----------------------------
-- Table structure for officer
-- ----------------------------
DROP TABLE IF EXISTS `officer`;
CREATE TABLE `officer` (
  `officerId` varchar(20) NOT NULL,
  `userId` varchar(20) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`officerId`),
  UNIQUE KEY `uk_officer_userId` (`userId`),
  CONSTRAINT `fk_officer_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of officer
-- ----------------------------

-- ----------------------------
-- Table structure for participation
-- ----------------------------
DROP TABLE IF EXISTS `participation`;
CREATE TABLE `participation` (
  `ParticipationId` varchar(20) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `activityId` varchar(20) NOT NULL,
  `hours` decimal(5,2) DEFAULT '0.00',
  `joinDate` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `score` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ParticipationId`),
  KEY `idx_participation_student` (`studentId`),
  KEY `idx_participation_activity` (`activityId`),
  CONSTRAINT `fk_participation_activity` FOREIGN KEY (`activityId`) REFERENCES `activity` (`activityId`) ON DELETE CASCADE,
  CONSTRAINT `fk_participation_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of participation
-- ----------------------------
INSERT INTO `participation` VALUES ('1787070710881', '2223432123', 'zg47jrSj6lC6uwHgObMo', '0.00', '2026-08-18', 'completed', '4.00', '2026-08-18 23:31:50', '2026-08-18 23:31:50');
INSERT INTO `participation` VALUES ('1787070885613', '2223432123', 'jTFlI3b7HbbnU71Sxz2z', '0.00', '2026-08-18', 'completed', '4.00', '2026-08-18 23:34:45', '2026-08-18 23:34:45');
INSERT INTO `participation` VALUES ('1787071162996', '2223432123', 'n2eKat-qpXkcUFojvdYd', '0.00', '2026-08-18', 'completed', '4.00', '2026-08-18 23:39:22', '2026-08-18 23:39:22');
INSERT INTO `participation` VALUES ('1787071730698', '2223432123', 'FyCieVtI5UlN07JhWx-L', '0.00', '2026-08-18', 'completed', '8.00', '2026-08-18 23:48:50', '2026-08-18 23:48:50');
INSERT INTO `participation` VALUES ('1787072213311', '2223432123', 'HzYesQVxph43a6Dz6PIF', '0.00', '2026-08-18', 'completed', '6.00', '2026-08-18 23:56:53', '2026-08-18 23:56:53');
INSERT INTO `participation` VALUES ('1787072248181', '112121212', 'HzYesQVxph43a6Dz6PIF', '0.00', '2026-08-18', 'completed', '6.00', '2026-08-18 23:57:28', '2026-08-18 23:57:28');
INSERT INTO `participation` VALUES ('1787073543371', '112121212', 'AtH9JUrfwqvlSc6J3k5L', '0.00', '2026-08-19', 'completed', '3.00', '2026-08-19 00:19:03', '2026-08-19 00:19:03');
INSERT INTO `participation` VALUES ('1787074174690', '112121212', 'FyCieVtI5UlN07JhWx-L', '0.00', '2026-08-19', 'completed', '8.00', '2026-08-19 00:29:34', '2026-08-19 00:29:34');
INSERT INTO `participation` VALUES ('1787074247178', '112121212', 'jTFlI3b7HbbnU71Sxz2z', '0.00', '2026-08-19', 'completed', '4.00', '2026-08-19 00:30:47', '2026-08-19 00:30:47');
INSERT INTO `participation` VALUES ('1787075363369', '112121212', 'IC4kmdADcCnHqUP8pOs5', '0.00', '2026-08-19', 'completed', '3.00', '2026-08-19 00:49:23', '2026-08-19 00:49:23');
INSERT INTO `participation` VALUES ('1787080508224', '112121212', 'W0RowmTBk-gQueYpJyoo', '1.00', '2026-08-19', 'completed', '1.00', '2026-08-19 02:15:08', '2026-08-19 02:15:08');
INSERT INTO `participation` VALUES ('1787083916685', '662021086', 'IC4kmdADcCnHqUP8pOs5', '0.00', '2026-08-19', 'completed', '0.00', '2026-08-19 03:11:56', '2026-08-19 03:11:56');
INSERT INTO `participation` VALUES ('1787083940672', '662021086', 'jTFlI3b7HbbnU71Sxz2z', '0.00', '2026-08-19', 'completed', '4.00', '2026-08-19 03:12:20', '2026-08-19 03:12:20');
INSERT INTO `participation` VALUES ('1787590556064', 'ุ662021085', 'IC4kmdADcCnHqUP8pOs5', '0.00', '2026-08-24', 'completed', '0.00', '2026-08-24 23:55:56', '2026-08-24 23:55:56');
INSERT INTO `participation` VALUES ('1787590580787', 'ุ662021085', 'jTFlI3b7HbbnU71Sxz2z', '0.00', '2026-08-24', 'completed', '4.00', '2026-08-24 23:56:20', '2026-08-24 23:56:20');
INSERT INTO `participation` VALUES ('1787664640853', '6720210099', 'IC4kmdADcCnHqUP8pOs5', '0.00', '2026-08-25', 'completed', '3.00', '2026-08-25 20:30:40', '2026-08-25 20:30:40');
INSERT INTO `participation` VALUES ('1787667799940', '6720210099', '_K4xSXCyCZbSU3l_bcwT', '2.00', '2026-08-25', 'completed', '4.00', '2026-08-25 21:23:19', '2026-08-25 21:23:19');
INSERT INTO `participation` VALUES ('1787676361193', '6720210099', 'xJepYAXRNqb4tM4YA-qE', '14.05', '2026-08-25', 'completed', '2.00', '2026-08-25 23:46:01', '2026-08-25 23:46:01');
INSERT INTO `participation` VALUES ('yEsHoW2_cYypOZeQzK5Q', '112121212', 'JuSJ9cXwjiSLt-iRI7h8', '0.00', '2026-08-19', 'completed', '2.00', '2026-08-19 02:40:28', '2026-08-19 02:40:28');

-- ----------------------------
-- Table structure for skill
-- ----------------------------
DROP TABLE IF EXISTS `skill`;
CREATE TABLE `skill` (
  `skillId` varchar(20) NOT NULL,
  `skillname` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`skillId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of skill
-- ----------------------------
INSERT INTO `skill` VALUES ('sk001', 'ทักษะการสร้างนวัตกรรมสังคม', 'กลาง');
INSERT INTO `skill` VALUES ('sk002', 'ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ', 'กลาง');
INSERT INTO `skill` VALUES ('sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง');
INSERT INTO `skill` VALUES ('sk004', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 'กลาง');
INSERT INTO `skill` VALUES ('sk005', 'ทักษะการใช้ปัญญาประดิษฐ์', 'กลาง');
INSERT INTO `skill` VALUES ('sk006', 'ทักษะความปลอดภัยไซเบอร์', 'กลาง');
INSERT INTO `skill` VALUES ('sk007', 'ทักษะการสื่อสาร', 'กลาง');
INSERT INTO `skill` VALUES ('sk008', 'ทักษะการเป็นผู้ประกอบการ', 'กลาง');
INSERT INTO `skill` VALUES ('sk009', 'ทักษะการทำงานเป็นทีม', 'กลาง');
INSERT INTO `skill` VALUES ('sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง');
INSERT INTO `skill` VALUES ('sk011', 'ทักษะดิจิทัล', 'กลาง');

-- ----------------------------
-- Table structure for students
-- ----------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `studentId` varchar(20) NOT NULL,
  `userId` varchar(20) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `profileImageUrl` varchar(500) DEFAULT NULL,
  `profileimage` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`studentId`),
  UNIQUE KEY `uk_students_userId` (`userId`),
  CONSTRAINT `fk_students_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of students
-- ----------------------------
INSERT INTO `students` VALUES ('111111111', 'hX4hGIxhairCWLE_A50K', 'Arraya5', 'Putila', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'หกหก', '2', '0913333333', null, null);
INSERT INTO `students` VALUES ('112121212', 'rdWGBuG-pOCe7tk9Yxjq', 'อารายา', 'ปูตีล่า', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'คอม', '4', '0913339246', null, null);
INSERT INTO `students` VALUES ('2223432123', 'KHe6T_p_Ze5MR-8p7a74', 'อารายา4', 'ปูตีล่า', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'คอม', '4', '0921111235', null, null);
INSERT INTO `students` VALUES ('662021086', 'Ys-C65MocekSO7jVlQ_J', 'test5', 'Putila', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'ฟิสิกส์', '2', '0913333331', '/uploads/profiles/662021086/lbNoIW2M-me8.jpg', null);
INSERT INTO `students` VALUES ('6720210003', 'y1SParIMkg4cfrhh4Cnm', 'หวาน', 'น้ำ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'เคมี', '3', '0998989798', null, null);
INSERT INTO `students` VALUES ('6720210099', 'acC8QYr_G9psDklexWz6', 's1', '1', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', '2', '0921212343', '/uploads/profiles/6720210099/gbzQJVeT-me6.jpg', null);
INSERT INTO `students` VALUES ('672021999', '37DO8fWipj2JXJsToZqM', 'อารายา2', 'ปูตีล่า', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทคอม', '4', '0921111234', null, null);
INSERT INTO `students` VALUES ('ุ662021085', 'h05eSWBcPcndWmi5Njp0', 'อัฟนาน', 'หะยีเหย็บ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', null, '0886730334', null, null);

-- ----------------------------
-- Table structure for teacher
-- ----------------------------
DROP TABLE IF EXISTS `teacher`;
CREATE TABLE `teacher` (
  `teacherId` varchar(20) NOT NULL,
  `userId` varchar(20) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `program` varchar(255) DEFAULT NULL,
  `isExecutive` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`teacherId`),
  UNIQUE KEY `uk_teacher_userId` (`userId`),
  CONSTRAINT `fk_teacher_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of teacher
-- ----------------------------
INSERT INTO `teacher` VALUES ('cM1mPT44cHBXlKpNcXAS', '5JkZtifImH-UzZHtBPq3', 'แก้วมณี', 'ศรีสงคราม', 'ผู้ช่วยศาสตราจารย์', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', '0');
INSERT INTO `teacher` VALUES ('GqpL2BIcTxLLc4bBq5iG', '4WZ35zQjuFr8u40oTQsI', 'x1', '1', 'รองคณบดีฝ่ายวิจัย', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', '1');
INSERT INTO `teacher` VALUES ('iBdPZdqUjIYyAFKDht2z', 'GnDJs_qvcwysf58sCIii', 'อ1', '1', 'อาจารย์ / รองคณบดีฝ่ายวิชาการ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', '1');
INSERT INTO `teacher` VALUES ('LrVWytxBEEZ6weXkR3mF', 'tQdk4Wmx1SEOpctOUaGF', 'อ1', '1', 'ผู้ช่วยศาสตราจารย์', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'คณิตศาสตร์และการจัดการข้อมูล', '0');
INSERT INTO `teacher` VALUES ('pDzpqP9CHjgELtEYKSNP', 'yDaIvH6w2jrUN7L0ejM1', 'อ2', '2', 'รองศาสตราจารย์', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'ฟิสิกส์', '0');

-- ----------------------------
-- Table structure for template
-- ----------------------------
DROP TABLE IF EXISTS `template`;
CREATE TABLE `template` (
  `templateId` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `imageUrl` varchar(500) NOT NULL,
  `fileType` varchar(50) DEFAULT 'image/png',
  `status` enum('active','inactive') DEFAULT 'active',
  `uploadedBy` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`templateId`),
  KEY `idx_status` (`status`),
  KEY `idx_uploadedBy` (`uploadedBy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of template
-- ----------------------------
INSERT INTO `template` VALUES ('disIWcPqLMZvZyOo85y5', '1', '1', '/uploads/templates/disIWcPqLMZvZyOo85y5/nxntvmJW-Blue_and_Gold_Elegant_Certificate_of_Achievement.png', 'image/png', 'active', 'acC8QYr_G9psDklexWz6', '2026-08-26 00:19:45', '2026-08-26 00:19:45');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `userId` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','teacher','officer','executive') NOT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('37DO8fWipj2JXJsToZqM', 'jeeda3@gmail.com', '$2a$10$R56g022fEOo69xDOcEOHMuDzu43RApbTkjLrFy2SxGaXovkBKSxnS', 'student', 'active', '2026-08-16 16:38:57', '2026-08-16 16:38:57');
INSERT INTO `users` VALUES ('4WZ35zQjuFr8u40oTQsI', 'x1@tsu.ac.th', '$2a$10$PCd3yvoQSUqhQ1/HHAZgJuiEe.jOfm42rmy9FiCwMsE9WLiwE3TPu', 'teacher', 'active', '2026-08-16 18:28:57', '2026-08-16 18:28:57');
INSERT INTO `users` VALUES ('5JkZtifImH-UzZHtBPq3', 'k@tsu.ac.th', '$2a$10$e3vDsy5C9x7zsXza3nY22uYrxDzXPtk09t/z/Fx7YAQYI3EUYu8hO', 'teacher', 'active', '2026-08-19 13:33:05', '2026-08-19 13:33:05');
INSERT INTO `users` VALUES ('acC8QYr_G9psDklexWz6', 's1@tsu.ac.th', '$2a$10$pZQFvWweCSNAKB9ctq5Hw.QoWO6tmFBy0lD.hMqdhwFi9Jg0hDOqW', 'student', 'active', '2026-08-25 16:04:44', '2026-08-25 16:04:44');
INSERT INTO `users` VALUES ('GnDJs_qvcwysf58sCIii', 'a1@tsu.ac.th', '$2a$10$slwuWPA.HuKKXcwyhl6exOkoM.MpyWcQsto6SC947.9sendlfP7A.', 'teacher', 'active', '2026-08-25 16:03:25', '2026-08-25 16:03:25');
INSERT INTO `users` VALUES ('h05eSWBcPcndWmi5Njp0', '662021085@tsu.ac.th', '$2a$10$QEhCitE.6WNyBqSN//8cFeBuwzALORA0PpSYUvCfrwPn6B3iJUlVy', 'student', 'active', '2026-08-19 13:21:51', '2026-08-19 13:21:51');
INSERT INTO `users` VALUES ('hX4hGIxhairCWLE_A50K', 'jeeda5@xn--tsu-gkla8o7exi', '$2a$10$8bGmWGthoccgvbG/tSUYcueSI8qf9u9F6ObLNxa2psOiUKI8PRhxS', 'student', 'active', '2026-08-19 02:53:33', '2026-08-19 02:56:17');
INSERT INTO `users` VALUES ('KHe6T_p_Ze5MR-8p7a74', 'jeeda4@gmail.com', '$2a$10$B5dV8bjD5h5pGGSu70zmr.NK6GLl7kEXMiW6FTsxM2AdnDP2ksFvu', 'student', 'active', '2026-08-18 23:30:02', '2026-08-18 23:30:02');
INSERT INTO `users` VALUES ('rdWGBuG-pOCe7tk9Yxjq', 'jeeda1@gmail.com', '$2a$10$yAlKQDC8y0TJilhEUVA5rOTUv.TEFwp.buhzIQ4HnmRGt/mxwIiDi', 'student', 'active', '2026-08-16 16:29:56', '2026-08-16 16:29:56');
INSERT INTO `users` VALUES ('tQdk4Wmx1SEOpctOUaGF', '1@tsu.ac.th', '$2a$10$x8b/NbCuLnshsqAdlwv2V.tUdvNrC1Gv3THWkChaGbGH0Y/qDhEzK', 'teacher', 'active', '2026-08-16 17:49:03', '2026-08-16 17:49:03');
INSERT INTO `users` VALUES ('y1SParIMkg4cfrhh4Cnm', '6720210003@tsu.ac.th', '$2a$10$HvL84tUPum.6sBUKIMscfORUoxE/F0Kufn6JRFxZKmcC0b8GEYzEu', 'student', 'active', '2026-08-25 20:03:06', '2026-08-25 20:03:06');
INSERT INTO `users` VALUES ('yDaIvH6w2jrUN7L0ejM1', '2@tsu.ac.th', '$2a$10$bDLLJdys07BM4TwnW4E6TukECtVSUcOgpD89hgYgZhm0s.gTPHw3G', 'teacher', 'active', '2026-08-16 17:59:44', '2026-08-16 17:59:44');
INSERT INTO `users` VALUES ('Ys-C65MocekSO7jVlQ_J', '662021086@tsu.ac.th', '$2a$10$0wpVzLTTAcEZCuVqUb1tpOcqY1tW8w14glK.0G3qsy9Flk0FFZyoG', 'student', 'active', '2026-08-19 03:10:11', '2026-08-19 03:10:11');
