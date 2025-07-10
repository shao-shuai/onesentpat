import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface Claim {
  number: string;
  text: string;
}

function formatPatentNumber(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (cleaned.startsWith('US')) {
    return cleaned;
  } else if (/^\d+$/.test(cleaned)) {
    return `US${cleaned}`;
  }
  
  return cleaned;
}

function constructPatentUrl(patentNumber: string): string {
  const formatted = formatPatentNumber(patentNumber);
  return `https://patents.google.com/patent/${formatted}B2/`;
}

async function fetchPatentData(url: string): Promise<Claim[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const claims: Claim[] = [];
    const claimNumbers = new Set<string>();
    
    // Find the claims section
    const claimsSection = $('section[itemprop="claims"]');
    if (claimsSection.length > 0) {
      const claimsText = claimsSection.text();
      
      // Split by claim numbers and process each claim
      const claimPattern = /(\d+)\.\s*([^]*?)(?=\d+\.\s*|$)/g;
      let match;
      
      while ((match = claimPattern.exec(claimsText)) !== null) {
        const claimNumber = match[1];
        const claimText = match[2].trim();
        
        if (claimText && !claimNumbers.has(claimNumber)) {
          claimNumbers.add(claimNumber);
          claims.push({
            number: claimNumber,
            text: claimText
          });
        }
      }
    }
    
    // Fallback: try to find claims in the entire document
    if (claims.length === 0) {
      const bodyText = $('body').text();
      const claimsMatch = bodyText.match(/Claims[\s\S]*?(?=\n\n|\n[A-Z][^.]*:|\n\s*$)/i);
      
      if (claimsMatch) {
        const claimsText = claimsMatch[0];
        const claimPattern = /(\d+)\.\s*([^]*?)(?=\d+\.\s*|$)/g;
        let match;
        
        while ((match = claimPattern.exec(claimsText)) !== null) {
          const claimNumber = match[1];
          const claimText = match[2].trim();
          
          if (claimText && !claimNumbers.has(claimNumber)) {
            claimNumbers.add(claimNumber);
            claims.push({
              number: claimNumber,
              text: claimText
            });
          }
        }
      }
    }

    return claims;
  } catch (error) {
    console.error('Error fetching patent data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { patentNumber } = await request.json();
    
    if (!patentNumber) {
      return NextResponse.json(
        { error: 'Patent number is required' },
        { status: 400 }
      );
    }

    const url = constructPatentUrl(patentNumber);
    const claims = await fetchPatentData(url);

    if (claims.length === 0) {
      return NextResponse.json(
        { error: 'No claims found for this patent number' },
        { status: 404 }
      );
    }

    return NextResponse.json({ claims });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patent data' },
      { status: 500 }
    );
  }
}