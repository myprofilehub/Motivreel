const url = 'https://instagram-video-downloader13.p.rapidapi.com/stories.php';
const formData = new FormData();
formData.append('url', 'https://www.instagram.com/reel/DbfuPn_ojG4/');

const options = {
  method: 'POST',
  headers: {
    'x-rapidapi-host': 'instagram-video-downloader13.p.rapidapi.com',
    'x-rapidapi-key': 'a61c944dcbmsh94b1581cfcb9588p112b77jsn1000373541d7',
  },
  body: formData
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(JSON.stringify(json, null, 2)))
  .catch(err => console.error('error:' + err));
