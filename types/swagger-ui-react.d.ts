declare module 'swagger-ui-react' {
  import React from 'react';
  
  interface SwaggerUIProps {
    spec?: object;
    url?: string;
    layout?: string;
    validatorUrl?: string;
    requestInterceptor?: (req: any) => any;
    responseInterceptor?: (res: any) => any;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    supportedSubmitMethods?: string[];
    filter?: string | boolean;
    deepLinking?: boolean;
    [key: string]: any;
  }
  
  const SwaggerUI: React.FC<SwaggerUIProps>;
  
  export default SwaggerUI;
} 