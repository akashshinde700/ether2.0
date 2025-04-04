CREATE TABLE IF NOT EXISTS users_register (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

-- Table Definitions

CREATE TABLE `Admin` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Inserting data into `Admin` table
INSERT INTO `Admin` (`id`, `email`, `password`, `created_at`, `updated_at`) 
VALUES (1, 'etherforce@gmail.com', 'Admin@123', '2025-01-04 06:14:41', '2025-01-07 11:06:59');

CREATE TABLE `daily_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `total_registers` int NOT NULL,
  `total_upgrades` int NOT NULL,
  `total_transactions` int NOT NULL,
  `total_value` decimal(18,8) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tbl_ether_force_all_internal_transaction` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hash` varchar(150) NOT NULL,
  `functionName` varchar(50) NOT NULL,
  `fromAddress` varchar(50) NOT NULL,
  `toAddress` varchar(50) NOT NULL,
  `value` varchar(30) NOT NULL,
  `timeStamp` varchar(20) NOT NULL,
  `objectJson` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_hash` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tbl_ether_force_all_transaction` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `hash` varchar(150) NOT NULL,
  `blockNumber` varchar(50) NOT NULL DEFAULT '0',
  `methodId` varchar(20) NOT NULL,
  `functionName` varchar(50) NOT NULL,
  `fromAddress` varchar(50) NOT NULL,
  `value` varchar(30) NOT NULL,
  `timeStamp` varchar(20) NOT NULL,
  `objectJson` json DEFAULT NULL,
  `fetch_internal_tx` tinyint NOT NULL DEFAULT '0',
  `upgrade_id` varchar(10) DEFAULT '0',
  `upgrade_lvl` varchar(10) DEFAULT '0',
  `register_ref` varchar(10) DEFAULT '0',
  `register_newAcc` varchar(50) DEFAULT '0',
  `register_NewId` varchar(10) DEFAULT '0',
  `is_fetch_internal` tinyint NOT NULL DEFAULT '0',
  `is_fetch_userinfo` tinyint NOT NULL DEFAULT '0',
  `is_error` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_hash` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `tbl_tree_link` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` varchar(150) NOT NULL DEFAULT '0',
  `parent_id` varchar(150) NOT NULL DEFAULT '0',
  `position` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `account` varchar(255) DEFAULT NULL,
  `referrer` varchar(255) DEFAULT NULL,
  `upline` varchar(255) DEFAULT NULL,
  `start` datetime DEFAULT NULL,
  `level` int DEFAULT NULL,
  `directTeam` int DEFAULT NULL,
  `totalMatrixTeam` int DEFAULT NULL,
  `totalIncome` decimal(10,4) DEFAULT NULL,
  `totalDeposit` decimal(10,4) DEFAULT NULL,
  `royaltyIncome` decimal(10,4) DEFAULT NULL,
  `referralIncome` decimal(10,4) DEFAULT NULL,
  `levelIncome` decimal(10,4) DEFAULT NULL,
  `TxHash` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TxHash` (`TxHash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

COMMIT;


BEGIN

        -- declare i_userid VARCHAR(50);
        declare i_sponsor_userid VARCHAR(50);
        declare iPosition_cnt int;
        declare tmpcnt int;

        set iPosition_cnt=1;
        set i_sponsor_userid='0';
        set tmpcnt=0;
        set out_msg='OK';
        
        if exists(SELECT `referrer` FROM `users` where `id` = i_userid limit 1) then
            SELECT `referrer` into i_sponsor_userid FROM `users` where `id` = i_userid limit 1;
            INSERT INTO `tbl_tree_link`(`user_id`, `parent_id`, `position`) VALUES (i_userid,i_sponsor_userid,iPosition_cnt);
            select count(*) into tmpcnt from `tbl_tree_link` where `user_id`=i_sponsor_userid order by `position` asc;
            -- select tmpcnt;
            if  tmpcnt > 0 then 
            --  select 'we are in',i_userid,i_sponsor_userid,iPosition_cnt;
                INSERT INTO `tbl_tree_link`(`user_id`, `parent_id`, `position`) select i_userid,`parent_id`,`position`+iPosition_cnt  from tbl_tree_link where `user_id`=i_sponsor_userid order by `position` asc;
            end if;
        else
           set out_msg="ERROR";
        end if;
        SELECT out_msg;
        set i_userid='0';
        set tmpcnt=0;
        set iPosition_cnt=1;
        set i_sponsor_userid='0';
END