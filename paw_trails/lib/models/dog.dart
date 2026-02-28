import 'dart:convert';
import 'package:uuid/uuid.dart';

class Dog {
  final String id;
  final String name;
  final String breed;
  final double age;
  final double weight;
  final String? photoPath;
  final String notes;
  final List<String> favoriteLocations;

  Dog({
    String? id,
    required this.name,
    required this.breed,
    required this.age,
    required this.weight,
    this.photoPath,
    this.notes = '',
    this.favoriteLocations = const [],
  }) : id = id ?? const Uuid().v4();

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'breed': breed,
      'age': age,
      'weight': weight,
      'photoPath': photoPath,
      'notes': notes,
      'favoriteLocations': favoriteLocations,
    };
  }

  factory Dog.fromMap(Map<String, dynamic> map) {
    return Dog(
      id: map['id'],
      name: map['name'],
      breed: map['breed'],
      age: map['age']?.toDouble() ?? 0.0,
      weight: map['weight']?.toDouble() ?? 0.0,
      photoPath: map['photoPath'],
      notes: map['notes'] ?? '',
      favoriteLocations: List<String>.from(map['favoriteLocations'] ?? []),
    );
  }

  String toJson() => json.encode(toMap());

  factory Dog.fromJson(String source) => Dog.fromMap(json.decode(source));
}
