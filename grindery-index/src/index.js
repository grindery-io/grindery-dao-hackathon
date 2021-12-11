const express = require('express'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  api = require('./api');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({
  extended: false,
}));

// Enable CORS
app.use(cors());

// API endpoints
app.use('/api/v0', api);

app.get('/', (req, res) => {
  res.send('Grindery Index!');
});

app.listen(PORT, function () {
  console.log('Grindery Index listening on port ' + (PORT) + '!');
});