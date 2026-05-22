const EmptyState = ({ 
  icon, 
  title, 
  message, 
  primaryAction, 
  secondaryAction 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
      <div className="max-w-xs mx-auto">
        {icon && (
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        {message && <p className="text-sm text-gray-500 mb-4">{message}</p>}
        
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-col gap-2 justify-center">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

