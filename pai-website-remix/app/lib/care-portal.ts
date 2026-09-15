import CryptoJS from "crypto-js";

export const CARE_PORTAL_TOKEN = "aVVpWTN3U3c4cEV0N291S0dNOHpTZz09OjpZc7HVn73COqg8IrvrkXF6";
export const CARE_PORTAL_BASE_URL = "https://partners.careinsurance.com/portals/pai/index.php";

const CARE_ENCRYPTION_KEY = CryptoJS.enc.Utf8.parse("z5yK1lw7XYt6YKdP7Pne2Jw3zRkMAziH");
const CARE_ENCRYPTION_IV = CryptoJS.enc.Utf8.parse("i0kbCAlFTlDXshYV");

export function encryptForCarePortal(value: string): string {
  const encrypted = CryptoJS.AES.encrypt(value, CARE_ENCRYPTION_KEY, { iv: CARE_ENCRYPTION_IV }).toString();
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encrypted));
}

export function buildCarePortalUrl(mobile: string, email: string): string {
  return `${CARE_PORTAL_BASE_URL}?token=${CARE_PORTAL_TOKEN}&tel_no=${encryptForCarePortal(mobile)}&email=${encryptForCarePortal(email)}`;
}
