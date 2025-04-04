// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
app.use(cors());

// Only parse JSON for POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    express.json({ limit: '50mb' })(req, res, next);
  } else {
    next();
  }
});

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
