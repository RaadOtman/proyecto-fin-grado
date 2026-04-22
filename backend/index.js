// Cargamos las variables del .env antes de importar nada más
require("dotenv").config();

const app  = require("./app");
const PORT = process.env.PORT || 4000;

// Arrancamos el servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en el puerto ${PORT}`);
});
