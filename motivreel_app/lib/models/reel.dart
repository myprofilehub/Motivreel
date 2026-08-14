class Reel {
  final int id;
  final String url;
  final String platform;
  final String? title;
  final String? videoPath;
  final String? thumbnail;
  final String status;
  final DateTime createdAt;

  Reel({
    required this.id,
    required this.url,
    required this.platform,
    this.title,
    this.videoPath,
    this.thumbnail,
    required this.status,
    required this.createdAt,
  });

  factory Reel.fromJson(Map<String, dynamic> json) {
    return Reel(
      id: json['id'],
      url: json['url'],
      platform: json['platform'],
      title: json['title'],
      videoPath: json['videoPath'],
      thumbnail: json['thumbnail'],
      status: json['status'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
