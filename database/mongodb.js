import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Conexión general a MongoDB establecida.");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
  }
}

export { client, connectToDatabase };
