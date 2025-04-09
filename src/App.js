import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, AreaChart, Area } from 'recharts';
import './App.css';

function App() {
  // Prescriber data - sorted by High Sx Count (highest to lowest)
  const prescriberData = [
    { name: 'Manuel Debesa', shortName: 'M. Debesa', measurements: 27, portalViews: 27, highSx: 13, orders: 0 },
    { name: 'Chris Cheyne', shortName: 'C. Cheyne', measurements: 18, portalViews: 18, highSx: 10, orders: 1 },
    { name: 'Nicole Stout', shortName: 'N. Stout', measurements: 18, portalViews: 16, highSx: 9, orders: 0 },
    { name: 'Courtney Cobbs', shortName: 'C. Cobbs', measurements: 21, portalViews: 19, highSx: 8, orders: 1 },
    { name: 'Robert Yeaman', shortName: 'R. Yeaman', measurements: 16, portalViews: 16, highSx: 5, orders: 0 }
  ];

  // Get total known orders and patients helped
  const knownOrders = prescriberData.reduce((sum, item) => sum + item.orders, 0);
  const patientsHelped = 4; // From the data
  
  // Calculate unknown/unmatched orders
  const unknownOrders = patientsHelped - knownOrders;
  
  // Add unknown prescriber data if there are unmatched orders
  const hasUnknownOrders = unknownOrders > 0;
  
  // Calculate totals for the table
  const totals = {
    measurements: prescriberData.reduce((sum, item) => sum + item.measurements, 0),
    portalViews: prescriberData.reduce((sum, item) => sum + item.portalViews, 0),
    highSx: prescriberData.reduce((sum, item) => sum + item.highSx, 0),
    orders: patientsHelped // Total orders is the patients helped (includes unknown orders)
  };

  // Daily activity data
  const dailyData = [
    { name: 'Mon 03/24', measurements: 34, portalViews: 27, highSx: 14, orders: 0 },
    { name: 'Tue 03/25', measurements: 28, portalViews: 21, highSx: 7, orders: 0 },
    { name: 'Wed 03/26', measurements: 32, portalViews: 23, highSx: 9, orders: 3 },
    { name: 'Thu 03/27', measurements: 32, portalViews: 25, highSx: 15, orders: 1 },
    { name: 'Fri 03/28', measurements: 0, portalViews: 0, highSx: 0, orders: 0 },
    { name: 'Sat 03/29', measurements: 0, portalViews: 0, highSx: 0, orders: 0 }
  ];

  return (
    <div className="dashboard">
      <div className="header">
        <div className="logo-container">
          <img 
            src="/images/neurolens-logo.png" 
            alt="Neurolens - Relief is in Sight" 
            className="company-logo" 
          />
          </div>
          <div className="header-text">
            <h1>Cheyne Eye Center - Prescriber Summary</h1>
            <p>Date Range: 3/24/25 - 3/29/25</p>
          </div>
      </div>
      
      {/* Highly Symptomatic Patients by Provider */}
      <div className="card">
        <h2>Highly Symptomatic Patients by Provider</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={prescriberData}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="shortName" tick={{fill: '#aaa', fontSize: 11}} />
            <YAxis tick={{fill: '#aaa'}} />
            <Tooltip 
              contentStyle={{backgroundColor: '#222', borderColor: '#555'}} 
              labelStyle={{color: '#ddd'}}
              itemStyle={{color: '#8bb3f4'}}
            />
            <Bar dataKey="highSx" name="Highly Symptomatic" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Prescriber Table with Totals */}
      <div className="card">
        <h2>Prescriber Performance Summary</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Prescriber</th>
                <th className="center">Measures</th>
                <th className="center">Portal Views</th>
                <th className="center">High Sx</th>
                <th className="center">Orders</th>
              </tr>
            </thead>
            <tbody>
              {prescriberData.map((prescriber, index) => (
                <tr key={index}>
                  <td>{prescriber.name}</td>
                  <td className="center">{prescriber.measurements}</td>
                  <td className="center">{prescriber.portalViews}</td>
                  <td className="center">{prescriber.highSx}</td>
                  <td className="center">{prescriber.orders}</td>
                </tr>
              ))}
              {/* No prescriber/Unknown row - conditionally rendered */}
              {hasUnknownOrders && (
                <tr>
                  <td>Unknown</td>
                  <td className="center">-</td>
                  <td className="center">-</td>
                  <td className="center">-</td>
                  <td className="center">{unknownOrders}</td>
                </tr>
              )}
              {/* Totals row */}
              <tr className="totals">
                <td>TOTALS</td>
                <td className="center">{totals.measurements}</td>
                <td className="center">{totals.portalViews}</td>
                <td className="center">{totals.highSx}</td>
                <td className="center">{totals.orders}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="small-text">
          * Orders placed with SpecCheck typically appear per unique prescriber. Unknown prescriber values are counts for patient measurements not assigned a provider and/or orders not matched to a patient.
        </div>
      </div>
      
      {/* Daily Activity Waterfall Chart */}
      <div className="card">
        <h2>Daily Activity Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={dailyData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" tick={{fill: '#aaa'}} />
            <YAxis tick={{fill: '#aaa'}} />
            <Tooltip 
              contentStyle={{backgroundColor: '#222', borderColor: '#555'}} 
              labelStyle={{color: '#ddd'}}
              itemStyle={{color: '#ddd'}}
            />
            <Legend wrapperStyle={{color: '#aaa'}} />
            <Area type="monotone" dataKey="measurements" name="Measurements" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            <Area type="monotone" dataKey="portalViews" name="Portal Views" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
            <Area type="monotone" dataKey="highSx" name="Highly Symptomatic" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
            <Area type="monotone" dataKey="orders" name="Orders" stroke="#ff8042" fill="#ff8042" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;