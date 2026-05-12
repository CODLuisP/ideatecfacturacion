const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const ApisSunat = {
  getCompany: (ruc: string) => `${BASE_URL}/api/companies/${ruc}`,
  updateCompany: (ruc: string) => `${BASE_URL}/api/companies/${ruc}`,
  uploadCertificateBase64: `${BASE_URL}/api/companies/file/base64`,
  convertCertificate: `${BASE_URL}/api/companies/certificate`,
  checkConnection: "/api/auth/sunat",
};
