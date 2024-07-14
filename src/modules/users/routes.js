import {Router} from 'express'
import {hashSync} from 'bcrypt'
import pool from '../../DB/mysql.js'
import controllers from './controller.js';

const {
    validateUsername, 
    validateEmail, 
    authenticateUser, 
    getData, 
    getUserById, 
    getUsersPaginated,
    validateUsernameNotId,
    validateEmailNotId
} = controllers;

const router = Router();

// Routes for Adding an User
router.get('/add', (req, res) => {
    res.render('users/add');
})

router.post('/add', async(req, res) => {
    try {

        const {name, last_name, username, email, password} = req.body;

        // Validate if username already exists
        const usernameExists = await validateUsername(username);

        if (usernameExists) {
            // Handle the case where the username already exists
            res.render('users/add', { alert: 'Username already exists' });
            return;
        }

        // Validate if email already exists
        const emailExists = await validateEmail(email);

        if (emailExists) {
            // Handle the case where the username already exists
            res.render('users/add', { alert: 'Email already exists' });
            return;
        }

        const new_password = hashSync(password, 5);

        const newUser = {
            name,
            last_name,
            username,
            email,
            password: new_password
        }

        await pool.query('INSERT INTO users SET ?', [newUser]);
        res.redirect('/add/success');

    } catch (err) {
        res.status(500).json({message: err.message});
    }
})

router.get('/add/success', (req, res) => {
    let alert = "Registration Successful";
    res.render('users/add', { message: alert });
});

// Login Routes
router.get('/login', (req, res) => {
    res.render('users/login');
})

router.post('/login', async(req, res) => {
    const {username, password} = req.body;

    // Validating authentication
    const user = await authenticateUser(username, password);

    if (user)
    {
        req.session.username = user.username;
        req.session.userId = user.id;
        
        console.log(req.session.userId + req.session.username);
        // Redirect to home page
        res.redirect('/dashboard'); // Redirige a la página de dashboard u otra página protegida
        return;
    }
    
    res.render('users/login', { alert: 'Invalid credentials' });
})

// Dashboard Routes
router.get('/dashboard', async(req, res) => {

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Verificar si hay un mensaje en la sesión
    const message = req.session.message;
    const alert_message = req.session.alert_message;

    delete req.session.message; // Limpiar el mensaje después de leerlo
    delete req.session.alert_message;

    if (!req.session.userId) {
        res.redirect('/login'); // Redirige si no hay sesión activa
        return;
    }

    const user = await getData(req.session.userId);
    
    if (user === false)
    {
        res.redirect('/logout'); // Redirige si no hay sesión activa
        return;
    }

    res.render('users/dashboard', {user: user, message, alert_message, layout: 'system'});
})

// UPDATE
router.post('/update', async(req, res) => {
    try {
        const {name, last_name, username, email} = req.body;
        const id = req.session.userId;
        
        // Check if the user exists
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            res.redirect('/logout');
        }

        // Validate if username already exists
        const usernameExists = await validateUsernameNotId(username, id);

        if (usernameExists) {
            // Handle the case where the username already exists
            req.session.alert_message = 'Username not valid or already in use in other users'
            res.redirect('/dashboard');
            return;
        }

        // Validate if email already exists
        const emailExists = await validateEmailNotId(email, id);

        if (emailExists) {
            // Handle the case where the username already exists
            req.session.alert_message = 'Email not valid or already in use in other users';
            res.redirect('/dashboard');
            return;
        }

        await pool.query('UPDATE users SET name =?, last_name =?, email =?, username=? WHERE id =?', [name, last_name, email, username, id]);
        
        // Guardar mensaje en la sesión
        req.session.message = 'User updated successfully';
        res.redirect('/dashboard');
        return;
        
    } catch (err) {
        console.error('Error al actualizar el usuario:', err);
        res.status(500).send('Error al actualizar el usuario');
        return;
    }

})

// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            res.status(500).send('Error al cerrar sesión');
            return;
        }
        res.clearCookie('session-id'); // Limpiar la cookie de sesión si es necesario
        res.redirect('/login'); // Redirige a la página de inicio de sesión u otra página
    });
});

// EndPoints

// Getting only one user
router.get('/api/v1/users/:id', async(req, res) => {

    try {
        const { id } = req.params;
        const user = await getUserById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Listing all users
router.get('/api/v1/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;  // Página actual
        const count = parseInt(req.query.count) || 10;  // Cantidad de usuarios por página

        const users = await getUsersPaginated(page, count);

        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// UPDATING ONE USER
router.put('/api/v1/users/:id', async(req, res) => {
    try {
        
        // Getting the ID
        const id = parseInt(req.params.id);

        // Check if the user exists
        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Getting the other data
        const {name, last_name, username, email} = req.body;

        // Validate if username already exists
        const usernameExists = await validateUsernameNotId(username, id);

        if (usernameExists) {
            // Handle the case where the username already exists
            return res.status(403).json({ message: 'Username not valid or already in use in other users' });
        }

        // Validate if email already exists
        const emailExists = await validateEmailNotId(email, id);

        if (emailExists) {
            // Handle the case where the username already exists
            return res.status(403).json({ message: 'Email not valid or already in use in other users' });
        }

        // Inserting that into the SQL Query
        await pool.query('UPDATE users SET name =?, last_name =?, email =?, username =? WHERE id =?', [name, last_name, email, username, id]);

        const message = "User updated successfully";
        res.status(200).json({ message });

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// DELETING ONE USER
router.delete('/api/v1/users/:id', async(req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await pool.query('SELECT * FROM users WHERE id =?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        await pool.query('DELETE FROM users WHERE id =?', [id]);
        res.status(200).json({ message: 'User deleted successfully' });
        
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error deleting user' });
    }
})

export default router;