import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', fontFamily: 'sans-serif', lineHeight: 1.6, color: '#333' }}>
      <h1 style={{ color: 'hsl(155, 30%, 20%)', fontSize: '2rem', marginBottom: '8px' }}>Privacy Policy</h1>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>Last updated: July 25, 2026</p>
      
      <section style={{ marginTop: '24px' }}>
        <h2>1. Introduction</h2>
        <p>Welcome to <strong>Amar Ayurveda</strong>. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our mobile application and web portal.</p>

        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us when registering an account, generating clinic tokens, or communicating with us. This includes:</p>
        <ul>
          <li><strong>Personal Details:</strong> Full Name, Date of Birth, Gender, Town/Residence Area, Profession, and Blood Group.</li>
          <li><strong>Contact Details:</strong> Mobile Number and Email Address.</li>
          <li><strong>Account Data:</strong> Encrypted authentication credentials.</li>
        </ul>

        <h3>2. How We Use Your Information</h3>
        <p>We use the collected data solely for healthcare operational purposes:</p>
        <ul>
          <li>To generate daily consultation tokens and manage real-time clinic queue status.</li>
          <li>To verify patient identity and link digital registrations with clinic medical records.</li>
          <li>To send password reset security codes and essential notification updates.</li>
        </ul>

        <h3>3. Data Sharing & Security</h3>
        <p>We implement strict administrative, technical, and physical security measures to protect your personal information against unauthorized access, disclosure, or alteration. We do <strong>NOT</strong> sell, trade, or share your personal information with third-party marketers.</p>

        <h3>4. Contact Us</h3>
        <p>If you have any questions or concerns regarding this Privacy Policy, please contact us at:</p>
        <p><strong>Amar Ayurveda</strong><br />Email: privacy@amarhospital.com<br />Website: https://amar.vistarafabtech.com</p>
      </section>
    </div>
  );
};
