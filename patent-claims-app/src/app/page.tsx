'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

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
            <Input
              type="text"
              value={patentNumber}
              onChange={(e) => setPatentNumber(e.target.value)}
              placeholder="Enter US patent number (e.g., US8848839)"
              className="w-80"
            />
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Fetching...' : 'Get Claims'}
            </Button>
          </div>
        </form>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {claims.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Patent Claims for {patentNumber.toUpperCase()}
                <Badge variant="secondary">{claims.length} claims</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {claims.map((claim, index) => (
                  <div key={claim.number}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Claim {claim.number}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {claim.text}
                    </p>
                    {index < claims.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}