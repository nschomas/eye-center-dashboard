import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser, UserButton } from "@clerk/clerk-react";
import { 
  isMobile, 
  isTablet, 
  isDesktop, 
  osName, 
  browserName 
} from 'react-device-detect';
import './App.css';

// API Endpoint for login tracking
const API_URL = 'https://prod-08.westus.logic.azure.com:443/workflows/9a9c3f9886a24687ba7fa0f74dfd41b1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QOTEpw7_ywfJCkHPo-TMt2mnV4Eb8dd4yUWZLyre86Q';

// Tracking Endpoint URL (Same as in App.js)
const TRACKING_ENDPOINT_URL = 'https://prod-113.westus.logic.azure.com:443/workflows/ffb0db7884e5468a90b7e64238dab2ce/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fSb0hor4tIeiqeBxQBtlfSoboAaplvHce3JzgpTr4_8';

function AllCustomersPage() {
  // State for raw data from API, data to display, loading, error, search, and sort
  const [allCustomers, setAllCustomers] = useState([]);
  const [displayedCustomers, setDisplayedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  // State to track which customer's SMS is being sent
  const [sendingSmsCustomerId, setSendingSmsCustomerId] = useState(null);

  // Get user state from Clerk
  const { user, isSignedIn } = useUser();

  // Effect to fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({}) // Send empty JSON object as body
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch customer data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Access the array directly within data.value
        if (!data || !Array.isArray(data.value)) { // Check data.value directly
          console.error("API response format is unexpected (expected data.value to be an array):", data);
          throw new Error('Received unexpected data format from the server.');
        }
        const customerArray = data.value; // Get array from data.value

        // Map data using correct field names and convert isFocusAccount
        const mappedData = customerArray.map(customer => ({
          // Keep existing fields like id, name, tam, tamEmail
          ...customer, 
          // Map isFocusAccount ("Yes"/"No") to isTop12Focus (boolean)
          isTop12Focus: customer.isFocusAccount === 'Yes', 
          // Ensure tamPhone is carried over (if needed elsewhere, though button uses it directly)
          // tamPhone: customer.tamPhone // Already included via ...customer
        }));
        
        setAllCustomers(mappedData);

      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError(err.message || 'An unexpected error occurred while fetching customers.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Effect to filter and sort data whenever source data, search term, or sort config changes
  useEffect(() => {
    if (!allCustomers) return;

    let processedCustomers = [...allCustomers];

    // Filter
    if (searchTerm) {
      processedCustomers = processedCustomers.filter(customer => 
        (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (customer.tam && customer.tam.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort
    processedCustomers.sort((a, b) => {
      // Handle potential null/undefined values during sort
      const aValue = a[sortConfig.key] ?? ''; // Default to empty string if null/undefined
      const bValue = b[sortConfig.key] ?? ''; // Default to empty string if null/undefined

      // Handle boolean sort for isTop12Focus (true comes first in ascending)
      if (sortConfig.key === 'isTop12Focus') {
         if (aValue === bValue) return 0;
         if (sortConfig.direction === 'ascending') {
             return aValue ? -1 : 1;
         } else {
             return aValue ? 1 : -1;
         }
      }

      // Standard string/number sort
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    setDisplayedCustomers(processedCustomers);

  }, [allCustomers, searchTerm, sortConfig]); // Re-run when these change

  // --- useEffect for tracking page views --- 
  useEffect(() => {
    if (isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      
      // Determine device type using react-device-detect
      let deviceType = 'unknown'; 
      if (isMobile) deviceType = 'mobile';
      else if (isTablet) deviceType = 'tablet';
      else if (isDesktop) deviceType = 'desktop';
      
      const trackingData = {
        eventType: 'all_customers_view', // Specific event type for this page
        userId: user.id,
        userEmail: userEmail, 
        // No practiceId on this page
        deviceType: deviceType, 
        osName: osName, 
        browserName: browserName, 
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending tracking data (All Customers):', trackingData); 
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
    // Depends only on user context
  }, [isSignedIn, user]); 
  // --------------------------------------

  // --- Render Functions ---

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSendReport = async (customerId, method) => {
    // Find the customer data
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) {
      alert("Could not find customer data.");
      return;
    }

    if (method === 'SMS') {
      // Prevent sending if TAM phone is missing or if already sending for this user
      if (!customer.tamPhone) {
        alert("TAM phone number is not available for this customer.");
        return;
      }
      if (sendingSmsCustomerId) {
        // Already sending an SMS, prevent concurrent requests for simplicity
        alert("Please wait for the current SMS request to complete.");
        return; 
      }

      setSendingSmsCustomerId(customerId); // Indicate sending started

      const recipientPhoneNumber = customer.tamPhone;
      // Ensure the dashboard link is the full URL
      const reportLink = `${window.location.origin}/dashboard/${customerId}`;
      // Use environment variable for backend URL
      const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'; // Fallback for safety
      const backendUrl = `${backendBaseUrl}/send-sms`;

      try {
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipientPhoneNumber, reportLink }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert(`SMS successfully sent to ${customer.tam || 'the TAM'}!`);
        } else {
          // Use error message from backend if available, otherwise a generic one
          console.error("Backend Error sending SMS:", data);
          alert(`Failed to send SMS: ${data.error || response.statusText || 'Unknown error'}`);
        }
      } catch (networkError) {
        console.error("Network Error sending SMS:", networkError);
        // Update error message to reflect potential misconfiguration
        alert(`Failed to send SMS: Could not reach the server. Ensure it's running and REACT_APP_BACKEND_URL is configured correctly (${backendUrl}).`);
      } finally {
        setSendingSmsCustomerId(null); // Indicate sending finished (success or fail)
      }

    } else if (method === 'Email') {
      // Keep existing placeholder logic for Email
      const contactInfo = customer?.tamEmail;
      alert(`Report for ${customer?.name || customerId} will be sent via Email${contactInfo ? ` to ${contactInfo}` : ''}. This feature will be connected to Power Automate later.`);
    }
  };

  // --- Conditional Rendering ---

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customer data...This may take up to 30 seconds.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Error Loading Customers
        </h2>
        <p>{error}</p>
        <p className="suggestion">Please check your connection or try again later. If the problem persists, contact support.</p>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="all-customers-page">
      {/* Header - Using CSS Grid */}
      <div className="header" style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto', // Left: auto, Center: flexible, Right: auto
        alignItems: 'center', // Vertically align items in grid rows
        gap: isMobile ? '5px' : '10px', // Add small gap between columns
        padding: isMobile ? '8px 32px' : '8px 32px',
        marginBottom: '16px',
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>

        {/* Left Section (Logo) - Grid Column 1 */}
        <div className="header-left" style={{ /* No flex needed */ }}>
          <img 
            src="/images/Neurolens Aligned Eye Blue PNG.png" 
            alt="Neurolens - Relief is in Sight" 
            className="company-logo" 
            style={{ height: '35px', width: 'auto', display: 'block', verticalAlign: 'middle' }}
          />
        </div>

        {/* Center Section (Title) - Grid Column 2 */}
        <div className="header-center" style={{
          textAlign: 'center',
          minWidth: 0 // Helps ensure text wraps correctly if needed
        }}>
          <h1 style={{
              fontSize: isMobile ? '1.0rem' : '1.3rem', 
              margin: 0,
              color: '#5b9bd5', // Blue color
              lineHeight: '1.2' 
            }}>
              Neurolens Weekly Performance Summaries
          </h1>
        </div>

        {/* Right Section (User Button) - Grid Column 3 */}
        <div className="header-right" style={{ /* No flex needed */ justifySelf: 'end' }}> {/* Align item to end of its grid cell */}
          <UserButton afterSignOutUrl='/login' />
        </div>
      </div>
      
      <div className="customer-list-container">
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search customers or TAMs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="table-container">
          {displayedCustomers.length > 0 ? (
            <table className="customers-table">
              <thead>
                <tr>
                  <th onClick={() => requestSort('name')} className="sortable">
                    Customer Name
                    {sortConfig.key === 'name' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => requestSort('tam')} className="sortable">
                    TAM
                    {sortConfig.key === 'tam' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => requestSort('isTop12Focus')} className="sortable center">
                    Top 12 Focus
                    {sortConfig.key === 'isTop12Focus' && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}
                      </span>
                    )}
                  </th>
                  {/* Comment out Send Report header */}
                  {/* 
                  <th>Send Report (Coming Soon!)</th> 
                  */}
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link 
                        to={`/dashboard/${customer.id}`}
                        className="customer-link"
                      >
                        {customer.name || 'N/A'}
                      </Link>
                    </td>
                    <td>{customer.tam || 'N/A'}</td>
                    <td className="center">
                      {customer.isTop12Focus && (
                        <span style={{ color: '#60a5fa', fontSize: '1.2em' }} title="Top 12 Focus Account">
                          ✔️
                        </span>
                      )}
                    </td>
                    {/* Comment out action buttons cell */}
                    {/* 
                    <td className="action-buttons">
                      <button 
                        className="action-button sms-button"
                        onClick={() => handleSendReport(customer.id, 'SMS')}
                        title={`Send SMS to ${customer.tamPhone || 'N/A'}`}
                        disabled={!customer.tamPhone || sendingSmsCustomerId === customer.id} 
                      >
                        {sendingSmsCustomerId === customer.id ? 'Sending...' : 'SMS'}
                      </button>
                      <button 
                        className="action-button email-button"
                        onClick={() => handleSendReport(customer.id, 'Email')}
                        title={`Send Email to ${customer.tamEmail || 'N/A'}`}
                        disabled={!customer.tamEmail} 
                      >
                        Email
                      </button>
                    </td>
                     */}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
             <p style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
               {searchTerm ? 'No customers match your search.' : 'No customer data available.'}
             </p>
           )}
        </div>
      </div>
    </div>
  );
}

export default AllCustomersPage;