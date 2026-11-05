import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#0f0f13', minHeight: '100vh', color: '#d1d5db', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: '#1a1a24', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid #ff477e', color: '#ff477e', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
          ← Back to Home
        </button>
        
        <h1 style={{ color: '#fff', fontSize: '32px', marginBottom: '20px' }}>Terms of Service</h1>
        <p style={{ marginBottom: '20px', fontSize: '14px' }}>Last updated: November 2026</p>

        <div style={{ lineHeight: '1.6', fontSize: '15px' }}>
          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>1. Acceptance of Terms</h2>
          <p>By using Random Talk, you agree to these Terms. If you do not agree, please do not use the service.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>2. Age Restriction (18+)</h2>
          <p>You must be at least <strong>18 years or older</strong> to use this platform. If you are under 18, you are not permitted to use Random Talk.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>3. Prohibited Conduct</h2>
          <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
            <li>No nudity or sexual content.</li>
            <li>No harassment, hate speech, or abuse.</li>
            <li>No recording of conversations without consent.</li>
            <li>No spamming or sharing illegal links.</li>
          </ul>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>4. Ban Policy</h2>
          <p>Violators of these rules will be permanently banned or temporarily blocked. We reserve the right to block any user at our discretion.</p>

          <h2 style={{ color: '#ff9a9e', fontSize: '20px', marginTop: '30px', marginBottom: '10px' }}>5. Limitation of Liability</h2>
          <p>Random Talk is provided "as is". We are not responsible for the actions of other users. You use the platform at your own risk.</p>
        </div>
      </div>
    </div>
  );
}