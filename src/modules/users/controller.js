import pool from '../../DB/mysql.js';
import {compare} from 'bcrypt'
/**
 * Validates if a username already exists in the database.
 * @param {string} username - The username to check.
 * @returns {Promise<boolean>} - Returns true if the username exists, false otherwise.
 */
const validateUsername = async (username) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        connection.release();

        // Check if the query returned any results
        return rows.length > 0;
    } catch (error) {
        console.error('Error validating username:', error);
        throw error;
    }
};

/**
 * Validates if an email already exists in the users table.
 * @param {string} email - The username to check.
 * @returns {Promise<boolean>} - Returns true if the email exists, false otherwise.
 */
const validateEmail = async (email) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        connection.release();

        // Check if the query returned any results
        return rows.length > 0;
    } catch (error) {
        console.error('Error validating email:', error);
        throw error;
    }
};

const authenticateUser = async (username, password) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [username]);
        connection.release();

        if (rows.length === 0) {
            return false;
        }

        // Getting the password from that username
        const password_crypted = rows[0].password;

        // Comparing password inserted with password crypted
        const passwordMatch = await compare(password, password_crypted);

        if (passwordMatch) {
            return rows[0]; // Returning the user
        } else {
            return false; // Incorrect password
        }
        
    } catch (err) {
        console.error('Error validating email:', err);
        throw err;
    }
};

const getData = async(id) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [id]);
        connection.release();
        return rows[0];
        
    } catch (err) {
        console.error('Error getting data:', err);
        throw err;
    }
}

export default {
    validateUsername, 
    validateEmail, 
    authenticateUser,
    getData
};