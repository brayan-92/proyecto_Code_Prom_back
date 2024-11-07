import express from "express";
import {
    postRegister,
    postLogin,
    obtenerCodigos,
    postRegisterAdmin,
    postRegisterCode,
    getCanjeados
} from "../controllers/user.js";
const router = express.Router();

//definjir rutas
router.post("/register", postRegister);
router.post("/login", postLogin);
router.post("/create-admin", postRegisterAdmin)
router.post("/user", postRegisterCode);
router.post("/obtenerCodigo", obtenerCodigos);
router.get("/canjeados", getCanjeados);


//exportar rutas
export default router;