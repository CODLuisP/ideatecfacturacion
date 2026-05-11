export const ApisSunat = {
  getCompany: (ruc: string) => `https://factunetapi.ideatec.com.pe:8443/api/companies/${ruc}`,
  updateCompany: (ruc: string) => `https://factunetapi.ideatec.com.pe:8443/api/companies/${ruc}`,
  uploadCertificateBase64: "https://factunetapi.ideatec.com.pe:8443/api/companies/file/base64",
  convertCertificate: "https://factunetapi.ideatec.com.pe:8443/api/companies/certificate",
  checkConnection: "/api/auth/sunat",
};
