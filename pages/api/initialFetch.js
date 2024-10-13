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

// Correct API call to Historypin for fetching photos based on event keyword
async function fetchImageData(keyword) {
  try {
    const response = await axios.get(`http://www.historypin.org/en/api/search/keyword:${keyword},pin:photo`);
    const pins = response.data.items;  // Adjust this based on the structure returned by Historypin API

    if (pins && pins.length > 0) {
      // Assuming the API returns a 'media_url' field for photos
      return pins[0].media_url;
    }
    return null;  // Return null if no image found
  } catch (error) {
    console.error('Error fetching image from Historypin:', error);
    return null;  // Return null if the API call fails
  }
}

export default async function handler(req, res) {
  console.log('Received request to initialFetch handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST' || req.method === 'GET') {
      const historicalData = await fetchHistoricalData();
      process.env.todayData = JSON.stringify(historicalData);

      const randomIndex = Math.floor(Math.random() * historicalData.Events.length);
      const event = historicalData.Events[randomIndex];

      // Fetch image based on event keyword (historical event description)
      const photoUrl = await fetchImageData(event.text);

      // Fallback to dynamic OG image if no photo found
      const ogImageUrl = photoUrl
        ? photoUrl
        : `${VERCEL_OG_API}?text=${encodeURIComponent('No Image Available')}&photoUrl=default`;

      const text = `${event.year}: ${event.text}`;
      const finalOgImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}&photoUrl=${encodeURIComponent(ogImageUrl)}`;

      console.log(`Serving event with image: ${text} (Index: ${randomIndex})`);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>On This Day in History</title>
          
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${finalOgImageUrl}" />
          
          <meta property="fc:frame:button:1" content="Previous" />
          <meta property="fc:frame:button:2" content="Next" />
          <meta property="fc:frame:button:3" content="Share" />
          <meta property="fc:frame:button:3:action" content="link" />
          <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check+out+today's+moments+in+history!%0A%0AFrame+by+%40aaronv&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/historyFrame" />
        </head>
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
