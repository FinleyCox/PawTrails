import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../models/walk.dart';
import '../providers/app_state.dart';
import '../services/location_service.dart';

class ActiveWalkScreen extends StatefulWidget {
  final List<String> selectedDogIds;
  final WalkType walkType;
  final String? destination;

  const ActiveWalkScreen({
    super.key,
    required this.selectedDogIds,
    this.walkType = WalkType.casual,
    this.destination,
  });

  @override
  State<ActiveWalkScreen> createState() => _ActiveWalkScreenState();
}

class _ActiveWalkScreenState extends State<ActiveWalkScreen> {
  final LocationService _locationService = LocationService();
  final List<LatLng> _route = [];
  final MapController _mapController = MapController();

  DateTime _startTime = DateTime.now();
  Timer? _timer;
  Duration _elapsedTime = Duration.zero;
  double _distance = 0.0;
  bool _isPaused = false;
  StreamSubscription<LatLng>? _locationSubscription;
  LatLng? _currentLocation;

  @override
  void initState() {
    super.initState();
    _startWalk();
  }

  void _startWalk() async {
    final hasPermission = await _locationService.requestPermission();
    if (!hasPermission) {
      if (mounted) Navigator.pop(context);
      return;
    }

    _startTime = DateTime.now();
    _startTimer();

    _locationSubscription = _locationService.getLocationStream().listen((
      location,
    ) {
      if (_isPaused) return;

      setState(() {
        if (_route.isNotEmpty) {
          final distance = const Distance().as(
            LengthUnit.Meter,
            _route.last,
            location,
          );
          _distance += distance / 1000.0;
        }
        _route.add(location);
        _currentLocation = location;
      });

      _mapController.move(location, _mapController.camera.zoom);
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isPaused) {
        setState(() {
          _elapsedTime = DateTime.now().difference(_startTime);
        });
      }
    });
  }

  void _togglePause() {
    setState(() {
      _isPaused = !_isPaused;
    });
  }

  void _endWalk() {
    _timer?.cancel();
    _locationSubscription?.cancel();

    final walk = Walk(
      dogIds: widget.selectedDogIds,
      destination: widget.destination,
      route: _route,
      startTime: _startTime,
      endTime: DateTime.now(),
      distance: _distance,
      type: widget.walkType,
    );

    Provider.of<AppState>(context, listen: false).addWalk(walk);
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _locationSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map View
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _currentLocation ?? const LatLng(0, 0),
              initialZoom: 16,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.paw_trails',
              ),
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: _route,
                    color: Theme.of(context).primaryColor,
                    strokeWidth: 5,
                  ),
                ],
              ),
              if (_currentLocation != null)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: _currentLocation!,
                      width: 40,
                      height: 40,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).primaryColor,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 3),
                        ),
                        child: const Icon(
                          Icons.navigation,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
                ),
            ],
          ),

          // Top Info Bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            right: 16,
            child: Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Theme.of(
                        context,
                      ).primaryColor.withValues(alpha: 0.1),
                      child: Icon(
                        Icons.pets,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Walking...',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    _buildSmallActionButton(
                      icon: Icons.sos,
                      color: Colors.red,
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Stats Overlay
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMainStat(_formatDuration(_elapsedTime), 'Time'),
                      _buildMainStat(_distance.toStringAsFixed(2), 'km'),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildCircleButton(
                        icon: _isPaused ? Icons.play_arrow : Icons.pause,
                        color: Colors.amber,
                        onPressed: _togglePause,
                      ),
                      _buildCircleButton(
                        icon: Icons.stop,
                        color: Colors.red,
                        onPressed: _endWalk,
                        isLarge: true,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMainStat(String value, String label) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
        ),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 16)),
      ],
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
    bool isLarge = false,
  }) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        width: isLarge ? 80 : 64,
        height: isLarge ? 80 : 64,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: isLarge ? 40 : 32),
      ),
    );
  }

  Widget _buildSmallActionButton({
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return IconButton(
      icon: Icon(icon, color: color),
      onPressed: onPressed,
      constraints: const BoxConstraints(),
      padding: const EdgeInsets.all(8),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String minutes = twoDigits(duration.inMinutes.remainder(60));
    String seconds = twoDigits(duration.inSeconds.remainder(60));
    return "$minutes:$seconds";
  }
}
