const { getClient } = require("./getClient");
const keys = require("./keys");

// Express App Setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
let pgClient = "";
(async () => {
  pgClient = await getClient();
  let createTableQuery = `CREATE TABLE IF NOT EXISTS values (number INT);`;
  const res = await pgClient.query(createTableQuery);
  console.log(`Created table.`);
  //await pgClient.end();
})();

// const { Pool } = require("pg");
// const pgClient = new Pool({
//   user: keys.pgUser,
//   host: keys.pgHost,
//   database: keys.pgDatabase,
//   password: keys.pgPassword,
//   port: keys.pgPort,
// });

// pgClient.on("connect", () => {
//   pgClient
//     .query("CREATE TABLE IF NOT EXISTS values (number INT)")
//     .then((data) => {
//       console.log(`Created the table for you`);
//       console.log(data);
//     })
//     .catch((err) => console.log(err));
// });

// Redis Client Setup
const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get("/", (req, res) => {
  res.send("Hi");
});

app.get("/values/all", async (req, res) => {
  console.log("Hello I am here for /all");
  const values = await pgClient.query("SELECT * from values");

  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  console.log("Hello I am here for /current");
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }

  redisClient.hset("values", index, "Nothing yet!");
  redisPublisher.publish("insert", index);
  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);

  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log("Listening");
});
