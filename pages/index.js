import Head from 'next/head'

export default function Home() {
  return (
    <div>
      <Head>
        <title>On This Day in History</title>
        <meta property="og:title" content="On This Day in History" />
        <meta property="og:image" content="https://time-capsule-jade.vercel.app/onthisday.png" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://time-capsule-jade.vercel.app//onthisday.png" />
        <meta property="fc:frame:button:1" content="Explore History" />
        <meta property="fc:frame:post_url" content="https://time-capsule-jade.vercel.app/api/initialFetch" />
      </Head>
      <main>
        <h1>Welcome to On This Day in History!</h1>
        <p>exploring historical events for today</p>
      </main>
    </div>
  )
}