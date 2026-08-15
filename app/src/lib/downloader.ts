import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

// Use yt-dlp installed globally in the Docker image
const YTDLP = "yt-dlp";
const VIDEO_DIR = path.join(process.cwd(), "public", "videos");
const THUMB_DIR = path.join(process.cwd(), "public", "thumbnails");

// Ensure output directories exist
[VIDEO_DIR, THUMB_DIR].forEach((dir) => {
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
});

export interface DownloadResult {
  videoPath: string;   // public URL path e.g. /videos/123.mp4
  thumbnail: string;   // public URL path e.g. /thumbnails/123.jpg
  title: string;
}

/**
 * Downloads a video using yt-dlp and returns the local paths.
 * Supports YouTube Shorts, Instagram Reels, and ShareChat.
 */
export async function downloadVideo(
  url: string,
  reelId: number
): Promise<DownloadResult> {
  const baseName = `reel_${reelId}`;
  const videoOut = path.join(VIDEO_DIR, `${baseName}.mp4`);
  const thumbOut = path.join(THUMB_DIR, `${baseName}.jpg`);

  // Build yt-dlp command
  // - Best MP4 quality ≤ 720p (keeps file sizes reasonable)
  // - Write thumbnail as jpg
  // - No playlist
  // - Merge into mp4
  const cmdArgs = [
    YTDLP,
    `"${url}"`,
    `-f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best"`,
    `--merge-output-format mp4`,
    `-o "${videoOut}"`,
    `--write-thumbnail`,
    `--convert-thumbnails jpg`,
    `--no-playlist`,
    `--no-warnings`,
    `--quiet`,
    `--print title`,
    `--no-simulate`,
  ];

  if (process.env.INSTAGRAM_SESSION_ID && url.includes("instagram.com")) {
    const cookieFilePath = path.join(process.cwd(), "cookies.txt");
    const cookieContent = `.instagram.com\tTRUE\t/\tTRUE\t2000000000\tsessionid\t${process.env.INSTAGRAM_SESSION_ID}\n`;
    fs.writeFileSync(cookieFilePath, cookieContent, { encoding: "utf-8" });
    cmdArgs.push(`--cookies "${cookieFilePath}"`);
  }

  const cmd = cmdArgs.join(" ");

  let title = "";
  try {
    const { stdout } = await execAsync(cmd, { timeout: 300_000 }); // 5 min max
    title = stdout.trim().split("\n")[0] || "";
  } catch (err: any) {
    // yt-dlp prints title to stdout even on some warnings — check if file exists
    if (!fs.existsSync(/*turbopackIgnore: true*/ videoOut)) {
      const msg = err.stderr ? err.stderr.toString() : err.message;
      throw new Error(`yt-dlp failed: ${msg}`);
    }
  }

  // yt-dlp may save thumbnail with a different extension - find it
  let thumbPath = "/thumbnails/placeholder.jpg";
  const possibleThumbs = [thumbOut, thumbOut.replace(".jpg", ".webp"), thumbOut.replace(".jpg", ".png")];
  for (const tp of possibleThumbs) {
    // yt-dlp names thumb as <baseName>.jpg after --convert-thumbnails
    if (fs.existsSync(/*turbopackIgnore: true*/ tp)) {
      // Rename to standard .jpg if needed
      if (tp !== thumbOut) fs.renameSync(/*turbopackIgnore: true*/ tp, thumbOut);
      thumbPath = `/thumbnails/${baseName}.jpg`;
      break;
    }
  }

  // Also check yt-dlp's default thumbnail name pattern (it may add the video ID)
  if (thumbPath === "/thumbnails/placeholder.jpg") {
    const files = fs.readdirSync(/*turbopackIgnore: true*/ THUMB_DIR);
    const match = files.find((f) => f.startsWith(baseName));
    if (match) thumbPath = `/thumbnails/${match}`;
  }

  return {
    videoPath: `/videos/${baseName}.mp4`,
    thumbnail: thumbPath,
    title,
  };
}

/**
 * Deletes the video and thumbnail files for a reel.
 */
export function deleteVideoFiles(reelId: number) {
  const baseName = `reel_${reelId}`;
  const toDelete = [
    path.join(VIDEO_DIR, `${baseName}.mp4`),
    path.join(THUMB_DIR, `${baseName}.jpg`),
    path.join(THUMB_DIR, `${baseName}.webp`),
  ];
  for (const f of toDelete) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ f)) fs.unlinkSync(/*turbopackIgnore: true*/ f);
    } catch {
      // ignore
    }
  }
}
