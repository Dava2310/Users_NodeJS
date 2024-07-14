import { config } from "dotenv"

// Load environment variables from .env file
config();

const configuration = {
    // App configuration
    app: {
        port: process.env.PORT || 5000,
    },
    // Database Configuration
    mysql: {
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DB || 'ejemplo'
    },
};

// Exporting configuration
export default configuration;