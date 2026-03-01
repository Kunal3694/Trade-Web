import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';

const Ledger = () => {
    const [ledger, setLedger] = useState([]);
    const [runningBalance, setRunningBalance] = useState(0);

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const { data } = await api.get('/ledger');

                // Calculate Running Balance on the Frontend for display accuracy
                let currentBal = 0;
                const calculatedData = data.map(entry => {
                    if (entry.credit > 0) currentBal += entry.credit;
                    if (entry.debit > 0) currentBal -= entry.debit;
                    return { ...entry, balance: currentBal };
                });

                setLedger(calculatedData);
                setRunningBalance(currentBal);
            } catch (error) {
                console.error("Error fetching ledger:", error);
            }
        };
        fetchLedger();
    }, []);

    return (
        <Layout title="Ledger Book">
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem' }}>Client Ledger</h2>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Account: XC-1029 (John Doe)</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Closing Balance</div>
                        <div className="text-up" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                            ₹ {runningBalance.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Date</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Particulars</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Debit</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Credit</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)', textAlign: 'right' }}>Running Bal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger.map(row => (
                                <tr key={row._id}>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)' }}>{new Date(row.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)' }}>{row.description}</td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', color: 'var(--danger)' }}>
                                        {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                                    </td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontFamily: 'monospace', color: 'var(--success)' }}>
                                        {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                                    </td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace' }}>
                                        ₹ {row.balance.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Ledger;