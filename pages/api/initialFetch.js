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

export default async function handler(req, res) {
  console.log('Received request to initialFetch handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST') {
      const historicalData = await fetchHistoricalData();
      process.env.todayData = JSON.stringify(historicalData);

      const event = historicalData.Events[Math.floor(Math.random() * historicalData.Events.length)];
      const text = `${event.year}: ${event.text}`;
      const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="10 Years Ago" />
            <meta property="fc:frame:button:2" content="25 Years Ago" />
            <meta property="fc:frame:button:3" content="50 Years Ago" />
            <meta property="fc:frame:button:4" content="Share" />
            <meta property="fc:frame:post_url" content="https://your-vercel-url.vercel.app/api/historyFrame" />
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