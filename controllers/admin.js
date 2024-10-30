import CryptoJS from "crypto-js";
import moment from "moment-timezone";
import dotenv from "dotenv";
import { client } from "../database/mongodb.js";
dotenv.config();

const database = client.db("ganaComoLoco");
const usersCollection = database.collection("users");
const codesCollection = database.collection("codes");
const usersInfoCollection = database.collection("users_info");
//---------------Registro de Admin---------------------
export const registerAdmin = async (req, res) => {
  const datos = req.body;
  const hashedPassword = CryptoJS.SHA256(datos.password).toString();

  try {
    const userExists = await usersCollection.findOne({ email: datos.email });
    if (userExists) {
      return res.status(400).json({
        status: "CorreoExistente",
        message: "El correo ya está registrado.",
      });
    }

    const currentDateTime = moment()
      .tz("America/Bogota")
      .format("YYYY-MM-DD HH:mm:ss");

    await usersCollection.insertOne({
      email: datos.email,
      password: hashedPassword,
      role: "admin",
      created_at: currentDateTime,
    });

    res.status(201).json({
      status: "RegistroExitoso",
      message: "Administrador registrado con éxito.",
    });
  } catch (error) {
    console.error("Error al registrar el administrador:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  }
};

//--------ver Codigos

export const getCodesInfo = async (req, res) => {
  try {
    const codes = await codesCollection.find().toArray();

    const codesInfo = await Promise.all(
      codes.map(async (code) => {
        const userInfo = await usersInfoCollection.findOne({
          email: code.usuarioEmail,
        });

        return {
          fecha: code.fechaRegistro,
          nombre: userInfo?.name || "N/A",
          cedula: userInfo?.idNumber || "N/A",
          telefono: userInfo?.cell || "N/A",
          codigo: code.code,
          premio: code.prize,
          estado: code.estado,
        };
      })
    );

    res.status(200).json({
      status: "Exito",
      data: codesInfo,
    });
  } catch (error) {
    console.error("Error al obtener la información de los códigos:", error);
    res.status(500).json({
      status: "Error",
      message: "Error al obtener la información de los códigos",
    });
  }
};
