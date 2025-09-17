'use client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_BASE!;
type Complaint = { _id: string; category: string; status: string; createdAt: string; societyId: string; description?: string; };

export default function QueuePage() {
  const [items, setItems] = useState<Complaint[]>([]);
  useEffect(() => {
    fetch(`${API}/v1/complaints`).then(r => r.json()).then(setItems);
    const socket = io(API.replace('/v1','')); // http://localhost:4000
    socket.emit('join', { rooms: ['society:soc-001'] });
    socket.on('complaint.created', (c: Complaint) => setItems(prev => [c, ...prev]));
    socket.on('complaint.updated', (c: Complaint) => setItems(prev => prev.map(i => i._id === c._id ? c : i)));
    return () => { socket.disconnect(); };
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h1>Org Queue (realtime)</h1>
      <table border={1} cellPadding={8}>
        <thead><tr><th>ID</th><th>Category</th><th>Status</th><th>Society</th><th>Created</th></tr></thead>
        <tbody>
          {items.map(c => (
            <tr key={c._id}>
              <td>{c._id.slice(-6)}</td>
              <td>{c.category}</td>
              <td>{c.status}</td>
              <td>{c.societyId}</td>
              <td>{new Date(c.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}