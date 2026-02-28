import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/dog.dart';
import '../models/walk.dart';

class AppState extends ChangeNotifier {
  List<Dog> _dogs = [];
  List<Walk> _walks = [];
  bool _isLoading = true;
  bool _isMetric = true; // Metric by default

  List<Dog> get dogs => _dogs;
  List<Walk> get walks => _walks;
  bool get isLoading => _isLoading;
  bool get isMetric => _isMetric;

  AppState() {
    loadData();
  }

  Future<void> loadData() async {
    _isLoading = true;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();

    // Load Units
    _isMetric = prefs.getBool('isMetric') ?? true;

    // Load Dogs
    final dogsJson = prefs.getString('dogs');
    if (dogsJson != null) {
      final List<dynamic> decoded = json.decode(dogsJson);
      _dogs = decoded.map((item) => Dog.fromMap(item)).toList();
    }

    // Load Walks
    final walksJson = prefs.getString('walks');
    if (walksJson != null) {
      final List<dynamic> decoded = json.decode(walksJson);
      _walks = decoded.map((item) => Walk.fromMap(item)).toList();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> toggleUnits() async {
    _isMetric = !_isMetric;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isMetric', _isMetric);
    notifyListeners();
  }

  Future<void> clearAllData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    _dogs = [];
    _walks = [];
    _isMetric = true;
    notifyListeners();
  }

  Future<void> saveDogs() async {
    final prefs = await SharedPreferences.getInstance();
    final dogsJson = json.encode(_dogs.map((dog) => dog.toMap()).toList());
    await prefs.setString('dogs', dogsJson);
  }

  Future<void> saveWalks() async {
    final prefs = await SharedPreferences.getInstance();
    final walksJson = json.encode(_walks.map((walk) => walk.toMap()).toList());
    await prefs.setString('walks', walksJson);
  }

  // Dog actions
  void addDog(Dog dog) {
    _dogs.add(dog);
    saveDogs();
    notifyListeners();
  }

  void updateDog(Dog dog) {
    final index = _dogs.indexWhere((d) => d.id == dog.id);
    if (index != -1) {
      _dogs[index] = dog;
      saveDogs();
      notifyListeners();
    }
  }

  void deleteDog(String id) {
    _dogs.removeWhere((d) => d.id == id);
    saveDogs();
    notifyListeners();
  }

  // Walk actions
  void addWalk(Walk walk) {
    _walks.insert(0, walk); // Newest first
    saveWalks();
    notifyListeners();
  }

  void deleteWalk(String id) {
    _walks.removeWhere((w) => w.id == id);
    saveWalks();
    notifyListeners();
  }
}
