require('dotenv/config')
const { createDataRecord, uploadDocument } = require("../services/docuware.service");

const vfUser = process.env.VIAFIRMA_API_USER;
const vfPassword = process.env.VIAFIRMA_API_PASSWORD;

const auth = Buffer.from(`${vfUser}:${vfPassword}`).toString('base64');

const recibirCallBackViaFirma = async (req, res) => {
    const viaFirmaCBResponse = req.body;
    const messageCode = viaFirmaCBResponse.links[0].messageCode;
    const setCode = viaFirmaCBResponse.code;
    
    if (viaFirmaCBResponse.status === "RESPONSED") {
        console.log("Message code obtenido: ", messageCode);
        console.log("Set code obtenido: ", setCode);
        const response = await fetch(`https://sandbox.viafirma.com/documents/api/v3/documents/download/signed/${messageCode}`, {
                method: 'GET',
                headers: { Authorization: `Basic ${auth}` }
            }
        )

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error al descargar el documento firmado: ${response.status} - ${errorText}`);
            return res.status(response.status).json({ error: `Error al descargar el documento firmado: ${errorText}` });
        }
        else {
            const downloadData = await response.json();
            console.log("Download link obtenido");
            const pdfResponse = await fetch(downloadData.link, { method: 'GET' });
            const arrayBuffer = await pdfResponse.arrayBuffer();
            const pdfBuffer = Buffer.from(arrayBuffer);

            const dataRecordId = await createDataRecord(messageCode, setCode);
            const uploadResult = await uploadDocument(dataRecordId, pdfBuffer);
            console.log("Documento firmado enviado a DocuWare.");
            console.log("Fecha y hora exacta de envío a DocuWare:", new Date().toLocaleString("sv-SE", { timeZone: "America/Santo_Domingo", hour12: false }));
        }
    }
    return res.status(200).json({ message: "Callback recibido correctamente", data: viaFirmaCBResponse });
}

module.exports = { recibirCallBackViaFirma };