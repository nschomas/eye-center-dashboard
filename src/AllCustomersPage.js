import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// API Endpoint
const API_URL = 'https://prod-08.westus.logic.azure.com:443/workflows/9a9c3f9886a24687ba7fa0f74dfd41b1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QOTEpw7_ywfJCkHPo-TMt2mnV4Eb8dd4yUWZLyre86Q';

function AllCustomersPage() {
  // State for raw data from API, data to display, loading, error, search, and sort
  const [allCustomers, setAllCustomers] = useState([]);
  const [displayedCustomers, setDisplayedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

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

  // --- Render Functions ---

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSendReport = (customerId, method) => {
    // Find customer to get details if needed (e.g., phone/email for alert)
    const customer = allCustomers.find(c => c.id === customerId);
    // Use tamPhone from API response
    const contactInfo = method === 'SMS' ? customer?.tamPhone : customer?.tamEmail;
    alert(`Report for ${customer?.name || customerId} will be sent via ${method}${contactInfo ? ` to ${contactInfo}` : ''}. This feature will be connected to Power Automate later.`);
    // Note: We might want to disable buttons if contact info isn't present in fetched data
  };

  // --- Conditional Rendering ---

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customer data...</p>
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
      <div className="header">
        <div className="logo-container">
          <a href="https://portal.neurolens.com" target="_blank" rel="noopener noreferrer">
            <img 
              src="/images/Neurolens Aligned Eye Blue PNG.png" 
              alt="Neurolens - Relief is in Sight" 
              className="company-logo" 
            />
          </a>
        </div>
        <div className="header-text">
          <h1>Neurolens Weekly Performance Summaries</h1>
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
                  <th>Send Report to TAM</th>
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
                        {customer.name || 'N/A'} {/* Add fallback for missing name */}
                      </Link>
                    </td>
                    <td>{customer.tam || 'N/A'} {/* Add fallback for missing TAM */}</td>
                    <td className="center">
                      {customer.isTop12Focus && (
                        <span style={{ color: '#60a5fa', fontSize: '1.2em' }} title="Top 12 Focus Account">
                          ✔️
                        </span>
                      )}
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="action-button sms-button"
                        onClick={() => handleSendReport(customer.id, 'SMS')}
                        // Use tamPhone from API response
                        title={`Send SMS to ${customer.tamPhone || 'N/A'}`}
                        disabled={!customer.tamPhone} 
                      >
                        SMS
                      </button>
                      <button 
                        className="action-button email-button"
                        onClick={() => handleSendReport(customer.id, 'Email')}
                        // Check if tamEmail exists in the fetched data before enabling
                        title={`Send Email to ${customer.tamEmail || 'N/A'}`}
                        disabled={!customer.tamEmail} 
                      >
                        Email
                      </button>
                    </td>
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