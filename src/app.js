import express from 'express'
import { engine } from 'express-handlebars';
import morgan from 'morgan';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { resolve } from 'path';
import config from './config.js'
import session from 'express-session'

// Importing routes of modules
import usersRoutes from './modules/users/routes.js'

// Initialization of app
const app = express();

// Configuration of express-session
app.use(session({
    secret: 'secret', 
    resave: false,
    saveUninitialized: false
}));

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration of the app
app.set('port', config.app.port);

// Setting views path
const viewsPath = resolve(__dirname, 'views');
app.set('views', viewsPath);

// Setting the render engine
app.engine('.hbs', engine({
    defaultLayout: 'main',
    layoutsDir: join(app.get('views'), 'layouts'),
    partialsDir: join(app.get('views'), 'partials'),
    extname: '.hbs'
}));
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes

app.use(usersRoutes);

// Main Route
app.get('/', (req, res) => {
    // Your code here...
    res.render('index', { title: 'Home Page' });
});

// Static Files
app.use(express.static(join(__dirname, 'public')));

// Exporting the app so index.js can import it
export default app;