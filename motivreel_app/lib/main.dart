import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:motivreel_app/models/reel.dart';
import 'package:motivreel_app/services/api_service.dart';

void main() {
  runApp(const MotivReelApp());
}

class MotivReelApp extends StatelessWidget {
  const MotivReelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MotivReel',
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
      ),
      home: const ReelFeedScreen(),
    );
  }
}

class ReelFeedScreen extends StatefulWidget {
  const ReelFeedScreen({super.key});

  @override
  State<ReelFeedScreen> createState() => _ReelFeedScreenState();
}

class _ReelFeedScreenState extends State<ReelFeedScreen> {
  final ApiService _apiService = ApiService();
  List<Reel> _reels = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchReels();
  }

  Future<void> _fetchReels() async {
    try {
      final reels = await _apiService.fetchReadyReels();
      setState(() {
        _reels = reels;
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching reels: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    if (_reels.isEmpty) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('No videos found', style: TextStyle(fontSize: 18, color: Colors.white)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchReels,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: PageView.builder(
        scrollDirection: Axis.vertical,
        itemCount: _reels.length,
        itemBuilder: (context, index) {
          return ReelPlayer(reel: _reels[index]);
        },
      ),
    );
  }
}

class ReelPlayer extends StatefulWidget {
  final Reel reel;

  const ReelPlayer({super.key, required this.reel});

  @override
  State<ReelPlayer> createState() => _ReelPlayerState();
}

class _ReelPlayerState extends State<ReelPlayer> {
  VideoPlayerController? _controller;
  bool _isPlaying = true;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    final videoUrl = ApiService.getVideoUrl(widget.reel.videoPath!);
    _controller = VideoPlayerController.networkUrl(Uri.parse(videoUrl))
      ..setLooping(true)
      ..initialize().then((_) {
        setState(() {});
        _controller?.play();
      });
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    if (_controller == null) return;
    setState(() {
      _isPlaying = !_isPlaying;
      _isPlaying ? _controller!.play() : _controller!.pause();
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _togglePlay,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Video Player
          if (_controller != null && _controller!.value.isInitialized)
            FittedBox(
              fit: BoxFit.cover,
              child: SizedBox(
                width: _controller!.value.size.width,
                height: _controller!.value.size.height,
                child: VideoPlayer(_controller!),
              ),
            )
          else
            const Center(child: CircularProgressIndicator(color: Colors.white)),

          // Play/Pause Overlay
          if (!_isPlaying)
            const Center(
              child: Icon(
                Icons.play_arrow,
                size: 80,
                color: Colors.white54,
              ),
            ),

          // Action Buttons Overlay
          Positioned(
            right: 16,
            bottom: 100,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildActionButton(Icons.favorite, 'Like'),
                const SizedBox(height: 20),
                _buildActionButton(Icons.comment, 'Comment'),
                const SizedBox(height: 20),
                _buildActionButton(Icons.share, 'Share'),
              ],
            ),
          ),

          // Info Overlay
          Positioned(
            left: 16,
            right: 80,
            bottom: 32,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (widget.reel.title != null && widget.reel.title!.isNotEmpty)
                  Text(
                    widget.reel.title!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      shadows: [
                        Shadow(offset: Offset(0, 1), blurRadius: 2, color: Colors.black87)
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    widget.reel.platform.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 36),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }
}
