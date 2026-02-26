import { createError } from "../middleware/errorHandler";

export interface GeocodingResult {
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  timezone: string;
  displayName: string;
}

/* ─── OpenCage ──────────────────────────────────────────────── */

interface OpenCageComponent {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  country?: string;
  country_code?: string;
}

interface OpenCageResult {
  formatted: string;
  geometry: { lat: number; lng: number };
  components: OpenCageComponent;
  annotations?: { timezone?: { name?: string } };
}

interface OpenCageResponse {
  results: OpenCageResult[];
  status?: { code?: number };
}

async function geocodeViaOpenCage(query: string): Promise<GeocodingResult[]> {
  const apiKey = process.env["OPENCAGE_API_KEY"];
  if (!apiKey) throw new Error("OPENCAGE_API_KEY não configurada.");

  const url = new URL("https://api.opencagedata.com/geocode/v1/json");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("limit", "8");
  url.searchParams.set("no_annotations", "0");
  url.searchParams.set("language", "pt");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`OpenCage HTTP ${res.status}`);

  const data = (await res.json()) as OpenCageResponse;

  return data.results.map((r) => {
    const c = r.components;
    return {
      city: c.city ?? c.town ?? c.village ?? c.county ?? r.formatted.split(",")[0] ?? "",
      country: c.country ?? "",
      countryCode: (c.country_code ?? "").toUpperCase(),
      lat: r.geometry.lat,
      lon: r.geometry.lng,
      timezone: r.annotations?.timezone?.name ?? "UTC",
      displayName: r.formatted,
    };
  });
}

/* ─── Nominatim (fallback) ──────────────────────────────────── */

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
}

async function geocodeViaNominatim(query: string): Promise<GeocodingResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "8");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "duGuru-AstrologyApp/1.0 (contact@duguru.app)",
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

  const data = (await res.json()) as NominatimResult[];

  return data.map((r) => {
    const a = r.address ?? {};
    return {
      city: a.city ?? a.town ?? a.village ?? a.county ?? r.display_name.split(",")[0] ?? "",
      country: a.country ?? "",
      countryCode: (a.country_code ?? "").toUpperCase(),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      timezone: "UTC", // Nominatim não retorna timezone — use frontend timezone detect
      displayName: r.display_name,
    };
  });
}

/* ─── Public API ─────────────────────────────────────────────── */

/**
 * geocodeCity — Busca cidades por nome com fallback.
 *
 * Tenta OpenCage primeiro (mais preciso + timezone).
 * Se falhar (sem chave, erro de rede, cota), usa Nominatim como fallback.
 */
export async function geocodeCity(query: string): Promise<GeocodingResult[]> {
  try {
    if (process.env["OPENCAGE_API_KEY"]) {
      return await geocodeViaOpenCage(query);
    }
  } catch (err) {
    console.warn("[geocodingService] OpenCage falhou, usando Nominatim:", err);
  }

  try {
    return await geocodeViaNominatim(query);
  } catch (err) {
    console.error("[geocodingService] Nominatim também falhou:", err);
    throw createError(502, "GEOCODING_UNAVAILABLE", "Serviço de geocodificação indisponível.");
  }
}
