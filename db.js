const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
  'telegram-bot',
  'root',
  'root',
  {
    host: '77.223.123.76',
    port: '6432',
    dialect: 'postgres'
  }
)