const url = "https://www.instagram.com/reel/DbfuPn_ojG4/";

async function testSaveIg() {
  try {
    const formData = new URLSearchParams();
    formData.append("q", url);
    formData.append("t", "media");
    formData.append("lang", "en");

    const res = await fetch("https://v3.saveig.app/api/ajaxSearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Origin": "https://saveig.app",
        "Referer": "https://saveig.app/en",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: formData
    });
    
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch (e) {
    console.error(e);
  }
}

testSaveIg();
