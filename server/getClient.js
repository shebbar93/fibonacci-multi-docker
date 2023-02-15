const keys = require("./keys");
const { Client } = require("pg");

module.exports.getClient = async () => {
  const client = new Client({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort,
  });
  await client.connect();
  return client;
};
