import React from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import data from './data.json';
import './styles.css';

function App() {
  const [sortKey, setSortKey] = React.useState('reviewsCount');
  const [direction, setDirection] = React.useState('desc');

  const sorted = React.useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      const left = a[sortKey] ?? '';
      const right = b[sortKey] ?? '';
      if (typeof left === 'number' && typeof right === 'number') {
        return direction === 'asc' ? left - right : right - left;
      }
      return direction === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left));
    });
    return copy;
  }, [sortKey, direction]);

  const chartData = [...data]
    .sort((a, b) => (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0))
    .slice(0, 10)
    .map((item) => ({ name: item.name, reviews: item.reviewsCount ?? 0 }));

  const toggleSort = (key) => {
    if (sortKey === key) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortKey(key);
    setDirection(key === 'name' ? 'asc' : 'desc');
  };

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Apify powered</p>
        <h1>Austin coffee shop market snapshot</h1>
        <p className="sub">20 Google Maps businesses scraped by a custom Apify actor. Static build. No browser token exposure.</p>
      </header>
      <section className="panel chart-panel">
        <div className="panel-header">
          <h2>Top businesses by review count</h2>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#243041" />
              <XAxis type="number" stroke="#9fb0c3" />
              <YAxis type="category" dataKey="name" width={170} stroke="#9fb0c3" />
              <Tooltip />
              <Bar dataKey="reviews" fill="#5eead4" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="panel-header">
          <h2>Business results</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th><button onClick={() => toggleSort('name')}>Name</button></th>
              <th><button onClick={() => toggleSort('category')}>Category</button></th>
              <th><button onClick={() => toggleSort('rating')}>Rating</button></th>
              <th><button onClick={() => toggleSort('reviewsCount')}>Reviews</button></th>
              <th>Address</th>
              <th>Phone</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => (
              <tr key={item.placeUrl}>
                <td>{item.name}</td>
                <td>{item.category || '—'}</td>
                <td>{item.rating ?? '—'}</td>
                <td>{item.reviewsCount ?? '—'}</td>
                <td>{item.address || '—'}</td>
                <td>{item.phone || '—'}</td>
                <td>{item.website ? <a href={item.website} target="_blank">Visit</a> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
