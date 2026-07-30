require("dotenv").config();
const fileCabinetId = process.env.DOCUWARE_FILE_CABINET_ID;

async function fetchDocuWareToken() {
  const url = process.env.DOCUWARE_TOKEN_URL;

  const body = new URLSearchParams({
    grant_type: process.env.DOCUWARE_GRANT_TYPE,
    scope: process.env.DOCUWARE_SCOPE,
    client_id: process.env.DOCUWARE_CLIENT_ID,
    username: process.env.DOCUWARE_USERNAME,
    password: process.env.DOCUWARE_PASSWORD,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}, error text: ${await response.text()}  `);
  }

  const data = await response.json();
  return data.access_token;
}

async function createDataRecord(MessageCode, SetCode) {
    const docuwareToken = await fetchDocuWareToken();
    const asuntoCorreo = "Documents Cloud: proceso " + SetCode + " Finalizado";
    const nombreArchivoAdjunto = SetCode + ".pdf";
    const tipoDocumento = "Contrato";
    const fechaDocumento = new Date().toISOString();
    const Workflow_WF= "CTR - Vincular Contrato Viafirma a Expediente";
    const Actividad_WF = "Inicio";
    const Estado_WF = "Pendiente";
    const estadoDocumento = "Contrato Firmado Viafirma";
    const direccionCorreo = "notifications@viafirma.net";
    const viaFirmaRefProceso = SetCode;
    
    const fields = {
        "Fields": [
            {
                "FieldName": "VIAFIRMA_ESTADO_DEL_PROCESO",
                "Item": direccionCorreo
            },
            {
                "FieldName": "NOMBRE_ARCHIVO",
                "Item": nombreArchivoAdjunto
            },
            {
                "FieldName": "FECHA_DOCUMENTO",
                "Item": fechaDocumento
            },
            {
                "FieldName": "TIPO_DE_DOCUMENTO",
                "Item": tipoDocumento
            },
            {
                "FieldName": "WORKFLOW_WF",
                "Item": Workflow_WF
            },
            {
                "FieldName": "ACTIVIDAD_WF",
                "Item": Actividad_WF
            },
            {
                "FieldName": "ESTADO_WF",
                "Item": Estado_WF
            },
            {
                "FieldName": "ESTADO_DEL_DOCUMENTO",
                "Item": estadoDocumento
            },
            {
                "FieldName": "VIAFIRMA_REF_DEL_PROCESO",
                "Item": asuntoCorreo
            }
        ]
    }

    const dataRecordResponse = await fetch(`${process.env.DOCUWARE_DOMAIN}/DocuWare/Platform/FileCabinets/${fileCabinetId}/Documents`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${docuwareToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(fields),
        }   
    );

    if (!dataRecordResponse.ok) {
        const errorText = await dataRecordResponse.text();
        throw new Error(`Error creating data record: ${dataRecordResponse.status} - ${errorText}`);
    }
    
    const responseText = await dataRecordResponse.text();
    const responseData = JSON.parse(responseText);
    console.log("DataRecord Id devuelto: ",responseData.Id);
    
    return responseData.Id;
}

async function uploadDocument(dataRecordId, buffer, SetCode) {
    const docuwareToken = await fetchDocuWareToken();
    console.log("DataRecordId: ", dataRecordId);

    const uploadDocResponse = await fetch(`${process.env.DOCUWARE_DOMAIN}/DocuWare/Platform/FileCabinets/${fileCabinetId}/Sections?DocId=${dataRecordId}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${docuwareToken}`,
                Accept: "application/json",
                "Content-Type": "application/pdf",
                "Content-Disposition": `file; filename="${SetCode}.pdf"`,
                "X-File-ModifiedDate": new Date().toISOString()
            },
            body: buffer
        }
    );

    if (!uploadDocResponse.ok) {
        const errorText = await uploadDocResponse.text();
        throw new Error(`Error uploading document: ${uploadDocResponse.status} - ${errorText}`);
    }

    const responseText = await uploadDocResponse.text();

    return responseText ? JSON.parse(responseText) : null;
}

module.exports = {createDataRecord, uploadDocument};
