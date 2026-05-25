const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser  = require('cookie-parser');

const { apiLimiter }  = require('./middleware/rateLimiter');
const errorHandler    = require('./middleware/errorHandler');
const AppError        = require('./utils/AppError');

const authRoutes          = require('./routes/auth.routes');
const userRoutes          = require('./routes/user.routes');
const recipeRoutes        = require('./routes/recipe.routes');
const mealPlanRoutes      = require('./routes/mealPlan.routes');
const nutritionPlanRoutes = require('./routes/nutritionPlan.routes');

const app = express();

app.use(helmet());
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.status(200).json({
  status: 'success', message: 'NutriNest API is running',
  environment: process.env.NODE_ENV, timestamp: new Date().toISOString(),
}));

app.use('/api/v1/auth',            authRoutes);
app.use('/api/v1/users',           userRoutes);
app.use('/api/v1/recipes',         recipeRoutes);
app.use('/api/v1/meal-plans',      mealPlanRoutes);
app.use('/api/v1/nutrition-plans', nutritionPlanRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

app.use(errorHandler);

module.exports = app;
