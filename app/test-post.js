const http = require('http');
const https = require('https');

async function test() {
  // Try 0000 first
  const res = await fetch("https://motivreel.onrender.com/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: "0000" })
  });
  
  if (!res.ok) {
    console.log("Failed to login with 0000", await res.text());
    return;
  }
  const cookies = res.headers.get('set-cookie');
  console.log("Logged in, got cookies");

  const postRes = await fetch("https://motivreel.onrender.com/api/reels", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Cookie": cookies
    },
    body: JSON.stringify({ url: "https://www.instagram.com/reel/DbfuPn_ojG/" })
  });

  console.log("POST status:", postRes.status);
  console.log("POST body:", await postRes.text());
}
test();
