import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Layout from '../components/Layout';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const [trades, setTrades] = useState([]);
    const [metrics, setMetrics] = useState({
        totalPnL: 0,
        completedTrades: 0,
        winRate: 0,
        invested: 0
    });

    // 1. Fetch Data from Backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User's Allocated Trades
                const { data } = await api.get('/trades/my-allocations/list');
                setTrades(data);
                calculateMetrics(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // 2. Calculate Dashboard Numbers on the fly using NEW schema fields
    const calculateMetrics = (data) => {
        let pnl = 0;
        let wins = 0;
        let completed = 0;
        let investedAmount = 0;

        data.forEach(trade => {
            if (trade.status === 'CLOSED') {
                pnl += (trade.client_pnl || 0);
                completed++;
                if (trade.client_pnl > 0) wins++;
            }
            if (trade.status === 'OPEN') {
                investedAmount += (trade.total_value || 0);
            }
        });

        setMetrics({
            totalPnL: pnl,
            completedTrades: completed,
            winRate: completed > 0 ? ((wins / completed) * 100).toFixed(0) : 0,
            invested: investedAmount
        });
    };

    // Chart Data Configuration
    const lineChartData = {
        labels: ['Oct 1', 'Oct 15', 'Oct 31', 'Nov 15', 'Nov 30'],
        datasets: [{
            label: 'Portfolio Value',
            data: [500000, 515000, 530000, 520000, 500000 + metrics.totalPnL],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    const doughnutData = {
        labels: ['Equity', 'F&O', 'Cash'],
        datasets: [{
            data: [45, 35, 20],
            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b'],
            borderWidth: 0
        }]
    };

    return (
        <Layout title="Dashboard">
            {/* Top Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Net Liquidation Value</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹ {(453450 + metrics.totalPnL).toLocaleString()}</div>
                    <div className="text-up" style={{ fontSize: '0.85rem', marginTop: '8px' }}><i className="fas fa-arrow-up"></i> Live Value</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Total P&L</div>
                    <div className={metrics.totalPnL >= 0 ? "text-up" : "text-down"} style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                        {metrics.totalPnL >= 0 ? '+' : ''} ₹ {metrics.totalPnL.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '8px', color: 'var(--text-muted)' }}>Realized Gains</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                    <div className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Holdings Value</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>₹ {metrics.invested.toLocaleString()}</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '8px', color: 'var(--text-muted)' }}>Invested Amount</div>
                </div>

                <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                    <div className="metric-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Win Rate</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{metrics.winRate}%</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '8px', color: 'var(--text-muted)' }}>{metrics.completedTrades} Trades Completed</div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Performance Trend</h3>
                    <div style={{ height: '320px' }}>
                        <Line options={{ responsive: true, maintainAspectRatio: false }} data={lineChartData} />
                    </div>
                </div>
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Asset Allocation</h3>
                    <div style={{ height: '320px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut options={{ responsive: true, maintainAspectRatio: false }} data={doughnutData} />
                    </div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recent Activity</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Date</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Script</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Type</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Amount</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid var(--border)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.slice(0, 5).map(trade => (
                                <tr key={trade._id}>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                        {new Date(trade.buy_timestamp).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>
                                        {trade.master_trade_id?.symbol}
                                    </td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                                            background: 'rgba(16, 185, 129, 0.1)',
                                            color: 'var(--success)'
                                        }}>
                                            BUY
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'monospace', fontWeight: '600' }}>
                                        ₹ {(trade.total_value || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '14px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                        {trade.status}
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

export default Dashboard;