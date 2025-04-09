const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const moment = require('moment-timezone'); 
const getCurrentDate = () => new Date().toISOString().split('T')[0];

// Helper function to convert UTC date to local time
const convertUTCToLocal = (utcDate, timeZone = 'Asia/Kolkata') => {
    return moment.utc(utcDate).tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;


        const [existingUsers] = await db.query('SELECT * FROM users_register WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const [result] = await db.query(
            'INSERT INTO users_register (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: result.insertId,
                username,
                email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT * FROM users_register WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

     
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status:200,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
           
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getUserById = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, created_at FROM users_register WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
            res.status(200).json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDownline = async (req, res) => {
    const userId = req.params.userId; 
    const page = parseInt(req.query.page) || 1; 
    const limit = 10;
    const offset = (page - 1) * limit; 

    try {
       
        const [downline] = await db.query(
            'SELECT * FROM tbl_tree_link WHERE user_id = ? LIMIT ? OFFSET ?',
            [userId, limit, offset]
        );

        if (downline.length === 0) {
            return res.status(404).json({ message: 'No downline found for this user' });
        }

        
        const [totalRecords] = await db.query(
            'SELECT COUNT(*) AS count FROM tbl_tree_link WHERE user_id = ?',
            [userId]
        );
        
        const totalPages = Math.ceil(totalRecords[0].count / limit);

        res.json({status:200,
            downline,
            currentPage: page,
            totalPages,
            totalRecords: totalRecords[0].count
        });
    } catch (error) {
        console.error('Get downline error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// const getbyFunctionName = async (req, res) => {
//     const functionName = req.params.functionName;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;

//     // Get the date as a date string (in YYYY/MM/DD format)
//     const date = req.query.date; // e.g., "2025/03/11"

//     if (!date) {
//         return res.status(400).json({ message: 'date parameter is required in YYYY/MM/DD format' });
//     }

//     try {
//         // Validate the functionName to ensure it's a known type
//         const validFunctionNames = ['register', 'upgrade', 'ot5 7 her'];
//         if (!validFunctionNames.includes(functionName)) {
//             return res.status(400).json({ message: 'Invalid functionName' });
//         }

//         // Parse the date date string into a Date object
//         const [year, month, day] = date.split('/').map((part) => parseInt(part, 10));
        
//         if (isNaN(year) || isNaN(month) || isNaN(day)) {
//             return res.status(400).json({ message: 'Invalid date format for date, expected YYYY/MM/DD' });
//         }

//         // Set the date to the specified day and set the time to midnight
//         const pastDate = new Date(year, month - 1, day);
//         pastDate.setHours(0, 0, 0, 0); // Set to midnight of the given date
//         const pastDateTimestamp = Math.floor(pastDate.getTime() / 1000); // Unix timestamp for past date

//         // Get the current date's Unix timestamp (midnight of today)
//         const currentDate = new Date();
//         currentDate.setHours(0, 0, 0, 0); // Set to midnight of the current day
//         const currentDateTimestamp = Math.floor(currentDate.getTime() / 1000); // Unix timestamp in seconds

//         // Query the database to get the transactions for the given functionName within the date range
//         const [transactions] = await db.query(
//             'SELECT * FROM tbl_ether_force_all_transaction WHERE functionName = ? AND timeStamp >= ? AND timeStamp <= ? LIMIT ? OFFSET ?',
//             [functionName, pastDateTimestamp, currentDateTimestamp, limit, offset]
//         );

//         // Get total count of transactions for this functionName and date range (for pagination metadata)
//         const [totalCount] = await db.query(
//             'SELECT COUNT(*) AS count FROM tbl_ether_force_all_internal_transaction WHERE functionName = ? AND timeStamp >= ? AND timeStamp <= ?',
//             [functionName, pastDateTimestamp, currentDateTimestamp]
//         );

//         // Calculate the total number of pages
//         const totalPages = Math.ceil(totalCount[0].count / limit);

//         if (transactions.length === 0) {
//             return res.status(404).json({ message: `No transactions found for functionName: ${functionName} from ${date}` });
//         }

//         // Return the response with the transactions and pagination info
//         res.status(200).json({
//             status: 200,
//             data: transactions,
//             pagination: {
//                 currentPage: page,
//                 totalPages: totalPages,
//                 totalTransactions: totalCount[0].count,
//                 limit: limit,
//             },
//         });
//     } catch (error) {
//         console.error('Error fetching transactions by functionName:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const getbyFunctionName = async (req, res) => {
    const functionName = req.params.functionName;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const date = req.query.date; // e.g., "2025/04/08"

    if (!date) {
        return res.status(400).json({ message: 'date parameter is required in YYYY/MM/DD format' });
    }

    try {
        const validFunctionNames = ['register', 'upgrade', 'ot5 7 her'];
        if (!validFunctionNames.includes(functionName)) {
            return res.status(400).json({ message: 'Invalid functionName' });
        }

        // Parse and validate date
        const [year, month, day] = date.split('/').map(part => parseInt(part, 10));
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return res.status(400).json({ message: 'Invalid date format for date, expected YYYY/MM/DD' });
        }

        // Start of day (00:00:00)
        const startDate = new Date(year, month - 1, day);
        startDate.setHours(0, 0, 0, 0);
        const startEpoch = Math.floor(startDate.getTime() / 1000);

        // End of day (23:59:59)
        const endDate = new Date(year, month - 1, day);
        endDate.setHours(23, 59, 59, 999);
        const endEpoch = Math.floor(endDate.getTime() / 1000);

        // Query actual transactions
        const [transactions] = await db.query(
            'SELECT * FROM tbl_ether_force_all_transaction WHERE functionName = ? AND timeStamp BETWEEN ? AND ? LIMIT ? OFFSET ?',
            [functionName, startEpoch, endEpoch, limit, offset]
        );

        // Count total
        const [totalCount] = await db.query(
            'SELECT COUNT(*) AS count FROM tbl_ether_force_all_transaction WHERE functionName = ? AND timeStamp BETWEEN ? AND ?',
            [functionName, startEpoch, endEpoch]
        );

        const totalPages = Math.ceil(totalCount[0].count / limit);

        if (transactions.length === 0) {
            return res.status(404).json({
                message: `No transactions found for functionName: ${functionName} from ${date}`,
            });
        }

        return res.status(200).json({
            status: 200,
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalTransactions: totalCount[0].count,
                limit: limit,
            },
        });

    } catch (error) {
        console.error('Error fetching transactions by functionName:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};



const getUsersByLevel = async (req, res) => {
    try {
        const level = parseInt(req.params.level);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const userId = req.query.id;  // Get the id if provided

        // Validate the level parameter
        if (isNaN(level) || level < 1) {
            return res.status(400).json({ message: 'Invalid level parameter' });
        }

        // Start building the query with the basic level filter
        let usersQuery = 'SELECT id, name, country, account, referrer, upline, start, level, directTeam, totalMatrixTeam, totalIncome, totalDeposit, royaltyIncome, referralIncome, levelIncome, TxHash FROM users WHERE level = ?';
        let queryParams = [level];

        // If userId is provided, add filter for id
        if (userId) {
            usersQuery += ' AND id = ?';
            queryParams.push(userId);
        }

        // Add LIMIT and OFFSET for pagination
        usersQuery += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // Query the database to get users with level and optional id filter
        const [users] = await db.query(usersQuery, queryParams);

        // Get total count of users (with or without the id filter)
        let countQuery = 'SELECT COUNT(*) as count FROM users WHERE level = ?';
        let countParams = [level];

        // If userId is provided, add filter for id in count query as well
        if (userId) {
            countQuery += ' AND id = ?';
            countParams.push(userId);
        }

        // Execute the count query
        const [totalCount] = await db.query(countQuery, countParams);

        // Calculate total pages
        const totalPages = Math.ceil(totalCount[0].count / limit);

        // If no users are found
        if (users.length === 0) {
            return res.status(404).json({ message: `No users found for level: ${level}` });
        }

        // Return the response with the users and pagination info
        res.json({
            status: 200,
            data: users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalUsers: totalCount[0].count,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Get users by level error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getAllFunctions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Query the database to get distinct function names
        const [functions] = await db.query(
            'SELECT DISTINCT functionName FROM tbl_ether_force_all_internal_transaction'
        );

        if (functions.length === 0) {
            return res.status(404).json({ message: 'No function names found' });
        }

        // Initialize an array to store function data
        const functionsWithData = [];

        // Loop through each function name to fetch the associated data with pagination
        for (const fn of functions) {
            // Query the database to get transactions for each function name with pagination
            const [transactions] = await db.query(
                'SELECT * FROM tbl_ether_force_all_internal_transaction WHERE functionName = ? LIMIT ? OFFSET ?',
                [fn.functionName, limit, offset]
            );

            // Get the total count of transactions for this function name to calculate total pages
            const [totalCount] = await db.query(
                'SELECT COUNT(*) as count FROM tbl_ether_force_all_internal_transaction WHERE functionName = ?',
                [fn.functionName]
            );

            const totalPages = Math.ceil(totalCount[0].count / limit);

            functionsWithData.push({
                functionName: fn.functionName,
                transactions: transactions,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    totalTransactions: totalCount[0].count,
                    limit: limit
                }
            });
        }

        // Return the response with the function names and their associated data
        res.status(200).json({
            status: 200,
            data: functionsWithData
        });

    } catch (error) {
        console.error('Error fetching function names with data and pagination:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const userId = req.query.id;

        let usersQuery = 'SELECT * FROM users LIMIT ? OFFSET ?';
        let queryParams = [limit, offset];

        let countQuery = 'SELECT COUNT(*) as count FROM users';
        let countParams = [];

        // If valid ID provided, modify query
        if (userId && userId.trim() !== "") {
            usersQuery = 'SELECT * FROM users WHERE id = ? LIMIT ? OFFSET ?';
            queryParams = [userId, limit, offset];

            countQuery = 'SELECT COUNT(*) as count FROM users WHERE id = ?';
            countParams = [userId];
        }

        const [users] = await db.query(usersQuery, queryParams);
        const [totalCount] = await db.query(countQuery, countParams);

        const totalPages = Math.ceil(totalCount[0].count / limit);

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.status(200).json({
            status: 200,
            data: users,
            pagination: {
                currentPage: page,
                totalPages,
                totalUsers: totalCount[0].count,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching users with pagination:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// const getAllUsers = async (req, res) => {
//     try {
//         // Retrieve the page, limit, and id from the query parameters
//         const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
//         const limit = parseInt(req.query.limit) || 10;  // Default to 10 records per page if not provided
//         const offset = (page - 1) * limit;  // Calculate the offset for pagination
//         const userId = req.query.id;  // Get the user ID if provided

//         // Construct the query based on the presence of the userId
//         let usersQuery = 'SELECT * FROM users';
//         let queryParams = [limit, offset];

//         // If an id is provided, add a condition to the query to filter by that id
//         if (userId) {
//             usersQuery = 'SELECT * FROM users WHERE id = ? LIMIT ? OFFSET ?';
//             queryParams = [userId, limit, offset];
//         }

//         // Query the database to get users with pagination or filter by id
//         const [users] = await db.query(usersQuery, queryParams);

//         // Get the total count of users (with or without the filter)
//         let countQuery = 'SELECT COUNT(*) as count FROM users';
//         let countParams = [];

//         if (userId) {
//             countQuery = 'SELECT COUNT(*) as count FROM users WHERE id = ?';
//             countParams = [userId];
//         }

//         const [totalCount] = await db.query(countQuery, countParams);

//         const totalPages = Math.ceil(totalCount[0].count / limit);  // Calculate total pages

//         // If no users are found
//         if (users.length === 0) {
//             return res.status(404).json({ message: 'No users found' });
//         }

//         // Return the response with the users and pagination info
//         res.status(200).json({
//             status: 200,
//             data: users,
//             pagination: {
//                 currentPage: page,
//                 totalPages: totalPages,
//                 totalUsers: totalCount[0].count,
//                 limit: limit
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching users with pagination:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };

const getUsersDetails = async (req, res) => {
    try {
        const userId = req.params.userId;  // User ID to get level and downline
        const page = parseInt(req.query.page) || 1;  // Pagination for downline
        const limit = parseInt(req.query.limit) || 10;  // Limit per page
        const offset = (page - 1) * limit;

        // Step 1: Fetch the level and details of the given user
        const [user] = await db.query(
            'SELECT id, name, country, account, referrer, upline, start, level, directTeam, totalMatrixTeam, totalIncome, totalDeposit, royaltyIncome, referralIncome, levelIncome, TxHash FROM users WHERE id = ?',
            [userId]
        );

        if (!user || user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userDetails = user[0];  // User details of the provided user
        const userLevel = userDetails.level;  // Get the user's level

        // Log the user's details to debug
        console.log(`Fetching downline for userId: ${userId} with level: ${userLevel}`);

        // Step 2: Get the downline users with a level lower than or equal to the user's level and directTeam < 2
        const [downline] = await db.query(
            'SELECT u.id, u.name, u.level, u.directTeam, t.parent_id, p.level AS parent_level ' + // Join again to get parent level
            'FROM tbl_tree_link t ' +
            'JOIN users u ON u.id = t.user_id ' +
            'LEFT JOIN users p ON p.id = t.parent_id ' + // Join to get the parent details
            'WHERE t.user_id = ? AND u.level <= ? AND u.directTeam < 2 ' + // Only directTeam < 2
            'LIMIT ? OFFSET ?',
            [userId, userLevel, limit, offset]
        );

        // Log the downline results to check if they are being fetched correctly
        console.log(`Downline for userId ${userId}: ${JSON.stringify(downline)}`);

        if (downline.length === 0) {
            return res.status(404).json({ message: 'No downline found for this user at a lower level' });
        }

        // Step 3: Filter users with direct team size 0 or 1
        const filteredDownline = downline.filter(user => user.directTeam === 0 || user.directTeam === 1);

        // Step 4: Get total count for pagination
        const [totalCount] = await db.query(
            'SELECT COUNT(*) AS count FROM users u ' +
            'JOIN tbl_tree_link t ON t.user_id = u.id ' +
            'WHERE t.user_id = ? AND u.level <= ? AND u.directTeam < 2',
            [userId, userLevel]
        );

        const totalPages = Math.ceil(totalCount[0].count / limit);

        // Step 5: Return the user details and filtered downline data, including parent level
        res.json({
            status: 200,
            userDetails: userDetails,  // User details of the requested user
            downline: filteredDownline.map(user => ({
                id: user.id,
                name: user.name,
                level: user.level,
                directTeam: user.directTeam,
                parent_id: user.parent_id,
                parent_level: user.parent_level  // Include parent level
            })),
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords: totalCount[0].count,
                limit,
            },
        });
    } catch (error) {
        console.error('Error fetching users details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


const getDailyStats = async (req, res) => {
    const { dateAgo, date } = req.query; // Retrieve query params from URL

    // Validate the dates if they are provided
    if (dateAgo && !/^\d{4}-\d{2}-\d{2}$/.test(dateAgo)) {
        return res.status(400).json({ message: 'Invalid dateAgo format. Use YYYY-MM-DD.' });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    try {
        let startOfDateAgo = '';
        let endOfDate = '';

        // Convert dateAgo and date to Unix timestamps if they are provided
        if (dateAgo) {
            startOfDateAgo = Math.floor(new Date(`${dateAgo} 00:00:00`).getTime() / 1000);
        }
        if (date) {
            endOfDate = Math.floor(new Date(`${date} 23:59:59`).getTime() / 1000);
        }

        // Query to count the register transactions and sum the value (Convert Wei to ETH)
        const [registerCount] = await db.query(
            `SELECT 
                COUNT(*) AS count,
                SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) AS totalValueInETH
            FROM 
                tbl_ether_force_all_transaction
            WHERE 
                functionName = ?
                ${startOfDateAgo && endOfDate ? 'AND timeStamp BETWEEN ? AND ?' : ''}`,
            startOfDateAgo && endOfDate ? ['register', startOfDateAgo, endOfDate] : ['register']
        );

        // Query to count the upgrade transactions and sum the value (Convert Wei to ETH)
        const [upgradeCount] = await db.query(
            `SELECT 
                COUNT(*) as count, 
                SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) as totalValueInETH
            FROM 
                tbl_ether_force_all_transaction
            WHERE 
                functionName = ?
                ${startOfDateAgo && endOfDate ? 'AND timeStamp BETWEEN ? AND ?' : ''}`,
            startOfDateAgo && endOfDate ? ['upgrade', startOfDateAgo, endOfDate] : ['upgrade']
        );

        // Query to count all transactions and sum the value (Convert Wei to ETH for total value)
        const [transactionCount] = await db.query(
            `SELECT 
                COUNT(*) as count, 
                SUM(CAST(value AS DECIMAL(20, 4)) / 1e18) as totalValueInETH
            FROM 
                tbl_ether_force_all_transaction
            ${startOfDateAgo && endOfDate ? 'WHERE timeStamp BETWEEN ? AND ?' : ''}`,
            startOfDateAgo && endOfDate ? [startOfDateAgo, endOfDate] : []
        );

        // Format the response data
        const responseData = {
            dateAgo,
            date,
            registerCount: registerCount[0].count || 0,
            registerTotalValue: registerCount[0].totalValueInETH || 0, // Converted to ETH
            upgradeCount: upgradeCount[0].count || 0,
            upgradeTotalValue: upgradeCount[0].totalValueInETH || 0, // Converted to ETH
            transactionCount: transactionCount[0].count || 0,
            transactionTotalValue: transactionCount[0].totalValueInETH || 0 // Converted to ETH
        };

        // Send the response with the daily stats
        res.status(200).json({
            status: 200,
            data: responseData
        });

    } catch (error) {
        // Log the error and send a generic error message
        console.error('Error fetching daily stats:', error.message || error);
        res.status(500).json({
            message: 'Server error',
            error: error.message || error
        });
    }
};


const downlinebusiness = async (req, res) => {
    const parentId = req.params.parentId;
 
    const query = `
      SELECT count(*) AS total_user, SUM(u.totalDeposit) AS total_deposit
      FROM users AS u
      INNER JOIN tbl_tree_link AS lnk ON u.id = lnk.user_id
      WHERE lnk.parent_id = ?
    `;
 
    try {
      // Execute the query and pass the parentId
      const [rows] = await db.query(query, [parentId]);
 
      // Check if any data was returned
      if (rows.length > 0) {
        res.status(200).json({
          total_user: rows[0].total_user,
          total_deposit: rows[0].total_deposit,
        });
      } else {
        res.status(404).json({ message: 'No downline data found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getCurrentDailyStats = async (req, res) => {
    const { page = 1, limit = 10, from, to } = req.query;

    try {
        const offset = (page - 1) * limit;
        let query = `SELECT * FROM daily_stats`;
        let queryParams = [];

        if (from && to) {
            query += ` WHERE date BETWEEN ? AND ?`;
            queryParams.push(`${from} 00:00:00`, `${to} 23:59:59`);
        }

        query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [dailyStats] = await db.query(query, queryParams);

        if (dailyStats.length > 0) {
            const statsWithLocalTime = dailyStats.map(stat => ({
                ...stat,
                date: convertUTCToLocal(stat.date, 'Asia/Kolkata'),
                created_at: convertUTCToLocal(stat.created_at, 'Asia/Kolkata')
            }));

            let countQuery = `SELECT COUNT(*) AS total FROM daily_stats`;
            let countParams = [];

            if (from && to) {
                countQuery += ` WHERE date BETWEEN ? AND ?`;
                countParams.push(`${from} 00:00:00`, `${to} 23:59:59`);
            }

            const [totalRecordsResult] = await db.query(countQuery, countParams);
            const totalRecords = totalRecordsResult[0].total;

            const totalPages = Math.ceil(totalRecords / limit);

            return res.status(200).json({
                status: 200,
                message: 'Daily stats fetched successfully',
                data: statsWithLocalTime,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRecords
                }
            });
        } else {
            return res.status(404).json({
                status: 404,
                message: 'No daily stats found'
            });
        }
    } catch (error) {
        console.error('Error fetching daily stats:', error.message || error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message || error
        });
    }
};


const getCurrentMonthlyStats = async (req, res) => {
    const { page = 1, limit = 10, year, month } = req.query;

    try {
        const offset = (page - 1) * limit;
        let query = `SELECT * FROM daily_stats`;
        let queryParams = [];

        if (year && month) {
            // We need to ensure that both year and month are provided
            const startOfMonth = `${year}-${month.padStart(2, '0')}-01 00:00:00`;
            const endOfMonth = `${year}-${month.padStart(2, '0')}-31 23:59:59`;
            query += ` WHERE date BETWEEN ? AND ?`;
            queryParams.push(startOfMonth, endOfMonth);
        }

        query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [dailyStats] = await db.query(query, queryParams);

        if (dailyStats.length > 0) {
            const statsWithLocalTime = dailyStats.map(stat => ({
                ...stat,
                date: convertUTCToLocal(stat.date, 'Asia/Kolkata'),
                created_at: convertUTCToLocal(stat.created_at, 'Asia/Kolkata')
            }));

            let countQuery = `SELECT COUNT(*) AS total FROM daily_stats`;
            let countParams = [];

            if (year && month) {
                countQuery += ` WHERE date BETWEEN ? AND ?`;
                countParams.push(startOfMonth, endOfMonth);
            }

            const [totalRecordsResult] = await db.query(countQuery, countParams);
            const totalRecords = totalRecordsResult[0].total;

            const totalPages = Math.ceil(totalRecords / limit);

            return res.status(200).json({
                status: 200,
                message: 'Monthly stats fetched successfully',
                data: statsWithLocalTime,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRecords
                }
            });
        } else {
            return res.status(404).json({
                status: 404,
                message: 'No monthly stats found'
            });
        }
    } catch (error) {
        console.error('Error fetching monthly stats:', error.message || error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message || error
        });
    }
};


function formatToYMD(dateStr) {
    const dateObj = new Date(dateStr);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function parseDateToEpoch(dateStr, isEndOfDay = false) {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return NaN;

    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');

    const formatted = `${year}-${month}-${day}T${isEndOfDay ? '23:59:59' : '00:00:00'}Z`;
    return Math.floor(new Date(formatted).getTime() / 1000);
}


function convertEpochToLocal(epochSeconds, timeZone = 'Asia/Kolkata') {
    return new Date(epochSeconds * 1000).toLocaleString('en-IN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
}


module.exports = {
    registerUser,
    loginUser,
    getUserById,
    getAllUsers,
    getUsersByLevel,
    getDownline,
    getbyFunctionName,
    getAllFunctions,
    getDailyStats,
    getUsersDetails,
    downlinebusiness,
    getCurrentDailyStats,
    getCurrentMonthlyStats
};
