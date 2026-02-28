class WeatherData {
  final double temperature;
  final String condition;
  final double feelsLike;
  final double humidity;
  final double windSpeed;
  final double uvIndex;
  final double floorTemperature;
  final List<HourlyForecast> hourly;

  WeatherData({
    required this.temperature,
    required this.condition,
    required this.feelsLike,
    required this.humidity,
    required this.windSpeed,
    required this.uvIndex,
    required this.floorTemperature,
    this.hourly = const [],
  });

  String get safetyRecommendation {
    if (floorTemperature >= 40) return "Stay indoors";
    if (floorTemperature >= 30) return "Use booties";
    return "Safe for paws";
  }
}

class HourlyForecast {
  final DateTime time;
  final double temperature;
  final String condition;

  HourlyForecast({
    required this.time,
    required this.temperature,
    required this.condition,
  });
}
