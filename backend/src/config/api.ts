export const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL no está configurada en .env");
}