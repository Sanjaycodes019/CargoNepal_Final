const LoadingSpinner = ({ message = "Loading...", size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-2",
    lg: "h-16 w-16 border-4",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-gray-300 border-t-slate-900`}
        ></div>
        <p className="mt-4 text-sm font-medium text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

