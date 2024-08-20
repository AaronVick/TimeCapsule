import axios from 'axios';

const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

// Get the event by cycling through the cached list using an index
function getEventByIndex(events, currentIndex) {
  const totalEvents = events.length;
  const index = ((currentIndex % totalEvents) + totalEvents) % totalEvents;
  return events[index];
}

// Main handler function to process incoming requests
export default async function handler(req, res) {
  console.log('Received request to historyFrame handler');
  console.log(`Original request method: ${req.method}`);

  // Temporarily force POST handling
  const method = req.method === 'POST' || req.method === 'GET' ? 'POST' : req.method;

  console.log(`Handling request as method: ${method}`);

  try {
    if (method === 'POST') {
      const { untrustedData } = req.body || {};
      const buttonIndex = untrustedData?.buttonIndex;

      console.log(`Button Index: ${buttonIndex}`);

      // Use a simple index for cycling through events
      let currentIndex = parseInt(untrustedData?.currentIndex) || 0;

      if (buttonIndex === 1) currentIndex -= 1; // Previous
      else if (buttonIndex === 2) currentIndex += 1; // Next

      let historicalData = process.env.todayData
        ? JSON.parse(process.env.todayData)  // Use cached data
        : await fetchHistoricalData();       // Fallback to API fetch if cache is missing

      if (!process.env.todayData) {
        process.env.todayData = JSON.stringify(historicalData);  // Cache the data after initial fetch
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
            <meta property="fc:frame:image" content="https://warpcast.com/~/compose?text=Check+out+some+moments+in+history+for+today%0A%0Aframe+by+%40aaronv&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app%2F" />
          </head>
        </html>
      `);
    } else {
      console.log(`Method ${method} not allowed.`);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}

// Helper function to fetch data if the cache is empty
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
