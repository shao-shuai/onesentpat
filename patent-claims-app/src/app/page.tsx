'use client';

import { useState } from 'react';

interface Claim {
  number: string;
  text: string;
}

export default function Home() {
  const [patentNumber, setPatentNumber] = useState('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patentNumber.trim()) return;

    setLoading(true);
    setError(null);
    setClaims([]);

    try {
      const response = await fetch('/api/patent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patentNumber: patentNumber.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patent data');
      }

      const data = await response.json();
      setClaims(data.claims);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Patent Claims Finder
        </h1>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4 items-center justify-center">
            <input
              type="text"
              value={patentNumber}
              onChange={(e) => setPatentNumber(e.target.value)}
              placeholder="Enter US patent number (e.g., US8848839)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching...' : 'Get Claims'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {claims.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Patent Claims for {patentNumber.toUpperCase()}
            </h2>
            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.number} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-800">Claim {claim.number}</h3>
                  <p className="text-gray-600 mt-1">{claim.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}