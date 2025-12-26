const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./openapi.yaml'); // đường dẫn đến file YAML

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(4000, () => {
  console.log('API Docs available at http://localhost:4000/api-docs');
});
