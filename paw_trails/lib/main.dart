import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'providers/app_state.dart';
import 'models/dog.dart';
import 'models/walk.dart';
import 'models/weather.dart';
import 'screens/start_walk_modal.dart';
import 'services/weather_service.dart';
import 'services/location_service.dart';
import 'screens/settings_screen.dart';
import 'screens/walk_detail_modal.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (context) => AppState()..loadData(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PawTrails',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFFF59E0B),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF59E0B),
          primary: const Color(0xFFF59E0B),
          secondary: const Color(0xFFD97706),
          surface: const Color(0xFFFFFBEB),
          surfaceContainerHighest: const Color(0xFFFEF3C7),
        ),
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Inter',
        textTheme: const TextTheme(
          displayLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Color(0xFF451A03),
          ),
          titleLarge: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Color(0xFF451A03),
          ),
        ),
      ),
      home: const MainScreen(),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const DogsScreen(),
    const WalksScreen(),
    const SettingsScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.pets), label: 'Dogs'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'Walks'),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

class ScreenContainer extends StatelessWidget {
  final Widget child;
  final String title;

  const ScreenContainer({super.key, required this.child, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title, style: Theme.of(context).textTheme.displayLarge),
        backgroundColor: Theme.of(context).colorScheme.surface,
      ),
      body: child,
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final WeatherService _weatherService = WeatherService();
  final LocationService _locationService = LocationService();
  WeatherData? _weather;
  bool _isFetchingWeather = false;

  @override
  void initState() {
    super.initState();
    _loadWeather();
  }

  Future<void> _loadWeather() async {
    setState(() => _isFetchingWeather = true);
    final loc = await _locationService.getCurrentLocation();
    if (loc != null) {
      final weather = await _weatherService.fetchWeather(
        loc.latitude,
        loc.longitude,
      );
      if (mounted) {
        setState(() {
          _weather = weather;
          _isFetchingWeather = false;
        });
      }
    } else {
      if (mounted) setState(() => _isFetchingWeather = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final today = DateTime.now();
    final todayWalks = appState.walks
        .where(
          (w) =>
              w.startTime.year == today.year &&
              w.startTime.month == today.month &&
              w.startTime.day == today.day,
        )
        .toList();

    double totalDistance = todayWalks.fold(0, (sum, w) => sum + w.distance);
    double displayDistance = appState.isMetric
        ? totalDistance
        : totalDistance * 0.621371;
    String distanceUnit = appState.isMetric ? 'km' : 'mi';

    int totalMinutes = todayWalks.fold(
      0,
      (sum, w) => sum + w.duration.inMinutes,
    );

    return ScreenContainer(
      title: 'PawTrails',
      child: appState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await appState.loadData();
                await _loadWeather();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_isFetchingWeather && _weather == null)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: CircularProgressIndicator(),
                          ),
                        ),
                      if (_weather != null) ...[
                        _buildWeatherCard(_weather!, appState),
                        const SizedBox(height: 16),
                      ],

                      // Today's Summary Card
                      Card(
                        elevation: 0,
                        color: Theme.of(
                          context,
                        ).colorScheme.surfaceContainerHighest,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Today\'s Summary',
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleLarge,
                                  ),
                                  const Icon(
                                    Icons.wb_sunny,
                                    color: Colors.amber,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceAround,
                                children: [
                                  _buildStatItem(
                                    todayWalks.length.toString(),
                                    'Walks',
                                  ),
                                  _buildStatItem(
                                    displayDistance.toStringAsFixed(1),
                                    distanceUnit,
                                  ),
                                  _buildStatItem(
                                    '${totalMinutes ~/ 60}:${(totalMinutes % 60).toString().padLeft(2, '0')}',
                                    'Time',
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Active Dogs Section
                      Text(
                        'Select a dog',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 100,
                        child: appState.dogs.isEmpty
                            ? Center(
                                child: Text(
                                  'No dogs added yet',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              )
                            : ListView.builder(
                                scrollDirection: Axis.horizontal,
                                itemCount: appState.dogs.length,
                                itemBuilder: (context, index) {
                                  final dog = appState.dogs[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(right: 16.0),
                                    child: Column(
                                      children: [
                                        CircleAvatar(
                                          radius: 35,
                                          backgroundColor: Theme.of(
                                            context,
                                          ).primaryColor.withValues(alpha: 0.2),
                                          backgroundImage: dog.photoPath != null
                                              ? FileImage(File(dog.photoPath!))
                                              : null,
                                          child: dog.photoPath == null
                                              ? Icon(
                                                  Icons.pets,
                                                  color: Theme.of(
                                                    context,
                                                  ).primaryColor,
                                                  size: 30,
                                                )
                                              : null,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          dog.name,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                      ),
                      const SizedBox(height: 24),

                      // Quick Start Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: appState.dogs.isEmpty
                              ? null
                              : () {
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (context) =>
                                        const StartWalkModal(),
                                  );
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Theme.of(context).primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Start Walk',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Recent Walks Preview
                      Text(
                        'Recent Walks',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      appState.walks.isEmpty
                          ? Center(
                              child: Text(
                                'No walks recorded yet',
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: appState.walks.length > 3
                                  ? 3
                                  : appState.walks.length,
                              itemBuilder: (context, index) {
                                final walk = appState.walks[index];
                                return Card(
                                  elevation: 0,
                                  color: Colors.white,
                                  margin: const EdgeInsets.only(bottom: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    leading: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Theme.of(
                                          context,
                                        ).primaryColor.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        Icons.directions_walk,
                                        color: Theme.of(context).primaryColor,
                                      ),
                                    ),
                                    title: Text(
                                      'Walk with ${walk.dogIds.length} dog${walk.dogIds.length > 1 ? 's' : ''}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    subtitle: Text(
                                      '${(appState.isMetric ? walk.distance : walk.distance * 0.621371).toStringAsFixed(1)} ${appState.isMetric ? 'km' : 'mi'}, ${walk.duration.inMinutes} min',
                                    ),
                                    trailing: Text(
                                      DateFormat(
                                        'MMM d',
                                      ).format(walk.startTime),
                                      style: TextStyle(color: Colors.grey[600]),
                                    ),
                                  ),
                                );
                              },
                            ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildWeatherCard(WeatherData weather, AppState appState) {
    final isHot = weather.floorTemperature >= 30;
    return Card(
      elevation: 0,
      color: isHot ? const Color(0xFFFEE2E2) : const Color(0xFFECFDF5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isHot ? Colors.red[100] : Colors.green[100],
                shape: BoxShape.circle,
              ),
              child: Icon(
                isHot ? Icons.warning_amber : Icons.check_circle_outline,
                color: isHot ? Colors.red[700] : Colors.green[700],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    weather.safetyRecommendation,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: isHot ? Colors.red[900] : Colors.green[900],
                    ),
                  ),
                  Text(
                    'Pavement: ${(_convertTemp(weather.floorTemperature, appState.isMetric)).toStringAsFixed(1)}°${appState.isMetric ? 'C' : 'F'} / Air: ${(_convertTemp(weather.temperature, appState.isMetric)).toStringAsFixed(1)}°${appState.isMetric ? 'C' : 'F'}',
                    style: TextStyle(
                      color: isHot ? Colors.red[700] : Colors.green[700],
                    ),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                Icon(
                  weather.condition.contains('Clear')
                      ? Icons.wb_sunny
                      : Icons.wb_cloudy,
                  color: Theme.of(context).primaryColor,
                ),
                Text(weather.condition, style: const TextStyle(fontSize: 10)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  double _convertTemp(double celsius, bool isMetric) {
    if (isMetric) return celsius;
    return (celsius * 9 / 5) + 32;
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF78350F),
          ),
        ),
        Text(label, style: const TextStyle(color: Color(0xFF92400E))),
      ],
    );
  }
}

class DogsScreen extends StatelessWidget {
  const DogsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Dogs', style: Theme.of(context).textTheme.displayLarge),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: appState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : appState.dogs.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.pets, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'No dogs yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text('Tap the + button to add your first dog'),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: appState.dogs.length,
              itemBuilder: (context, index) {
                final dog = appState.dogs[index];
                return Card(
                  elevation: 0,
                  color: Colors.white,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: InkWell(
                    onTap: () {
                      // View/Edit profile to be implemented
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: Theme.of(
                              context,
                            ).primaryColor.withValues(alpha: 0.1),
                            backgroundImage: dog.photoPath != null
                                ? FileImage(File(dog.photoPath!))
                                : null,
                            child: dog.photoPath == null
                                ? Icon(
                                    Icons.pets,
                                    color: Theme.of(context).primaryColor,
                                    size: 40,
                                  )
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  dog.name,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  '${dog.breed} • ${dog.age} years old',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Theme.of(
                                      context,
                                    ).primaryColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${appState.walks.where((w) => w.dogIds.contains(dog.id)).length} walks this month',
                                    style: TextStyle(
                                      color: Theme.of(context).primaryColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              Icons.delete_outline,
                              color: Colors.grey,
                            ),
                            onPressed: () {
                              _showDeleteConfirmation(context, appState, dog);
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          _showAddDogModal(context);
        },
        backgroundColor: Theme.of(context).primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showDeleteConfirmation(
    BuildContext context,
    AppState appState,
    Dog dog,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Dog?'),
        content: Text('Are you sure you want to remove ${dog.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              appState.deleteDog(dog.id);
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _showAddDogModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AddDogModal(),
    );
  }
}

class AddDogModal extends StatefulWidget {
  const AddDogModal({super.key});

  @override
  State<AddDogModal> createState() => _AddDogModalState();
}

class _AddDogModalState extends State<AddDogModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _breedController = TextEditingController();
  final _ageController = TextEditingController();
  final _weightController = TextEditingController();
  String? _photoPath;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _photoPath = image.path;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24,
        right: 24,
        top: 32,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Add New Dog',
                style: Theme.of(context).textTheme.displayLarge,
              ),
              const SizedBox(height: 24),
              Center(
                child: GestureDetector(
                  onTap: _pickImage,
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor: Theme.of(
                      context,
                    ).primaryColor.withValues(alpha: 0.1),
                    backgroundImage: _photoPath != null
                        ? FileImage(File(_photoPath!))
                        : null,
                    child: _photoPath == null
                        ? Icon(
                            Icons.add_a_photo,
                            size: 40,
                            color: Theme.of(context).primaryColor,
                          )
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Name
              TextFormField(
                controller: _nameController,
                decoration: _inputDecoration('Dog Name', Icons.pets),
                validator: (v) =>
                    v?.isEmpty ?? true ? 'Please enter a name' : null,
              ),
              const SizedBox(height: 16),
              // Breed
              TextFormField(
                controller: _breedController,
                decoration: _inputDecoration('Breed', Icons.category),
                validator: (v) =>
                    v?.isEmpty ?? true ? 'Please enter a breed' : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: _inputDecoration('Age', Icons.cake),
                      validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _weightController,
                      keyboardType: TextInputType.number,
                      decoration: _inputDecoration(
                        'Weight (kg)',
                        Icons.monitor_weight,
                      ),
                      validator: (v) => v?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState?.validate() ?? false) {
                      final dog = Dog(
                        name: _nameController.text,
                        breed: _breedController.text,
                        age: double.tryParse(_ageController.text) ?? 0,
                        weight: double.tryParse(_weightController.text) ?? 0,
                        photoPath: _photoPath,
                      );
                      Provider.of<AppState>(context, listen: false).addDog(dog);
                      Navigator.pop(context);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Save Dog',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Theme.of(context).primaryColor),
      filled: true,
      fillColor: const Color(0xFFFFFBF0),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Theme.of(context).primaryColor, width: 2),
      ),
    );
  }
}

class WalksScreen extends StatelessWidget {
  const WalksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Walks', style: Theme.of(context).textTheme.displayLarge),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: appState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : appState.walks.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.directions_walk,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No walks yet',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text('Go for a walk to see your history here!'),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: appState.walks.length,
              itemBuilder: (context, index) {
                final walk = appState.walks[index];
                return Card(
                  elevation: 0,
                  color: Colors.white,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: InkWell(
                    onTap: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (context) => WalkDetailModal(walk: walk),
                      );
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: Theme.of(
                                        context,
                                      ).primaryColor.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.directions_walk,
                                      color: Theme.of(context).primaryColor,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        DateFormat(
                                          'EEEE, MMM d',
                                        ).format(walk.startTime),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      Text(
                                        DateFormat('jm').format(walk.startTime),
                                        style: TextStyle(
                                          color: Colors.grey[600],
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                              IconButton(
                                icon: const Icon(
                                  Icons.delete_outline,
                                  color: Colors.grey,
                                  size: 20,
                                ),
                                onPressed: () {
                                  _showDeleteConfirmation(
                                    context,
                                    appState,
                                    walk,
                                  );
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildWalkStat(
                                context,
                                '${walk.distance.toStringAsFixed(1)} km',
                                'Distance',
                              ),
                              _buildWalkStat(
                                context,
                                '${walk.duration.inMinutes} min',
                                'Duration',
                              ),
                              _buildWalkStat(
                                context,
                                walk.type.name.toUpperCase(),
                                'Type',
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            children: walk.dogIds.map((dogId) {
                              final dog = appState.dogs.firstWhere(
                                (d) => d.id == dogId,
                                orElse: () => Dog(
                                  name: 'Unknown',
                                  breed: '',
                                  age: 0,
                                  weight: 0,
                                ),
                              );
                              return Chip(
                                label: Text(
                                  dog.name,
                                  style: const TextStyle(fontSize: 12),
                                ),
                                avatar: const Icon(Icons.pets, size: 14),
                                backgroundColor: Theme.of(
                                  context,
                                ).primaryColor.withValues(alpha: 0.05),
                                side: BorderSide.none,
                                padding: EdgeInsets.zero,
                                materialTapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildWalkStat(BuildContext context, String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }

  void _showDeleteConfirmation(
    BuildContext context,
    AppState appState,
    Walk walk,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Walk?'),
        content: const Text(
          'Are you sure you want to remove this walk from history?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              appState.deleteWalk(walk.id);
              Navigator.pop(context);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
