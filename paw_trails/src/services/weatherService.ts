import { WeatherSnapshot } from "../models/Walk";

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? "";

export async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  if (!API_KEY) throw new Error("No API key");
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather ${res.status}`);
  const data = await res.json();
  const temp: number = data.main?.temp ?? 20;
  const condition: string = data.weather?.[0]?.main ?? "Unknown";
  return { temp, condition };
}
