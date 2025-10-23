const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.port || 5000;
const db =  require('./models');


// Import routes
const authRoutes = require('./routes/auth.route.js');
const userRoutes = require('./routes/user.route.js');
const patientRoutes = require('./routes/patient.route.js');
const bedRoutes = require('./routes/bed.route.js');
const admissionRoutes = require('./routes/admission.route.js');
const billingRoutes = require('./routes/billing.route.js');
const serviceRoutes = require('./routes/service.route.js');

// Import Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/services', serviceRoutes);

app.get("/", (req, res)=> {
    res.send("Hospital System...");
})

// Database connection and start server
db.sequelize.sync().then(() => {
    console.log('Database connected successfully');
    app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});