import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PawTrails',
      theme: ThemeData(
        primaryColor: const Color(0xFFF59E0B),
        colorScheme: ColorScheme.fromSwatch().copyWith(
          primary: const Color(0xFFF59E0B),
          secondary: const Color(0xFFFB923C),
          background: const Color(0xFFFFFBF0),
          surface: const Color(0xFFFEF3C7),
          onPrimary: const Color(0xFF78350F),
          onSecondary: const Color(0xFF78350F),
          onBackground: const Color(0xFF78350F),
          onSurface: const Color(0xFF78350F),
          error: const Color(0xFFEF4444),
          onError: const Color(0xFFFFFFFF),
          brightness: Brightness.light,
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.bold, color: Color(0xFF78350F)),
          bodyLarge: TextStyle(fontFamily: 'Inter', color: Color(0xFF78350F)),
        ),
        useMaterial3: true,
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

  static const List<Widget> _widgetOptions = <Widget>[
    HomeScreen(),
    DogsScreen(),
    WalksScreen(),
    SettingsScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: _widgetOptions.elementAt(_selectedIndex),
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.pets),
            label: 'Dogs',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_walk),
            label: 'Walks',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Theme.of(context).primaryColor,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
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
        backgroundColor: Theme.of(context).colorScheme.background,
      ),
      body: child,
    );
  }
}


class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenContainer(
      title: 'PawTrails',
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Today's Summary Card
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Today\'s Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                          Icon(Icons.wb_sunny, color: Colors.amber),
                        ],
                      ),
                      SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(
                            children: [
                              Text('0', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                              Text('Walks'),
                            ],
                          ),
                          Column(
                            children: [
                              Text('0.0', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                              Text('km'),
                            ],
                          ),
                          Column(
                            children: [
                              Text('0:00', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                              Text('Time'),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Active Dogs Section
              const Text('Select a dog', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              SizedBox(
                height: 100,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: 5, // Placeholder for dog list
                  itemBuilder: (context, index) {
                    return const Padding(
                      padding: EdgeInsets.only(right: 16.0),
                      child: CircleAvatar(
                        radius: 40,
                        // Placeholder for dog avatar
                        backgroundColor: Colors.grey,
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
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text('Start Walk', style: TextStyle(fontSize: 18, color: Colors.white)),
                ),
              ),
              const SizedBox(height: 24),

              // Recent Walks Preview
              const Text('Recent Walks', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 3, // Placeholder for recent walks
                itemBuilder: (context, index) {
                  return Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const ListTile(
                      leading: Icon(Icons.pets),
                      title: Text('Walk with Buddy'),
                      subtitle: Text('2.5 km, 30 min'),
                      trailing: Text('Feb 28'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class DogsScreen extends StatelessWidget {
  const DogsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenContainer(
      title: 'Dogs',
      child: Center(
        child: Text('Dogs Screen'),
      ),
    );
  }
}

class WalksScreen extends StatelessWidget {
  const WalksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenContainer(
      title: 'Walks',
      child: Center(
        child: Text('Walks Screen'),
      ),
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenContainer(
      title: 'Settings',
      child: Center(
        child: Text('Settings Screen'),
      ),
    );
  }
}