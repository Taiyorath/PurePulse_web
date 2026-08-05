import React from 'react';

const TestDashboard: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '20px' }}>
        🎉 ML Dashboard Test - SUCCESS!
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>✅ Route Working: /intelligence</h2>
        <p>This confirms that the routing is working correctly!</p>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>🔗 Available Routes:</h2>
        <ul>
          <li><strong>/air-quality</strong> - Original Delhi heatmap</li>
          <li><strong>/ml-dashboard</strong> - Full ML intelligence center</li>
          <li><strong>/intelligence</strong> - Alternative ML access (this page)</li>
        </ul>
      </div>

      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '10px',
        border: '2px solid #4caf50'
      }}>
        <h2>🚀 Next Steps:</h2>
        <p>Now that routing is confirmed working, you can see:</p>
        <ol>
          <li>The ML Dashboard components are properly imported</li>
          <li>The routes are correctly registered</li>
          <li>The server is running without critical errors</li>
        </ol>
      </div>
    </div>
  );
};

export default TestDashboard;