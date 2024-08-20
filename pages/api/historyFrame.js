import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // Using uuid to generate unique identifiers

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

// Fetch historical data from the API
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

// Get the event by cycling through the list using an index
function getEventByIndex(events, currentIndex) {
  const totalEvents = events.length;
  const index = ((currentIndex % totalEvents) + totalEvents) % totalEvents;
  return events[index];
}

// Main handler function to process incoming requests
export default async function handler(req, res) {
  const requestId = uuidv4(); // Generate a unique ID for this request
  console.log(`[${requestId}] Received request to historyFrame handler`);
  console.log(`[${requestId}] Request method: ${req.method}`);
  console.log(`[${requestId}] Request headers: ${JSON.stringify(req.headers)}`);
  console.log(`[${requestId}] Request body: ${JSON.stringify(req.body)}`);

  try {
    if (req.method === 'POST') {
      const { untrustedData } = req.body || {};
      const buttonIndex = untrustedData?.buttonIndex;

      console.log(`[${requestId}] Button Index: ${buttonIndex}`);

      // Using a simple index for cycling through events
      let currentIndex = parseInt(untrustedData?.currentIndex) || 0;

      if (buttonIndex === 1) currentIndex -= 1; // Previous button
      else if (buttonIndex === 2) currentIndex += 1; // Next button

      let historicalData;

      if (process.env.todayData) {
        console.log(`[${requestId}] Using cached historical data.`);
        historicalData = JSON.parse(process.env.todayData);
      } else {
        console.log(`[${requestId}] Fetching new historical data.`);
        historicalData = await fetchHistoricalData();
        process.env.todayData = JSON.stringify(historicalData);
      }

      const event = getEventByIndex(historicalData.Events, currentIndex);
      const text = `${event.year}: ${event.text}`;
      const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

      console.log(`[${requestId}] Serving event: ${text}`);

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
            <meta property="fc:frame:image" content="https://warpcast.com/~/compose?text=Check+out+some+moments+in+history+for+today%0A%0Aframe+by+%40aaronv&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app%2F" />
          </head>
        </html>
      `);
    } else {
      console.log(`[${requestId}] Method ${req.method} not allowed.`);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
