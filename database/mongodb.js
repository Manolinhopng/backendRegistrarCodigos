import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

// Crea una instancia persistente de MongoClient para mantener la conexión abierta
const client = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToDatabase() {
  try {
    // Conexión a la base de datos
    await client.connect();
    console.log("Conexión general a MongoDB establecida.");

    // Asegúrate de que el cliente se mantenga conectado mientras la aplicación esté en ejecución
    client.on("topologyClosed", () => {
      console.log("La topología de MongoDB se ha cerrado.");
    });
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error);
  }
}

export { client, connectToDatabase };
