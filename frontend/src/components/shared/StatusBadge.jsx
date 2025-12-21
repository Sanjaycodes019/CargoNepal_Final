const StatusBadge = ({ status, size = "md" }) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    declined: "bg-rose-100 text-rose-800 border-rose-200",
    in_transit: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200",
    cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  };

  const sizeClasses = {
    sm: "text-[10px] px-2 py-1",
    md: "text-xs px-3 py-1.5",
    lg: "text-sm px-4 py-2",
  };

  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  const displayStatus = status ? status.replace("_", " ") : "";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full font-semibold border ${colorClass} ${sizeClasses[size]}`}
    >
      {displayStatus}
    </span>
  );
};

export default StatusBadge;

