import {createPool} from 'mysql2/promise';
import config from '../config.js';

const pool = createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
})

export default pool;
