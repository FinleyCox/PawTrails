import 'dart:convert';
import 'package:latlong2/latlong.dart';
import 'package:uuid/uuid.dart';

enum WalkType { casual, exercise, training, potty }

class Walk {
  final String id;
  final List<String> dogIds;
  final String? destination;
  final List<LatLng> route;
  final DateTime startTime;
  final DateTime? endTime;
  final double distance; // in kilometers
  final WalkType type;
  final double? avgSpeed;
  final double? calories;
  final String? weatherCondition;
  final double? temperature;

  Walk({
    String? id,
    required this.dogIds,
    this.destination,
    this.route = const [],
    required this.startTime,
    this.endTime,
    this.distance = 0.0,
    this.type = WalkType.casual,
    this.avgSpeed,
    this.calories,
    this.weatherCondition,
    this.temperature,
  }) : id = id ?? const Uuid().v4();

  Duration get duration => endTime != null
      ? endTime!.difference(startTime)
      : DateTime.now().difference(startTime);

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'dogIds': dogIds,
      'destination': destination,
      'route': route
          .map((e) => {'lat': e.latitude, 'lng': e.longitude})
          .toList(),
      'startTime': startTime.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'distance': distance,
      'type': type.index,
      'avgSpeed': avgSpeed,
      'calories': calories,
      'weatherCondition': weatherCondition,
      'temperature': temperature,
    };
  }

  factory Walk.fromMap(Map<String, dynamic> map) {
    return Walk(
      id: map['id'],
      dogIds: List<String>.from(map['dogIds']),
      destination: map['destination'],
      route:
          (map['route'] as List?)
              ?.map((e) => LatLng(e['lat'], e['lng']))
              .toList() ??
          [],
      startTime: DateTime.parse(map['startTime']),
      endTime: map['endTime'] != null ? DateTime.parse(map['endTime']) : null,
      distance: map['distance']?.toDouble() ?? 0.0,
      type: WalkType.values[map['type'] ?? 0],
      avgSpeed: map['avgSpeed']?.toDouble(),
      calories: map['calories']?.toDouble(),
      weatherCondition: map['weatherCondition'],
      temperature: map['temperature']?.toDouble(),
    );
  }

  String toJson() => json.encode(toMap());

  factory Walk.fromJson(String source) => Walk.fromMap(json.decode(source));
}
