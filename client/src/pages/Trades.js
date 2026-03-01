import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';

const Trades = () => {
    const [trades, setTrades] = useState([]);
    const [filteredTrades, setFilteredTrades] = useState([]);

    // Filters State
    const [search, setSearch] = useState('');
    const [typeFilter] = useState('ALL');
    const [startDate] = useState('2025-10-01');
    const [endDate] = useState('2025-12-31');

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                // Ensure this URL matches your backend
                const { data } = await api.get('/trades/my-allocations/list');
                setTrades(data);
                setFilteredTrades(data);
            } catch (error) {
                console.error("Error fetching trades:", error);
            }
        };
        fetchTrades();
    }, []);

    // Filter Logic
    const handleFilter = () => {
        let temp = trades;

        if (search) {
            temp = temp.filter(t => t.master_trade_id?.symbol.toLowerCase().includes(search.toLowerCase()));
        }
        if (startDate) {
            temp = temp.filter(t => new Date(t.buy_timestamp) >= new Date(startDate));
        }
        if (endDate) {
            temp = temp.filter(t => new Date(t.buy_timestamp) <= new Date(endDate));
        }
        setFilteredTrades(temp);
    };

    return (
        <Layout title="Trade History">
            <div className="card">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '8px' }} />
                    <button className="btn btn-primary" onClick={handleFilter}>Filter</button>
                </div>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Script</th>
                            <th>Type</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrades.map(t => (
                            <tr key={t._id}>
                                <td>{new Date(t.buy_timestamp).toLocaleDateString()}</td>
                                <td>{t.master_trade_id?.symbol}</td>
                                <td>BUY</td>
                                <td>{t.total_value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default Trades;