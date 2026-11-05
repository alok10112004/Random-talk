export default function HeroAnimation() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '160px', width: '100%', marginBottom: '10px' }}>
      
      {/* Left Card (Ladki) */}
      <div style={{ position: 'relative', width: '100px', height: '100px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(236, 72, 153, 0.2)', border: '3px solid #fbcfe8' }}>
        <img 
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
          alt="Girl" 
          // 🔥 objectPosition: 'top' add kiya taaki upar se na kate
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} 
        />
      </div>

      {/* Right Card (Ladka) */}
      <div style={{ position: 'relative', width: '100px', height: '100px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(236, 72, 153, 0.2)', border: '3px solid #fbcfe8' }}>
        <img 
          src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80" 
          alt="Boy" 
          // 🔥 objectPosition: 'top' add kiya taaki upar se na kate
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} 
        />
      </div>

    </div>
  );
}