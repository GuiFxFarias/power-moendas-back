const path = require('path');
const router = require('./routes');

module.exports = (app, express) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  app.use(router);
};
