require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
  const { data: reels } = await supabase.from('Reel').select('*');
  for (const reel of reels) {
    if (reel.videoPath && reel.videoPath.startsWith('/videos/')) {
      const localVideoPath = path.join(__dirname, 'public', reel.videoPath);
      const localThumbPath = path.join(__dirname, 'public', reel.thumbnail || '/thumbnails/placeholder.jpg');
      
      let newVideoUrl = reel.videoPath;
      let newThumbUrl = reel.thumbnail;

      console.log(`Fixing reel ${reel.id}...`);

      if (fs.existsSync(localVideoPath)) {
        const videoData = fs.readFileSync(localVideoPath);
        const fileName = path.basename(localVideoPath);
        console.log(`Uploading ${fileName}...`);
        const { error: vErr } = await supabase.storage.from('Reels').upload(fileName, videoData, { contentType: 'video/mp4', upsert: true });
        if (!vErr) {
          newVideoUrl = supabase.storage.from('Reels').getPublicUrl(fileName).data.publicUrl;
        } else {
          console.error(vErr);
        }
      }

      if (fs.existsSync(localThumbPath)) {
        const thumbData = fs.readFileSync(localThumbPath);
        const fileName = path.basename(localThumbPath);
        const ext = path.extname(fileName).toLowerCase();
        const cType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
        const { error: tErr } = await supabase.storage.from('Reels').upload(fileName, thumbData, { contentType: cType, upsert: true });
        if (!tErr) {
          newThumbUrl = supabase.storage.from('Reels').getPublicUrl(fileName).data.publicUrl;
        }
      }

      await supabase.from('Reel').update({ videoPath: newVideoUrl, thumbnail: newThumbUrl }).eq('id', reel.id);
      console.log(`Reel ${reel.id} fixed!`);
    }
  }
}

fix();
