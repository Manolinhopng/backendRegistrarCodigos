// routesUser.js
import express from "express";
import {
  postLogin,
  postRegister,
  verificarCodigo,
  obtenerCodigo,
} from "../controllers/user.js";
const router = express.Router();
import { registerAdmin, getCodesInfo } from "../controllers/admin.js";

// Rutas para el usuario
router.post("/login", postLogin);
router.post("/register", postRegister);
router.post("/verificarCodigo", verificarCodigo);
router.post("/obtenerCodigo", obtenerCodigo);

// Rutas para el admin
router.post("/registerAdmin", registerAdmin);
router.get("/obtenerCodigos", getCodesInfo);

export default router;
