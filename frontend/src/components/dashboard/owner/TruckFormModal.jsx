import React, { useState, useRef } from "react";
// Ensure you have your CameraModal component, or remove this import if not using it yet
import CameraModal from "../../CameraModal"; 

const TruckFormModal = ({ isOpen, onClose, onSubmit, formData, onChange, editingTruck }) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleCapture = (blob) => {
    setCameraOpen(false);
    const file = new File([blob], `truck-photo-${Date.now()}.jpg`, { type: "image/jpeg" });
    const event = { target: { name: "image", type: "file", files: [file] } };
    onChange(event);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const event = { target: { name: "image", type: "file", files: e.dataTransfer.files } };
      onChange(event);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const removeImage = (e) => {
    e.stopPropagation();
    const event = { target: { name: "image", type: "file", files: [] } };
    onChange(event); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6">
      {/* Dark Overlay with Blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:rounded-3xl sm:max-w-2xl overflow-hidden shadow-2xl flex flex-col animate-fadeIn">
        
        {/* Header - Sticky on Mobile */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              {editingTruck ? "Edit Truck Details" : "Add New Truck"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          <form id="truck-form" onSubmit={onSubmit}>
            
            {/* Row 1: Title & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Truck Title"
                name="title"
                value={formData.title}
                onChange={onChange}
                placeholder="e.g. Tata Tipper 10 Ton"
                required
              />
              <SelectGroup
                label="Truck Type"
                name="type"
                value={formData.type}
                onChange={onChange}
                options={["Flatbed", "Container", "Tipper", "Tanker", "Trailer", "Box Truck"]}
                placeholder="Select Type"
              />
            </div>

            {/* Row 2: Capacity & Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup
                label="Capacity"
                name="capacityTons"
                type="number"
                step="0.1"
                value={formData.capacityTons}
                onChange={onChange}
                placeholder="0.0"
                rightIcon={<span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">TONS</span>}
              />
              <InputGroup
                label="Rate per KM"
                name="ratePerKm"
                type="number"
                step="0.1"
                value={formData.ratePerKm}
                onChange={onChange}
                placeholder="0.00"
                leftIcon={<span className="text-gray-900 font-serif font-bold text-lg">₹</span>}
              />
            </div>

            {/* Row 3: Drag & Drop Photo Area */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-600 uppercase tracking-wider">
                Truck Photo <span className="text-black">*</span>
              </label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group border-2 border-dashed rounded-xl min-h-[120px] flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer
                  ${isDragging ? "border-black bg-gray-50" : "border-gray-300 hover:border-gray-500 hover:bg-gray-50"}
                  ${formData.imagePreview ? "border-solid border-gray-200 p-2" : "p-6"}
                `}
              >
                {formData.imagePreview ? (
                  // Image Preview
                  <div className="relative w-full h-36 md:h-44 rounded-lg overflow-hidden">
                    <img 
                      src={formData.imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    {/* Remove Overlay */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         type="button" 
                         onClick={removeImage}
                         className="bg-white text-black px-5 py-2 rounded-full font-bold shadow-xl hover:scale-105 transition-transform text-sm"
                       >
                         Remove Photo
                       </button>
                    </div>
                  </div>
                ) : (
                  // Empty State
                  <div className="flex flex-col items-center justify-center space-y-3 text-center" onClick={triggerFileSelect}>
                    <div className="p-3 bg-gray-100 text-gray-900 rounded-full">
                       <UploadIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">
                        <span className="underline decoration-2 underline-offset-2">Click to upload</span> or drag here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  name="image"
                  ref={fileInputRef}
                  onChange={onChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              {/* Mobile Camera Button */}
              {!formData.imagePreview && (
                 <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500 hover:text-black transition-colors px-4 py-2 rounded-lg hover:bg-gray-100"
                    >
                      <CameraIcon className="w-4 h-4" />
                      Take photo using camera
                    </button>
                 </div>
              )}
            </div>

            {/* Row 4: Description & Location */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wider">Description</label>
                <textarea
                  name="description"
                  rows="2"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm resize-none placeholder-gray-400 font-bold"
                  value={formData.description}
                  onChange={onChange}
                  placeholder="Describe key features..."
                />
              </div>

              <InputGroup
                label="Location"
                name="locationString"
                value={formData.locationString}
                onChange={onChange}
                placeholder="Search city..."
                required
                leftIcon={<PinIcon className="w-5 h-5 text-gray-900" />}
                helpText="Auto-detects coordinates based on selection."
              />
            </div>
            
            {/* Row 5: Availability Toggle */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm font-black text-gray-900">Availability</span>
                <span className="text-xs font-bold text-gray-600">Is this truck active?</span>
              </div>
              <Toggle 
                checked={formData.available} 
                onChange={(e) => {
                  onChange({ target: { name: 'available', type: 'checkbox', checked: e.target.checked }})
                }} 
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white sm:rounded-b-3xl z-20">
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 font-black rounded-lg hover:bg-gray-50 hover:text-black transition-all text-sm"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    form="truck-form"
                    className="w-full sm:flex-1 px-5 py-2.5 bg-black text-white font-black rounded-lg shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                >
                    {editingTruck ? "Save Changes" : "Add Truck"}
                    <ArrowRightIcon className="w-3.5 h-3.5 text-gray-300" />
                </button>
            </div>
        </div>
      </div>
      
      {/* Camera Modal Component */}
      <CameraModal isOpen={cameraOpen} onCapture={handleCapture} onClose={() => setCameraOpen(false)} />
    </div>
  );
};

/* --- 
   MONOCHROME UI COMPONENTS 
   Designed to be modular and reusable
--- */

const InputGroup = ({ label, name, type = "text", value, onChange, placeholder, required, step, leftIcon, rightIcon, helpText }) => (
  <div className="w-full">
    <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
      {label} {required && <span className="text-black">*</span>}
    </label>
    <div className="relative group">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
          {leftIcon}
        </div>
      )}
      <input
        type={type}
        name={name}
        required={required}
        step={step}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black block p-2.5 transition-all font-black placeholder-gray-500
          ${leftIcon ? "pl-9" : ""} ${rightIcon ? "pr-12" : ""}
        `}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
    {helpText && <p className="mt-1.5 text-xs text-gray-400">{helpText}</p>}
  </div>
);

const SelectGroup = ({ label, name, value, onChange, options, placeholder }) => (
  <div className="w-full">
    <label className="block text-xs font-black text-gray-600 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black block p-2.5 pr-8 transition-all font-black cursor-pointer"
      >
        <option value="" className="text-gray-400">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt.toLowerCase()}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
  </label>
);

/* --- SVG ICONS (Strictly Monochrome) --- */
const CloseIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>;
const UploadIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const CameraIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PinIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ArrowRightIcon = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

export default TruckFormModal;