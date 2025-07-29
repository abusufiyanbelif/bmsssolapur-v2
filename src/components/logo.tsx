
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      <circle cx="50" cy="50" r="48" fill="#006400" />
      <path
        id="curve"
        fill="transparent"
        d="M 10,50 a 40,40 0 1,1 80,0"
      />
      <text width="500" fill="#FFFFFF" className="font-semibold" fontSize="11">
        <textPath xlinkHref="#curve" startOffset="50%" textAnchor="middle">
          BAITUL MALL SAMAJIK SANSTHA
        </textPath>
      </text>
       <path
        id="curve2"
        fill="transparent"
        d="M 15, 52 a 40,40 0 0,0 70,0"
      />
       <text width="500" fill="#FFFFFF" className="font-semibold" fontSize="11">
         <textPath xlinkHref="#curve2" startOffset="50%" textAnchor="middle">
          SOLAPUR
        </textPath>
      </text>
       <circle cx="20" cy="50" r="2" fill="#FFFFFF" />
      <circle cx="80" cy="50" r="2" fill="#FFFFFF" />
      <path
        d="M35 65 C 30 55, 30 50, 40 45 L 60 45 C 70 50, 70 55, 65 65 Z"
        fill="#32CD32"
        stroke="#FFFFFF"
        strokeWidth="1"
      />
        <path
        d="M40 65 C 35 55, 35 50, 45 45 L 65 45 C 75 50, 75 55, 70 65 Z"
        fill="#FFD700"
        stroke="#FFFFFF"
        strokeWidth="1"
        transform="translate(25, -5) rotate(15, 50, 50)"
      />
      <path
        d="M 50 25 L 40 35 L 50 45 L 60 35 Z"
        fill="#FFD700"
        stroke="#FFFFFF"
        strokeWidth="1"
      />
    </svg>
  );
};
