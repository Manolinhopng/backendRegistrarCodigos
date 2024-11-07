import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { urlencoded, json } from "express";
import router from "./routes/routesUser.js";
import { connectToDatabase } from "./database/mongodb.js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: "https://frontend-registrar-codigos.vercel.app",
  methods: ["GET", "POST", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cors(corsOptions));

connectToDatabase();

app.use("/api/users", router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
