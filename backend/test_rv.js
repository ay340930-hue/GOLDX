const http = require('http');

http.get('http://127.0.0.1:5000/api/relative-value?symbol_a=GOLDM&symbol_b=GOLDGUINEA&lookback_window=30', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    const parsed = JSON.parse(data);
    console.log("Keys:", Object.keys(parsed));
    if (parsed.error) console.log("Error:", parsed.error);
    if (parsed.data) console.log("Data length:", parsed.data.length, "Sample:", parsed.data[0]);
  });
});
