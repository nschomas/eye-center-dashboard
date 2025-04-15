import React, { useState, useEffect } from 'react';
// Import useParams
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
         ResponsiveContainer, AreaChart, Area, LabelList } from 'recharts';
import './App.css';

function App() {
  // Get the practiceId from the URL path parameter
  const { practiceId } = useParams();

  // Add state hooks for data loading
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Track window width for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if we're on mobile
  const isMobile = windowWidth <= 768;

  // Use effect to fetch data on component mount or when practiceId changes
  useEffect(() => {
    const fetchData = async () => {
      // Reset states when starting fetch
      setLoading(true);
      setError(null);
      setDashboardData(null);

      try {
        // Validate practiceId presence (useParams provides it directly)
        if (!practiceId) {
          // This case should technically not happen if routing is set up correctly,
          // but it's good practice to check.
          setError('No practice ID found in URL path.');
          setLoading(false);
          return;
        }

        // Replace with your Power Automate flow URL
        const response = await fetch('https://prod-121.westus.logic.azure.com:443/workflows/ae97f93478ea45a49447ed9b984d7971/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jkNp7-6ahOHoHjc04gB07WLMOenNL37zsdrq7qWt7sg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          // Send the practiceId obtained from useParams
          body: JSON.stringify({ practiceId })
        });

        if (!response.ok) {
          // Provide more specific error message
          throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setDashboardData(data);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || 'An unexpected error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // Add practiceId to the dependency array.
  // This ensures data re-fetches if the user navigates
  // from one dashboard directly to another (e.g., using browser back/forward).
  }, [practiceId]);

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
        Error Loading Dashboard
      </h2>
      <p>{error}</p>
      <p className="suggestion">Please check the URL or Practice ID and try again. If the problem persists, contact support.</p>
    </div>
  );

  // Check specifically if dashboardData is null AFTER loading is false and there's no error
  if (!dashboardData) return (
    <div className="no-data">
        No data available for Practice ID: {practiceId}. Please verify the ID or check data source.
    </div>
  );


  // Extract data from API response (add checks for potentially missing data)
  const { practiceName = "Practice", dateRange = "N/A", prescriberData = [], dailyData = [], patientsHelped = 0 } = dashboardData;

  // Calculate derived values
  const knownOrders = prescriberData.reduce((sum, item) => sum + (item.orders || 0), 0); // Add fallback
  const unknownOrders = patientsHelped - knownOrders;
  const hasUnknownOrders = unknownOrders > 0;

  // Calculate totals for the table
  const totals = {
    measurements: prescriberData.reduce((sum, item) => sum + (item.measurements || 0), 0), // Add fallback
    portalViews: prescriberData.reduce((sum, item) => sum + (item.portalViews || 0), 0), // Add fallback
    highSx: prescriberData.reduce((sum, item) => sum + (item.highSx || 0), 0), // Add fallback
    orders: patientsHelped // Use the total from the main object if available
  };

  // Filter out providers with 0 High Sx values, then sort by highSx
  const filteredChartData = [...prescriberData]
    .filter(prescriber => (prescriber.highSx || 0) > 0) // Only include providers with at least 1 High Sx
    .sort((a, b) => (b.highSx || 0) - (a.highSx || 0))
    .map(prescriber => ({
      ...prescriber,
      // Keep original values for the table
      // Create combined data for the chart - orders will be displayed on top of highSx
      _highSx: prescriber.highSx || 0,  // Underscore to avoid confusion with original property
      _orders: prescriber.orders || 0    // This will be the overlay
    }));

  // Sort prescriber data by measurements (descending) for the table, 
  // but with special handling to ensure "No Provider" is always last
  const sortedPrescriberData = [...prescriberData].sort((a, b) => {
    // If either is the "No Provider" entry, handle specially
    if (a.name === "No Provider") return 1;  // a is "No Provider", move to end
    if (b.name === "No Provider") return -1; // b is "No Provider", move to end
    
    // Normal sort by measurements descending
    return (b.measurements || 0) - (a.measurements || 0);
  });

  // Custom label component for the bar values
  const renderCustomBarLabel = (props) => {
    const { x, y, width, value } = props;
    return (
      <g>
        <text 
          x={x + width / 2} 
          y={y - 6} 
          fill="#FFF" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fontSize="11"
          fontWeight="bold"
        >
          {value}
        </text>
      </g>
    );
  };

  // Calculate bar size based on screen width for mobile responsiveness
  const getBarSize = () => {
    if (windowWidth <= 480) return 34; // Narrower on mobile
    if (windowWidth <= 768) return 36; // Slightly wider on tablets
    return 40; // Default for desktop
  };

  return (
    <div className="dashboard">
      {/* Header - Logo only shows on non-mobile */}
      <div className="header" style={{ marginBottom: isMobile ? '8px' : '16px' }}>
        {!isMobile && (
          <div className="logo-container">
            <img
              src="/images/Neurolens Aligned Eye Blue PNG.png"
              alt="Neurolens - Relief is in Sight"
              className="company-logo"
            />
          </div>
        )}
        <div className="header-text" style={{ textAlign: isMobile ? 'center' : 'left', width: '100%' }}>
          {/* Use default value if practiceName is missing */}
          <h1>{practiceName} - Performance Summary</h1>
          <p>Date Range: {dateRange}</p>
        </div>
      </div>
      
      {/* UPDATED: True Overlapping Bar Chart - Symptomatic with Orders on top */}
      <div className="card" style={{ 
        padding: isMobile ? '8px 2px' : '16px', // Reduced horizontal padding significantly on mobile
        marginBottom: isMobile ? '10px' : '16px'
      }}>
        <h2 style={{ 
          marginBottom: isMobile ? '6px' : '12px',
          paddingLeft: isMobile ? '8px' : '0' // Add padding to the title on mobile since the card padding is reduced
        }}>
          High Sx vs <span style={{ color: '#BA4DA5' }}>Orders</span> by Provider
        </h2>
        <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
          <BarChart
            data={filteredChartData}
            margin={{
              top: 5,
              right: 0,   // Reduce right margin further
              left: -30,  // Try a larger negative left margin
              bottom: 0,
            }}
            barSize={getBarSize()} // Dynamic bar size based on screen width
            barCategoryGap="20%" // Adjust gap between categories if needed
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="shortName" tick={{fill: '#aaa', fontSize: 10}} interval={0} /> {/* interval={0} ensures all labels show */}
            <YAxis
              tick={{fill: '#aaa', fontSize: 10}}
              width={25}       // Explicitly reduce calculated width (default might be ~60)
              tickMargin={-5} // Pull tick labels closer to axis line (or even slightly overlap)
              domain={[0, dataMax => (dataMax > 0 ? dataMax + .5 : 10)]} // Ensure domain is at least e.g., 10 if max is 0
            />
            {/* First bar for total symptomatic patients */}
            <Bar 
              dataKey="_highSx" 
              name="High Sx" 
              fill="#60a5fa" 
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList dataKey="_highSx" content={renderCustomBarLabel} />
            </Bar>
            {/* Second bar for orders - will be displayed on top due to stack order */}
            <Bar 
              dataKey="_orders" 
              name="Orders" 
              fill="#BA4DA5" 
              radius={[4, 4, 0, 0]}
              // Make the Orders bar semi-transparent to see the underlying bar
              fillOpacity={0.8}
              isAnimationActive={false} 
            >
              <LabelList dataKey="_orders" content={renderCustomBarLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Prescriber Table with Totals - SORTED by measurements descending, "No Provider" always last */}
      <div className="card" style={{ padding: isMobile ? '10px' : '16px', marginBottom: isMobile ? '10px' : '16px' }}>
        <h2 style={{ marginBottom: isMobile ? '6px' : '12px' }}>
          Prescriber Performance Summary
        </h2>
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
              {/* Display sorted prescriber data with "No Provider" always at the bottom */}
              {sortedPrescriberData.map((prescriber, index) => (
                <tr key={index}>
                  <td>{prescriber.name || 'Unknown'}</td>
                  <td className="center">{prescriber.measurements || 0}</td>
                  <td className="center">{prescriber.portalViews || 0}</td>
                  <td className="center">{prescriber.highSx || 0}</td>
                  <td className="center">{prescriber.orders || 0}</td>
                </tr>
              ))}
              {/* "Unknown" row - conditionally rendered and always at the bottom */}
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
        <div className="small-text" style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
          * Orders placed with SpecCheck typically appear per unique prescriber. Unknown prescriber values are counts for patient measurements not assigned a provider and/or orders not matched to a patient.
        </div>
      </div>

      {/* Daily Activity Waterfall Chart */}
      <div className="card" style={{ 
        padding: isMobile ? '10px 4px' : '16px' // Reduced horizontal padding for the bottom chart too
      }}>
        <h2 style={{ 
          marginBottom: isMobile ? '6px' : '12px',
          paddingLeft: isMobile ? '6px' : '0' // Add padding to the title since the card padding is reduced
        }}>
          Daily Activity Trend
        </h2>
        <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
          <AreaChart
            data={dailyData}
            margin={{
              top: 20,
              right: isMobile ? 0 : 30, // No right margin on mobile
              left: isMobile ? 0 : 20,  // No left margin on mobile
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
                fontSize: '12px',
                padding: '5px 8px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
              labelStyle={{
                display: 'none'
              }}
              itemStyle={{
                color: '#ddd',
                fontSize: '12px',
                padding: '2px 0'
              }}
              wrapperStyle={{
                zIndex: 100
              }}
              formatter={(value) => value || 0} // Fallback to 0
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