require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT ||8000

const mysql = require('mysql2')
const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect()

app.get('/', (req, res) => {
  connection.query('SELECT * FROM user_account', function (err, rows, fields) {
    if (err) throw err

    res.send(rows)
  })
})

app.listen(port, () => {
  console.log(`Roombooking app listening at http://localhost:${port}`)
})
