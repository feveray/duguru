/**
 * Frontend stub — tipos do serviço de geocodificação do backend.
 * A comunicação real é feita via api.ts → GET /api/geocoding/search.
 */
export interface GeocodingResult {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  displayName: string;
}
