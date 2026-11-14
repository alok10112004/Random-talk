import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'alok10112004@gmail.com'; // 
const LAST_UPDATED = 'November 2026';
const GOVERNING_LAW = 'India'; // 

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    paragraphs: [
      'These Terms of Service ("Terms") govern your access to and use of Random Talk ("we", "our", "the Service"), a free video and text chat platform that connects users at random. By accessing or using the Service, you confirm that you have read, understood, and agreed to these Terms and to our Privacy Policy. If you do not agree, you must not use the Service.',
    ],
  },
  {
    title: '2. Eligibility: Adults Only (18+)',
    paragraphs: [
      'The Service is intended exclusively for adults aged 18 or over. By using it, you represent and warrant that you are at least 18 years old (or the age of majority in your jurisdiction, if higher) and that you are legally able to enter into these Terms.',
      'We do not knowingly allow minors on the Service. If you believe that a minor is using the Service, please report the user immediately and contact us. Accounts, devices, or connections suspected to belong to minors may be blocked without notice.',
    ],
  },
  {
    title: '3. The Service',
    paragraphs: [
      'Random Talk pairs you with another user at random for a live video and text conversation. We do not create, select, or review the content of conversations, and we do not verify the identity, age, or location of any user. The country shown for a user is selected by that user and may not be accurate.',
      'You use the Service at your own risk and are responsible for your own conduct and for the decisions you make when interacting with strangers.',
    ],
  },
  {
    title: '4. Prohibited Conduct',
    paragraphs: ['When using the Service, you agree not to:'],
    bullets: [
      'Display, share, or request nudity, sexual acts, or sexually explicit or suggestive content of any kind.',
      'Engage in or promote any content involving minors in a sexual or harmful context. This is strictly prohibited and may be reported to the authorities.',
      'Harass, bully, threaten, stalk, intimidate, or abuse any other user, or use hate speech or discriminate on the basis of race, religion, gender, nationality, disability, sexual orientation, or any other characteristic.',
      'Show or promote violence, self-harm, terrorism, or any illegal activity.',
      'Record, screenshot, broadcast, or distribute another user\'s video, audio, or messages without their clear consent.',
      'Share personal information about yourself or others (such as phone numbers or addresses), or attempt to obtain such information from other users.',
      'Send spam, advertisements, scams, phishing attempts, or links, or promote products, services, or other websites.',
      'Impersonate another person, or provide false or misleading information.',
      'Use bots, scripts, or automated tools; attempt to disrupt, overload, or reverse-engineer the Service; or attempt to gain unauthorised access to any part of it.',
      'Evade or attempt to evade a ban or block, including by using VPNs, proxies, new devices, or by clearing stored data to return after you have been restricted.',
      'Misuse the reporting system, including by filing false, malicious, or repeated unfounded reports.',
    ],
  },
  {
    title: '5. Reporting and Moderation',
    paragraphs: [
      'Every user can report another user from within the Service. When a report is made, a still image from the reported video may be captured and analysed, automatically and by our moderators, to determine whether these Terms have been violated. See our Privacy Policy for how this information is handled.',
      'We use a combination of user reports, automated tools, and human review. These systems are not perfect, and we may make mistakes. We do not guarantee that every violation will be detected or that every user will behave appropriately.',
    ],
  },
  {
    title: '6. Warnings, Bans, and Appeals',
    paragraphs: [
      'If we determine, in our sole discretion, that you have violated these Terms, we may take action without prior notice. Actions may include:',
    ],
    bullets: [
      'Issuing a warning.',
      'Temporarily blocking your device or connection. The duration depends on the severity of the violation and your history, and increases for repeat violations.',
      'Permanently banning your device or connection for serious or repeated violations, including any conduct involving minors or sexual content.',
      'Reporting unlawful conduct to the relevant authorities.',
    ],
    paragraphs2: [
      'Because the Service does not use accounts, bans may be applied to a device identifier and/or an IP address. If you believe that a ban was applied in error, you may appeal by contacting us at the email address below and including the device identifier shown in your appeal message. We will review appeals in good faith but are not obliged to reverse any decision.',
    ],
  },
  {
    title: '7. Your Responsibilities and Safety',
    paragraphs: [
      'You are solely responsible for everything you say, show, or share on the Service. Other users can see and hear you and may record the conversation without your knowledge. Never share personal, financial, or sensitive information with strangers, and end any conversation that makes you uncomfortable by using the Next or Stop button.',
      'You are responsible for ensuring that your use of the Service complies with the laws that apply to you.',
    ],
  },
  {
    title: '8. Intellectual Property',
    paragraphs: [
      'The Service, including its name, logo, design, and software, is owned by us or our licensors and is protected by applicable intellectual property laws. You are granted a limited, personal, non-exclusive, non-transferable, revocable licence to use the Service in accordance with these Terms. You must not copy, modify, distribute, or create derivative works from any part of the Service without our written permission.',
    ],
  },
  {
    title: '9. Third-Party Services',
    paragraphs: [
      'The Service relies on third-party providers for functions such as hosting, relay (TURN) connections, databases, authentication, and content moderation. We are not responsible for the acts or omissions of these providers. Your use of the Service is also subject to our Privacy Policy.',
    ],
  },
  {
    title: '10. Disclaimer of Warranties',
    paragraphs: [
      'The Service is provided on an "as is" and "as available" basis, without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free, or that any content or user will meet your expectations. We do not endorse any user or any content shared on the Service.',
    ],
  },
  {
    title: '11. Limitation of Liability',
    paragraphs: [
      'To the fullest extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data, reputation, or profits, arising out of or in connection with your use of the Service or your interactions with other users. We are not responsible for the conduct of any user, whether online or offline. Nothing in these Terms excludes liability that cannot be excluded under applicable law.',
    ],
  },
  {
    title: '12. Indemnification',
    paragraphs: [
      'You agree to indemnify and hold us harmless from any claims, damages, losses, and expenses (including reasonable legal fees) arising out of your violation of these Terms, your misuse of the Service, or your violation of any law or the rights of another person.',
    ],
  },
  {
    title: '13. Suspension and Termination',
    paragraphs: [
      'We may suspend, restrict, or terminate access to the Service for any user, at any time and for any reason, including violations of these Terms, to protect other users, or to comply with legal requirements. You may stop using the Service at any time.',
    ],
  },
  {
    title: '14. Governing Law',
    paragraphs: [
      `These Terms are governed by and construed in accordance with the laws of ${GOVERNING_LAW}, without regard to its conflict-of-law principles. Any disputes arising from these Terms or the Service shall be subject to the jurisdiction of the competent courts of ${GOVERNING_LAW}, unless applicable law requires otherwise.`,
    ],
  },
  {
    title: '15. Changes to These Terms',
    paragraphs: [
      'We may update these Terms from time to time. When we do, we will revise the "Last updated" date at the top of this page. Your continued use of the Service after the changes take effect means that you accept the updated Terms.',
    ],
  },
  {
    title: '16. Contact Us',
    paragraphs: [
      'If you have questions about these Terms, wish to report a concern, or want to appeal a ban, please contact us at:',
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
  link: { color: '#ff8a9a', fontWeight: 600 },
};

export default function Terms() {
  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <Link to="/" style={styles.back}>← Back to Random Talk</Link>
        <h1 style={styles.h1}>Terms of Service</h1>
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
            {s.paragraphs2?.map((text, i) => (
              <p key={`b${i}`} style={styles.p}>{text}</p>
            ))}
            {s.email && (
              <p style={styles.p}>
                <a href={`mailto:${CONTACT_EMAIL}`} style={styles.link}>{CONTACT_EMAIL}</a>
              </p>
            )}
            {s.title.startsWith('1.') && (
              <p style={styles.p}>
                Please also read our <Link to="/privacy" style={styles.link}>Privacy Policy</Link>.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}