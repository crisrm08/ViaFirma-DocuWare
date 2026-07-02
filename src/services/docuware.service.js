async function fetchDocuWareToken() {
  const url =
    "https://login-us.docuware.cloud/da373611-6d3d-43d0-9677-370481859974/connect/token";

  const body = new URLSearchParams({
    grant_type: "password",
    scope: "docuware.platform",
    client_id: "docuware.platform.net.client",
    username: "ca.rodriguez@grupocsi.com.do",
    password: "Abcd1234abcd1234!",
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
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function appendDocument(docId, fileCabId, buffer) {
    const docuwareToken = await fetchDocuWareToken();
    
    const appendDocResponse = await fetch(
        `https://grupocsidemo.docuware.cloud/DocuWare/Platform/FileCabinets/${fileCabId}/Sections?DocId=${docId}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${docuwareToken}`,
                Accept: "application/json",
                "Content-Type": "application/pdf",
                "Content-Disposition": `file; filename="${docId}.pdf"`,
                "X-File-ModifiedDate": new Date().toISOString()
            },
            body: buffer
        }
    );

    if (!appendDocResponse.ok) {
        const errorText = await appendDocResponse.text();
        throw new Error(`Error appending document: ${appendDocResponse.status} - ${errorText}`);
    }

    const responseText = await appendDocResponse.text();

    return responseText ? JSON.parse(responseText) : null;
}

module.exports = {appendDocument};