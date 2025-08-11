require('dotenv').config();
const router = require('./routers/indexRotas.js');
const cors = require('cors');
const path = require('path');

const express = require('express');
const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://power-moendas-front.vercel.app/',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

router(app, express);

const PORT = 3001;
app.listen(PORT, (error) => {
  if (error) {
    console.log('Error running server');
    return;
  }

  console.log(`✅ Server is running on port ${PORT}`);
});
