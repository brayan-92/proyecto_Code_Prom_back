import CryptoJS from "crypto-js";
import moment from "moment-timezone";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
import client from "../mongodb.js";
dotenv.config();

export async function postRegisterCode(req, res) {
  const datos = req.body;
  console.log("Datos recibidos del frontend:", datos); // Verifica que los datos llegan correctamente

  try {
    await client.connect(); // Conéctate a la base de datos usando el cliente de MongoDB
    const database = client.db("Parcial_2"); // Selecciona la base de datos
    const codigosCollection = database.collection("codigos"); // Selecciona la colección de códigos
    const intentosCollection = database.collection("intentos"); // Selecciona la colección de intentos

    // Obtener el user_id desde los datos enviados por el frontend
    const { codigo, user_id } = datos;

    // Verificar si el código ya existe en la colección codigos
    const codigoExists = await codigosCollection.findOne({ codigo });

    if (codigoExists) {
      // Actualizar el estado a 'canjeado' y registrar la fecha de cambio de estado junto con el user_id
      const currentDateTime = moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");

      await codigosCollection.updateOne(
        { codigo },
        {
          $set: {
            estado: "canjeado",
            fecha_cambio_estado: currentDateTime,
            user_id: user_id, // Asocia el user_id con este canje
          }
        }
      );

      return res.status(200).json({
        status: "CodigoExistente",
        message: "Felicitaciones GANASTE!!.",
        premio: codigoExists.premio, // Retornar el premio existente
      });
    } else {
      // Si el código no existe, registra un intento fallido en la colección intentos
      const currentDateTime = moment().tz("America/Bogota").format("YYYY-MM-DD HH:mm:ss");

      await intentosCollection.insertOne({
        user_id,
        codigo,
        fecha_intento: currentDateTime,
      });

      return res.status(404).json({
        status: "CodigoNoExistente",
        message: "Codigo sin premio, siguen intentando.",
      });
    }

  } catch (error) {
    console.error("Error al verificar el código:", error);
    return res.status(500).json({ status: "Error", message: "Error en el servidor." });
  } finally {
    await client.close(); // Asegúrate de cerrar la conexión
  }
}

//---------------Login---------------------
export const postLogin = async (req, res) => {
  const datos = req.body;
  console.log("Datos recibidos del frontend:", datos); // Verifica que el email y el password llegan correctamente

  const hashedPassword = CryptoJS.SHA256(datos.password).toString();
  console.log("Contraseña encriptada:", hashedPassword); // Verifica que la contraseña fue encriptada correctamente

  try {
    await client.connect(); // Conéctate a la base de datos usando el cliente de MongoDB

    const database = client.db("Parcial_2"); // Selecciona la base de datos
    const usersCollection = database.collection("users"); // Selecciona la colección de usuarios

    // Busca al usuario con el email y la contraseña encriptada
    const login = await usersCollection.findOne({
      email: datos.email,
      password: hashedPassword,
    });
    console.log("Resultado de la búsqueda del usuario:", login); // Verifica si encontró el usuario

    if (login) {
      const currentDateTime = moment()
        .tz("America/Bogota")
        .format("YYYY-MM-DD HH:mm:ss");

      // Inserta el inicio de sesión en el log_login
      await database.collection("log_login").insertOne({
        email: datos.email,
        role: login.role,
        date: currentDateTime,
      });

      // Aquí se añade la lógica para redirigir según el rol
      const redirectPath = login.role === 'admin' ? '/admin' : '/user';

      //incluye el user_id en la respuesta

      res.json({
        status: "Bienvenido",
        user_id: login._id,
        user: datos.email,
        role: login.role,
        redirectPath
      });
    } else {
      console.log("Credenciales incorrectas");
      res.json({ status: "ErrorCredenciales" });
    }
  } catch (error) {
    console.error("Error en el login:", error); // Captura y muestra cualquier error
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  } finally {
    await client.close(); // Cierra la conexión con la base de datos
  }
};


//--------------- Register Admin ---------------------
export const postRegisterAdmin = async (req, res) => {
  const datos = req.body;
  const hashedPassword = CryptoJS.SHA256(datos.password).toString();

  try {
    await client.connect(); // Conéctate a la base de datos

    const database = client.db("Parcial_2"); // Selecciona tu base de datos
    const usersCollection = database.collection("users"); // Selecciona la colección de usuarios

    // Verificar si el correo ya existe
    const userExists = await usersCollection.findOne({ email: datos.email });

    if (userExists) {
      return res.status(400).json({
        status: "CorreoExistente",
        message: "El correo ya está registrado.",
      });
    }

    // Obtener la fecha y hora actual en formato Bogotá para el registro
    const currentDateTime = moment()
      .tz("America/Bogota")
      .format("YYYY-MM-DD HH:mm:ss");

    // Insertar el nuevo usuario en la colección users con el rol de "admin"
    const userInsertResult = await usersCollection.insertOne({
      email: datos.email,
      password: hashedPassword,
      role: "admin",
      created_at: currentDateTime,
    });

    console.log("userInsertResult:", userInsertResult); // Verifica el resultado de la inserción

    // Verifica si se obtuvo el ID del usuario correctamente
    if (!userInsertResult.insertedId) {
      throw new Error("Fallo al obtener el ID del usuario recién creado.");
    }

    // Respuesta de éxito
    res.status(201).json({
      status: "RegistroExitoso",
      message: "Administrador registrado correctamente.",
      user: datos.email,
    });
  } catch (error) {
    console.error("Error al registrar el administrador:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  } finally {
    await client.close(); // Asegúrate de cerrar la conexión
  }
};

//---------------Register---------------------
export const postRegister = async (req, res) => {
  const datos = req.body;
  const hashedPassword = CryptoJS.SHA256(datos.password).toString();

  try {
    await client.connect(); // Conéctate a la base de datos

    const database = client.db("Parcial_2"); // Selecciona tu base de datos
    const usersCollection = database.collection("users"); // Selecciona la colección de usuarios
    const usersInfoCollection = database.collection("users_info"); // Selecciona la colección de info de usuarios

    // Verificar si el correo ya existe
    const userExists = await usersCollection.findOne({ email: datos.email });

    if (userExists) {
      return res.status(400).json({
        status: "CorreoExistente",
        message: "El correo ya está registrado.",
      });
    }

    // Obtener la fecha y hora actual en formato Bogotá para el registro
    const currentDateTime = moment()
      .tz("America/Bogota")
      .format("YYYY-MM-DD HH:mm:ss");

    // Insertar el nuevo usuario en la colección users (correo y contraseña)
    const userInsertResult = await usersCollection.insertOne({
      email: datos.email,
      password: hashedPassword,
      role: "user",
      created_at: currentDateTime,
    });

    console.log("userInsertResult:", userInsertResult); // Verifica el resultado de la inserción

    //verifica si se obtubo el id del corectamente
    if (!userInsertResult.insertedId) {
      throw new Error("Fallo al obtener el ID del usuario recién creado.");
    }


    // Insertar los demás datos del usuario en la colección users_info
    const userInfoInsertResult = await usersInfoCollection.insertOne({
      user_id: userInsertResult.insertedId, // Relación con el ID del usuario
      name: datos.name,
      birthDate: datos.birthDate,
      idNumber: datos.idNumber,
      email: datos.email,
      cell: datos.cell,
      city: datos.city,
      registered_at: currentDateTime,
    });

    console.log("userInfoInsertResult:", userInfoInsertResult); // Verifica el resultado de la inserción

    // Respuesta de éxito
    res.status(201).json({
      status: "RegistroExitoso",
      message: "Usuario registrado correctamente.",
      user: datos.email,
    });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  } finally {
    await client.close(); // Asegúrate de cerrar la conexión
  }
};


//---------------Obtener Códigos por user_id---------------------
export const obtenerCodigos = async (req, res) => {
  const { user_id } = req.body;
  console.log("user_id recibido:", user_id);

  if (!user_id) {
    return res.status(400).json({
      status: "Error",
      message: "El user_id es requerido.",
    });
  }

  let clientConnected = false; // Control de conexión para cerrar solo si fue abierta
  try {
    await client.connect();
    clientConnected = true;

    const database = client.db("Parcial_2");
    const codigosCollection = database.collection("codigos");
    const intentosCollection = database.collection("intentos");

    // Buscar códigos en estado "canjeado" que coincidan con el user_id proporcionado
    const codigosCanjeados = await codigosCollection
      .find({ estado: "canjeado", user_id })
      .project({ codigo: 1, premio: 1, fecha_cambio_estado: 1, estado: 1 })
      .toArray();

    if (codigosCanjeados.length === 0) {
      return res.json({
        status: "SinCodigosCanjeados",
        message: "Este usuario no tiene códigos canjeados.",
      });
    }

    // Obtener los intentos del usuario relacionados a estos códigos
    const intentos = await intentosCollection
      .find({ user_id })
      .project({ codigo: 1, fecha_intento: 1 })
      .toArray();

    return res.json({
      status: "CodigosCanjeadosObtenidos",
      message: "Códigos canjeados obtenidos correctamente.",
      codigosCanjeados: codigosCanjeados || [],
      intentos: intentos || [],
    });
  } catch (error) {
    console.error("Error al obtener los códigos canjeados:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  } finally {
    if (clientConnected) await client.close(); // Cierra la conexión solo si fue abierta
  }
};

// Nueva función para obtener los códigos canjeados y la información del usuario
export const getCanjeados = async (_req, res) => {
  try {
    await client.connect();

    const database = client.db("Parcial_2");
    const codigosCollection = database.collection("codigos");
    const usersInfoCollection = database.collection("users_info");

    // Buscar códigos en estado "canjeado"
    const codigosCanjeados = await codigosCollection.find({ estado: "canjeado" }).toArray();

    // Para cada código canjeado, obtener la información adicional del usuario
    const results = await Promise.all(
      codigosCanjeados.map(async (codigo) => {
        // Convertir user_id de string a ObjectId
        const userInfo = await usersInfoCollection.findOne({ user_id: new ObjectId(codigo.user_id) });
        console.log("Datos del usuario:", userInfo); // Verificación en consola

        // Formatear el resultado para la respuesta
        return {
          fecha: codigo.fecha_cambio_estado,
          codigo: codigo.codigo,
          premio: codigo.premio,
          nombre: userInfo ? userInfo.name : null,
          cedula: userInfo ? userInfo.idNumber : null,
          telefono: userInfo ? userInfo.cell : null,
        };
      })
    );

    return res.status(200).json({ status: "CodigosCanjeados", winners: results });
  } catch (error) {
    console.error("Error al obtener códigos canjeados:", error);
    res.status(500).json({ status: "Error", message: "Error en el servidor." });
  } finally {
    await client.close();
  }
};
