const path = require('path');
const router = require('./routes');
const webhookRoute = require('./webhookRoute'); // ⚠️ arquivo separado só pro webhook

module.exports = (app, express) => {
  // ✅ Aplique o express.raw() SOMENTE no webhook ANTES do json
  app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoute);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use(router);
};
