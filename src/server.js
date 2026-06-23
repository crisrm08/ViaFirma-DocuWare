require("dotenv").config();

const express = require("express");
const cors = require("cors");
const viafirmaRoutes = require("./routes/viafirma.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/viafirma", viafirmaRoutes);

app.get("/health", (req, res) => {
    res.json({ message: "API Via Firma funcionando "});
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Servidor API ViaFirma corriendo en el puerto ${PORT}`);
})
