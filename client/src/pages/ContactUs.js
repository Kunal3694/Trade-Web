import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

const DEFAULT_CONTACT = {
    email: 'support@smartsip.com',
    phone: '+91 88797 53917',
    address: '123 Financial District, Trading Tower',
    supportText: 'If you have any questions, need support, or have generic inquiries, feel free to reach out to our administration team.'
};

const ContactUs = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const fromLogin = searchParams.get('from') === 'login';

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    const isAdmin = userInfo?.user?.role?.toLowerCase() === 'admin';
    const isLoggedIn = !!userInfo;

    const [contact, setContact] = useState(DEFAULT_CONTACT);
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState(DEFAULT_CONTACT);
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchContact = async () => {
            try {
                // Public endpoint - returns shared contact details for everyone
                const { data } = await api.get('/contact');
                if (data && (data.email || data.phone)) {
                    setContact({ ...DEFAULT_CONTACT, ...data });
                    setForm({ ...DEFAULT_CONTACT, ...data });
                }
            } catch (error) {
                console.warn('Could not fetch contact details:', error.message);
            }
        };
        fetchContact();
    }, []);

    const handleEdit = () => {
        setForm(contact);
        setIsEditing(true);
        setMessage('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Admin-only PUT endpoint saves to DB Contact collection
            const { data } = await api.put('/contact', form);
            setContact({ ...DEFAULT_CONTACT, ...data });
            setIsEditing(false);
            setMessage('Contact details updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Save error:', error.response || error.message);
            const errMsg = error.response?.data?.msg || error.response?.data?.message || error.message || 'Save failed';
            setMessage(`Error: ${errMsg}`);
        } finally {
            setSaving(false);
        }
    };


    const inputStyle = {
        width: '100%', padding: '10px', marginBottom: '15px',
        border: '1px solid var(--border)', borderRadius: '6px',
        background: 'var(--bg-body)', color: 'var(--text-main)', outline: 'none'
    };

    const content = (
        <div style={{ padding: isLoggedIn && !fromLogin ? '0' : '2rem' }}>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: '0', color: 'var(--primary)' }}>
                        <i className="fas fa-headset" style={{ marginRight: '10px' }}></i>
                        Get in Touch
                    </h2>
                    {isAdmin && (
                        <button className="btn btn-primary" onClick={handleEdit} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                            <i className="fas fa-edit"></i> Edit Info
                        </button>
                    )}
                </div>

                {message && !isEditing && (
                    <div style={{
                        padding: '10px', marginBottom: '1rem', borderRadius: '6px',
                        background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: message.includes('Error') ? 'var(--danger)' : 'var(--success)',
                        fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    {contact.supportText}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                            <i className="fas fa-envelope"></i>
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>Email Support</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{contact.email}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                            <i className="fas fa-phone-alt"></i>
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>Phone</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{contact.phone}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                            <i className="fas fa-map-marker-alt"></i>
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem' }}>Headquarters</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{contact.address}</p>
                        </div>
                    </div>
                </div>

                {(!isLoggedIn || fromLogin) && (
                    <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                        <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ padding: '8px 20px' }}>
                            <i className="fas fa-arrow-left"></i> Back to Login
                        </button>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditing && isAdmin && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px',
                        width: '100%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Contact Info</h3>

                        {message && isEditing && (
                            <div style={{
                                padding: '10px', marginBottom: '1rem', borderRadius: '6px',
                                background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                color: message.includes('Error') ? 'var(--danger)' : 'var(--success)',
                                fontSize: '0.9rem', textAlign: 'center'
                            }}>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Email Address</label>
                            <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Phone Number</label>
                            <input style={inputStyle} type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Headquarters Address</label>
                            <input style={inputStyle} type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Support Text (Subtitle)</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                value={form.supportText}
                                onChange={e => setForm({ ...form, supportText: e.target.value })}
                                required
                            />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" className="btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                    onClick={() => { setIsEditing(false); setForm(contact); setMessage(''); }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    if (!isLoggedIn || fromLogin) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-body)' }}>
                {content}
            </div>
        );
    }

    return <Layout title="Contact Us">{content}</Layout>;
};

export default ContactUs;
