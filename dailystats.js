// const cron = require('node-cron');
// const db = require('./config/db');  // Import the db.js file
// const moment = require('moment-timezone');  // Import moment-timezone

// // Helper function to get current date in YYYY-MM-DD format (adjusted to a specific timezone)
// const getCurrentDate = (timezone = 'Asia/Kolkata') => {
//     return moment().tz(timezone).format('YYYY-MM-DD');
// };

// // Function to execute the daily stats logic
// const getCurrentDailyStats = async () => {
//     const timezone = 'Asia/Kolkata';  // Set the timezone, adjust as necessary
//     const currentDate = getCurrentDate(timezone);

//     try {
//         // Convert current date to Unix timestamps (adjusted for the timezone)
//         const startOfDateAgo = moment(`${currentDate} 00:00:00`, 'YYYY-MM-DD HH:mm:ss')
//             .tz(timezone)
//             .startOf('day')
//             .unix();
        
//         const endOfDate = moment(`${currentDate} 23:59:59`, 'YYYY-MM-DD HH:mm:ss')
//             .tz(timezone)
//             .endOf('day')
//             .unix();

//         // Query to count the register transactions and sum the value (Convert Wei to ETH)
//         const [registerCount] = await db.query(
//             `SELECT 
//                 COUNT(*) AS count,
//                 SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) AS totalValueInETH
//             FROM 
//                 tbl_ether_force_all_transaction
//             WHERE 
//                 functionName = ? AND timeStamp BETWEEN ? AND ?`,
//             ['register', startOfDateAgo, endOfDate]
//         );

//         // Query to count the upgrade transactions and sum the value (Convert Wei to ETH)
//         const [upgradeCount] = await db.query(
//             `SELECT 
//                 COUNT(*) as count, 
//                 SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) as totalValueInETH
//             FROM 
//                 tbl_ether_force_all_transaction
//             WHERE 
//                 functionName = ? AND timeStamp BETWEEN ? AND ?`,
//             ['upgrade', startOfDateAgo, endOfDate]
//         );

//         // Query to count all transactions and sum the value (Convert Wei to ETH for total value)
//         const [transactionCount] = await db.query(
//             `SELECT 
//                 COUNT(*) as count, 
//                 SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) as totalValueInETH
//             FROM 
//                 tbl_ether_force_all_transaction
//             WHERE 
//                 timeStamp BETWEEN ? AND ?`,
//             [startOfDateAgo, endOfDate]
//         );

//         // Calculate the total value as the sum of all the individual categories' total value (ETH)
//         const totalValue = (registerCount[0].totalValueInETH || 0) +
//                            (upgradeCount[0].totalValueInETH || 0) +
//                            (transactionCount[0].totalValueInETH || 0);

//         // Check if a record already exists for the current date
//         const [existingRecord] = await db.query(
//             `SELECT * FROM daily_stats WHERE date = ?`,
//             [currentDate]
//         );

//         if (existingRecord.length > 0) {
//             // If the record exists, update it
//             await db.query(
//                 `UPDATE daily_stats 
//                  SET total_registers = ?, total_upgrades = ?, total_transactions = ?, total_value = ?
//                  WHERE date = ?`,
//                 [
//                     registerCount[0].count || 0,
//                     upgradeCount[0].count || 0,
//                     transactionCount[0].count || 0,
//                     totalValue,
//                     currentDate
//                 ]
//             );

//             console.log('Daily stats updated successfully');
//         } else {
//             // If the record doesn't exist, insert it
//             await db.query(
//                 `INSERT INTO daily_stats (date, total_registers, total_upgrades, total_transactions, total_value)
//                  VALUES (?, ?, ?, ?, ?)`,
//                 [
//                     currentDate,
//                     registerCount[0].count || 0,
//                     upgradeCount[0].count || 0,
//                     transactionCount[0].count || 0,
//                     totalValue
//                 ]
//             );

//             console.log('Daily stats inserted successfully');
//         }

//     } catch (error) {
//         console.error('Error fetching daily stats:', error.message || error);
//     }
// };

// // Schedule the cron job to run every 5 seconds
// cron.schedule('*/5 * * * * *', () => {
//     console.log('Running daily stats task...');
//     getCurrentDailyStats();
// });


const cron = require('node-cron');
const db = require('./config/db');  // Import the db.js file
const moment = require('moment-timezone');  // Import moment-timezone

// Helper function to get current date in YYYY-MM-DD format (adjusted to a specific timezone)
const getCurrentDate = (timezone = 'Asia/Kolkata') => {
    return moment().tz(timezone).format('YYYY-MM-DD');
};

// Function to execute the daily stats logic
const getCurrentDailyStats = async () => {
    const timezone = 'Asia/Kolkata';  // Set the timezone, adjust as necessary
    const currentDate = getCurrentDate(timezone);

    try {
        // Convert current date to Unix timestamps (adjusted for the timezone)
        const startOfDateAgo = moment(`${currentDate} 00:00:00`, 'YYYY-MM-DD HH:mm:ss')
            .tz(timezone)
            .startOf('day')
            .unix();
        
        const endOfDate = moment(`${currentDate} 23:59:59`, 'YYYY-MM-DD HH:mm:ss')
            .tz(timezone)
            .endOf('day')
            .unix();

        // Debugging: log the start and end of the day
        console.log(`Start of Day (UNIX): ${startOfDateAgo}`);
        console.log(`End of Day (UNIX): ${endOfDate}`);
        console.log(`Current Date (Local Timezone): ${currentDate}`);

        // Query to count the register transactions and sum the value (Convert Wei to ETH)
        const [registerCount] = await db.query(
            `SELECT 
                COUNT(*) AS count,
                SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) AS totalValueInETH
            FROM 
                tbl_ether_force_all_transaction
            WHERE 
                functionName = ? AND timeStamp BETWEEN ? AND ?`,
            ['register', startOfDateAgo, endOfDate]
        );

        // Query to count the upgrade transactions and sum the value (Convert Wei to ETH)
        const [upgradeCount] = await db.query(
            `SELECT 
                COUNT(*) as count, 
                SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) as totalValueInETH
            FROM 
                tbl_ether_force_all_transaction
            WHERE 
                functionName = ? AND timeStamp BETWEEN ? AND ?`,
            ['upgrade', startOfDateAgo, endOfDate]
        );

        // Query to count all transactions and sum the value (Convert Wei to ETH for total value)
        const [transactionCount] = await db.query(
            `SELECT 
                COUNT(*) as count, 
                SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) as totalValueInETH
            FROM 
                tbl_ether_force_all_transaction
            WHERE 
                timeStamp BETWEEN ? AND ?`,
            [startOfDateAgo, endOfDate]
        );

        // Calculate the total value as the sum of all the individual categories' total value (ETH)
        const totalValue = (registerCount[0].totalValueInETH || 0) +
                           (upgradeCount[0].totalValueInETH || 0) +
                           (transactionCount[0].totalValueInETH || 0);

        // Check if a record already exists for the current date
        const [existingRecord] = await db.query(
            `SELECT * FROM daily_stats WHERE date = ?`,
            [currentDate]
        );

        if (existingRecord.length > 0) {
            // If the record exists, update it
            await db.query(
                `UPDATE daily_stats 
                 SET total_registers = ?, total_upgrades = ?, total_transactions = ?, total_value = ?
                 WHERE date = ?`,
                [
                    registerCount[0].count || 0,
                    upgradeCount[0].count || 0,
                    transactionCount[0].count || 0,
                    totalValue,
                    currentDate
                ]
            );

            console.log('Daily stats updated successfully');
        } else {
            // If the record doesn't exist, insert it
            await db.query(
                `INSERT INTO daily_stats (date, total_registers, total_upgrades, total_transactions, total_value)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    currentDate,
                    registerCount[0].count || 0,
                    upgradeCount[0].count || 0,
                    transactionCount[0].count || 0,
                    totalValue
                ]
            );

            console.log('Daily stats inserted successfully');
        }

    } catch (error) {
        console.error('Error fetching daily stats:', error.message || error);
    }
};

// Schedule the cron job to run every 5 seconds
cron.schedule('*/5 * * * * *', () => {
    console.log('Running daily stats task...');
    getCurrentDailyStats();
});
