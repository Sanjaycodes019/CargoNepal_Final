const VerifiedBadge = ({ size = 16, color = "#1D9BF0" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-label="Verified"
  >
    {/* 12-pointed scalloped star badge - larger size */}
    <path
      d="M12 2
         L13.8 3.8
         L16.2 3.2
         L17.5 5.5
         L20 6.2
         L19.2 8.8
         L21 11
         L19.2 13.2
         L20 15.8
         L17.5 16.5
         L16.2 18.8
         L13.8 18.2
         L12 20
         L10.2 18.2
         L7.8 18.8
         L6.5 16.5
         L4 15.8
         L4.8 13.2
         L3 11
         L4.8 8.8
         L4 6.2
         L6.5 5.5
         L7.8 3.2
         L10.2 3.8
         Z"
      fill={color}
    />

    {/* Smaller check mark positioned lower */}
    <path
      d="M8.5 11.5
         L10.5 13.5
         L15 9"
      stroke="white"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default VerifiedBadge;
