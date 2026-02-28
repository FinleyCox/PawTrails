import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/weather.dart';

class WeatherService {
  static const String _baseUrl = 'https://api.open-meteo.com/v1/forecast';

  Future<WeatherData?> fetchWeather(double lat, double lon) async {
    try {
      final url = Uri.parse(
        '$_baseUrl?latitude=$lat&longitude=$lon&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=uv_index_max&timezone=auto',
      );

      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final current = data['current'];

        // Mock floor temperature as typical +5 to +15 degrees higher than air if sunny
        final airTemp = current['temperature_2m'].toDouble();
        final weatherCode = current['weather_code'];
        double floorTemp = airTemp + (weatherCode <= 2 ? 10.0 : 2.0);

        return WeatherData(
          temperature: airTemp,
          condition: _mapWeatherCode(weatherCode),
          feelsLike: current['apparent_temperature'].toDouble(),
          humidity: current['relative_humidity_2m'].toDouble(),
          windSpeed: current['wind_speed_10m'].toDouble(),
          uvIndex: data['daily']['uv_index_max'][0].toDouble(),
          floorTemperature: floorTemp,
          hourly: (data['hourly']['time'] as List).take(6).map((time) {
            final index = (data['hourly']['time'] as List).indexOf(time);
            return HourlyForecast(
              time: DateTime.parse(time),
              temperature: data['hourly']['temperature_2m'][index].toDouble(),
              condition: _mapWeatherCode(data['hourly']['weather_code'][index]),
            );
          }).toList(),
        );
      }
    } catch (e) {
      // Handle error
    }
    return null;
  }

  String _mapWeatherCode(int code) {
    if (code == 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 55) return 'Drizzle';
    if (code <= 65) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Rain showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  }
}
