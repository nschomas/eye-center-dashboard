import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Dummy data for customers
const customersData = [
  { id: "9876-5432-1098-7654", name: "Cheyne Eye Center", tam: "Jessica Reynolds" },
  { id: "1234-5678-9012-3456", name: "Vision Partners", tam: "Michael Torres" },
  { id: "5678-9012-3456-7890", name: "Clear View Optometry", tam: "Sarah Johnson" },
  { id: "2345-6789-0123-4567", name: "Insight Eye Care", tam: "Robert Chen" },
  { id: "3456-7890-1234-5678", name: "Metro Vision Associates", tam: "Amanda Williams" },
  { id: "4567-8901-2345-6789", name: "Premier Eye Clinic", tam: "David Patterson" },
  { id: "6789-0123-4567-8901", name: "Family Eye Doctors", tam: "Lisa Martinez" },
  { id: "7890-1234-5678-9012", name: "Perfect Vision Center", tam: "John Smith" },
  { id: "8901-2345-6789-0123", name: "Advanced Eyecare", tam: "Emily Thompson" },
  { id: "0123-4567-8901-2345", name: "Horizon Eye Specialists", tam: "Brian Taylor" },
];

function AllCustomersPage() {
  const [customers, setCustomers] = useState(customersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  // Filter customers based on search term
  useEffect(() => {
    const filteredCustomers = customersData.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customer.tam.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setCustomers(filteredCustomers);
  }, [searchTerm]);

  // Sort customers
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const sortedCustomers = [...customers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    setCustomers(sortedCustomers);
  }, [sortConfig]);

  // Handle report sending
  const handleSendReport = (customerId, method) => {
    alert(`Report for customer ${customerId} will be sent via ${method}. This feature will be connected to Power Automate in the future.`);
  };

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
                <th>Send Report to TAM</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <Link 
                      to={`/dashboard/${customer.id}`}
                      className="customer-link"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td>{customer.tam}</td>
                  <td className="action-buttons">
                    <button 
                      className="action-button sms-button"
                      onClick={() => handleSendReport(customer.id, 'SMS')}
                      title={`Send SMS to ${customer.tamPhoneNumber || 'N/A'}`}
                      disabled={!customer.tamPhoneNumber}
                    >
                      SMS
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AllCustomersPage;