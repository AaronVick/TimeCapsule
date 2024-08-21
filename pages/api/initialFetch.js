import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

async function fetchHistoricalData() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  try {
    const response = await axios.get(`https://history.muffinlabs.com/date/${month}/${day}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error('Failed to fetch historical data');
  }
}

function getRandomIndex(arrayLength) {
  return Math.floor(Math.random() * arrayLength);
}

export default async function handler(req, res) {
  console.log('Received request to initialFetch handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST' || req.method === 'GET') {
      const historicalData = await fetchHistoricalData();
      process.env.todayData = JSON.stringify(historicalData);

      const randomIndex = getRandomIndex(historicalData.Events.length);
      process.env.currentIndex = randomIndex.toString();  // Start with a random index

      const event = historicalData.Events[randomIndex];  // Start with the random event
      const text = `${event.year}: ${event.text}`;
      const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

      console.log(`Serving random event: ${text} (Index: ${randomIndex})`);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>On This Day in History</title>
          
          <!-- Farcaster Frame Meta Tags -->
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${ogImageUrl}" />
          
          <!-- Removed Redundant Button Meta Tags -->
        </head>
        <body>
          <main>
            <h1>${text}</h1>
            <img src="${ogImageUrl}" alt="Historical event" />
          </main>
        </body>
        </html>
      `);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
