require('dotenv/config')
const { createDataRecord, uploadDocument } = require("../services/docuware.service");

const vfUser = process.env.VIAFIRMA_API_USER;
const vfPassword = process.env.VIAFIRMA_API_PASSWORD;
const viaFirmaBaseURL = process.env.VIAFIRMA_API_BASE_URL;

const auth = Buffer.from(`${vfUser}:${vfPassword}`).toString('base64');

const recibirCallBackViaFirma = async (req, res) => {
    const apiKey = req.headers["x-api-key"];

    if (apiKey !== process.env.VIAFIRMA_CALLBACK_API_KEY) {
        console.log("No autorizado");
        console.log("ApiKey obtenido: ", apiKey);
        return res.status(401).json({error: "No autorizado"});
    }
    const viaFirmaCBResponse = req.body;
    
    const messageCode = viaFirmaCBResponse.links[0].messageCode;
    const setCode = viaFirmaCBResponse.code;
    
    if (viaFirmaCBResponse.status === "RESPONSED") {
        console.log("Set code obtenido: ", setCode);
        const response = await fetch(`${viaFirmaBaseURL}/documents/download/signed/${messageCode}`, {
                method: 'GET',
                headers: { Authorization: `Basic ${auth}` }
            }
        )
        //https://documents.viafirma.com/documents/api/v3/documents/download/signed/{{messageCode}}

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

            if (viaFirmaCBResponse.externalCode) {
                const dataRecordId = await createDataRecord(messageCode, viaFirmaCBResponse.externalCode);
                const uploadResult = await uploadDocument(dataRecordId, pdfBuffer, viaFirmaCBResponse.externalCode);
            }
            else {
                const dataRecordId = await createDataRecord(messageCode, setCode);
                const uploadResult = await uploadDocument(dataRecordId, pdfBuffer, setCode);
            }
           
            console.log("Documento firmado enviado a DocuWare.");
            console.log("Fecha y hora exacta de envío a DocuWare:", new Date().toLocaleString("sv-SE", { timeZone: "America/Santo_Domingo", hour12: false }));
        }
    }
    else {
        console.log(`SET aún no finalizado. Estado actual: ${viaFirmaCBResponse.status}`);
    }
    return res.status(200).json({ message: "Callback recibido correctamente", data: viaFirmaCBResponse });
}

module.exports = { recibirCallBackViaFirma };