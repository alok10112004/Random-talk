import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'YOUR_EMAIL@gmail.com'; // 🔥 apna contact email yahan daalo
const LAST_UPDATED = 'November 2026';

const SECTIONS = [
  {
    title: '1. Introduction',
    paragraphs: [
      'Random Talk ("we", "our", "the Service") is a free, anonymous video and text chat platform that connects adults with other users at random. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using the Service, you agree to the practices described here.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: [
      'You do not need to provide your name, email address, phone number, or password to use Random Talk. We collect only the limited information described below.',
    ],
    bullets: [
      'Technical data: your IP address, browser type, and device information, which are processed to establish connections, prevent abuse, and keep the Service secure.',
      'Device identifier: a random identifier generated in your browser and stored in local storage. It is used to enforce bans and prevent repeat abuse. It does not contain your name or any personal details.',
      'Preferences: choices such as your selected country and your confirmation that you are 18 or older, stored in your browser.',
      'Safety and moderation records: if a report is filed against a device, or a ban is applied, we store the device identifier, IP address, ban duration, reason, and a count of previous violations.',
    ],
  },
  {
    title: '3. Video, Audio, and Chat Messages',
    paragraphs: [
      'Video and audio streams are sent directly between users using peer-to-peer (WebRTC) technology and are encrypted in transit. We do not record, store, or monitor your video or audio.',
      'Text messages are relayed in real time and are not saved in our database. Once a conversation ends, the messages are no longer available to us. Messages may be automatically filtered, for example to block links and inappropriate words.',
      'Please remember that the other user can see and hear you, and could record the conversation using their own device. Never share personal, financial, or sensitive information with strangers.',
    ],
  },
  {
    title: '4. Reports and Moderation',
    paragraphs: [
      'When a user reports another user, a single still image from the reported video may be captured by the reporter\'s device and sent to our server together with the selected reason. This image may be analysed by an automated content-moderation provider to detect nudity or other prohibited content.',
    ],
    bullets: [
      'Report images are kept only in temporary server memory, for no more than 24 hours, so that they can be reviewed. They are not written to our database.',
      'Reports are reviewed automatically and, where necessary, by our moderators. Actions can include warnings and temporary or permanent bans.',
      'Content that appears to involve minors or other illegal activity may be disclosed to the appropriate authorities where required by law.',
    ],
  },
  {
    title: '5. How We Use Information',
    bullets: [
      'To connect you with other users and operate the Service.',
      'To detect, prevent, and respond to abuse, harassment, nudity, spam, and illegal activity.',
      'To enforce our Terms of Service, including bans and appeals.',
      'To maintain the security, stability, and performance of the Service.',
      'To comply with legal obligations and respond to lawful requests.',
    ],
    paragraphs: [
      'We do not sell your personal information, and we do not use it for targeted advertising.',
    ],
  },
  {
    title: '6. Local Storage and Cookies',
    paragraphs: [
      'We use your browser\'s local storage (and, where necessary, essential cookies) to remember your device identifier, age confirmation, and basic preferences. We do not use cookies for advertising or cross-site tracking. You can clear this data at any time through your browser settings; however, clearing it may require you to confirm your age again.',
    ],
  },
  {
    title: '7. Third-Party Services',
    paragraphs: [
      'We rely on trusted providers to operate the Service. These providers process data only as needed to perform their function:',
    ],
    bullets: [
      'TURN/relay service (Cloudflare): relays encrypted media when a direct connection is not possible. It cannot view or store your media.',
      'Hosting and infrastructure providers: host our website and servers.',
      'Database provider (MongoDB Atlas): stores safety and moderation records.',
      'Content-moderation provider: analyses report images to detect prohibited content.',
      'Authentication provider (Google Firebase): creates an anonymous guest session so that you can use the Service without registering.',
      'Image delivery (flagcdn.com): provides country flag images, which means your browser connects to that service when a flag is displayed.',
    ],
  },
  {
    title: '8. Data Retention',
    bullets: [
      'Video, audio, and chat messages: not stored.',
      'Report images: kept in temporary memory for up to 24 hours.',
      'Ban and moderation records: kept for as long as necessary to enforce bans, prevent repeat abuse, and meet legal obligations.',
      'Server and security logs: kept for a limited period for security and troubleshooting.',
    ],
  },
  {
    title: '9. Data Security',
    paragraphs: [
      'We use industry-standard measures, including encrypted connections (HTTPS and WebRTC encryption), access controls, and rate limiting, to protect the Service. No online service can be guaranteed to be completely secure, and we cannot promise absolute security.',
    ],
  },
  {
    title: '10. Age Requirement and Children\'s Privacy',
    paragraphs: [
      'Random Talk is intended only for adults aged 18 and over. We do not knowingly collect information from anyone under 18. If you believe a minor is using the Service, please contact us immediately so that we can take action.',
    ],
  },
  {
    title: '11. Your Rights and Choices',
    paragraphs: [
      'Depending on where you live, and in accordance with applicable data protection laws (including India\'s Digital Personal Data Protection Act, 2023, where applicable), you may request access to, correction of, or deletion of the personal data we hold about you. Because we do not require accounts, we may need your device identifier to locate any records related to you.',
      'If you believe a ban was applied in error, you may appeal by contacting us using the email below.',
    ],
  },
  {
    title: '12. International Data Transfers',
    paragraphs: [
      'Our servers and service providers may be located in countries other than your own. By using the Service, you understand that your information may be processed in those locations.',
    ],
  },
  {
    title: '13. Changes to This Policy',
    paragraphs: [
      'We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. Your continued use of the Service after a change means you accept the updated policy.',
    ],
  },
  {
    title: '14. Contact Us',
    paragraphs: [
      'If you have any questions, requests, or concerns about this Privacy Policy, or wish to appeal a ban, please contact us at:',
    ],
    email: true,
  },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: '#1a1a24',
    color: '#e6e6ea',
    padding: '40px 20px 60px',
  },
  wrap: { maxWidth: '820px', margin: '0 auto' },
  back: { color: '#ff8a9a', textDecoration: 'none', fontSize: '14px' },
  h1: { fontSize: '40px', fontWeight: 600, margin: '20px 0 8px', color: '#fff' },
  updated: { fontSize: '14px', color: '#b8b8c4', marginBottom: '32px' },
  h2: { fontSize: '22px', fontWeight: 500, color: '#ff7b8a', margin: '32px 0 10px' },
  p: { fontSize: '16px', lineHeight: 1.7, margin: '0 0 12px', color: '#dcdce2' },
  ul: { margin: '0 0 12px', paddingLeft: '22px' },
  li: { fontSize: '16px', lineHeight: 1.7, marginBottom: '8px', color: '#dcdce2' },
  email: { color: '#ff8a9a', fontWeight: 600 },
};

export default function Privacy() {
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <Link to="/" style={styles.back}>← Back to Random Talk</Link>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: {LAST_UPDATED}</p>

        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 style={styles.h2}>{s.title}</h2>
            {s.paragraphs?.map((text, i) => (
              <p key={i} style={styles.p}>{text}</p>
            ))}
            {s.bullets && (
              <ul style={styles.ul}>
                {s.bullets.map((b, i) => (
                  <li key={i} style={styles.li}>{b}</li>
                ))}
              </ul>
            )}
            {s.email && (
              <p style={styles.p}>
                <a href={`mailto:${CONTACT_EMAIL}`} style={styles.email}>{CONTACT_EMAIL}</a>
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}