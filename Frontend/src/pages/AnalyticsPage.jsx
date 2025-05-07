import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import AdminLayout from "../layouts/AdminLayout";

const API_URI = import.meta.env.VITE_API_URL;
const PIE_COLORS = ['#4caf50', '#3f51b5', '#f44336', '#ff9800', '#607d8b', '#9c27b0'];
const BAR_COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '20px',
  margin: '10px',
  flex: '1',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  minWidth: '200px',
  borderLeft: '4px solid #3f51b5',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
  }
};

const metricTitleStyle = {
  color: '#555',
  fontSize: '14px',
  fontWeight: '600',
  marginBottom: '8px'
};

const metricValueStyle = {
  color: '#2c3e50',
  fontSize: '28px',
  fontWeight: '700',
  margin: '8px 0'
};

const sectionTitleStyle = {
  color: '#34495e',
  margin: '30px 0 15px 10px',
  fontSize: '20px',
  fontWeight: '600'
};

const AnalyticsPage = () => {
  const [shedAnalytics, setShedAnalytics] = useState(null);
  const [notificationAnalytics, setNotificationAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [shedRes, notifRes] = await Promise.all([
          axios.get(`${API_URI}/api/analytics/shed`),
          axios.get(`${API_URI}/api/analytics/notifications`)
        ]);

        setShedAnalytics(shedRes.data?.data || shedRes.data);
        setNotificationAnalytics(notifRes.data?.data || notifRes.data);
      } catch (err) {
        setError(err.message || 'Error fetching analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div style={{ padding: '30px' }}>Loading analytics...</div>;
  if (error) return <div style={{ padding: '30px' }}>Error: {error}</div>;

  const shedMetricCards = [
    { label: 'Total Messages', value: shedAnalytics.totalMessages, color: '#3f51b5' },
    { label: 'Sent', value: shedAnalytics.sentMessages, color: '#4caf50' },
    { label: 'Pending', value: shedAnalytics.pendingMessages, color: '#ff9800' },
    { label: 'Archived', value: shedAnalytics.archivedMessages, color: '#607d8b' },
  ];

  const notificationMetricCards = [
    { label: 'Total Notifications', value: notificationAnalytics.totalNotifications, color: '#3f51b5' },
    { label: 'Sent', value: notificationAnalytics.sentNotifications, color: '#4caf50' },
    { label: 'Archived', value: notificationAnalytics.archivedNotifications, color: '#607d8b' },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: '30px', fontFamily: "'Inter', sans-serif", maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '25px', color: '#2c3e50', fontSize: '28px', fontWeight: '700' }}>
          Notifications Analytics 
        </h2>

        {/* Shed Messages Section */}
        <h3 style={sectionTitleStyle}>Shcheduled Notifications</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {shedMetricCards.map((card, idx) => (
            <div 
              key={idx} 
              style={{ 
                ...cardStyle, 
                borderLeft: `4px solid ${card.color}`,
                ':hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <h4 style={metricTitleStyle}>{card.label}</h4>
              <p style={metricValueStyle}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', marginTop: '20px', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            ...cardStyle, 
            flex: '1 1 300px', 
            borderLeft: '4px solid #9c27b0',
            minWidth: '300px'
          }}>
            <h4 style={metricTitleStyle}> Scheduled Notifications Composition Overview</h4>
            {shedAnalytics.typeCount?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={shedAnalytics.typeCount}
                    dataKey="count"
                    nameKey="_id"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {shedAnalytics.typeCount.map((entry, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} messages`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No breakdown available.</p>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <h3 style={sectionTitleStyle}>Notifications</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {notificationMetricCards.map((card, idx) => (
            <div 
              key={idx} 
              style={{ 
                ...cardStyle, 
                borderLeft: `4px solid ${card.color}`,
                ':hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                }
              }}
            >
              <h4 style={metricTitleStyle}>{card.label}</h4>
              <p style={metricValueStyle}>{card.value}</p>
            </div>
          ))}
        </div>

        <div style={{ 
          ...cardStyle, 
          marginTop: '20px',
          borderLeft: '4px solid #4caf50'
        }}>
          <h4 style={metricTitleStyle}>Notifications Composition Overview</h4>
          {notificationAnalytics.typeCount?.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={notificationAnalytics.typeCount}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="_id" 
                  tick={{ fill: '#555' }} 
                  axisLine={{ stroke: '#ddd' }}
                />
                <YAxis 
                  tick={{ fill: '#555' }} 
                  axisLine={{ stroke: '#ddd' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: 'none'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Notification Count"
                  radius={[4, 4, 0, 0]}
                >
                  {notificationAnalytics.typeCount.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={BAR_COLORS[index % BAR_COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No breakdown available.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;