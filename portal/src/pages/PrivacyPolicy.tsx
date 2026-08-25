import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif', lineHeight: 1.6, color: '#334155' }}>
      <h1 style={{ color: '#064e3b', fontSize: '2rem', marginBottom: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
        <strong>Amar Ayurveda (A Unit of Amar Hospital)</strong> — Last updated: August 26, 2026
      </p>
      
      <section>
        <h2 style={{ color: '#047857', fontSize: '1.25rem', marginTop: '20px' }}>1. Introduction</h2>
        <p>
          Welcome to <strong>Amar Ayurveda (A Unit of Amar Hospital)</strong>. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application and web portal.
        </p>

        <h2 style={{ color: '#047857', fontSize: '1.25rem', marginTop: '20px' }}>2. Information We Collect</h2>
        <p>We collect information you provide directly to us when registering an account, generating clinic tokens, or updating your profile. This includes:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Personal Details:</strong> Full Name, Date of Birth, Gender, Town/Residence Area, Profession, and Blood Group.</li>
          <li><strong>Contact Details:</strong> Mobile Phone Number and Email Address.</li>
          <li><strong>Notification & Device Data:</strong> Push notification tokens for delivering real-time queue turn and proximity warnings.</li>
          <li><strong>Account Data:</strong> Encrypted authentication credentials and OTP verification session tokens.</li>
        </ul>

        <h2 style={{ color: '#047857', fontSize: '1.25rem', marginTop: '20px' }}>3. How We Use Your Information</h2>
        <p>We use the collected data solely for healthcare operational and queue management purposes:</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li>To generate daily consultation tokens and manage real-time clinic queue status.</li>
          <li>To verify patient identity and link digital registrations with clinic medical records.</li>
          <li>To send SMS/Email OTP verification codes and real-time push notification turn alerts.</li>
        </ul>

        <h2 style={{ color: '#047857', fontSize: '1.25rem', marginTop: '20px' }}>4. Data Sharing & Security</h2>
        <p>
          We implement strict administrative, technical, and physical security measures (including SSL/TLS encryption) to protect your personal information. We do <strong>NOT</strong> sell, trade, or share your personal health data or contact information with third-party advertisers or marketers.
        </p>

        <h2 style={{ color: '#047857', fontSize: '1.25rem', marginTop: '20px' }}>5. Data Retention & Account Deletion Rights</h2>
        <p>
          Your data is retained for as long as your account remains active. You may request account or profile data deletion at any time by contacting clinic reception or emailing <a href="mailto:no-reply@amarayurveda.in" style={{ color: '#047857', fontWeight: 600 }}>no-reply@amarayurveda.in</a>.
        </p>

        <h2 style={{ color: '#047857', fontSize: '1.25rem', marginTop: '20px' }}>6. Contact Us</h2>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
          <p style={{ margin: 0 }}>
            <strong>Amar Ayurveda (A Unit of Amar Hospital)</strong><br />
            #226/4, 7th Cross, R.T. Street, Bengaluru - 560053<br />
            <strong>Email:</strong> <a href="mailto:no-reply@amarayurveda.in" style={{ color: '#047857' }}>no-reply@amarayurveda.in</a><br />
            <strong>Website:</strong> <a href="https://amarayurveda.in" target="_blank" rel="noopener noreferrer" style={{ color: '#047857' }}>https://amarayurveda.in</a>
          </p>
        </div>
      </section>
    </div>
  );
};
