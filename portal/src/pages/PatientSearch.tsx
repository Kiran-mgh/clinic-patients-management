import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, User } from 'lucide-react';

interface PatientSearchProps {
  token: string | null;
}

/**
 * 1. Sanitization: All non-digit characters are stripped out.
 * 2. Structure: Input is automatically formatted into YYYY-MM-DD.
 * 3. Year validation: Typing a year in the future corrects it to the current year.
 * 4. Month validation: Entering a first digit > 1 auto-prefixes a '0'; entering > 12 caps it to 12.
 * 5. Day validation: Entering a first digit > 3 auto-prefixes a '0'; entering a day > max days for the month caps it to the limit (accounting for leap years).
 * 6. Bounds: The input automatically limits to 10 characters (YYYY-MM-DD format).
 */
const formatDob = (text: string, prevValue: string = '') => {
  const isDeleting = text.length < prevValue.length;
  let cleaned = text.replace(/\D/g, '');
  
  // 1. Validate Year (cannot be in the future)
  if (cleaned.length >= 4) {
    let year = parseInt(cleaned.slice(0, 4), 10);
    const currentYear = new Date().getFullYear();
    if (year > currentYear) {
      year = currentYear;
    } else if (year < 1900 && cleaned.slice(0, 4).length === 4) {
      if (year === 0) year = 1900;
    }
    cleaned = year.toString().padStart(4, '0') + cleaned.slice(4);
  }

  // 2. Validate Month (01 to 12)
  if (cleaned.length >= 5) {
    let monthPart = cleaned.slice(4, 6);
    if (monthPart.length === 1) {
      const firstDigit = parseInt(monthPart, 10);
      if (firstDigit > 1) {
        monthPart = '0' + monthPart;
        cleaned = cleaned.slice(0, 4) + monthPart + cleaned.slice(5);
      }
    } else if (monthPart.length === 2) {
      let month = parseInt(monthPart, 10);
      if (month < 1) month = 1;
      if (month > 12) month = 12;
      cleaned = cleaned.slice(0, 4) + month.toString().padStart(2, '0') + cleaned.slice(6);
    }
  }

  // 3. Validate Day (01 to max days in month)
  if (cleaned.length >= 7) {
    let dayPart = cleaned.slice(6, 8);
    if (dayPart.length === 1) {
      const firstDigit = parseInt(dayPart, 10);
      if (firstDigit > 3) {
        dayPart = '0' + dayPart;
        cleaned = cleaned.slice(0, 6) + dayPart + cleaned.slice(7);
      }
    } else if (dayPart.length === 2) {
      let day = parseInt(dayPart, 10);
      if (day < 1) day = 1;
      
      const year = parseInt(cleaned.slice(0, 4), 10);
      const month = parseInt(cleaned.slice(4, 6), 10);
      let maxDays = 31;
      if (month === 2) {
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        maxDays = isLeap ? 29 : 28;
      } else if ([4, 6, 9, 11].includes(month)) {
        maxDays = 30;
      }
      
      if (day > maxDays) day = maxDays;
      cleaned = cleaned.slice(0, 6) + day.toString().padStart(2, '0');
    }
  }

  cleaned = cleaned.slice(0, 8);

  let formatted = '';
  if (cleaned.length > 0) {
    formatted += cleaned.slice(0, 4);
  }
  
  if (cleaned.length >= 4) {
    const wasDeletingHyphen1 = isDeleting && prevValue.length === 5 && prevValue.endsWith('-');
    if (!wasDeletingHyphen1) {
      formatted += '-';
    }
  }
  
  if (cleaned.length > 4) {
    formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6);
    if (cleaned.length >= 6) {
      const wasDeletingHyphen2 = isDeleting && prevValue.length === 8 && prevValue.endsWith('-');
      if (!wasDeletingHyphen2) {
        formatted += '-';
      }
    }
  }
  
  if (cleaned.length > 6) {
    formatted = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 6) + '-' + cleaned.slice(6, 8);
  }
  
  return formatted;
};

export const PatientSearch: React.FC<PatientSearchProps> = ({ token }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const handlePatientClick = async (p: any) => {
    setSelectedPatient(p);
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await api.get(`/patients/${p.id}/detail`, token);
      setSelectedPatient(data);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load patient history');
    } finally {
      setDetailLoading(false);
    }
  };

  // Registration form states
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newGender, setNewGender] = useState('');
  const [newDateOfBirth, setNewDateOfBirth] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newBloodGroup, setNewBloodGroup] = useState('');
  const [newProfession, setNewProfession] = useState('');
  const [newTown, setNewTown] = useState('');
  const [newIsExisting, setNewIsExisting] = useState(false);
  const [newExistingPatientId, setNewExistingPatientId] = useState('');

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load all patients on component mount
  const fetchPatients = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/patients/search?query=${encodeURIComponent(searchQuery)}`, token);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients registry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(query);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim() === '') {
      fetchPatients(''); // Restore full list when input is cleared
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Input Validations
    const trimmedMobile = newMobileNumber.trim();
    if (!/^\d{10}$/.test(trimmedMobile) && trimmedMobile !== '+919999999999') {
      setFormError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!newFullName.trim()) {
      setFormError('Full name is required.');
      return;
    }

    if (!newGender) {
      setFormError('Gender is required.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDateOfBirth)) {
      setFormError('Date of birth must match YYYY-MM-DD format.');
      return;
    }

    if (newEmail.trim() && !/\S+@\S+\.\S+/.test(newEmail)) {
      setFormError('Invalid email address format.');
      return;
    }



    if (!newTown.trim()) {
      setFormError('Town/Residence is required.');
      return;
    }

    if (newIsExisting && newExistingPatientId.trim() && !/^AH\d{6}$/i.test(newExistingPatientId.trim())) {
      setFormError('Existing Patient ID must be in format AHXXXXXX (e.g., AH000001).');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        mobileNumber: trimmedMobile,
        fullName: newFullName.trim(),
        gender: newGender,
        dateOfBirth: newDateOfBirth,
        email: newEmail.trim() || undefined,
        bloodGroup: newBloodGroup || undefined,
        profession: newProfession.trim(),
        town: newTown.trim(),
        isExisting: newIsExisting,
        existingPatientId: newIsExisting && newExistingPatientId.trim() ? newExistingPatientId.trim().toUpperCase() : undefined
      };

      const result = await api.post('/patients/create', payload, token);
      
      setFormSuccess(`Successfully registered patient ${result.fullName} with ID ${result.patientId || 'Pending'}!`);
      
      // Clear form
      setNewMobileNumber('');
      setNewFullName('');
      setNewGender('');
      setNewDateOfBirth('');
      setNewEmail('');
      setNewBloodGroup('');
      setNewProfession('');
      setNewTown('');
      setNewIsExisting(false);
      setNewExistingPatientId('');
      
      // Hide form after a short delay
      setTimeout(() => {
        setShowRegisterForm(false);
        setFormSuccess('');
      }, 3000);

      // Refresh registry
      fetchPatients(query);
    } catch (err: any) {
      setFormError(err.message || 'Registration failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Patient Search Registry</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Look up active, pending, or historical patient files.</p>
        </div>
        <button
          onClick={() => {
            setShowRegisterForm(!showRegisterForm);
            setFormError('');
            setFormSuccess('');
          }}
          className="btn btn-primary"
          style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {showRegisterForm ? 'Close Registration' : 'Register New Patient'}
        </button>
      </div>

      {showRegisterForm && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>Register New Patient Profile</h3>
          
          {formError && (
            <div style={{
              backgroundColor: 'hsla(350, 65%, 44%, 0.06)',
              border: '1px solid hsla(350, 65%, 44%, 0.15)',
              color: 'hsl(var(--danger))',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              {formError}
            </div>
          )}

          {formSuccess && (
            <div style={{
              backgroundColor: 'hsla(150, 55%, 32%, 0.06)',
              border: '1px solid hsla(150, 55%, 32%, 0.15)',
              color: 'hsl(var(--success))',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem'
            }}>
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sujith Pillai"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  maxLength={10}
                  value={newMobileNumber}
                  onChange={(e) => setNewMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Gender *</label>
                <select
                  required
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Date of Birth *</label>
                <input
                  type="text"
                  required
                  placeholder="YYYY-MM-DD"
                  maxLength={10}
                  value={newDateOfBirth}
                  onChange={(e) => setNewDateOfBirth(formatDob(e.target.value, newDateOfBirth))}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Blood Group</label>
                <select
                  value={newBloodGroup}
                  onChange={(e) => setNewBloodGroup(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Profession (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Teacher"
                  value={newProfession}
                  onChange={(e) => setNewProfession(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Town / Residence *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Palakkad"
                  value={newTown}
                  onChange={(e) => setNewTown(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                />
              </div>

            </div>

            <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="isExistingCheckbox"
                  checked={newIsExisting}
                  onChange={(e) => setNewIsExisting(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="isExistingCheckbox" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: '#1a202c' }}>
                  Patient has existing physical card/record at clinic
                </label>
              </div>

              {newIsExisting && (
                <div className="form-group animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '300px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Existing Patient ID (e.g. AH000001)</label>
                  <input
                    type="text"
                    placeholder="AHXXXXXX"
                    value={newExistingPatientId}
                    onChange={(e) => setNewExistingPatientId(e.target.value)}
                    style={{ borderRadius: '8px', border: '1px solid hsl(var(--border-color))', padding: '10px 12px', background: 'none', color: '#1a202c' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Leave blank to auto-generate sequential patient ID.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowRegisterForm(false)}
                disabled={formSubmitting}
                style={{ padding: '10px 24px', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formSubmitting}
                style={{ padding: '10px 32px', borderRadius: '8px' }}
              >
                {formSubmitting ? 'Registering...' : 'Register Profile'}
              </button>
            </div>
          </form>
        </div>
      )}



      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'hsl(var(--bg-secondary))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '12px',
          padding: '12px 16px',
          flexGrow: 1
        }}>
          <Search size={20} style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            type="text"
            placeholder="Search by Patient ID (e.g. AH000001), Full Name, or Mobile Number..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: '#1a202c', fontSize: '1rem', width: '100%' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 32px', borderRadius: '12px' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{
          backgroundColor: 'hsla(350, 65%, 44%, 0.06)',
          border: '1px solid hsla(350, 65%, 44%, 0.15)',
          color: 'hsl(var(--danger))',
          padding: '12px 16px',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {/* Results grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Results */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>Patients Registry ({results.length})</h3>

          {loading && results.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))' }}>Searching records...</p>
          ) : results.length === 0 ? (
            <p style={{ color: 'hsl(var(--text-muted))' }}>No matching patient profiles found in the registry.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => (
                    <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => handlePatientClick(p)}>
                      <td>
                        <strong style={{ color: 'hsl(var(--primary))', fontFamily: 'Outfit' }}>{p.patientId || 'Pending'}</strong>
                      </td>
                      <td>{p.fullName}</td>
                      <td>{p.user?.mobileNumber}</td>
                      <td>
                        <span className={`badge badge-${p.status}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Detail card */}
        <div className="glass-card">
          {selectedPatient ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ padding: '12px', background: 'hsla(var(--primary) / 0.08)', color: 'hsl(var(--primary))', borderRadius: '12px' }}>
                  <User size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedPatient.fullName}</h3>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>ID: {selectedPatient.patientId || 'Unassigned'}</span>
                    <span className={`badge badge-${selectedPatient.status}`}>{selectedPatient.status}</span>
                  </div>
                </div>
              </div>

              {/* Details table */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                background: 'hsl(var(--bg-primary))',
                borderRadius: '12px',
                fontSize: '0.9rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '8px' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Mobile:</span>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.user?.mobileNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '8px' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Gender:</span>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.gender}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '8px' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Date of Birth:</span>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.dateOfBirth}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '8px' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Town/Residence:</span>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.town}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '8px' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Profession:</span>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.profession}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                  <span style={{ color: 'hsl(var(--text-muted))' }}>Blood Group:</span>
                  <span style={{ fontWeight: 600 }}>{selectedPatient.bloodGroup || 'Not Specified'}</span>
                </div>
              </div>

              {/* Visit History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>Visit History & Service Records</h4>
                {detailLoading ? (
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', fontStyle: 'italic' }}>Loading visit history...</p>
                ) : detailError ? (
                  <p style={{ color: 'hsl(var(--danger))', fontSize: '0.9rem' }}>{detailError}</p>
                ) : selectedPatient.tokens && selectedPatient.tokens.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {selectedPatient.tokens.map((t: any, index: number) => {
                      const dateStr = new Date(t.generatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      return (
                        <div key={t.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: index === 0 ? 'hsla(150, 55%, 32%, 0.05)' : 'hsl(var(--bg-primary))',
                          border: index === 0 ? '1px solid hsla(150, 55%, 32%, 0.15)' : '1px solid hsl(var(--border-color))',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              Token {t.tokenNumber}
                              {index === 0 && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'hsl(var(--success))', background: 'hsla(150, 55%, 32%, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                  LATEST
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                              {dateStr}
                            </div>
                            {t.notes && (
                              <div style={{
                                fontSize: '0.8rem',
                                color: 'hsl(var(--text-primary))',
                                marginTop: '6px',
                                padding: '6px 10px',
                                background: 'hsl(var(--bg-secondary) / 0.4)',
                                borderLeft: '3px solid hsl(var(--primary))',
                                borderRadius: '4px',
                                fontStyle: 'italic',
                                maxWidth: '300px'
                              }}>
                                <strong>Notes:</strong> {t.notes}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
                              {t.serviceType}
                            </span>
                            <span className={`badge badge-${t.status}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                              {t.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    No previous clinic visits recorded in the system.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--text-muted))',
              textAlign: 'center',
              padding: '24px'
            }}>
              Select a patient from search results to view their full file details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
