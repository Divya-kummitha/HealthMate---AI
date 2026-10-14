import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(const HealthMateApp());
}

class HealthMateApp extends StatelessWidget {
  const HealthMateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HealthMate AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0D9488), // Medical Teal
          primary: const Color(0xFF0D9488),
          secondary: const Color(0xFF0284C7),
          surface: Colors.white,
        ),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}
