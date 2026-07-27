import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif', lineHeight: 1.6, color: '#333' }}>
      <h1 style={{ color: 'hsl(155, 30%, 20%)', fontSize: '2rem', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>Last updated: July 25, 2026</p>
      
      <section style={{ marginTop: '24px' }}>
        <h2>1. Introduction</h2>
        <p>Welcome to <strong>Amar Hospital (Amar Ayurveda)</strong>. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application and web portal.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>2. Information We Collect</h2>
        <p>We collect essential information to provide healthcare management services, including:</p>
        <ul>
          <li>Mobile phone numbers (for OTP authentication and token notifications)</li>
          <li>Patient names and basic registration details</li>
          <li>Clinic queue tokens and appointment schedules</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>3. How We Use Your Information</h2>
        <p>Your information is strictly used for:</p>
        <ul>
          <li>Authenticating your identity via OTP (SMS and WhatsApp)</li>
          <li>Issuing and managing clinic queue tokens</li>
          <li>Sending real-time consultation notifications</li>
        </ul>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>4. Data Protection & Security</h2>
        <p>We implement industry-standard encryption protocols (SSL/TLS, JWT authentication, and secure database storage) to ensure your data remains confidential and protected.</p>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>5. Contact Us</h2>
        <p>If you have any questions regarding this Privacy Policy, please contact us at:</p>
        <p><strong>Amar Hospital (Amar Ayurveda)</strong><br />Email: privacy@amarhospital.com<br />Website: https://amar.vistarafabtech.com</p>
      </section>
    </div>
  );
};
