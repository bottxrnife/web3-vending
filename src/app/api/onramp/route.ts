import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const projectId = process.env.CDP_PROJECT_ID;
    const keyName = process.env.CDP_API_KEY_NAME;
    const privateKey = process.env.CDP_API_PRIVATE_KEY;

    console.log('Environment check:', {
      projectId: projectId ? 'present' : 'missing',
      keyName: keyName ? 'present' : 'missing', 
      privateKey: privateKey ? `present (${privateKey.length} chars)` : 'missing'
    });

    if (!projectId || !keyName || !privateKey) {
      return NextResponse.json({ 
        error: 'CDP configuration missing',
        debug: {
          projectId: !!projectId,
          keyName: !!keyName,
          privateKey: !!privateKey
        }
      }, { status: 500 });
    }

    // Clean up the private key (remove literal \n and ensure proper formatting)
    const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    console.log('Private key format check:', {
      originalLength: privateKey.length,
      cleanedLength: cleanPrivateKey.length,
      hasBEGIN: cleanPrivateKey.includes('BEGIN'),
      hasEND: cleanPrivateKey.includes('END')
    });

    // Create JWT for CDP authentication
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: 'cdp',
      sub: keyName,
      aud: ['cdp_service'],
      nbf: now,
      exp: now + 120, // 2 minutes
      iat: now,
    };

    let token;
    try {
      // Create JWT with manual header for ES256
      const header = {
        alg: 'ES256',
        kid: keyName,
        typ: 'JWT'
      };
      
      token = jwt.sign(jwtPayload, cleanPrivateKey, {
        algorithm: 'ES256',
        header: header
      });
      console.log('JWT created successfully, payload:', jwtPayload);
    } catch (jwtError) {
      console.error('JWT creation failed:', jwtError);
      return NextResponse.json({
        error: 'JWT creation failed',
        details: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
      }, { status: 500 });
    }

    // Call Coinbase Onramp API to get session token
    console.log('Calling Coinbase Onramp API...');
    const onrampResponse = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        destination_wallets: [
          {
            address: address,
            blockchains: ['ethereum', 'base'],
          },
        ],
        assets: ['USDC'],
        preset_fiat_amount: 1, // Default amount
        payment_methods: ['apple_pay', 'debit_card'],
      }),
    });

    console.log('Coinbase API response status:', onrampResponse.status);

    if (!onrampResponse.ok) {
      const errorText = await onrampResponse.text();
      console.error('Coinbase Onramp API error:', onrampResponse.status, errorText);
      return NextResponse.json(
        { error: 'Failed to create onramp session', details: errorText, status: onrampResponse.status },
        { status: onrampResponse.status }
      );
    }

    const data = await onrampResponse.json();
    const sessionToken = data.token;

    if (!sessionToken) {
      console.error('No session token in response:', data);
      return NextResponse.json({ error: 'No session token received', response: data }, { status: 500 });
    }

    // Return the hosted URL with the session token
    const onrampUrl = `https://pay.coinbase.com/buy/select-asset?sessionToken=${sessionToken}&defaultAsset=USDC&defaultNetwork=base`;
    console.log('Successfully created onramp URL');

    return NextResponse.json({ url: onrampUrl });
  } catch (error) {
    console.error('Onramp session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 