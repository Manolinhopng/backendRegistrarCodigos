import CryptoJS from "crypto-js";
import moment from "moment-timezone";
import dotenv from "dotenv";
import { client } from "../database/mongodb.js";
dotenv.config();

const database = client.db("ganaComoLoco");
const usersCollection = database.collection("users");
const usersInfoCollection = database.collection("users_info");
const logLoginCollection = database.collection("log_login");

//---------------Login---------------------
export const postLogin = async (req, res) => {
  const datos = req.body;
  const hashedPassword = CryptoJS.SHA256(datos.password).toString();

  try {
    const login = await usersCollection.findOne({
      email: datos.email,
      password: hashedPassword,
    });

    if (login) {
      const currentDateTime = moment()
        .tz("America/Bogota")
        .format("YYYY-MM-DD HH:mm:ss");

      await logLoginCollection.insertOne({
        email: datos.email,
        role: login.role,
        date: currentDateTime,
      });

      res.json({ status: "Bienvenido", user: datos.email, role: login.role });
    } else {
      res.json({ status: "ErrorCredenciales" });
    }
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  }
};

//---------------Register---------------------
export const postRegister = async (req, res) => {
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

    const userInsertResult = await usersCollection.insertOne({
      email: datos.email,
      password: hashedPassword,
      role: "user",
      created_at: currentDateTime,
    });

    await usersInfoCollection.insertOne({
      user_id: userInsertResult.insertedId,
      name: datos.name,
      birthDate: datos.birthDate,
      idNumber: datos.idNumber,
      email: datos.email,
      cell: datos.cell,
      city: datos.city,
      registered_at: currentDateTime,
    });

    res.status(201).json({
      status: "RegistroExitoso",
      message: "Usuario registrado correctamente.",
      user: datos.email,
    });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  }
};

//---------------Verificar Codigo---------------------
export const verificarCodigo = async (req, res) => {
  const { code } = req.body;
  const email = req.body.email;

  if (!code || !email) {
    return res.status(400).json({
      status: "CodigoInvalido",
      message: "No se recibió ningún código o correo para verificar.",
    });
  }

  try {
    const codigoComoCadena = code.toString();

    if (!/^\d{3}$/.test(codigoComoCadena)) {
      await database.collection("logs_codes").insertOne({
        email,
        code: codigoComoCadena,
        status: "CodigoInvalido",
        date: new Date().toLocaleString("es-CO"),
      });
      return res.json({
        status: "CodigoInvalido",
        message: "El código debe tener exactamente 3 números.",
      });
    }

    const codigoEncontrado = await database
      .collection("codes")
      .findOne({ code: codigoComoCadena });

    if (!codigoEncontrado) {
      await database.collection("logs_codes").insertOne({
        email,
        code: codigoComoCadena,
        status: "CodigoNoExiste",
        date: new Date().toLocaleString("es-CO"),
      });
      return res.json({
        status: "CodigoNoExiste",
        message: "El código no existe en la base de datos.",
      });
    }

    if (codigoEncontrado.estado === "registrado") {
      await database.collection("logs_codes").insertOne({
        email,
        code: codigoComoCadena,
        status: "CodigoRepetido",
        date: new Date().toLocaleString("es-CO"),
      });
      return res.json({
        status: "CodigoRepetido",
        message: "El código ya fue registrado previamente.",
      });
    }

    const fechaRegistro = new Date().toLocaleString("es-CO");

    await database.collection("codes").updateOne(
      { code: codigoComoCadena },
      {
        $set: {
          estado: "registrado",
          fechaRegistro: fechaRegistro,
          prize: codigoEncontrado.prize,
          usuarioEmail: email,
        },
      }
    );

    await database.collection("logs_codes").insertOne({
      email,
      code: codigoComoCadena,
      status: "CodigoRegistrado",
      date: fechaRegistro,
    });

    return res.json({
      status: "CodigoRegistrado",
      message: "El código ha sido registrado correctamente.",
      _id: codigoEncontrado._id,
      code: codigoComoCadena,
      prize: codigoEncontrado.prize,
    });
  } catch (error) {
    console.error("Error al verificar el código:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  }
};

//---------------Obtener Codigo---------------------
export const obtenerCodigo = async (req, res) => {
  const { email } = req.body; // Asegúrate de recibir el email

  try {
    const user = await database.collection("users").findOne({ email });

    if (!user) {
      return res.json({
        status: "UsuarioNoExiste",
        message: "El usuario no existe en la base de datos.",
      });
    }

    const codigos = await database
      .collection("codes")
      .find({ usuarioEmail: email })
      .project({ code: 1, prize: 1, fechaRegistro: 1, estado: 1 })
      .toArray();

    if (!codigos.length) {
      return res.json({
        status: "SinCodigos",
        message: "Este usuario no tiene códigos asignados.",
      });
    }

    return res.json({
      status: "CodigosObtenidos",
      message: "Códigos obtenidos correctamente.",
      codigos,
    });
  } catch (error) {
    console.error("Error al obtener los códigos:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  }
};
