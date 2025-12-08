// =================================================================================================
// DEPRECATED / LEGACY - DO NOT USE
// This file contains a Sequelize (MySQL) database configuration that is not used in this project.
// The project uses Mongoose (MongoDB) for all database operations.
// This file is kept for historical purposes only and should not be imported or used.
// =================================================================================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;