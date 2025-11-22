const express = require('express');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const sequelize = require('./config/db');

// Kiểm tra kết nối database
sequelize.authenticate()
  .then(() => 
    console.log('Connection to the database has been established successfully.'));

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
});