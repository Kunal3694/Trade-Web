import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('adminTheme') === 'dark');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Live Database State
    const [users, setUsers] = useState([]);
    const [masterTrades, setMasterTrades] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [ledger, setLedger] = useState([]);
    const [currentTrades, setCurrentTrades] = useState([]);

    // Pop-up Visibility State
    const [showUserModal, setShowUserModal] = useState(false);
    const [showTradeModal, setShowTradeModal] = useState(false);

    // Trade Details Modal
    const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
    const [detailsTrade, setDetailsTrade] = useState(null);
    const [tradeDetailsAllocations, setTradeDetailsAllocations] = useState([]);

    // Allocation & Close Modals
    const [showAllocateModal, setShowAllocateModal] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [allocationInputs, setAllocationInputs] = useState([]);

    const [showCloseModal, setShowCloseModal] = useState(false);
    const [closePrice, setClosePrice] = useState('');

    // Form States
    const [newUser, setNewUser] = useState({ user_name: '', mob_num: '', password: '', percentage: '', current_balance: 100000 });
    const [newTrade, setNewTrade] = useState({ symbol: '', total_qty: '', buy_price: '' });

    useEffect(() => {
        if (darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('adminTheme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('adminTheme', 'light');
        }
    }, [darkMode]);

    const fetchDashboardData = async () => {
        try {
            const [usersRes, tradesRes, allocRes, ledgerRes] = await Promise.all([
                api.get('/users'),
                api.get('/trades'),
                api.get('/trades/allocations'),
                api.get('/ledger')
            ]);
            setUsers(usersRes.data);
            setMasterTrades(tradesRes.data);
            setAllocations(allocRes.data);
            setLedger(ledgerRes.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate('/login');
            }
        }
    };

    const fetchCurrentTable = async () => {
        try {
            const res = await api.get('/trades/current');
            setCurrentTrades(res.data);
        } catch (error) {
            console.error("Error fetching current table", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (activeTab === 'current_tbl') {
            fetchCurrentTable();
            const interval = setInterval(fetchCurrentTable, 10000); // refresh every 10s
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users/create', newUser);
            alert("User created successfully!");
            setNewUser({ user_name: '', mob_num: '', password: '', percentage: '', current_balance: 100000 });
            setShowUserModal(false);
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.msg || "Error creating user");
        }
    };

    const handleCreateTrade = async (e) => {
        e.preventDefault();
        try {
            await api.post('/trades', newTrade);
            alert("Master Trade Executed!");
            setNewTrade({ symbol: '', total_qty: '', buy_price: '' });
            setShowTradeModal(false);
            fetchDashboardData();
        } catch (error) {
            alert("Error creating trade");
        }
    };

    const openTradeDetails = async (trade) => {
        setDetailsTrade(trade);
        try {
            const res = await api.get(`/trades/${trade._id}/allocations`);
            setTradeDetailsAllocations(res.data);
            setShowTradeDetailsModal(true);
        } catch (error) {
            alert("Error fetching trade details.");
        }
    };

    // ----- Allocation Logic -----
    const openAllocateModal = (trade) => {
        setSelectedTrade(trade);
        // Pre-fill allocation based on user percentages
        const defaultAllocations = users
            .filter(u => u.status === 'active' && u.percentage > 0)
            .map(u => ({
                mob_num: u.mob_num,
                name: u.user_name,
                allocation_qty: Math.floor(trade.total_qty * (u.percentage / 100))
            }));
        setAllocationInputs(defaultAllocations);
        setShowAllocateModal(true);
    };

    const handleAllocationQtyChange = (mob_num, qty) => {
        setAllocationInputs(prev =>
            prev.map(a => a.mob_num === mob_num ? { ...a, allocation_qty: Number(qty) } : a)
        );
    };

    const submitAllocation = async () => {
        setIsSubmitting(true);
        try {
            const totalAllocated = allocationInputs.reduce((sum, a) => sum + a.allocation_qty, 0);
            if (totalAllocated > selectedTrade.total_qty) {
                alert("Cannot allocate more than Master Trade Quantity!");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                allocations: allocationInputs.filter(a => a.allocation_qty > 0)
            };

            await api.post(`/trades/${selectedTrade._id}/allocate`, payload);
            alert("Allocations successful!");
            setShowAllocateModal(false);
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || "Error allocating");
        }
        setIsSubmitting(false);
    };

    // ----- Close Trade Logic -----
    const openCloseModal = (trade) => {
        setSelectedTrade(trade);
        setClosePrice('');
        setShowCloseModal(true);
    };

    const submitCloseTrade = async () => {
        setIsSubmitting(true);
        try {
            await api.post(`/trades/${selectedTrade._id}/close`, { sell_price: Number(closePrice) });
            alert("Trade closed successfully! Ledger updated.");
            setShowCloseModal(false);
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || "Error closing trade");
        }
        setIsSubmitting(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const doughnutData = {
        labels: users.map(u => u.user_name).slice(0, 4),
        datasets: [{
            data: users.map(u => u.percentage).slice(0, 4),
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0
        }]
    };

    const thStyle = { padding: '12px', borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' };
    const tdStyle = { padding: '14px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' };
    const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-body)', color: 'var(--text-main)' };

    // Modal Overlay Styles
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000
    };
    const modalContentStyle = {
        background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px',
        width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        maxHeight: '90vh', overflowY: 'auto'
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'user_detail':
                return (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>User Details Directory</h2>
                            <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
                                <i className="fas fa-plus"></i> Create User
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Client ID</th>
                                        <th style={thStyle}>Name</th>
                                        <th style={thStyle}>Mobile Num</th>
                                        <th style={thStyle}>Alloc %</th>
                                        <th style={thStyle}>Current Balance</th>
                                        <th style={thStyle}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.role !== 'admin').map(u => (
                                        <tr key={u._id}>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--primary)' }}>{u.client_id}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{u.user_name}</td>
                                            <td style={tdStyle}>{u.mob_num}</td>
                                            <td style={tdStyle}>{u.percentage}%</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace' }}>₹ {(u.current_balance || 0).toLocaleString()}</td>
                                            <td style={tdStyle}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', background: u.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: u.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                                                    {u.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'master_tbl':
                return (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>Master Trade Book</h2>
                            <button className="btn btn-primary" onClick={() => setShowTradeModal(true)}>
                                <i className="fas fa-plus"></i> Take Trade
                            </button>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Master ID</th>
                                        <th style={thStyle}>Symbol</th>
                                        <th style={thStyle}>Qty</th>
                                        <th style={thStyle}>Buy Price</th>
                                        <th style={thStyle}>Total Cost</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {masterTrades.map(t => (
                                        <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => openTradeDetails(t)}>
                                            <td style={tdStyle}>{new Date(t.buy_timestamp).toLocaleDateString()}</td>
                                            <td style={{ ...tdStyle, fontSize: '0.8rem', fontFamily: 'monospace' }}>{t.master_trade_id}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{t.symbol}</td>
                                            <td style={tdStyle}>{t.total_qty}</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace' }}>₹ {(t.buy_price || 0).toFixed(2)}</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 'bold' }}>₹ {(t.total_cost || 0).toLocaleString()}</td>
                                            <td style={tdStyle}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', background: t.status === 'CLOSED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: t.status === 'CLOSED' ? 'var(--danger)' : 'var(--success)' }}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                                                {t.status === 'OPEN' && (
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        {!t.allocation_tab && (
                                                            <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => openAllocateModal(t)}>Allocate</button>
                                                        )}
                                                        <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => openCloseModal(t)}>Close</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'current_tbl':
                return (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem' }}>Current Open Positions (Live via Yahoo Finance API)</h2>
                            <button className="btn" onClick={fetchCurrentTable}>
                                <i className="fas fa-sync"></i> Refresh
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Symbol</th>
                                        <th style={thStyle}>Total Qty</th>
                                        <th style={thStyle}>Avg Buy Price</th>
                                        <th style={thStyle}>CMP (Live)</th>
                                        <th style={thStyle}>Unrealized P/L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentTrades.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No open trades or fetching data...</td></tr>
                                    ) : currentTrades.map(t => (
                                        <tr key={t.master_trade_id}>
                                            <td style={tdStyle}>{new Date(t.date).toLocaleString()}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{t.symbol}</td>
                                            <td style={tdStyle}>{t.total_qty}</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace' }}>₹{t.buy_price.toFixed(2)}</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 'bold' }}>₹{t.current_price.toFixed(2)}</td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 'bold', color: t.unrealized_pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {t.unrealized_pnl >= 0 ? '+' : ''}₹{t.unrealized_pnl.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'allocation_tbl':
                return (
                    <div className="card">
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Trade Allocations</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Alloc ID</th>
                                        <th style={thStyle}>Symbol</th>
                                        <th style={thStyle}>User Mobile</th>
                                        <th style={thStyle}>Qty</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Client P&L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allocations.map(a => (
                                        <tr key={a._id}>
                                            <td style={tdStyle}>{new Date(a.buy_timestamp).toLocaleDateString()}</td>
                                            <td style={{ ...tdStyle, fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--primary)' }}>{a.allocation_id}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{a.master_trade_id?.symbol}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{a.mob_num}</td>
                                            <td style={tdStyle}>{a.allocation_qty}</td>
                                            <td style={tdStyle}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', background: a.status === 'CLOSED' ? 'rgba(239,68,68,0.1)' : 'rgba(79,70,229,0.1)', color: a.status === 'CLOSED' ? 'var(--danger)' : 'var(--primary)' }}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td style={{ ...tdStyle, fontFamily: 'monospace', color: a.client_pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                {a.status === 'CLOSED' ? `₹${a.client_pnl}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'gl_ledger':
                return (
                    <div className="card">
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Global Ledger</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>Timestamp</th>
                                        <th style={thStyle}>User Mobile</th>
                                        <th style={thStyle}>Description</th>
                                        <th style={thStyle}>Credit</th>
                                        <th style={thStyle}>Debit</th>
                                        <th style={thStyle}>Closing Bal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.map(l => (
                                        <tr key={l._id}>
                                            <td style={tdStyle}>{new Date(l.entry_date).toLocaleString()}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold' }}>{l.mob_num}</td>
                                            <td style={tdStyle}>{l.description}</td>
                                            <td style={{ ...tdStyle, color: 'var(--success)', fontFamily: 'monospace' }}>{l.amt_cr > 0 ? `₹ ${l.amt_cr.toLocaleString()}` : '-'}</td>
                                            <td style={{ ...tdStyle, color: 'var(--danger)', fontFamily: 'monospace' }}>{l.amt_dr > 0 ? `₹ ${l.amt_dr.toLocaleString()}` : '-'}</td>
                                            <td style={{ ...tdStyle, fontWeight: 'bold', fontFamily: 'monospace' }}>₹ {(l.cls_balance || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="admin-grid-container">
                        <div className="card admin-grid-span" style={{ minHeight: '180px', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-card)', borderLeft: '5px solid var(--primary)' }}>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-main)', textAlign: 'center' }}>MASTER TRADE OF CURRENT WEEK</h2>
                            <p className="text-muted" style={{ fontWeight: '500' }}>(API for NIFTY INDEX) Live</p>
                            <div style={{ marginTop: '15px', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                22,450.50 <span style={{ fontSize: '1.2rem', color: 'var(--success)', marginLeft: '10px' }}><i className="fas fa-arrow-up"></i> +120.40</span>
                            </div>
                        </div>
                        <div className="card" style={{ minHeight: '350px' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Details & Data Flow</h3>
                            <div style={{ padding: '1rem', background: 'var(--bg-body)', borderRadius: '8px', border: '1px dashed var(--border)', flexGrow: 1, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                                <p className="text-muted">Select a client or trade from the master table to populate data flow details here...</p>
                            </div>
                        </div>
                        <div className="card" style={{ minHeight: '350px', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', alignSelf: 'flex-start' }}>Global By User Allocation</h3>
                            <div style={{ width: '100%', height: '100%', maxHeight: '250px', display: 'flex', justifyContent: 'center' }}>
                                {users.length > 0 ? (
                                    <Doughnut options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} data={doughnutData} />
                                ) : (
                                    <p className="text-muted" style={{ marginTop: '50px' }}>Add users to see chart</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="app-container">
            {/* Create User Modal */}
            {showUserModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Create New User</h3>
                        <form onSubmit={handleCreateUser}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>User Name</label>
                            <input style={inputStyle} type="text" value={newUser.user_name} onChange={e => setNewUser({ ...newUser, user_name: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Mobile Number</label>
                            <input style={inputStyle} type="text" value={newUser.mob_num} onChange={e => setNewUser({ ...newUser, mob_num: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Password</label>
                            <input style={inputStyle} type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Default Allocation (%)</label>
                            <input style={inputStyle} type="number" value={newUser.percentage} onChange={e => setNewUser({ ...newUser, percentage: e.target.value })} />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowUserModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Execute Master Trade Modal */}
            {showTradeModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Execute Master Trade</h3>
                        <form onSubmit={handleCreateTrade}>
                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Symbol (e.g., NIFTY)</label>
                            <input style={inputStyle} type="text" placeholder="NIFTY" value={newTrade.symbol} onChange={e => setNewTrade({ ...newTrade, symbol: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Total Quantity</label>
                            <input style={inputStyle} type="number" value={newTrade.total_qty} onChange={e => setNewTrade({ ...newTrade, total_qty: e.target.value })} required />

                            <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Buy Price</label>
                            <input style={inputStyle} type="number" step="0.01" value={newTrade.buy_price} onChange={e => setNewTrade({ ...newTrade, buy_price: e.target.value })} required />

                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Trade</button>
                                <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setShowTradeModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Allocate Trade Modal */}
            {showAllocateModal && selectedTrade && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Allocate "{selectedTrade.symbol}"</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Master Qty: <strong>{selectedTrade.total_qty}</strong></p>
                        <div style={{ marginBottom: '15px' }}>
                            {allocationInputs.map(alloc => (
                                <div key={alloc.mob_num} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>{alloc.name} ({alloc.mob_num})</span>
                                    <input
                                        type="number"
                                        value={alloc.allocation_qty}
                                        onChange={e => handleAllocationQtyChange(alloc.mob_num, e.target.value)}
                                        style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                                        min="0"
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={submitAllocation} disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>{isSubmitting ? 'Wait...' : 'Submit'}</button>
                            <button onClick={() => setShowAllocateModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Close Trade Modal */}
            {showCloseModal && selectedTrade && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Close "{selectedTrade.symbol}"</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                            Closing this trade will automatically close all child allocations, calculate P&L, and update the Ledger entries for each user.
                        </p>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>Sell Price</label>
                        <input style={inputStyle} type="number" step="0.01" value={closePrice} onChange={e => setClosePrice(e.target.value)} required />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button onClick={submitCloseTrade} disabled={!closePrice || isSubmitting} className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', border: 'none' }}>{isSubmitting ? 'Wait...' : 'Confirm Close'}</button>
                            <button onClick={() => setShowCloseModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Trade Details / Allocations Modal */}
            {showTradeDetailsModal && detailsTrade && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalContentStyle, maxWidth: '600px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Trade Details: {detailsTrade.symbol}</h3>
                            <button className="btn" onClick={() => setShowTradeDetailsModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><i className="fas fa-times"></i></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', background: 'var(--bg-body)', padding: '15px', borderRadius: '8px' }}>
                            <div>
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Master ID</p>
                                <p style={{ margin: 0, fontWeight: 'bold', fontFamily: 'monospace' }}>{detailsTrade.master_trade_id}</p>
                            </div>
                            <div>
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Status</p>
                                <p style={{ margin: 0, fontWeight: 'bold', color: detailsTrade.status === 'OPEN' ? 'var(--success)' : 'var(--danger)' }}>{detailsTrade.status}</p>
                            </div>
                            <div>
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Total Qty</p>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{detailsTrade.total_qty}</p>
                            </div>
                            <div>
                                <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>Buy Price</p>
                                <p style={{ margin: 0, fontWeight: 'bold', fontFamily: 'monospace' }}>₹ {(detailsTrade.buy_price || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>Allocations ({tradeDetailsAllocations.length})</h4>
                        {tradeDetailsAllocations.length === 0 ? (
                            <p className="text-muted" style={{ fontSize: '0.85rem' }}>No users have been allocated to this trade yet.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ padding: '8px', textAlign: 'left', color: 'var(--text-muted)' }}>Mobile Number</th>
                                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>Qty</th>
                                            <th style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradeDetailsAllocations.map(a => (
                                            <tr key={a._id} style={{ borderBottom: '1px dashed var(--border)' }}>
                                                <td style={{ padding: '8px', fontWeight: 'bold' }}>{a.mob_num}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>{a.allocation_qty}</td>
                                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace', color: a.client_pnl >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                                    {a.status === 'CLOSED' ? `₹${a.client_pnl}` : 'OPEN'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => setShowTradeDetailsModal(false)}>Close</button>
                    </div>
                </div>
            )}

            {/* Main Navigation and Content */}
            <nav className="sidebar">
                <div className="logo" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
                        <i className="fas fa-user-shield"></i>
                    </div>
                    Admin Panel
                </div>

                <div className="nav-group">
                    <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-home"></i> 0. DASHBOARD
                    </div>
                    <div className={`nav-item ${activeTab === 'user_detail' ? 'active' : ''}`} onClick={() => setActiveTab('user_detail')} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-user-edit"></i> 1. USER DETAIL
                    </div>
                    <div className={`nav-item ${activeTab === 'master_tbl' ? 'active' : ''}`} onClick={() => setActiveTab('master_tbl')} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-table"></i> 2. MASTER TBL
                    </div>
                    <div className={`nav-item ${activeTab === 'allocation_tbl' ? 'active' : ''}`} onClick={() => setActiveTab('allocation_tbl')} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-tasks"></i> 3. ALLOCATION TBL
                    </div>
                    <div className={`nav-item ${activeTab === 'current_tbl' ? 'active' : ''}`} onClick={() => setActiveTab('current_tbl')} style={{ cursor: 'pointer', color: 'var(--success)' }}>
                        <i className="fas fa-chart-line"></i> 4. CURRENT TBL (Live)
                    </div>
                    <div className={`nav-item ${activeTab === 'gl_ledger' ? 'active' : ''}`} onClick={() => setActiveTab('gl_ledger')} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-book"></i> 5. GL LEDGER
                    </div>
                    <div className="nav-item" onClick={handleLogout} style={{ marginTop: 'auto', color: 'var(--danger)', cursor: 'pointer' }}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </div>
                </div>
            </nav>

            <main className="main-content">
                <header className="top-bar" style={{ paddingRight: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '600', letterSpacing: '1px', margin: 0, cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>ADMIN DASHBOARD</h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button className="btn" style={{ padding: '8px' }} onClick={() => setDarkMode(!darkMode)}>
                            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ textAlign: 'right' }} className="d-none d-md-block">
                                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Developer</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Admin</div>
                                </div>
                                <div style={{ width: '36px', height: '36px', background: 'var(--primary)', borderRadius: '50%', display: 'grid', placeItems: 'center', color: 'white' }}>
                                    AD
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="scroll-area">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;