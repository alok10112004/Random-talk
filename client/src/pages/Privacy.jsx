import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#0f0f13', minHeight: '100vh', color: '#d1d5db', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1a1a24', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #ff477e', color: '#ff477e', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
          ← Back to Home
        </button>
        
        <h1 style={{ color: '#fff', fontSize: '32px', marginBottom: '20px' }}>Privacy Policy</h1>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>Last updated: November 2026</p>

        <div style={{ lineHeight: '1.6', fontSize: '15px' }}>
          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>1. Information We Collect</h2>
          <p>We do not require you to create an account to use Random Talk. We do not store your video or audio conversations. Video streams are peer-to-peer (P2P) and are not recorded or saved on our servers.</p>
          <p>We may temporarily collect basic technical data (like IP address and browser type) to establish the connection and maintain server security.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>2. Chat Messages</h2>
          <p>Text chat messages are transmitted in real-time and are <strong>not saved</strong> on our database. Once you disconnect or skip, the messages are gone forever.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>3. Cookies and Analytics</h2>
          <p>We may use basic cookies to remember your preferences (like your selected country or gender). We do not use tracking cookies for targeted advertising.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>4. Third-Party Services</h2>
          <p>We use WebRTC technology and third-party TURN servers to ensure video connections work even behind strict networks. These services only relay encrypted data and do not store your media.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>5. Your Rights</h2>
          <p>Since we do not store personal data, there is nothing to delete. However, if you have any concerns, you can contact us at the email below.</p>

          {/* 🔥 IT RULES COMPLIANCE */}
          <div style={{ background: '#2a2a35', padding: '20px', borderRadius: '8px', marginTop: '30px', borderLeft: '4px solid #ff477e' }}>
            <h2 style={{ color: '#fff', fontSize: '18px', marginTop: '0', marginBottom: '10px' }}>Grievance Officer (As per IT Rules 2021)</h2>
            <p style={{ margin: '5px 0' }}><strong>Name:</strong> Alok (Owner)</p>
            <p style={{ margin: '5px 0' }}><strong>Email:</strong> support@randomtalk.com</p>
            <p style={{ margin: '5px 0' }}><strong>Response Time:</strong> Within 15 days of receiving complaint.</p>
          </div>
        </div>
      </div>
    </div>
  );
}