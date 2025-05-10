import React, { useState, useRef } from "react";
import { FiUpload, FiDownload, FiFile } from "react-icons/fi";

const ImportExportCard = ({ 
  onImport, 
  onExport, 
  importLoading, 
  exportLoading
}) => {
  const [selectedFormat, setSelectedFormat] = useState("xlsx");
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    onImport(file, fileExtension);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    onExport(selectedFormat);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Data Management</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Section */}
        <div className="border rounded-lg p-4 hover:border-orange-500 transition-colors">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-orange-100 text-orange-500">
              <FiUpload className="w-6 h-6" />
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-gray-800">Import Stops</h4>
              <p className="text-sm text-gray-500">Upload your stops data</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <FiFile className="text-gray-500" />
              <span className="text-gray-600">Supported formats: XLSX, CSV, JSON</span>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv,.json"
              className="hidden"
            />
            
            <button
              onClick={handleFileSelect}
              disabled={importLoading}
              className={`w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors duration-200 ${
                importLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {importLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Importing...</span>
                </div>
              ) : (
                'Choose File to Import'
              )}
            </button>
          </div>
        </div>
        
        {/* Export Section */}
        <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
          <div className="flex items-center mb-3">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiDownload className="w-6 h-6" />
            </div>
            <div className="ml-3">
              <h4 className="font-medium text-gray-800">Export Stops</h4>
              <p className="text-sm text-gray-500">Download your stops data</p>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Select format:</label>
              <select 
                value={selectedFormat} 
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="text-sm border rounded p-1 focus:ring-blue-600 focus:border-blue-600"
              >
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className={`w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors duration-200 ${
                exportLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {exportLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </div>
              ) : (
                'Export Stops Data'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportCard;