import 'package:location/location.dart';
import 'package:latlong2/latlong.dart';

class LocationService {
  final Location _location = Location();

  Future<bool> requestPermission() async {
    bool serviceEnabled = await _location.serviceEnabled();
    if (!serviceEnabled) {
      serviceEnabled = await _location.requestService();
      if (!serviceEnabled) return false;
    }

    PermissionStatus permissionGranted = await _location.hasPermission();
    if (permissionGranted == PermissionStatus.denied) {
      permissionGranted = await _location.requestPermission();
      if (permissionGranted != PermissionStatus.granted) return false;
    }
    return true;
  }

  Stream<LatLng> getLocationStream() {
    return _location.onLocationChanged.map((event) {
      return LatLng(event.latitude!, event.longitude!);
    });
  }

  Future<LatLng?> getCurrentLocation() async {
    try {
      final loc = await _location.getLocation();
      return LatLng(loc.latitude!, loc.longitude!);
    } catch (e) {
      return null;
    }
  }
}
