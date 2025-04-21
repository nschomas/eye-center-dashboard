import React, { useState, useEffect } from 'react';
// Import useParams, Link
import { useParams, Link } from 'react-router-dom';
// Import useUser and UserButton from Clerk
import { useUser, UserButton } from '@clerk/clerk-react';
// Remove Recharts BarChart imports if no longer needed by other charts
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
//          ResponsiveContainer, AreaChart, Area, LabelList } from 'recharts';

// Import necessary Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title, // Keep Title if needed elsewhere, remove if not
  Tooltip as ChartJsTooltip, // Renamed to avoid conflict
  Legend as ChartJsLegend // Renamed to avoid conflict
} from 'chart.js';
// Remove unused ChartJsBar import
// import { Bar as ChartJsBar } from 'react-chartjs-2'; // Renamed Bar component
// Import Recharts components needed for the *other* charts (AreaChart etc.)
// import { ResponsiveContainer, /* AreaChart, Area, */ XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts'; // Keep necessary Recharts imports

// Import Plotly component
import Plot from 'react-plotly.js';

// Import from react-device-detect
import { 
  isMobile, 
  isTablet, 
  isDesktop, 
  osName, 
  browserName 
} from 'react-device-detect';

import './App.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartJsTooltip,
  ChartJsLegend // Register renamed Legend
);


// Your Power Automate tracking endpoint URL
const TRACKING_ENDPOINT_URL = 'https://prod-113.westus.logic.azure.com:443/workflows/ffb0db7884e5468a90b7e64238dab2ce/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fSb0hor4tIeiqeBxQBtlfSoboAaplvHce3JzgpTr4_8';

function App() {
  // Get the practiceId from the URL path parameter
  const { practiceId } = useParams();
  // Get user state from Clerk
  const { user, isSignedIn } = useUser();

  // Add state hooks for data loading
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setError('No practice ID found in URL path.');
          setLoading(false);
          return;
        }

        // Existing fetch logic...
        const response = await fetch('https://prod-121.westus.logic.azure.com:443/workflows/ae97f93478ea45a49447ed9b984d7971/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jkNp7-6ahOHoHjc04gB07WLMOenNL37zsdrq7qWt7sg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ practiceId })
        });

        if (!response.ok) {
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
  }, [practiceId]);

  // Effect to update document title based on practice name
  useEffect(() => {
    if (dashboardData && dashboardData.practiceName) {
      const nameParts = dashboardData.practiceName.split(' ');
      const lastName = nameParts[nameParts.length - 1];
      document.title = `${lastName} | Weekly Performance`;
    }
    // Reset title if data is not available or component unmounts
    return () => {
      document.title = 'Neurolens Weekly Performance'; // Reset to default
    };
  }, [dashboardData]); // Rerun when dashboardData changes

  // --- useEffect for tracking report views (Using react-device-detect) ---
  useEffect(() => {
    if (isSignedIn && user && practiceId) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      
      // Determine device type using react-device-detect
      let deviceType = 'unknown'; 
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      else if (isDesktop) deviceType = 'desktop';
      
      const trackingData = {
        eventType: 'report_view',
        userId: user.id,
        userEmail: userEmail, 
        practiceId: practiceId,
        deviceType: deviceType, 
        osName: osName, // Add OS name
        browserName: browserName, // Add browser name
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending tracking data:', trackingData); 
      fetch(TRACKING_ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingData)
      })
      .then(response => {
        if (!response.ok) {
          console.error('Tracking request failed:', response.status, response.statusText);
        }
      })
      .catch(error => {
        console.error('Failed to send tracking data:', error);
      });
    }
    // Remove windowWidth from dependency array - now depends only on user/page context
  }, [practiceId, isSignedIn, user]);
  // -------------------------------------------------------------------

  // --- Loading/Error/No Data States ---
  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading dashboard data...</p>
    </div>
  );
  if (error) return (
    <div className="error-container">
      <h2>{/* Error SVG */} Error Loading Dashboard</h2>
      <p>{error}</p>
      <p className="suggestion">Please check the URL or Practice ID and try again. If the problem persists, contact support.</p>
    </div>
  );
  if (!dashboardData) return (
    <div className="no-data">
        No data available for Practice ID: {practiceId}. Please verify the ID or check data source.
    </div>
  );
  // ----------------------------------


  // Extract data from API response (add checks for potentially missing data)
  const { practiceName = "Practice", dateRange = "N/A", prescriberData = [], dailyData = [], patientsHelped = 0 } = dashboardData;

  // --- Data Preparation for Charts ---

  // Filter and sort data specifically for the FIRST chart (High Sx > 0)
  const filteredChartData = [...prescriberData]
    .filter(prescriber => (prescriber.highSx || 0) > 0)
    .sort((a, b) => (b.highSx || 0) - (a.highSx || 0))
    .map(prescriber => ({
      ...prescriber,
      _highSx: prescriber.highSx || 0,
      _orders: prescriber.orders || 0,
      labelName: prescriber.shortName || prescriber.name || 'Unknown' // Combined label source
    }));

  // Prepare Plotly Traces
  const plotlyTraceHighSx = {
    x: filteredChartData.map(d => d.labelName),
    y: filteredChartData.map(d => d._highSx),
    name: 'High Sx',
    type: 'bar',
    width: 0.5, // Set width for the background bar
    marker: {
      color: '#60a5fa' // Blue
    },
    text: filteredChartData.map(d => d._highSx), // Text for labels
    textposition: 'outside', // Position labels above bars
    textfont: {
      color: '#FFF', // Label color
      size: 11
    }
  };

  const plotlyTraceOrders = {
    x: filteredChartData.map(d => d.labelName),
    y: filteredChartData.map(d => d._orders),
    name: 'Orders',
    type: 'bar',
    width: 0.35, // Set a smaller width for the foreground bar
    marker: {
      color: '#BA4DA5', // Purple
      opacity: 0.85 // Slightly increased opacity for better visibility
    },
    text: filteredChartData.map(d => d._orders).map(v => (v === 0 ? '' : v)), // Show text only if > 0
    textposition: 'outside',
    textfont: {
        color: '#FFF',
        size: 11
      }
  };

  const plotlyData = [plotlyTraceHighSx, plotlyTraceOrders]; // Order matters for overlay: HighSx first (bottom), Orders second (top)

  // --- Calculate X-axis range dynamically ---
  const numCategories = filteredChartData.length;
  let xaxisRange = undefined; // Default to auto-range
  if (numCategories === 1) {
    // If only one category, manually set range to constrain width
    xaxisRange = [-0.7, 0.7];
  } else if (numCategories > 1) {
    // Optional: For multiple categories, default range often works well
    // xaxisRange = [-0.5, numCategories - 0.5];
  }
  // ---------------------------------------

  // Prepare Plotly Layout (Adjust top margin)
  const plotlyLayout = {
    barmode: 'overlay',
    showlegend: false,
    hovermode: false,
    autosize: true,
    margin: { l: 20, r: 20, t: 15, b: isMobile ? 40 : 30 }, // Reduced top margin
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      tickfont: { color: '#aaa', size: 10 },
      showgrid: false,
      zeroline: false,
      range: xaxisRange // Apply dynamic range
    },
    yaxis: {
      showticklabels: false,
      tickfont: { color: '#aaa', size: 10 },
      gridcolor: '#444',
      showgrid: true,
      zeroline: false,
      // Increase top padding for labels: use 15% of max value (or at least 2)
      range: [0, Math.max(2, ...filteredChartData.map(d => d._highSx)) * 1.15] 
    },
    uniformtext: { minsize: 8, mode: 'hide' }
  };

  const plotlyConfig = { displayModeBar: false };

  // Calculate derived values for the TABLE (same as before)
  const knownOrders = prescriberData.reduce((sum, item) => sum + (item.orders || 0), 0);
  const unknownOrders = patientsHelped - knownOrders;
  const hasUnknownOrders = unknownOrders > 0;

  // Calculate totals for the TABLE (same as before)
  const totals = {
    measurements: prescriberData.reduce((sum, item) => sum + (item.measurements || 0), 0),
    portalViews: prescriberData.reduce((sum, item) => sum + (item.portalViews || 0), 0),
    highSx: prescriberData.reduce((sum, item) => sum + (item.highSx || 0), 0),
    orders: patientsHelped
  };


  // Sort prescriber data for the TABLE (same as before)
  const sortedPrescriberData = [...prescriberData].sort((a, b) => {
    if (a.name === "No Provider") return 1;
    if (b.name === "No Provider") return -1;
    return (b.measurements || 0) - (a.measurements || 0);
  });

  // --- Process Daily Data: Filter, Reformat, and Split ---
  const processedDailyData = dailyData
    .filter(day => day.name && !day.name.toLowerCase().startsWith('sun '))
    .map(day => {
      let dayAbbr = 'N/A';
      let datePart = '';
      let formattedName = day.name || 'N/A'; // Keep original formatted for fallback/key

      const parts = day.name ? day.name.split(' ') : [];
      if (parts.length === 2 && parts[1].includes('/')) {
        dayAbbr = parts[0]; // e.g., "Mon"
        const dateParts = parts[1].split('/');
        if (dateParts.length === 2) {
          const month = parseInt(dateParts[0], 10);
          const dayOfMonth = parseInt(dateParts[1], 10);
          if (!isNaN(month) && !isNaN(dayOfMonth)) {
            datePart = `${month}/${dayOfMonth}`; // e.g., "4/8"
            // Reconstruct formattedName just in case parsing failed earlier but split worked
            formattedName = `${dayAbbr} ${datePart}`;
          }
        }
      }
      return {
        ...day, // Keep original data
        dayAbbr: dayAbbr,
        datePart: datePart,
        formattedName: formattedName // Used for key
      };
    });
  // -----------------------------------------------------------


  return (
    <div className="dashboard">
      {/* Header - Using CSS Grid */}
      <div className="header" style={{
           display: 'grid',
           gridTemplateColumns: 'auto 1fr auto',
           alignItems: 'start',
           gap: isMobile ? '5px' : '10px',
           padding: isMobile ? '8px 8px' : '8px 16px',
           marginBottom: isMobile ? '8px' : '16px'
           }}>

        {/* Left Section (Logo Link - Always Visible) */}
        <div className="header-left" style={{ /* No flex needed */ }}>
          <Link to="/all-customers" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <img src="/images/Neurolens Aligned Eye Blue PNG.png" alt="Neurolens - Go to All Customers" className="company-logo" title="Go to All Customers" style={{ height: '35px', width: 'auto', display: 'block' }} />
          </Link>
        </div>

        {/* Center Section (Text - Reordered) */}
        <div className="header-center" style={{
              textAlign: 'center',
              minWidth: 0 // Allow text wrapping
             }}>
          {/* Line 1: Static Title */}
          <h2 style={{
              fontSize: isMobile ? '1.0rem' : '1.3rem',
              margin: '0 0 2px 0', // Small margin below
              color: '#93c5fd', // Lighter blue for main title
              fontWeight: '600'
             }}>
             Weekly Performance Summary
          </h2>
          {/* Line 2: Practice Name */}
          <p style={{
             fontSize: isMobile ? '0.9rem' : '1.1rem',
             margin: '0 0 2px 0', // Small margin below
             color: '#e2e8f0' // Main text color
             }}>
             {practiceName}
          </p>
          {/* Line 3: Date Range */}
          <p style={{ 
             margin: 0, 
             fontSize: isMobile ? '0.8rem' : '0.9rem', 
             color: '#9ca3af' // Subdued color
             }}>
             Date Range: {dateRange}
          </p>
        </div>

        {/* Right Section (User Button) */}
        <div className="header-right" style={{ /* No flex needed */ justifySelf: 'end' }}>
          <UserButton afterSignOutUrl='/login' />
        </div>
      </div>

      {/* Plotly.js Overlapping Bar Chart */}
      <div className="card" style={{
        padding: isMobile ? '8px 2px' : '16px',
        marginBottom: isMobile ? '10px' : '16px'
      }}>
        <h2 style={{
          marginBottom: isMobile ? '6px' : '12px',
          paddingLeft: isMobile ? '8px' : '0'
        }}>
          High Sx vs <span style={{ color: '#BA4DA5' }}>Orders</span> by Provider
        </h2>
        <div style={{
            position: 'relative',
            width: '100%'
          }}>
          <Plot
            data={plotlyData}
            layout={plotlyLayout}
            config={plotlyConfig}
            style={{ width: '100%', height: isMobile ? '210px' : '250px' }}
            useResizeHandler={true}
          />
        </div>
      </div>

      {/* Prescriber Table with Totals */}
      <div className="card" style={{ padding: isMobile ? '10px' : '16px', marginBottom: isMobile ? '10px' : '16px' }}>
        <h2 style={{ marginBottom: isMobile ? '6px' : '12px' }}>
          Prescriber Performance Summary
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Prescriber</th>
                <th className="col-meas">Meas.</th>
                <th className="col-portal">Portal Views</th>
                <th className="col-highsx">High Sx</th>
                <th className="col-orders">Orders</th>
              </tr>
            </thead>
            <tbody>
              {/* Display sorted prescriber data */}
              {sortedPrescriberData.map((prescriber, index) => (
                <tr key={index}>
                  <td>{prescriber.name || 'Unknown'}</td>
                  <td className="col-meas">{prescriber.measurements || 0}</td>
                  <td className="col-portal">{prescriber.portalViews || 0}</td>
                  <td className="col-highsx">{prescriber.highSx || 0}</td>
                  <td className="col-orders">{prescriber.orders || 0}</td>
                </tr>
              ))}
              {/* "Unknown" row */}
              {hasUnknownOrders && (
                <tr>
                  <td>Unknown</td>
                  <td className="col-meas">-</td>
                  <td className="col-portal">-</td>
                  <td className="col-highsx">-</td>
                  <td className="col-orders">{unknownOrders}</td>
                </tr>
              )}
              {/* Totals row */}
              <tr className="totals">
                <td>TOTALS</td>
                <td className="col-meas">{totals.measurements}</td>
                <td className="col-portal">{totals.portalViews}</td>
                <td className="col-highsx">{totals.highSx}</td>
                <td className="col-orders">{totals.orders}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="small-text" style={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
          * Orders placed with SpecCheck typically appear per unique prescriber. "No Prescriber" values are counts for patient measurements not assigned a prescriber in the Neurolens Portal and/or orders we were unable to match to a patient.
        </div>
      </div>

      {/* Daily Performance Summary Table */}
      <div className="card" style={{
        padding: isMobile ? '10px' : '16px',
        marginBottom: isMobile ? '10px' : '16px'
      }}>
        <h2 style={{ marginBottom: isMobile ? '6px' : '12px' }}>
          Daily Performance Summary
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {/* Remove inline center, add class */}
                <th className="col-day">Day</th>
                <th className="col-meas">Meas.</th>
                <th className="col-portal">Portal Views</th>
                <th className="col-highsx">High Sx</th>
                <th className="col-orders">Orders</th>
              </tr>
            </thead>
            <tbody>
              {processedDailyData.length > 0
                ? processedDailyData.map((day, index) => (
                    <tr key={day.formattedName || index}>
                      {/* Remove inline center, add class, conditional rendering */}
                      <td className="col-day">
                        {day.dayAbbr}
                        {/* Add space on desktop, <br /> on mobile */}
                        {day.datePart && (isMobile ? <><br />{day.datePart}</> : ` ${day.datePart}`)}
                      </td>
                      <td className="col-meas">{day.measurements || 0}</td>
                      <td className="col-portal">{day.portalViews || 0}</td>
                      <td className="col-highsx">{day.highSx || 0}</td>
                      <td className="col-orders">{day.orders || 0}</td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#9ca3af', padding: '15px' }}>
                      No daily data available (excluding Sundays).
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;