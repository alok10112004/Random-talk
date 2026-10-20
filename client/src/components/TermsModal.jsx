export default function TermsModal({ open, onClose, type }) {
  if (!open) return null;

  const CONTENT = {
    terms: {
      title: 'Terms of Service',
      body: (
        <>
          <h3>1. Age Requirement</h3>
          <p>
            You must be at least 18 years old to use Random Talk. Users aged 13-17
            may use the service only with verifiable parental consent and
            supervision.
          </p>

          <h3>2. Acceptable Use</h3>
          <p>
            You agree not to use Random Talk for any unlawful purpose, including:
          </p>
          <ul>
            <li>Displaying nudity, sexual content, or sexually explicit material</li>
            <li>Harassing, threatening, or abusing other users</li>
            <li>Impersonating any person or entity</li>
            <li>Recording other users without their explicit consent</li>
            <li>Advertising, promoting products, or spamming</li>
            <li>Any content involving minors in inappropriate contexts</li>
          </ul>

          <h3>3. Anonymous Chats</h3>
          <p>
            Random Talk pairs you randomly with other users. You should not
            share personal identifying information (real name, address, phone,
            social media, etc.) with strangers. Random Talk is not responsible
            for any consequences of information you voluntarily share.
          </p>

          <h3>4. Video Monitoring & Moderation</h3>
          <p>
            Video sessions may be moderated using automated tools and manual
            review. Reports submitted by users are reviewed by our team.
            Violations may result in a permanent ban.
          </p>

          <h3>5. Privacy</h3>
          <p>
            Video and audio streams are peer-to-peer (P2P). We do not record or
            store your video or audio. Chat messages are transmitted in real
            time and are not saved on our servers.
          </p>

          <h3>6. Disclaimer</h3>
          <p>
            Random Talk is provided "as-is" without any warranty. We are not
            liable for user behavior or any damages arising from use of the
            service.
          </p>

          <h3>7. Changes to Terms</h3>
          <p>
            We may update these Terms at any time. Continued use of Random Talk
            after changes constitutes acceptance of the new Terms.
          </p>
        </>
      ),
    },

    guidelines: {
      title: 'Community Guidelines',
      body: (
        <>
          <h3>Our Community Values</h3>
          <p>
            Random Talk is built on respect, safety, and genuine human
            connection. Follow these guidelines to keep the community safe for
            everyone.
          </p>

          <h3>✅ Do</h3>
          <ul>
            <li>Be respectful and kind to strangers</li>
            <li>Keep your face visible in the camera frame</li>
            <li>Report inappropriate behavior using the 🚩 button</li>
            <li>Skip (Next) if you feel uncomfortable</li>
            <li>Keep conversations civil and fun</li>
          </ul>

          <h3>❌ Don't</h3>
          <ul>
            <li>Show nudity or sexual content — instant ban</li>
            <li>Harass, threaten, or use hate speech</li>
            <li>Record the other person without consent</li>
            <li>Advertise products or share spam links</li>
            <li>Use Random Talk if you are under 18 (unless 13+ with parental consent)</li>
            <li>Display weapons, violence, or self-harm</li>
          </ul>

          <h3>Consequences</h3>
          <p>
            Violations may result in:
          </p>
          <ul>
            <li>First offense: Warning + temporary suspension</li>
            <li>Second offense: 30-day suspension</li>
            <li>Serious violations: Permanent ban + IP block</li>
            <li>Illegal activity: Reported to law enforcement</li>
          </ul>

          <h3>Reporting</h3>
          <p>
            If you see someone violating these guidelines, click the 🚩 Report
            button in the control bar. All reports are anonymous.
          </p>
        </>
      ),
    },

    privacy: {
      title: 'Privacy Policy',
      body: (
        <>
          <h3>1. Information We Collect</h3>
          <p>
            When you sign in with Google or Email, we collect:
          </p>
          <ul>
            <li>Your email address</li>
            <li>Your display name (from Google)</li>
            <li>Your profile picture (from Google, if any)</li>
          </ul>

          <h3>2. Information We Do NOT Collect</h3>
          <ul>
            <li>We do NOT record your video or audio</li>
            <li>We do NOT store your chat messages</li>
            <li>We do NOT track your location</li>
            <li>We do NOT sell your data to third parties</li>
          </ul>

          <h3>3. How Video Works</h3>
          <p>
            Video and audio streams are peer-to-peer (P2P) using WebRTC
            technology. Your stream goes directly to your chat partner — it does
            not pass through our servers (except for connection setup).
          </p>

          <h3>4. Cookies & Local Storage</h3>
          <p>
            We use browser local storage to remember your login session and
            terms acceptance. We do not use third-party tracking cookies.
          </p>

          <h3>5. Third-Party Services</h3>
          <ul>
            <li>Firebase (Google) — for authentication</li>
            <li>MongoDB Atlas — for user account storage</li>
            <li>STUN servers — for WebRTC connection setup</li>
          </ul>

          <h3>6. Your Rights</h3>
          <p>
            You can delete your account at any time by contacting us. Upon
            deletion, all your stored data will be removed within 30 days.
          </p>

          <h3>7. Contact</h3>
          <p>
            For privacy concerns, email us at privacy@randomtalk.com
          </p>
        </>
      ),
    },
  };

  const data = CONTENT[type] || CONTENT.terms;

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div
        className="terms-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="terms-modal-header">
          <h2 className="terms-modal-title">{data.title}</h2>
          <button className="terms-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="terms-modal-body">{data.body}</div>

        <div className="terms-modal-footer">
          <button className="terms-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}