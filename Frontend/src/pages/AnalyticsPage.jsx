import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { DatePicker, Button, Dropdown, Menu } from 'antd';
import dayjs from 'dayjs';
import AdminLayout from "../layouts/AdminLayout";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const { RangePicker } = DatePicker;
const API_URI = import.meta.env.VITE_API_URL;
const PIE_COLORS = ['#4caf50', '#3f51b5', '#f44336', '#ff9800', '#607d8b', '#9c27b0'];
const BAR_COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1'];
const LINE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

const cardStyle = {
  background: '#fff',
  borderRadius: '10px',
  padding: '12px',
  margin: '8px',
  flex: '1',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  minWidth: '200px',
  borderLeft: '4px solid #3f51b5',
};

const chartCardStyle = {
  ...cardStyle,
  padding: '10px',
  minWidth: '260px',
  height: '240px'
};

const largeChartCardStyle = {
  ...chartCardStyle,
  minWidth: '500px',
  height: '300px'
};

const metricTitleStyle = {
  color: '#555',
  fontSize: '12px',
  fontWeight: '600',
};

const metricValueStyle = {
  color: '#2c3e50',
  fontSize: '22px',
  fontWeight: '700',
};

const sectionTitleStyle = {
  color: '#34495e',
  margin: '25px 0 10px 10px',
  fontSize: '18px',
  fontWeight: '600'
};

const AnalyticsPage = () => {
  const [shedAnalytics, setShedAnalytics] = useState(null);
  const [notificationAnalytics, setNotificationAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(30, 'days').toDate(),
    end: new Date()
  });
  
  const reportRef = useRef();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [shedRes, notifRes] = await Promise.all([
        axios.get(`${API_URI}/api/analytics/shed`, {
          params: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          }
        }),
        axios.get(`${API_URI}/api/analytics/notifications`, {
          params: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          }
        })
      ]);
      setShedAnalytics(shedRes.data);
      setNotificationAnalytics(notifRes.data);
    } catch (err) {
      setError(err.message || 'Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange({
        start: dates[0].toDate(),
        end: dates[1].toDate()
      });
    }
  };

  const exportToPDF = async () => {
    const input = reportRef.current;
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`analytics-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
  };

  const exportToFormattedPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Gosync Online Bus Ticket Booking System', 80, 10);
    
    // Add report title
    doc.setFontSize(16);
    doc.text('Notification Analytics Report', 15, 35);
    
    // Add date range
    doc.setFontSize(12);
    doc.text(`Date Range: ${dayjs(dateRange.start).format('MMM D, YYYY')} - ${dayjs(dateRange.end).format('MMM D, YYYY')}`, 15, 45);
    
    // Add generated timestamp
    doc.text(`Generated: ${dayjs().format('MMM D, YYYY h:mm A')}`, 15, 55);
    
    // Add line separator
    doc.line(15, 60, 195, 60);
    
    let yPosition = 70;
    
    // 1. Scheduled Messages Summary
    doc.setFontSize(14);
    doc.text('1. Scheduled Messages Summary', 15, yPosition);
    yPosition += 10;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Messages', shedAnalytics.totalMessages],
        ['Sent Messages', shedAnalytics.sentMessages],
        ['Pending Messages', shedAnalytics.pendingMessages],
        ['Archived Messages', shedAnalytics.archivedMessages]
      ],
      margin: { left: 15 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [63, 81, 181] }
    });
    
    yPosition = doc.lastAutoTable.finalY + 10;
    
    // 2. Message Type Distribution
    doc.setFontSize(14);
    doc.text('2. Message Type Distribution', 15, yPosition);
    yPosition += 10;
    
    const typeDistributionData = shedAnalytics.typeCount.map(item => [item._id, item.count]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Count']],
      body: typeDistributionData,
      margin: { left: 15 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [76, 175, 80] }
    });
    
    yPosition = doc.lastAutoTable.finalY + 10;
    
    // 3. Travel Disruption Subtypes
    doc.setFontSize(14);
    doc.text('3. Travel Disruption Subtypes', 15, yPosition);
    yPosition += 10;
    
    const subtypeData = shedAnalytics.travelDisruptionSubTypes.map(item => [item._id, item.count]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Subtype', 'Count']],
      body: subtypeData,
      margin: { left: 15 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 152, 0] }
    });
    
    yPosition = doc.lastAutoTable.finalY + 10;
    
    // 4. Instant Notifications Summary
    doc.setFontSize(14);
    doc.text('4. Instant Notifications Summary', 15, yPosition);
    yPosition += 10;
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Total Notifications', notificationAnalytics.totalNotifications],
        ['Sent Notifications', notificationAnalytics.sentNotifications],
        ['Archived Notifications', notificationAnalytics.archivedNotifications]
      ],
      margin: { left: 15 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [121, 134, 203] }
    });
    
    yPosition = doc.lastAutoTable.finalY + 10;
    
    // 5. Instant Notifications Type Distribution
    doc.setFontSize(14);
    doc.text('5. Instant Notifications Type Distribution', 15, yPosition);
    yPosition += 10;
    
    const instantTypeData = notificationAnalytics.typeCount.map(item => [item._id, item.count]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Type', 'Count']],
      body: instantTypeData,
      margin: { left: 15 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [96, 125, 139] }
    });
    
    // Add page footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 15, doc.internal.pageSize.height - 10);
      doc.text('GoSync Notification Analytics Report', doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10, { align: 'right' });
    }
    
    doc.save(`GoSyncNotificationAnlytics-Report-${dayjs().format('YYYY-MM-DD-HHmm')}.pdf`);
  };

  const exportToCSV = () => {
    if (!shedAnalytics || !notificationAnalytics) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Analytics Report for ${dayjs(dateRange.start).format('MMM D, YYYY')} to ${dayjs(dateRange.end).format('MMM D, YYYY')}\n\n`;
    csvContent += "Scheduled Messages Summary\n";
    csvContent += `Total Messages,${shedAnalytics.totalMessages}\n`;
    csvContent += `Sent,${shedAnalytics.sentMessages}\n`;
    csvContent += `Pending,${shedAnalytics.pendingMessages}\n`;
    csvContent += `Archived,${shedAnalytics.archivedMessages}\n\n`;
    csvContent += "Scheduled Messages Type Distribution\nType,Count\n";
    shedAnalytics.typeCount.forEach(item => {
      csvContent += `${item._id},${item.count}\n`;
    });
    csvContent += "\nTravel Disruption Subtypes\nSubtype,Count\n";
    shedAnalytics.travelDisruptionSubTypes.forEach(item => {
      csvContent += `${item._id},${item.count}\n`;
    });
    csvContent += "\nInstant Notifications Summary\n";
    csvContent += `Total Notifications,${notificationAnalytics.totalNotifications}\n`;
    csvContent += `Sent,${notificationAnalytics.sentNotifications}\n`;
    csvContent += `Archived,${notificationAnalytics.archivedNotifications}\n\n`;
    csvContent += "Instant Notifications Type Distribution\nType,Count\n";
    notificationAnalytics.typeCount.forEach(item => {
      csvContent += `${item._id},${item.count}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportMenu = (
    <Menu>
      <Menu.Item key="pdf-simple" onClick={exportToPDF}>Export as Simple PDF</Menu.Item>
      <Menu.Item key="pdf-formatted" onClick={exportToFormattedPDF}>Export as Formatted PDF</Menu.Item>
      <Menu.Item key="csv" onClick={exportToCSV}>Export as CSV</Menu.Item>
    </Menu>
  );

  const renderMetricCards = (data) => (
    data.map((card, idx) => (
      <div key={idx} style={{ ...cardStyle, borderLeft: `4px solid ${card.color}` }}>
        <div style={metricTitleStyle}>{card.label}</div>
        <div style={metricValueStyle}>{card.value}</div>
      </div>
    ))
  );

  if (loading) return <div style={{ padding: '30px' }}>Loading analytics...</div>;
  if (error) return <div style={{ padding: '30px' }}>Error: {error}</div>;

  return (
    <AdminLayout>
      <div ref={reportRef} style={{ padding: '30px', fontFamily: "'Inter', sans-serif", maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ marginBottom: '25px', color: '#2c3e50', fontSize: '26px', fontWeight: '700' }}>
            Notification Analytics Dashboard
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
          <RangePicker
            value={[dayjs(dateRange.start), dayjs(dateRange.end)]}
            onChange={handleDateChange}
            allowClear={false}
            format="YYYY-MM-DD"
          />
            <Dropdown overlay={reportMenu} placement="bottomRight">
              <Button type="primary">Generate Report</Button>
            </Dropdown>
          </div>
        </div>

        {/* Scheduled Messages Section */}
        <h3 style={sectionTitleStyle}>Scheduled Notifications</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {renderMetricCards([
            { label: 'Total Messages', value: shedAnalytics.totalMessages, color: '#3f51b5' },
            { label: 'Sent', value: shedAnalytics.sentMessages, color: '#4caf50' },
            { label: 'Pending', value: shedAnalytics.pendingMessages, color: '#ff9800' },
            { label: 'Archived', value: shedAnalytics.archivedMessages, color: '#607d8b' },
          ])}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div style={chartCardStyle}>
            <h4 style={metricTitleStyle}>Type Distribution</h4>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={shedAnalytics.typeCount}
                  dataKey="count"
                  nameKey="_id"
                  outerRadius={60}
                  label
                >
                  {shedAnalytics.typeCount.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <h4 style={metricTitleStyle}>Travel Disruption Subtypes</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={shedAnalytics.travelDisruptionSubTypes} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count">
                  {shedAnalytics.travelDisruptionSubTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheduled Messages Timeline */}
        <h3 style={sectionTitleStyle}>Scheduled Messages Timeline</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div style={largeChartCardStyle}>
            <h4 style={metricTitleStyle}>Daily Activity</h4>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={shedAnalytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={LINE_COLORS[0]} name="Total" />
                <Line type="monotone" dataKey="sent" stroke={LINE_COLORS[1]} name="Sent" />
                <Line type="monotone" dataKey="pending" stroke={LINE_COLORS[2]} name="Pending" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...largeChartCardStyle, minWidth: '400px' }}>
            <h4 style={metricTitleStyle}>Monthly Activity</h4>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={shedAnalytics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke={LINE_COLORS[0]} fill={LINE_COLORS[0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Instant Notifications Section */}
        <h3 style={sectionTitleStyle}>Instant Notifications</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {renderMetricCards([
            { label: 'Total Notifications', value: notificationAnalytics.totalNotifications, color: '#3f51b5' },
            { label: 'Sent', value: notificationAnalytics.sentNotifications, color: '#4caf50' },
            { label: 'Archived', value: notificationAnalytics.archivedNotifications, color: '#607d8b' },
          ])}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <div style={chartCardStyle}>
            <h4 style={metricTitleStyle}>Type Distribution</h4>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={notificationAnalytics.typeCount}
                  dataKey="count"
                  nameKey="_id"
                  outerRadius={60}
                  label
                >
                  {notificationAnalytics.typeCount.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={chartCardStyle}>
            <h4 style={metricTitleStyle}>Travel Disruption Subtypes</h4>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={notificationAnalytics.travelDisruptionSubTypes} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count">
                  {notificationAnalytics.travelDisruptionSubTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Instant Notifications Timeline */}
        <h3 style={sectionTitleStyle}>Instant Notifications Timeline</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={largeChartCardStyle}>
            <h4 style={metricTitleStyle}>Daily Activity</h4>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={notificationAnalytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke={LINE_COLORS[0]} name="Total" />
                <Line type="monotone" dataKey="sent" stroke={LINE_COLORS[1]} name="Sent" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...largeChartCardStyle, minWidth: '400px' }}>
            <h4 style={metricTitleStyle}>Monthly Activity</h4>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={notificationAnalytics.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke={LINE_COLORS[0]} fill={LINE_COLORS[0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsPage;