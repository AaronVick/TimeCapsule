const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

// Function to fetch historical data (e.g., from initialFetch or MuffinLabs)
async function fetchHistoricalData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/initialFetch`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data.Events; // Assuming response contains an array of events
    } else {
      const textResponse = await response.text();
      console.error('Unexpected non-JSON response:', textResponse);
      throw new Error('Received non-JSON response from initialFetch');
    }

  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  console.log('Received request to historyFrame handler');
  console.log('Request method:', req.method);
  console.log('Request body:', JSON.stringify(req.body));

  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    let buttonIndex = 0;
    if (req.method === 'POST') {
      const { untrustedData } = req.body;
      buttonIndex = untrustedData?.buttonIndex;
    }

    // Fetch the latest historical data from initialFetch or a similar API
    const historicalData = await fetchHistoricalData();

    if (!historicalData || historicalData.length === 0) {
      console.error('No historical data found.');
      return res.status(500).json({ error: 'No historical data found' });
    }

    let currentIndex = 0; // Start from index 0 if undefined

    // Adjust index based on button clicked (previous or next)
    if (buttonIndex === 1) {
      currentIndex -= 1;
    } else if (buttonIndex === 2) {
      currentIndex += 1;
    }

    // Ensure the index is valid
    currentIndex = (currentIndex + historicalData.length) % historicalData.length;
    const event = historicalData[currentIndex];

    if (!event) {
      console.error('Event not found at index:', currentIndex);
      return res.status(404).json({ error: 'Event not found' });
    }

    const text = `${event.year}: ${event.text}`;
    const ogImageUrl = `${VERCEL_OG_API}?text=${encodeURIComponent(text)}`;

    console.log(`Serving event: ${text} (Index: ${currentIndex})`);

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${ogImageUrl}" />
        <meta property="fc:frame:button:1" content="Previous" />
        <meta property="fc:frame:button:2" content="Next" />
        <meta property="fc:frame:button:3" content="Share" />
        <meta property="fc:frame:button:3:action" content="link" />
        <meta property="fc:frame:button:3:target" content="https://warpcast.com/~/compose?text=Check+out+today's+moments+in+history!%0A%0AFrame+by+%40aaronv&embeds[]=https%3A%2F%2Ftime-capsule-jade.vercel.app" />
        <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/historyFrame" />
      </head>
      </html>
    `);
  } catch (error) {
    console.error('An unexpected error occurred:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
