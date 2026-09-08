-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql:3306
-- Generation Time: Sep 07, 2026 at 01:53 PM
-- Server version: 8.0.46
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skilltranscript`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity`
--

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
  `templateId` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity`
--

INSERT INTO `activity` (`activityId`, `activityName`, `description`, `date`, `time`, `endDate`, `endTime`, `hours`, `location`, `organizer`, `term`, `status`, `confirmationEnabled`, `hasEvaluation`, `evaluation`, `created_at`, `updated_at`, `confirmationCode`, `verification_code`, `code_expires_at`, `createdBy`, `templateId`) VALUES
('19NV0M0kUWV71h2Z3_09', 'เพื่อนช่วยกัน', 'ทดสอบ2', '2026-09-02', '08:00:00', '2026-09-02', '13:00:00', 5.00, 'mf2200', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'past', 0, 1, '[{\"id\":\"1788275023638\",\"question\":\"คำถาม1\",\"options\":[\"1\",\"2\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"},{\"id\":\"17882750421610.05996099024577184\",\"question\":\"คำถาม2\",\"options\":[\"1\",\"2\"],\"correctAnswer\":1,\"skillName\":\"ทักษะการคิดและการแก้ปัญหา\"}]', '2026-09-01 22:03:39', '2026-09-05 00:31:17', NULL, NULL, NULL, NULL, 'qd6wjTvdriGQkvyrcNo1'),
('1iVzqXcCOfFZ0Rd1IDuX', 'dd', 'dd', '2026-09-08', '04:50:00', '2026-09-10', '04:50:00', 48.00, 'dd', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'active', 1, 1, '[{\"id\":\"1788709490753\",\"question\":\"aa\",\"options\":[\"a\",\"a\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"]},{\"id\":\"17887094923330.7240935092313698\",\"question\":\"aa\",\"options\":[\"a\",\"a\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"]}]', '2026-09-06 15:44:48', '2026-09-06 21:51:17', NULL, '251364', '2026-09-07 21:51:17', NULL, 'qd6wjTvdriGQkvyrcNo1'),
('1pJlCp4FQdn9N285LHvY', 'jd', 'dd', '2026-09-07', '22:11:00', '2026-09-08', '22:11:00', 24.00, 'dd', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '2', 'past', 0, 1, '[{\"id\":\"1788707523308\",\"question\":\"qq\",\"options\":[\"q\",\"w\",\"e\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะดิจิทัล\",\"ทักษะการสื่อสาร\",\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"]}]', '2026-09-06 12:47:15', '2026-09-06 15:33:32', NULL, NULL, NULL, NULL, 'qd6wjTvdriGQkvyrcNo1'),
('5WcyER1J2nH9w8q4SNI1', 'cd', 'dsds', '2026-09-02', '02:25:00', '2026-09-09', '02:25:00', 168.00, 'asdsad', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'past', 0, 1, '[{\"id\":\"1788543657139\",\"question\":\"a\",\"options\":[\"a\",\"a\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"}]', '2026-09-02 02:24:48', '2026-09-05 00:41:13', NULL, NULL, NULL, 'Fyia5uadxZD1iOBqIRhL', 'qd6wjTvdriGQkvyrcNo1'),
('6KIhvoJbSlNEPaOsj_Uf', 'test3', 'wqewer', '2026-09-06', '00:36:00', '2026-09-07', '00:37:00', 24.02, 'werwe', 'werewrewr', '1', 'past', 0, 1, '[{\"id\":\"1788543435530\",\"question\":\"a\",\"options\":[\"a\",\"a\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"}]', '2026-09-05 00:37:12', '2026-09-06 15:33:34', NULL, NULL, NULL, 'Fyia5uadxZD1iOBqIRhL', 'uWOpRjptE2AIdNDL68ep'),
('6Si4lNoSM2lbcEGjnAAZ', 'xx', 'xx', '2026-09-14', '22:38:00', '2026-09-15', '22:38:00', 24.00, 'x', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', 1, 1, '[{\"id\":\"1788709126592\",\"question\":\"z\",\"options\":[\"z\",\"z\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"]}]', '2026-09-06 15:38:44', '2026-09-06 20:57:01', NULL, '437303', '2026-09-07 20:57:00', NULL, 'uWOpRjptE2AIdNDL68ep'),
('cmBMA0GTNFDcPtr5O-9S', 'ฟฟ', 'ฟฟ', '2026-09-06', '22:06:00', '2026-09-07', '20:06:00', 22.00, 'ฟฟ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '3', 'past', 0, 1, '[{\"id\":\"1788706352289\",\"question\":\"test\",\"options\":[\"qไำไ\",\"ไๆำไ\"],\"correctAnswer\":1,\"skillNames\":[\"ทักษะการคิดและการแก้ปัญหา\",\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"]}]', '2026-09-06 13:06:28', '2026-09-06 15:33:35', NULL, NULL, NULL, NULL, NULL),
('MaiBzvl_MubJ2BMAq2Fk', 'pitching league', 'ไม่รู้เหมือนกัน', '2026-09-01', NULL, '2026-09-02', NULL, 0.00, 'กิจกรรมภายนอก', 'กิจการนิสิต', 'ภายนอก', 'past', 0, 0, NULL, '2026-09-05 14:08:01', '2026-09-05 14:08:01', NULL, NULL, NULL, NULL, NULL),
('MapzXr0ZzH77k2v_JesW', 'ปฐมนิเทศ', 'ไหว้ครูทำไม', '2026-09-07', '22:33:00', '2026-09-08', '22:33:00', 24.00, 'ฟฟ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'past', 0, 1, '[{\"id\":\"1788591259357\",\"question\":\"สร้างคำถามทำไม\",\"options\":[\"ทำไมมมม\",\"ทำำำำำำำำำ\",\"อะไร\"],\"correctAnswer\":1,\"skillName\":\"ทักษะดิจิทัล\"}]', '2026-09-05 13:54:05', '2026-09-06 20:56:49', NULL, NULL, NULL, NULL, NULL),
('MVSNhPboMzpEYHvpakDx', 'qq', 'qq', '2026-09-08', NULL, '2026-09-29', NULL, 0.00, 'กิจกรรมภายนอก', 'qq', 'ภายนอก', 'past', 0, 0, NULL, '2026-09-05 16:41:40', '2026-09-05 16:41:40', NULL, NULL, NULL, NULL, NULL),
('NYVty4jnZKrKbVlVtQqF', 'ๆๆ', 'ๆๆ', '2026-09-07', '22:34:00', '2026-09-08', '22:34:00', 24.00, 'ๆๆ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'past', 0, 1, '[{\"id\":\"1788708884265\",\"question\":\"ๆ\",\"options\":[\"ๆ\",\"ๆ\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะการทำงานเป็นทีม\",\"ทักษะการคิดเชิงออกแบบนวัตกรรม\",\"ทักษะการคิดและการแก้ปัญหา\"]}]', '2026-09-06 15:34:41', '2026-09-06 20:56:44', NULL, NULL, NULL, NULL, NULL),
('p6Ri7IsiyYNBD77J7Y_z', 'อบรม ai ขั้นสูง', 'การใช้ ai ', '2026-08-27', '13:00:00', '2026-08-27', '14:00:00', 1.00, 'mf2200', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'past', 0, 1, '[{\"id\":\"1787722069037\",\"question\":\"ai ย่อมาจากอะไร\",\"options\":[\"ai\",\"ia\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการใช้ปัญญาประดิษฐ์\"},{\"id\":\"17877220716180.5717768916009849\",\"question\":\"ai ใช้ทำอะไร\",\"options\":[\"ช่วยคิด\",\"ทำการบ้าน\"],\"correctAnswer\":0,\"skillName\":\"ทักษะการคิดเชิงออกแบบนวัตกรรม\"}]', '2026-08-26 12:27:46', '2026-09-05 00:40:40', NULL, NULL, NULL, NULL, NULL),
('Pslr3DQFNVgHA8aR4NWh', 'อบรมไซเบอร์', 'เรียนรู้และรู้ทันโลกไซเบอร์', '2026-09-07', '10:00:00', '2026-09-07', '11:00:00', 1.00, 'อาคารเรียนรวม 2', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', 1, 1, '[{\"id\":\"1788727953507\",\"question\":\"ไซเบอร์คืออะไร\",\"options\":[\"ความปลอดภัย\",\"การละเลย\",\"ปลดปล่อย\",\"ถูกทุกข้อ\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะความปลอดภัยไซเบอร์\"]},{\"id\":\"17887280147560.5732944862216542\",\"question\":\"ใครคือคนที่น่ากลัวที่สุดและไม่น่าไว้ใจ\",\"options\":[\"เจมส์โพสต์ด่าพนักงานร้านกาแฟที่ตัวเองไม่ชอบ\",\"ไก่กาเจาะเว็บไซต์ของโรงเรียนเพื่อเป็นการเรียนรู้\",\"แมวชอบลงสตอรี่เกี่ยวกับสิ่งที่ตัวเองเจอในแต่ละวัน\",\"ไม่มีข้อถูก\"],\"correctAnswer\":1,\"skillNames\":[\"ทักษะความปลอดภัยไซเบอร์\"]}]', '2026-09-06 20:52:27', '2026-09-06 20:56:33', NULL, '308974', '2026-09-07 20:56:32', NULL, NULL),
('UEB20DU4ovQGoG2fb1d5', 'ee', 'ee', '2026-09-08', '04:54:00', '2026-09-09', '04:54:00', 24.00, 'ee', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '1', 'active', 1, 1, '[{\"id\":\"1788731657762\",\"question\":\"e\",\"options\":[\"e\",\"e\"],\"correctAnswer\":0,\"skillNames\":[\"ทักษะการใช้เครื่องมือวิทยาศาสตร์\"]}]', '2026-09-06 21:54:15', '2026-09-06 21:54:26', NULL, '324481', '2026-09-07 21:54:26', NULL, '7esBx5SmfzBoZIAm9fE3'),
('XYSaUPbo5LXlpM3-gvbd', 'ss', 'qqqq', '2026-09-13', NULL, '2026-09-30', NULL, 0.00, 'กิจกรรมภายนอก', 'ss', 'ภายนอก', 'past', 0, 0, NULL, '2026-09-06 12:14:16', '2026-09-06 12:14:16', NULL, NULL, NULL, NULL, NULL),
('yGIsILDqrVo8xK8BCzRy', 'eiei', 'eiei', '2026-09-01', NULL, '2026-09-02', NULL, 0.00, 'กิจกรรมภายนอก', 'eiei', 'ภายนอก', 'past', 0, 0, NULL, '2026-09-05 16:36:10', '2026-09-05 16:36:10', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `activityskill`
--

CREATE TABLE `activityskill` (
  `ActivitySkillId` varchar(20) NOT NULL,
  `activityId` varchar(20) DEFAULT NULL,
  `skillId` varchar(20) DEFAULT NULL,
  `skillname` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activityskill`
--

INSERT INTO `activityskill` (`ActivitySkillId`, `activityId`, `skillId`, `skillname`, `level`) VALUES
('-iXkvOyf_5ft5-J1SXkv', 'XYSaUPbo5LXlpM3-gvbd', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('1IN4dZAqyHuhl_VWbsdz', '1iVzqXcCOfFZ0Rd1IDuX', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('3GL47UkkFh8tEKiCLVTY', 'MapzXr0ZzH77k2v_JesW', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('7qaJ4fwCloeIKQkCeG8-', 'UEB20DU4ovQGoG2fb1d5', 'sk004', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 'กลาง'),
('8FWe0wPxuNkHhXJZfa7D', 'p6Ri7IsiyYNBD77J7Y_z', 'sk005', 'ทักษะการใช้ปัญญาประดิษฐ์', 'สูง'),
('8K8M5qp2iltIGmv7FvRi', '6KIhvoJbSlNEPaOsj_Uf', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('8XVJ7nx_1J75RArYBFFP', 'Pslr3DQFNVgHA8aR4NWh', 'sk006', 'ทักษะความปลอดภัยไซเบอร์', 'กลาง'),
('A1KU1nQqLiR6q9C-b0Kl', 'MapzXr0ZzH77k2v_JesW', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('A7wlyXvynlpjva1ysui6', 'cmBMA0GTNFDcPtr5O-9S', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'พื้นฐาน'),
('AHcO_tBP7G6kh6JBDdDa', 'NYVty4jnZKrKbVlVtQqF', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง'),
('BGQxZ11U4s45XqyiKM5h', 'MVSNhPboMzpEYHvpakDx', 'sk004', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 'พื้นฐาน'),
('EtlCmTxZFR9H9cQJnWVc', '19NV0M0kUWV71h2Z3_09', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('eWerIbX0A0vakOTlvSey', 'MapzXr0ZzH77k2v_JesW', 'sk011', 'ทักษะดิจิทัล', 'กลาง'),
('h2D1x2AW1Ygzs2f7d3QD', 'MaiBzvl_MubJ2BMAq2Fk', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'สูง'),
('HriVjlLLi-ki7tNZXJIh', 'MapzXr0ZzH77k2v_JesW', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง'),
('hsecX5RcbNlO8EbxLU5G', '1pJlCp4FQdn9N285LHvY', 'sk011', 'ทักษะดิจิทัล', 'พื้นฐาน'),
('j5QPznbdtYuTLQl6Dtlk', 'NYVty4jnZKrKbVlVtQqF', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน'),
('JfT8TNJsSb_ep2eQwF-M', 'MapzXr0ZzH77k2v_JesW', 'sk002', 'ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ', 'กลาง'),
('lqNY4x_wsji6eHH8CZWl', '5WcyER1J2nH9w8q4SNI1', 'sk011', 'ทักษะดิจิทัล', 'กลาง'),
('mHGkfyjSxGHSUU-3XpXc', 'yGIsILDqrVo8xK8BCzRy', 'sk002', 'ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ', 'พื้นฐาน'),
('nlYD6OtLN5hBO7yv8Bdf', 'NYVty4jnZKrKbVlVtQqF', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง'),
('o2XyeYlxzayTFII2xbw9', '6Si4lNoSM2lbcEGjnAAZ', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'สูง'),
('oK4UIzyuWNwh4YldjlQo', 'XYSaUPbo5LXlpM3-gvbd', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('oLXAyvFJ3mmGw5Eaj3yx', 'p6Ri7IsiyYNBD77J7Y_z', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('P0Wxx-XFC4znor9eqUU4', 'yGIsILDqrVo8xK8BCzRy', 'sk005', 'ทักษะการใช้ปัญญาประดิษฐ์', 'สูง'),
('PUA_Tp_60_aPXp1gij2T', '5WcyER1J2nH9w8q4SNI1', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('rwWREDnqlcMSVyEnyv8E', 'yGIsILDqrVo8xK8BCzRy', 'sk007', 'ทักษะการสื่อสาร', 'กลาง'),
('SaG-KnmgGhr77_dKpG6l', 'MapzXr0ZzH77k2v_JesW', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'พื้นฐาน'),
('sf5bylXUq-E4cf0-_ttB', '1pJlCp4FQdn9N285LHvY', 'sk007', 'ทักษะการสื่อสาร', 'สูง'),
('tTYoNuw34ampNsL7Fpu3', '1iVzqXcCOfFZ0Rd1IDuX', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'พื้นฐาน'),
('Uh4bUtv7PLI7Nvgw0VKl', 'MaiBzvl_MubJ2BMAq2Fk', 'sk006', 'ทักษะความปลอดภัยไซเบอร์', 'พื้นฐาน'),
('UnEs4rC6TjQ94Mvdhi-7', '1pJlCp4FQdn9N285LHvY', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('vAcWxp75HtDfrRNmB7tf', 'cmBMA0GTNFDcPtr5O-9S', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('w6gR8GdgSac5Qq-V-NZi', 'yGIsILDqrVo8xK8BCzRy', 'sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('y4k3L9Bi4Kd9UhfzmCMH', '19NV0M0kUWV71h2Z3_09', 'sk010', 'ทักษะการคิดและการแก้ปัญหา', 'สูง'),
('yQvdyP6RXkw21ISah8ba', 'MapzXr0ZzH77k2v_JesW', 'sk009', 'ทักษะการทำงานเป็นทีม', 'สูง'),
('Z8gyxvg-bC3M9wzkL8Mf', 'MapzXr0ZzH77k2v_JesW', 'sk007', 'ทักษะการสื่อสาร', 'กลาง');

-- --------------------------------------------------------

--
-- Table structure for table `activity_request`
--

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
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_request`
--

INSERT INTO `activity_request` (`requestId`, `studentId`, `activityName`, `organizer`, `activityDate`, `activityEndDate`, `description`, `evidenceFiles`, `status`, `reason`, `approvedActivityId`, `reviewedAt`, `createdAt`, `updatedAt`) VALUES
('_AFMguKsksh5RePCWjlN', '662021085', 'อบรบเกม rov', 'มหาลัยแม่โจ้', '2026-08-03', '2026-08-04', 'การทำงานเป็นทีม การสื่อสารกัน', '[{\"name\":\"Blue and Gold Elegant Certificate of Achievement.png\",\"url\":\"/uploads/activity-requests/3__g-keoGa/DA0yru1g-Blue_and_Gold_Elegant_Certificate_of_Achievement.png\",\"type\":\"image/png\"},{\"name\":\"แม่แบบใบเซอ.png\",\"url\":\"/uploads/activity-requests/3__g-keoGa/xjUA4IKx-แม่แบบใบเซอ.png\",\"type\":\"image/png\"},{\"name\":\"เลือกดูทักษะนิสิตที่ปรึกษา.png\",\"url\":\"/uploads/activity-requests/3__g-keoGa/3doe-KCt-เลือกดูทักษะนิสิตที่ปรึกษา.png\",\"type\":\"image/png\"},{\"name\":\"แสดงรายชื่อคนเข้าร่วมกิจกรรม.png\",\"url\":\"/uploads/activity-requests/3__g-keoGa/V58eztua-แสดงรายชื่อคนเข้าร่วมกิจกรรม.png\",\"type\":\"image/png\"},{\"name\":\"แดชบอดผู้บริหาร.png\",\"url\":\"/uploads/activity-requests/3__g-keoGa/xivBVGgM-แดชบอดผู้บริหาร.png\",\"type\":\"image/png\"}]', 'pending', NULL, NULL, NULL, '2026-08-26 12:31:49', '2026-08-26 12:31:49'),
('k3Lke2cFu2mxdzSNNjw5', '662021086', 'หฟห', 'หห', '2026-09-01', '2026-09-02', 'หห', '[{\"name\":\"A4 - 1.png\",\"url\":\"/uploads/activity-requests/K2xp6ThHYb/YVlHpUjY-A4_-_1.png\",\"type\":\"image/png\"}]', 'pending', NULL, NULL, NULL, '2026-09-06 20:15:23', '2026-09-06 20:15:23'),
('m_AqPM-_9HWxlMYo3-sR', '662021085', 'ss', 'ss', '2026-09-13', '2026-09-30', 'qqqq', '[{\"name\":\"c3.jpg\",\"url\":\"/uploads/activity-requests/QIi2X_nxzs/mOWDovKz-c3.jpg\",\"type\":\"image/jpeg\"}]', 'approved', NULL, 'XYSaUPbo5LXlpM3-gvbd', '2026-09-06 12:14:16', '2026-09-06 12:12:17', '2026-09-06 12:14:16');

-- --------------------------------------------------------

--
-- Table structure for table `activity_request_skill`
--

CREATE TABLE `activity_request_skill` (
  `requestSkillId` varchar(20) NOT NULL,
  `requestId` varchar(20) NOT NULL,
  `skillname` varchar(100) NOT NULL,
  `level` varchar(50) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `activity_request_skill`
--

INSERT INTO `activity_request_skill` (`requestSkillId`, `requestId`, `skillname`, `level`, `createdAt`) VALUES
('QmHCiRjesUFUwrF9Jura', 'm_AqPM-_9HWxlMYo3-sR', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง', '2026-09-06 12:14:16'),
('ZW7gm8gYbYJCdNiyJ9J7', 'm_AqPM-_9HWxlMYo3-sR', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง', '2026-09-06 12:14:16');

-- --------------------------------------------------------

--
-- Table structure for table `advisor`
--

CREATE TABLE `advisor` (
  `AdvisorId` varchar(20) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `advisorUserId` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `advisor`
--

INSERT INTO `advisor` (`AdvisorId`, `studentId`, `advisorUserId`) VALUES
('95gxEynTKrBCIFead7Hl', '662021086', 'Fyia5uadxZD1iOBqIRhL'),
('ECF5JyTBl2--9lOdnWqI', '662021086', '5JkZtifImH-UzZHtBPq3'),
('LOcNkXk20YYPGcmfIV_n', '662021085', '5JkZtifImH-UzZHtBPq3'),
('VFXw53zzKkgajksvUXUq', '662021085', 'Fyia5uadxZD1iOBqIRhL');

-- --------------------------------------------------------

--
-- Table structure for table `officer`
--

CREATE TABLE `officer` (
  `officerId` varchar(20) NOT NULL,
  `userId` varchar(20) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `profileImageUrl` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `officer`
--

INSERT INTO `officer` (`officerId`, `userId`, `firstname`, `lastname`, `position`, `faculty`, `profileImageUrl`) VALUES
('S9DMBXRCICuMwdhuTOhj', 'HhzpU9sVRwpVX0FGNIG2', 'เจ้าหน้าที่', 'ระบบ', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', '/uploads/officers/HhzpU9sVRwpVX0FGNIG2/UisUs2xO-c3.jpg'),
('Tn3JtWazGagmamJAFEI6', 'Wg_GbcNH7cIeZP5J5120', 'staff2', '2', 'ฝ่ายบริหาร', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `participation`
--

CREATE TABLE `participation` (
  `ParticipationId` varchar(20) NOT NULL,
  `studentId` varchar(20) NOT NULL,
  `activityId` varchar(20) NOT NULL,
  `hours` decimal(5,2) DEFAULT '0.00',
  `joinDate` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `score` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `participation`
--

INSERT INTO `participation` (`ParticipationId`, `studentId`, `activityId`, `hours`, `joinDate`, `status`, `score`, `created_at`, `updated_at`) VALUES
('1787722794823', '662021085', 'p6Ri7IsiyYNBD77J7Y_z', 1.00, '2026-08-26', 'completed', 5.00, '2026-08-26 12:39:54', '2026-08-26 12:39:54'),
('f4dJ7BE6Vb9GVLpZ9hnb', '662021085', 'Pslr3DQFNVgHA8aR4NWh', 1.00, '2026-09-06', 'completed', 0.50, '2026-09-06 21:07:44', '2026-09-06 21:07:44'),
('j3SHyGmByOyYiL4roWg6', '662021086', 'UEB20DU4ovQGoG2fb1d5', 24.00, '2026-09-06', 'completed', 0.50, '2026-09-06 21:54:37', '2026-09-06 21:54:37'),
('w9Wuk_yAQcj3W7DB87GL', '662021086', '1iVzqXcCOfFZ0Rd1IDuX', 48.00, '2026-09-06', 'completed', 0.50, '2026-09-06 21:51:39', '2026-09-06 21:51:39'),
('Yqz0h0p0zXAf6xKOlgOj', '662021085', 'XYSaUPbo5LXlpM3-gvbd', 0.00, '2026-09-06', 'completed', 2.00, '2026-09-06 12:14:16', '2026-09-06 12:14:16'),
('yX4_xmbc5YXFitl-oxqV', '662021086', '6Si4lNoSM2lbcEGjnAAZ', 24.00, '2026-09-06', 'completed', 0.33, '2026-09-06 20:56:20', '2026-09-06 20:56:20');

-- --------------------------------------------------------

--
-- Table structure for table `participation_skill`
--

CREATE TABLE `participation_skill` (
  `id` int NOT NULL,
  `participationId` varchar(20) NOT NULL,
  `skillName` varchar(100) NOT NULL,
  `earnedScore` decimal(10,2) DEFAULT '0.00',
  `maxScore` decimal(10,2) DEFAULT '0.00',
  `normalizedScore` decimal(10,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `participation_skill`
--

INSERT INTO `participation_skill` (`id`, `participationId`, `skillName`, `earnedScore`, `maxScore`, `normalizedScore`, `created_at`) VALUES
(6, 'yX4_xmbc5YXFitl-oxqV', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 1.00, 3.00, 0.33, '2026-09-06 20:56:20'),
(7, 'f4dJ7BE6Vb9GVLpZ9hnb', 'ทักษะความปลอดภัยไซเบอร์', 2.00, 4.00, 0.50, '2026-09-06 21:07:44'),
(8, 'w9Wuk_yAQcj3W7DB87GL', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 1.00, 2.00, 0.50, '2026-09-06 21:51:39'),
(9, 'j3SHyGmByOyYiL4roWg6', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 1.00, 2.00, 0.50, '2026-09-06 21:54:37');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `email`, `token`, `expires_at`, `created_at`) VALUES
(1, '662021086@tsu.ac.th', '95c53244f6dbc8966474155c6da699c43456d8494d395269233590633b534ab2', '2026-09-01 22:02:58', '2026-09-01 21:02:58'),
(4, '662021085@tsu.ac.th', '45a0f63e32071cc4490a43c50c7a0cd71c23071a9e93b5bf4e2f51df8e41b1f0', '2026-09-06 19:13:18', '2026-09-06 18:13:18'),
(5, '662021086@tsu.ac.th', '397e9398323ca3d4cb8c16f10708dacf587c9f738c24b58a0d7653e7507c13b1', '2026-09-06 19:25:21', '2026-09-06 18:25:20'),
(7, '662021085@tsu.ac.th', '9d71c43b1ba648da2cdc5fc5766b8317795b9ec3abf899a5ba4c7e7c43230e4b', '2026-09-06 19:29:12', '2026-09-06 18:29:11'),
(8, '662021085@tsu.ac.th', 'f517286a1f3907f58b11aa38b37d355223c88bda623bd14b0f079e6f35784800', '2026-09-06 20:12:58', '2026-09-06 19:12:57'),
(9, '662021085@tsu.ac.th', '91e0c76cb75c86f87967b9e2b0be61afa40de3a51f0bcd68bf4ddd54badf8576', '2026-09-06 20:42:18', '2026-09-06 19:42:18');

-- --------------------------------------------------------

--
-- Table structure for table `skill`
--

CREATE TABLE `skill` (
  `skillId` varchar(20) NOT NULL,
  `skillname` varchar(100) DEFAULT NULL,
  `level` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `skill`
--

INSERT INTO `skill` (`skillId`, `skillname`, `level`) VALUES
('sk001', 'ทักษะการสร้างนวัตกรรมสังคม', 'กลาง'),
('sk002', 'ทักษะการใช้ห้องปฏิบัติการและความปลอดภัยในห้องปฏิบัติการ', 'กลาง'),
('sk003', 'ทักษะการคิดเชิงออกแบบนวัตกรรม', 'กลาง'),
('sk004', 'ทักษะการใช้เครื่องมือวิทยาศาสตร์', 'กลาง'),
('sk005', 'ทักษะการใช้ปัญญาประดิษฐ์', 'กลาง'),
('sk006', 'ทักษะความปลอดภัยไซเบอร์', 'กลาง'),
('sk007', 'ทักษะการสื่อสาร', 'กลาง'),
('sk008', 'ทักษะการเป็นผู้ประกอบการ', 'กลาง'),
('sk009', 'ทักษะการทำงานเป็นทีม', 'กลาง'),
('sk010', 'ทักษะการคิดและการแก้ปัญหา', 'กลาง'),
('sk011', 'ทักษะดิจิทัล', 'กลาง');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `studentId` varchar(20) NOT NULL,
  `userId` varchar(20) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `program` varchar(255) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `admissionYear` int DEFAULT NULL,
  `year` int DEFAULT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `profileImageUrl` varchar(500) DEFAULT NULL,
  `profileimage` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`studentId`, `userId`, `firstname`, `lastname`, `faculty`, `program`, `major`, `admissionYear`, `year`, `phone`, `profileImageUrl`, `profileimage`) VALUES
('662021085', '8fJt5f8qgT-JrjUU25Sp', 'อัฟนาน', 'หะยีเหย็บ', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', NULL, 'วิทยาการคอมพิวเตอร์และสารสนเทศ', NULL, 4, '0987654321', '/uploads/profiles/662021085/cmLgxM4L-me.jpg', NULL),
('662021086', 'RCPUo2iL6Zb15NX7MvoA', 'Arraya', 'Putila', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', 'วิทยาการดิจิทัล', 2023, 4, '0913339249', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `teacher`
--

CREATE TABLE `teacher` (
  `teacherId` varchar(20) NOT NULL,
  `userId` varchar(20) NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `faculty` varchar(255) DEFAULT NULL,
  `program` varchar(255) DEFAULT NULL,
  `isExecutive` tinyint(1) DEFAULT '0',
  `profileImageUrl` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `teacher`
--

INSERT INTO `teacher` (`teacherId`, `userId`, `firstname`, `lastname`, `position`, `faculty`, `program`, `isExecutive`, `profileImageUrl`) VALUES
('cM1mPT44cHBXlKpNcXAS', '5JkZtifImH-UzZHtBPq3', 'แก้วมณี', 'ศรีสงคราม', 'ผู้ช่วยศาสตราจารย์', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', 0, NULL),
('hRygLUDRXkquMV_fcP-w', 'Fyia5uadxZD1iOBqIRhL', 'นภัทร', 'แก้วภิบาล', 'ศาสตราจารย์ / รองคณบดีฝ่ายวางแผนและพัฒนา', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', 1, '/uploads/teachers/Fyia5uadxZD1iOBqIRhL/5-d9n0qE-c1.jpg'),
('mhKMEnEssiNyPw30CEh6', 'DbwqPOI92ddc_v2qRuxf', 'tea1', '1', 'อาจารย์ / หัวหน้าภาควิชา', 'คณะวิทยาศาสตร์และนวัตกรรมดิจิทัล', 'วิทยาการคอมพิวเตอร์และสารสนเทศ', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `template`
--

CREATE TABLE `template` (
  `templateId` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `imageUrl` varchar(500) NOT NULL,
  `fileType` varchar(50) DEFAULT 'image/png',
  `status` enum('active','inactive') DEFAULT 'active',
  `uploadedBy` varchar(20) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `template`
--

INSERT INTO `template` (`templateId`, `name`, `description`, `imageUrl`, `fileType`, `status`, `uploadedBy`, `createdAt`, `updatedAt`) VALUES
('7esBx5SmfzBoZIAm9fE3', 'aa', 'aa', '/uploads/templates/7esBx5SmfzBoZIAm9fE3/PGTSnGsz-f0893d97-f0e8-4460-8de0-60f6855ddcf8.jpg', 'image/jpeg', 'active', 'Wg_GbcNH7cIeZP5J5120', '2026-09-06 21:50:31', '2026-09-06 21:50:31'),
('qd6wjTvdriGQkvyrcNo1', 'สีฟ้าทอง', 'สวยงาม', '/uploads/templates/qd6wjTvdriGQkvyrcNo1/ea9R5Dxy-Blue_and_Gold_Elegant_Certificate_of_Achievement.png', 'image/png', 'active', 'acC8QYr_G9psDklexWz6', '2026-08-26 12:29:44', '2026-08-26 12:29:44'),
('uWOpRjptE2AIdNDL68ep', 'test อาจารย์', 'ฟฟ', '/uploads/templates/uWOpRjptE2AIdNDL68ep/7UFRGZ2Z-Blue_and_Gold_Elegant_Certificate_of_Achievement.png', 'image/png', 'active', 'Fyia5uadxZD1iOBqIRhL', '2026-09-02 02:08:25', '2026-09-02 02:08:25');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','teacher','officer','executive') NOT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `must_change_password` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `email`, `password`, `role`, `status`, `created_at`, `updated_at`, `must_change_password`) VALUES
('5JkZtifImH-UzZHtBPq3', 'k@tsu.ac.th', '$2a$10$e3vDsy5C9x7zsXza3nY22uYrxDzXPtk09t/z/Fx7YAQYI3EUYu8hO', 'teacher', 'active', '2026-08-19 13:33:05', '2026-08-19 13:33:05', 0),
('8fJt5f8qgT-JrjUU25Sp', '662021085@tsu.ac.th', '$2a$10$UJLjv5deSjl3MvTlJ02lpOVxNbboqwCRy39scN7/74/h6NyrEMKZu', 'student', 'active', '2026-08-26 12:21:09', '2026-09-06 20:07:23', 0),
('DbwqPOI92ddc_v2qRuxf', 't1@tsu.ac.th', '$2a$10$.8HyerwhJ43dX4Fu1MuH8um/LmeGP8UdtxrbMyHvpYr7YIhbNYvDK', 'teacher', 'active', '2026-09-01 22:38:02', '2026-09-01 22:41:39', 0),
('Fyia5uadxZD1iOBqIRhL', 'napat@tsu.ac.th', '$2a$10$IT9HusYWrWQp0vi3xVOWx.dIQbBwTtAZyVwZFNKgUD6ptOOuZOG8S', 'teacher', 'active', '2026-08-26 12:18:58', '2026-08-26 12:18:58', 0),
('HhzpU9sVRwpVX0FGNIG2', 'staff@tsu.ac.th', '$2a$10$bABiht.3qHnexU2gBUsoTuuVXk5RzXf5DeJAx89acwrpiqGiF8472', 'officer', 'active', '2026-09-01 18:00:36', '2026-09-06 20:26:50', 0),
('RCPUo2iL6Zb15NX7MvoA', '662021086@tsu.ac.th', '$2a$10$Un7hYlst3mHse0429K0kBO0G4gDGSbwenBpfUYR64muWgUTC7cx2i', 'student', 'active', '2026-09-06 20:00:09', '2026-09-06 20:00:09', 0),
('Wg_GbcNH7cIeZP5J5120', 'staff2@tsu.ac.th', '$2a$10$vXAkO3Mf9SYmNshd7dvYT.IgS83J9NeofBKzf3V3tAUlldVdfizxe', 'officer', 'active', '2026-09-06 20:26:30', '2026-09-06 20:28:12', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity`
--
ALTER TABLE `activity`
  ADD PRIMARY KEY (`activityId`),
  ADD KEY `fk_activity_template` (`templateId`);

--
-- Indexes for table `activityskill`
--
ALTER TABLE `activityskill`
  ADD PRIMARY KEY (`ActivitySkillId`),
  ADD KEY `fk_activityskill_activity` (`activityId`) USING BTREE,
  ADD KEY `fk_activityskill_skill` (`skillId`) USING BTREE;

--
-- Indexes for table `activity_request`
--
ALTER TABLE `activity_request`
  ADD PRIMARY KEY (`requestId`),
  ADD KEY `idx_activity_request_student` (`studentId`),
  ADD KEY `idx_activity_request_status` (`status`);

--
-- Indexes for table `activity_request_skill`
--
ALTER TABLE `activity_request_skill`
  ADD PRIMARY KEY (`requestSkillId`),
  ADD KEY `idx_activity_request_skill_request` (`requestId`);

--
-- Indexes for table `advisor`
--
ALTER TABLE `advisor`
  ADD PRIMARY KEY (`AdvisorId`),
  ADD KEY `idx_advisor_student` (`studentId`),
  ADD KEY `idx_advisor_user` (`advisorUserId`);

--
-- Indexes for table `officer`
--
ALTER TABLE `officer`
  ADD PRIMARY KEY (`officerId`),
  ADD UNIQUE KEY `uk_officer_userId` (`userId`);

--
-- Indexes for table `participation`
--
ALTER TABLE `participation`
  ADD PRIMARY KEY (`ParticipationId`),
  ADD KEY `idx_participation_student` (`studentId`),
  ADD KEY `idx_participation_activity` (`activityId`);

--
-- Indexes for table `participation_skill`
--
ALTER TABLE `participation_skill`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participation_skill` (`participationId`,`skillName`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_email_token` (`email`,`token`),
  ADD KEY `idx_token` (`token`);

--
-- Indexes for table `skill`
--
ALTER TABLE `skill`
  ADD PRIMARY KEY (`skillId`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`studentId`),
  ADD UNIQUE KEY `uk_students_userId` (`userId`);

--
-- Indexes for table `teacher`
--
ALTER TABLE `teacher`
  ADD PRIMARY KEY (`teacherId`),
  ADD UNIQUE KEY `uk_teacher_userId` (`userId`);

--
-- Indexes for table `template`
--
ALTER TABLE `template`
  ADD PRIMARY KEY (`templateId`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_uploadedBy` (`uploadedBy`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `uk_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `participation_skill`
--
ALTER TABLE `participation_skill`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity`
--
ALTER TABLE `activity`
  ADD CONSTRAINT `fk_activity_template` FOREIGN KEY (`templateId`) REFERENCES `template` (`templateId`) ON DELETE SET NULL;

--
-- Constraints for table `activityskill`
--
ALTER TABLE `activityskill`
  ADD CONSTRAINT `activityskill_ibfk_1` FOREIGN KEY (`activityId`) REFERENCES `activity` (`activityId`),
  ADD CONSTRAINT `activityskill_ibfk_2` FOREIGN KEY (`skillId`) REFERENCES `skill` (`skillId`);

--
-- Constraints for table `activity_request`
--
ALTER TABLE `activity_request`
  ADD CONSTRAINT `fk_activity_request_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`) ON DELETE CASCADE;

--
-- Constraints for table `activity_request_skill`
--
ALTER TABLE `activity_request_skill`
  ADD CONSTRAINT `fk_activity_request_skill_request` FOREIGN KEY (`requestId`) REFERENCES `activity_request` (`requestId`) ON DELETE CASCADE;

--
-- Constraints for table `advisor`
--
ALTER TABLE `advisor`
  ADD CONSTRAINT `fk_advisor_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_advisor_user` FOREIGN KEY (`advisorUserId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `officer`
--
ALTER TABLE `officer`
  ADD CONSTRAINT `fk_officer_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `participation`
--
ALTER TABLE `participation`
  ADD CONSTRAINT `fk_participation_activity` FOREIGN KEY (`activityId`) REFERENCES `activity` (`activityId`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_participation_student` FOREIGN KEY (`studentId`) REFERENCES `students` (`studentId`) ON DELETE CASCADE;

--
-- Constraints for table `participation_skill`
--
ALTER TABLE `participation_skill`
  ADD CONSTRAINT `participation_skill_ibfk_1` FOREIGN KEY (`participationId`) REFERENCES `participation` (`ParticipationId`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;

--
-- Constraints for table `teacher`
--
ALTER TABLE `teacher`
  ADD CONSTRAINT `fk_teacher_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
