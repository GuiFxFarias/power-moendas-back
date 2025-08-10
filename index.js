require('dotenv').config();
const router = require('./routers/indexRotas.js');
const cors = require('cors');
const path = require('path');

const { enviarMensagemWhatsApp } = require('./services/twilioService.js');

require('./services/agendadorMensagens.js');

const express = require('express');
const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://g-calender.vercel.app',
      'https://www.gcalendar.com.br',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

router(app, express);

const PORT = 3001;
app.listen(PORT, (error) => {
  if (error) {
    console.log('Error running server');
    return;
  }

  console.log(`✅ Server is running on port ${PORT}`);
});
