// Client: Reusable Input component with label and error display
import React from 'react';
export const Input = ({ label, error, className = '', id, ...props }) => {
    return (<div className="w-full">
      {label && (<label htmlFor={id} className="block text-sm font-medium text-text mb-1">
          {label}
        </label>)}
      <input id={id} className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${error ? 'border-error' : ''} ${className}`} {...props}/>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>);
};
