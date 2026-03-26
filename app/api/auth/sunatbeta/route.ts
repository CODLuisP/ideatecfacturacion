import { NextResponse } from "next/server";

const BETA_URL = "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem/billService";

const SOAP_PRUEBA = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ser="http://service.sunat.gob.pe/"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>20000000001MODDATOS</wsse:Username>
        <wsse:Password>moddatos</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>20000000001-01-F001-00000001.zip</fileName>
      <contentFile>UEsDBAoAAAAAAA==</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;

export async function GET() {
  const start = Date.now();

  try {
    const res = await fetch(BETA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "sendBill",
      },
      body: SOAP_PRUEBA,
      signal: AbortSignal.timeout(7000),
    });

    const sunatMs = Date.now() - start;

    return NextResponse.json({
      alive: true,
      sunatMs,
      status: res.status,
    });

  } catch (error) {
    return NextResponse.json({
      alive: false,
      sunatMs: 0,
      error: "timeout o red",
    });
  }
}