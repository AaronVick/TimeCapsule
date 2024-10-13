import { ImageResponse } from '@vercel/og';

// Optimize by using lighter-weight libraries or reducing the complexity of this component
export const config = {
  runtime: 'experimental-edge',
};

export default function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');

    const [year, ...eventText] = text.split(':');

    return new ImageResponse(
      (
        <div
          style={{
            background: '#000000', // Reduced color complexity
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Arial, sans-serif', // Use a standard font
            color: '#ffffff',
            padding: '20px', // Reduced padding
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 50, fontWeight: 'bold', marginBottom: '10px' }}>
            {year}
          </div>
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
