
'use strict';

require('localenv');

const express = require('express');
const serveStatic = require('serve-static');
const finalhandler = require("finalhandler");

const app = express();


const sserve = serveStatic("./static/");


// home page
app.get('/', (req, res) => {
  res.status(200).send('K.L. Studio.nodejs');
});


app.get('*', (req, res) => {
    const done = finalhandler(req, res);
    sserve(req, res, done);
});


if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}

module.exports = app;
