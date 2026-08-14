import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:motivreel_app/models/reel.dart';

class ApiService {
  // Use the deployed Render URL for all API requests
  static const String baseUrl = 'https://motivreel.onrender.com/api';

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

  // Use the deployed Render URL for fetching the actual video files
  static String getVideoUrl(String videoPath) {
    if (videoPath.startsWith('http')) return videoPath;
    return 'https://motivreel.onrender.com$videoPath';
  }
}
