const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const db = require('./models');

// Import routes
const authRoutes = require('./routes/auth.route.js');
const userRoutes = require('./routes/user.route.js');
const patientRoutes = require('./routes/patient.route.js');
const bedRoutes = require('./routes/bed.route.js');
const admissionRoutes = require('./routes/admission.route.js');
const billingRoutes = require('./routes/billing.route.js');
const serviceRoutes = require('./routes/service.route.js');

// CORS configuration - Allow requests from your frontend
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/services', serviceRoutes);

app.get("/", (req, res) => {
    res.json({ 
        message: "Hospital System API", 
        status: "Running",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            patients: "/api/patients",
            beds: "/api/beds",
            admissions: "/api/admissions",
            billing: "/api/billing",
            services: "/api/services"
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

db.sequelize.sync().then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

