'use client';

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

const ApiDocsPage = () => {
  return (
    <div className="container mx-auto p-4 bg-white rounded-lg shadow-sm my-8">
      <SwaggerUI url="/swagger.json" />
    </div>
  );
};

export default ApiDocsPage; 