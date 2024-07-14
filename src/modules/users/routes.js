import {Router} from 'express'
import {hashSync} from 'bcrypt'
import pool from '../../DB/mysql.js'
import controllers from './controller.js';

const {validateUsername, validateEmail, authenticateUser, getData, getUserById} = controllers;

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
    delete req.session.message; // Limpiar el mensaje después de leerlo

    if (!req.session.userId) {
        res.redirect('/login'); // Redirige si no hay sesión activa
        return;
    }

    const user = await getData(req.session.userId);
    console.log(user);

    res.render('users/dashboard', {user: user, message, layout: 'system'});
})

// UPDATE
router.post('/update', async(req, res) => {
    try {
        const {name, last_name, email} = req.body;
        const id = req.session.userId;
        
        await pool.query('UPDATE users SET name =?, last_name =?, email =? WHERE id =?', [name, last_name, email, id]);
        
        // Guardar mensaje en la sesión
        req.session.message = 'User updated successfully';

        res.redirect('/dashboard');
        
        
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

export default router;