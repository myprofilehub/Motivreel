require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('Reel').select('id, title, videoPath, thumbnail, status').order('id', { ascending: false }).limit(3);
  console.log(data);
}
run();
