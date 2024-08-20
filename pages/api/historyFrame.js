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

function getHistoricalEvent(events, year = null) {
  if (year) {
    const filteredEvents = events.filter(event => parseInt(event.year) <= year);
    return filteredEvents[Math.floor(Math.random() * filteredEvents.length)];
  } else {
    return events[Math.floor(Math.random() * events.length)];
  }
}

async function handleHistoryRequest(res, year = null) {
  let historicalData;
  
  if (process.env.todayData) {
    historicalData = JSON.parse(process.env.todayData);
  } else {
    historicalData = await fetchHistoricalData();
    process.env.todayData = JSON.stringify(historicalData);
  }

  const event = getHistoricalEvent(historicalData.Events, year);
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
        <meta property="fc:frame:post_url" content="https://time-capsule-jade.vercel.app/api/historyFrame" />
      </head>
    </html>
  `);
}

export default async function handler(req, res) {
  console.log('Received request to historyFrame handler');
  console.log('Request method:', req.method);

  try {
    if (req.method === 'POST') {
      const { untrustedData } = req.body;
      const buttonIndex = untrustedData?.buttonIndex;

      let year = null;
      if (buttonIndex === 1) year = new Date().getFullYear() - 10;
      else if (buttonIndex === 2) year = new Date().getFullYear() - 25;
      else if (buttonIndex === 3) year = new Date().getFullYear() - 50;
      else if (buttonIndex === 4) {
        // Handle share functionality
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${VERCEL_OG_API}?text=${encodeURIComponent('Check out some moments in history for today!')}" />
              <meta property="fc:frame:button:1" content="Back to History" />
              <meta property="fc:frame:post_url" content="https://your-vercel-url.vercel.app/api/historyFrame" />
            </head>
          </html>
        `);
      }

      return handleHistoryRequest(res, year);
    } else {
      console.log('Method not allowed:', req.method);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}