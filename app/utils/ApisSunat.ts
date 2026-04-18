export const ApisSunat = {
  getCompany: (ruc: string) => `http://localhost:5004/api/companies/${ruc}`,
  updateCompany: (ruc: string) => `http://localhost:5004/api/companies/${ruc}`,
  uploadCertificateBase64: "http://localhost:5004/api/companies/file/base64",
  convertCertificate: "http://localhost:5004/api/companies/certificate",
  checkConnection: "/api/auth/sunat",
};
