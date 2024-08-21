const VERCEL_OG_API = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og`;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { untrustedData } = req.body;
    const buttonIndex = untrustedData?.buttonIndex;

    let historicalData;
    let currentIndex;

    if (process.env.todayData) {
      try {
        historicalData = JSON.parse(process.env.todayData);
      } catch (error) {
        console.error('Failed to parse historical data:', error);
        return res.status(500).json({ error: 'Failed to parse historical data' });
      }
      currentIndex = parseInt(process.env.currentIndex || '0', 10);
    } else {
      console.error('Historical data not found in environment variable');
      return res.status(500).json({ error: 'Historical data not available' });
    }

    if (buttonIndex === 1) {
      currentIndex -= 1;
    } else if (buttonIndex === 2) {
      currentIndex += 1;
    } else if (buttonIndex === 3) {
      // Handle share action
      return res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/onthisday.png" />
          <meta property="fc:frame:button:1" content="Back to History" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/historyFrame" />
        </head>
        </html>
      `);
    } else {
      return res.status(400).json({ error: 'Invalid button index' });
    }

    process.env.currentIndex = currentIndex.toString();
    const event = getEventByIndex(historicalData.Events, currentIndex);
    
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
    console.error('An unexpected error occurred:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

function getEventByIndex(events, currentIndex) {
  const totalEvents = events.length;
  const index = ((currentIndex % totalEvents) + totalEvents) % totalEvents;
  return events[index];
}