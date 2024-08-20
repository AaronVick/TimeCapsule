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

function getEventByIndex(events, currentIndex) {
  const totalEvents = events.length;
  const index = ((currentIndex % totalEvents) + totalEvents) % totalEvents;
  return events[index];
}

export default async function handler(req, res) {
  console.log('Received request to historyFrame handler');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body));
  console.log('Request headers:', JSON.stringify(req.headers));

  try {
    // Accept both POST and GET requests
    if (req.method === 'POST' || req.method === 'GET') {
      let currentIndex = 0;
      let buttonIndex = 0;

      if (req.method === 'POST' && req.body && req.body.untrustedData) {
        buttonIndex = req.body.untrustedData.buttonIndex;
        currentIndex = parseInt(req.body.untrustedData.currentIndex) || 0;
      }

      if (buttonIndex === 1) currentIndex -= 1; // Previous
      else if (buttonIndex === 2) currentIndex += 1; // Next

      let historicalData = process.env.todayData
        ? JSON.parse(process.env.todayData)
        : await fetchHistoricalData();

      if (!process.env.todayData) {
        process.env.todayData = JSON.stringify(historicalData);
      }

      const event = getEventByIndex(historicalData.Events, currentIndex);
      const text = `${event.year}: ${event.text}`;
      const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

      console.log(`Serving event: ${text}`);

      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${ogImageUrl}" />
            <meta property="fc:frame:button:1" content="Previous" />
            <meta property="fc:frame:button:2" content="Next" />
            <meta property="fc:frame:button:3" content="Share" />
            <meta property="fc:frame:post_url" content="https://time-capsule-jade.vercel.app/api/historyFrame" />
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