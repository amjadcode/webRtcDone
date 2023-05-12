// let { MongoClient } = require("mongodb");
// let url = "mongodb://localhost:27017";
// let client = new MongoClient(url);
let { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://message_app:666Tph4Ra1tEgc6o@cluster0.fjaog.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let userInsert = async (user) => {
  client.connect();
  let db = client.db("message_app");
  //db password 666Tph4Ra1tEgc6o
  let collection = db.collection("users");
  const insertResult = await collection.insertOne(user);
  client.close();
  return insertResult;
};
let userFind = async (user) => {
  client.connect();
  let db = client.db("message_app");
  let collection = db.collection("users");
  const findResult = await collection.findOne(user);
  client.close();
  return findResult;
};
exports.userInsert = userInsert;
exports.userFind = userFind;
