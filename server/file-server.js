// server/file-server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

app.get('/engagement', (req, res) => {
  const filePath = path.join(__dirname, '../engagement.json');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.status(500).send({ error: "Could not read engagement.json" });
    } else {
      res.send(JSON.parse(data));
    }
  });
});

app.listen(4000, () => {
  console.log("Server running at http://localhost:4000/engagement");
});
