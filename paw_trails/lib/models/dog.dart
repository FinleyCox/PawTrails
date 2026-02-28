import 'dart:convert';
import 'package:uuid/uuid.dart';

class Dog {
  final String id;
  final String name;
  final String breed;
  final DateTime birthday;
  final double weight;
  final String? photoPath;
  final String notes;
  final List<String> favoriteLocations;

  Dog({
    String? id,
    required this.name,
    required this.breed,
    required this.birthday,
    required this.weight,
    this.photoPath,
    this.notes = '',
    this.favoriteLocations = const [],
  }) : id = id ?? const Uuid().v4();

  String get ageString {
    final now = DateTime.now();
    final difference = now.difference(birthday).inDays;
    final years = difference / 365.25;
    return '${years.toStringAsFixed(1)} years old';
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'breed': breed,
      'birthday': birthday.toIso8601String(),
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
      birthday: map['birthday'] != null
          ? DateTime.parse(map['birthday'])
          : DateTime.now().subtract(
              Duration(days: ((map['age'] ?? 0.0) * 365.25).toInt()),
            ),
      weight: map['weight']?.toDouble() ?? 0.0,
      photoPath: map['photoPath'],
      notes: map['notes'] ?? '',
      favoriteLocations: List<String>.from(map['favoriteLocations'] ?? []),
    );
  }

  String toJson() => json.encode(toMap());

  factory Dog.fromJson(String source) => Dog.fromMap(json.decode(source));
}
