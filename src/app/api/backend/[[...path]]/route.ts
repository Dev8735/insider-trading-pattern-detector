import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.NEXT_PUBLIC_API_URL

async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!backendUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_API_URL is not configured' }, { status: 500 })
  }

  const { path = [] } = await params
  const target = new URL(path.join('/'), `${backendUrl.replace(/\/$/, '')}/`)
  target.search = request.nextUrl.search

  try {
    const response = await fetch(target, {
      method: request.method,
      headers: {
        Accept: request.headers.get('accept') ?? 'application/json',
        ...(request.headers.get('content-type')
          ? { 'Content-Type': request.headers.get('content-type') as string }
          : {}),
      },
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') ?? 'application/json',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 })
  }
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const PATCH = forward
export const DELETE = forward
