import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'experimental-edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const photoUrl = searchParams.get('photoUrl');  // Get the image URL or 'default' for fallback

    const [year, ...eventText] = text.split(':');

    // Check if the image is a fallback (no image available)
    const isFallback = photoUrl === 'default';

    // If it's a fallback, we'll use the old method (no image, just text)
    if (isFallback) {
      return new ImageResponse(
        (
          <div
            style={{
              background: '#000000',  // Black background
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontFamily: 'Arial, sans-serif',
              color: '#ffffff',  // White text
              padding: '20px',
              textAlign: 'center',
            }}
          >
            {/* Display the year (bold, larger font) */}
            <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: '10px' }}>
              {year}
            </div>

            {/* Display the event text */}
            <div style={{ fontSize: 30, maxWidth: '80%', wordWrap: 'break-word' }}>
              {eventText.join(':')}
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Otherwise, we are using Historypin's image and displaying it at the top
    return new ImageResponse(
      (
        <div
          style={{
            background: '#000000',  // Black background
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',  // White text
            padding: '20px',
            textAlign: 'center',
          }}
        >
          {/* Display the image if available */}
          <div style={{ marginBottom: '20px' }}>
            <img 
              src={photoUrl} 
              alt="Historical event image" 
              style={{ maxWidth: '100%', maxHeight: '50%' }} 
            />
          </div>

          {/* Display the year (bold, larger font) */}
          <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: '10px' }}>
            {year}
          </div>

          {/* Display the event text */}
          <div style={{ fontSize: 30, maxWidth: '80%', wordWrap: 'break-word' }}>
            {eventText.join(':')}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}
