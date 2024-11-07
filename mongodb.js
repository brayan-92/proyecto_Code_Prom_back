import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function connect() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Hizo ping tu despliegue. Te has conectado con exito a MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

const db = client.db('nombre_de_tu_base_de_datos');

const users = db.collection('users');
const userInfo = db.collection('user_info');

export default client;
