import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
         ResponsiveContainer, AreaChart, Area } from 'recharts';
import './App.css';

function App() {
  // Add state hooks for data loading
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use effect to fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get practiceId from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const practiceId = urlParams.get('practiceId');

        if (!practiceId) {
          setError('No practice ID provided. Please include a valid practice ID in the URL.');
          setLoading(false);
          return;
        }
        
        // Replace with your Power Automate flow URL
        const response = await fetch('https://prod-121.westus.logic.azure.com:443/workflows/ae97f93478ea45a49447ed9b984d7971/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jkNp7-6ahOHoHjc04gB07WLMOenNL37zsdrq7qWt7sg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ practiceId })
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Add loading and error states
  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>
  );
  if (error) return (
    <div className="error-container">
      <h2>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        Error
      </h2>
      <p>{error}</p>
      <p className="suggestion">Please check the URL and try again. If the problem persists, contact support.</p>
    </div>
  );
  if (!dashboardData) return <div className="no-data">No data available</div>;
  
  // Extract data from API response
  const { practiceName, dateRange, prescriberData, dailyData, patientsHelped } = dashboardData;
  
  // Calculate derived values
  const knownOrders = prescriberData.reduce((sum, item) => sum + item.orders, 0);
  const unknownOrders = patientsHelped - knownOrders;
  const hasUnknownOrders = unknownOrders > 0;
  
  // Calculate totals for the table
  const totals = {
    measurements: prescriberData.reduce((sum, item) => sum + item.measurements, 0),
    portalViews: prescriberData.reduce((sum, item) => sum + item.portalViews, 0),
    highSx: prescriberData.reduce((sum, item) => sum + item.highSx, 0),
    orders: patientsHelped
  };

  // The rest of your code remains the same
  return (
    <div className="dashboard">
      <div className="header">
        <div className="logo-container">
          <img 
            src="/images/Neurolens Aligned Eye Blue PNG.png" 
            alt="Neurolens - Relief is in Sight" 
            className="company-logo" 
          />
          </div>
          <div className="header-text">
            <h1>{practiceName} - Performance Summary</h1>
            <p>Date Range: {dateRange}</p>
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
              contentStyle={{
                backgroundColor: '#222', 
                borderColor: '#555',
                fontSize: '12px',        // Reduce font size
                padding: '5px 8px',      // Reduce padding
                borderRadius: '4px',     // Optional: slightly rounded corners
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'  // Optional: subtle shadow
              }} 
              labelStyle={{
                display: 'none'          // Hide the date/label completely
              }}
              itemStyle={{
                color: '#ddd',
                fontSize: '12px',        // Ensure item text is also smaller
                padding: '2px 0'         // Reduce spacing between items
              }}
              wrapperStyle={{
                zIndex: 100             // Ensure tooltip stays on top
              }}
              formatter={(value) => value} // Just show the value
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