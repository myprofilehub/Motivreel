import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:motivreel_app/models/reel.dart';

class ApiService {
  // Use the local IP of the Next.js server
  static const String baseUrl = 'http://192.168.31.17:3001/api';

  Future<List<Reel>> fetchReadyReels() async {
    final response = await http.get(Uri.parse('$baseUrl/reels'));
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      final allReels = data.map((json) => Reel.fromJson(json)).toList();
      
      // Filter out downloading reels and those without video paths
      return allReels.where((r) => r.status == 'ready' && r.videoPath != null).toList();
    } else {
      throw Exception('Failed to load reels');
    }
  }

  // Returns the absolute URL for the video since the backend returns relative paths like "/videos/file.mp4"
  static String getVideoUrl(String videoPath) {
    if (videoPath.startsWith('http')) return videoPath;
    return 'http://192.168.31.17:3001$videoPath';
  }
}
