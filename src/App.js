import React, { useState, useEffect } from 'react';
// Import useParams
import { useParams } from 'react-router-dom';
// Import useUser from Clerk
import { useUser } from '@clerk/clerk-react';
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
import { Bar as ChartJsBar } from 'react-chartjs-2'; // Renamed Bar component
// Import Recharts components needed for the *other* charts (AreaChart etc.)
import { ResponsiveContainer, AreaChart, Area, XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts'; // Keep necessary Recharts imports

// Import Plotly component
import Plot from 'react-plotly.js';

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

  // --- useEffect for tracking report views (Modified) ---
  useEffect(() => {
    if (isSignedIn && user && practiceId) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const trackingData = {
        eventType: 'report_view',
        userId: user.id,
        userEmail: userEmail, // Add user email
        practiceId: practiceId,
        timestamp: new Date().toISOString()
      };
      console.log('Sending tracking data:', trackingData); // Optional: for debugging
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
  }, [practiceId, isSignedIn, user]);
  // ---------------------------------------------

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
    width: 0.9, // Set width for the background bar
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
    width: 0.6, // Set a smaller width for the foreground bar
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

  // Prepare Plotly Layout
  const plotlyLayout = {
    barmode: 'overlay',
    showlegend: false,
    hovermode: false,
    autosize: true,
    margin: { l: 20, r: 20, t: 30, b: isMobile ? 40 : 30 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      tickfont: { color: '#aaa', size: 10 },
      showgrid: false,
      zeroline: false
    },
    yaxis: {
      showticklabels: false,
      tickfont: { color: '#aaa', size: 10 },
      gridcolor: '#444',
      showgrid: true,
      zeroline: false,
      range: [0, Math.max(...filteredChartData.map(d => d._highSx)) + 5]
    },
    uniformtext: {
      minsize: 8,
      mode: 'hide'
    }
  };

  const plotlyConfig = {
      displayModeBar: false
  };

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

  // --- Recharts Label Component (Might still be used by AreaChart?) --- Keep if needed
   const renderCustomBarLabel = (props) => {
     const { x, y, width, value } = props;
     // Hide label if value is 0 or null/undefined
     if (!value || value === 0) {
       return null;
     }
     return (
       <g>
         <text
           x={x + width / 2}
           y={y - 6} // Position above bar
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
   // -------------------------------------------------------------------


  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header" style={{ marginBottom: isMobile ? '8px' : '16px' }}>
        {!isMobile && (
          <div className="logo-container">
            <img src="/images/Neurolens Aligned Eye Blue PNG.png" alt="Neurolens - Relief is in Sight" className="company-logo" />
          </div>
        )}
        <div className="header-text" style={{ textAlign: isMobile ? 'center' : 'left', width: '100%' }}>
          <h1>{practiceName} - Performance Summary</h1>
          <p>Date Range: {dateRange}</p>
        </div>
      </div>

      {/* Plotly.js Overlapping Bar Chart */}
      <div className="card" style={{
        padding: isMobile ? '8px 2px' : '16px',
        marginBottom: isMobile ? '10px' : '16px'
        // Height is now controlled by Plotly's autosize and container
      }}>
        <h2 style={{
          marginBottom: isMobile ? '6px' : '12px',
          paddingLeft: isMobile ? '8px' : '0'
        }}>
          High Sx vs <span style={{ color: '#BA4DA5' }}>Orders</span> by Provider
        </h2>
        {/* Plotly component */}
        <Plot
          data={plotlyData}
          layout={plotlyLayout}
          config={plotlyConfig}
          style={{ width: '100%', height: isMobile ? '260px' : '300px' }} // Control height via style
          useResizeHandler={true} // Ensures chart redraws on container resize
        />
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
                <th className="center">Measures</th>
                <th className="center">Portal Views</th>
                <th className="center">High Sx</th>
                <th className="center">Orders</th>
              </tr>
            </thead>
            <tbody>
              {/* Display sorted prescriber data */}
              {sortedPrescriberData.map((prescriber, index) => (
                <tr key={index}>
                  <td>{prescriber.name || 'Unknown'}</td>
                  <td className="center">{prescriber.measurements || 0}</td>
                  <td className="center">{prescriber.portalViews || 0}</td>
                  <td className="center">{prescriber.highSx || 0}</td>
                  <td className="center">{prescriber.orders || 0}</td>
                </tr>
              ))}
              {/* "Unknown" row */}
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

      {/* Daily Activity Waterfall Chart (Recharts - Keep as is for now) */}
      <div className="card" style={{
        padding: isMobile ? '10px 4px' : '16px'
      }}>
        <h2 style={{
          marginBottom: isMobile ? '6px' : '12px',
          paddingLeft: isMobile ? '6px' : '0'
        }}>
          Daily Activity Trend
        </h2>
        <ResponsiveContainer width="100%" height={isMobile ? 260 : 300}>
          {/* Ensure Recharts components here use the renamed imports if needed */}
          <AreaChart data={dailyData} margin={{ top: 20, right: isMobile ? 0 : 30, left: isMobile ? 0 : 20, bottom: 20 }}>
            <RechartsCartesianGrid strokeDasharray="3 3" stroke="#444" />
            <RechartsXAxis dataKey="name" tick={{fill: '#aaa'}} />
            <RechartsYAxis tick={{fill: '#aaa'}} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#222', borderColor: '#555', fontSize: '12px', padding: '5px 8px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} labelStyle={{ display: 'none' }} itemStyle={{ color: '#ddd', fontSize: '12px', padding: '2px 0' }} wrapperStyle={{ zIndex: 100 }} formatter={(value) => value || 0} />
            <RechartsLegend wrapperStyle={{color: '#aaa'}} />
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