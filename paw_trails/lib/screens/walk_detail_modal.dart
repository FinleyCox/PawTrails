import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/walk.dart';
import '../providers/app_state.dart';
import '../models/dog.dart';

class WalkDetailModal extends StatelessWidget {
  final Walk walk;

  const WalkDetailModal({super.key, required this.walk});

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    // Convert units
    double displayDistance = appState.isMetric
        ? walk.distance
        : walk.distance * 0.621371;
    String distanceUnit = appState.isMetric ? 'km' : 'mi';

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          // Header / Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            DateFormat('EEEE, MMM d').format(walk.startTime),
                            style: Theme.of(
                              context,
                            ).textTheme.displayLarge?.copyWith(fontSize: 24),
                          ),
                          Text(
                            '${DateFormat('jm').format(walk.startTime)} - ${DateFormat('jm').format(walk.endTime ?? DateTime.now())}',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.grey[100],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Map Preview
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: walk.route.isEmpty
                        ? const Center(child: Text('No GPS data for this walk'))
                        : FlutterMap(
                            options: MapOptions(
                              initialCenter: walk.route[walk.route.length ~/ 2],
                              initialZoom: 15,
                            ),
                            children: [
                              TileLayer(
                                urlTemplate:
                                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              ),
                              PolylineLayer(
                                polylines: [
                                  Polyline(
                                    points: walk.route,
                                    color: Theme.of(context).primaryColor,
                                    strokeWidth: 4,
                                  ),
                                ],
                              ),
                            ],
                          ),
                  ),

                  const SizedBox(height: 24),

                  // Stats Grid
                  Row(
                    children: [
                      _buildStatCard(
                        context,
                        displayDistance.toStringAsFixed(2),
                        distanceUnit,
                        Icons.straighten,
                      ),
                      const SizedBox(width: 16),
                      _buildStatCard(
                        context,
                        walk.duration.inMinutes.toString(),
                        'min',
                        Icons.timer_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildStatCard(
                        context,
                        walk.type.name.toUpperCase(),
                        'Walk Type',
                        Icons.directions_walk,
                      ),
                      const SizedBox(width: 16),
                      _buildStatCard(
                        context,
                        '${walk.dogIds.length}',
                        'Dogs',
                        Icons.pets,
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  Text(
                    'Dogs included',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  ...walk.dogIds.map((dogId) {
                    final dog = appState.dogs.firstWhere(
                      (d) => d.id == dogId,
                      orElse: () => Dog(
                        name: 'Unknown',
                        breed: '',
                        birthday: DateTime.now(),
                        weight: 0,
                      ),
                    );
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: Theme.of(
                          context,
                        ).primaryColor.withValues(alpha: 0.1),
                        child: const Icon(Icons.pets, size: 20),
                      ),
                      title: Text(
                        dog.name,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Text(dog.breed),
                    );
                  }),

                  if (walk.destination != null &&
                      walk.destination!.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text(
                      'Destination',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(walk.destination!),
                  ],

                  const SizedBox(height: 48),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String value,
    String label,
    IconData icon,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(
            context,
          ).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: Theme.of(context).primaryColor),
            const SizedBox(height: 12),
            Text(
              value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
