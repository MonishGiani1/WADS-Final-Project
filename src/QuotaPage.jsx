import { useState } from "react";

export default function QuotaPage() {
  const [usedTime, setUsedTime] = useState(30); // e.g., 30 minutes used
  const totalTime = 120; // e.g., 2 hours total

  const quotaPlans = [
    { name: "30 Min Boost", price: "$1", time: 30 },
    { name: "1 Hour Boost", price: "$1.75", time: 60 },
    { name: "2 Hour Boost", price: "$3", time: 120 },
  ];

  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (usedTime / totalTime) * circumference;

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="flex justify-center mb-10">
        <svg
          height={radius * 2}
          width={radius * 2}
        >
          <circle
            stroke="#4B5563"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#10B981"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, transition: "stroke-dashoffset 0.35s" }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            className="fill-white text-lg font-bold"
          >
            {usedTime}m
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {quotaPlans.map((plan, index) => (
          <div
            key={index}
            className="bg-gray-700 p-6 rounded-xl text-center hover:bg-gray-600 transition"
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <p className="text-green-400 text-lg font-semibold">{plan.price}</p>
            <p className="mt-2 text-sm">Add {plan.time} minutes to your time</p>
            <button className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded">
              Buy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
