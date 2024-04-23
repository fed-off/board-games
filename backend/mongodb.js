const { MongoClient, ServerApiVersion } = require('mongodb');

const password = process.env.MONGO_PASSWORD;

const uri = `mongodb+srv://admin:${password}@atlascluster.6jmw2qo.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

client.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch(console.error);

const database = client.db("monopoly");

module.exports = {
  db: database,
}
