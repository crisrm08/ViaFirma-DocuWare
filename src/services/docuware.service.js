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
    const setCode = SetCode;
    const messageCode = MessageCode;
    
    const fields = {
        "Fields": [
            {
                "FieldName": "SETCODE",
                "Item": setCode
            },
            {
                "FieldName": "MESSAGECODE",
                "Item": messageCode
            },
           
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
