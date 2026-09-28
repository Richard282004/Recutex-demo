/*
  Webpay return URL. Transbank sends the buyer back here (GET or POST) with:
  - token_ws                     → payment finished: commit it
  - TBK_TOKEN (+ TBK_ORDEN_COMPRA) → buyer cancelled on the Webpay form
  - neither                      → timeout / error
*/
import { NextResponse, type NextRequest } from 'next/server';
import { webpayTransaction } from '@/lib/webpay';

async function handle(request: NextRequest, params: URLSearchParams) {
  const result = new URL('/checkout/resultado', request.url);
  const token = params.get('token_ws');
  const aborted = params.get('TBK_TOKEN');

  if (token && !aborted) {
    try {
      const commit = await webpayTransaction().commit(token);
      const approved = commit.status === 'AUTHORIZED' && commit.response_code === 0;
      result.searchParams.set('estado', approved ? 'aprobado' : 'rechazado');
      result.searchParams.set('token', token);
    } catch (error) {
      console.error('Webpay commit failed', error);
      result.searchParams.set('estado', 'error');
    }
  } else if (aborted) {
    result.searchParams.set('estado', 'anulado');
    const order = params.get('TBK_ORDEN_COMPRA');
    if (order) result.searchParams.set('orden', order);
  } else {
    result.searchParams.set('estado', 'error');
  }

  // 303 so a POST from Transbank becomes a GET of the result page.
  return NextResponse.redirect(result, 303);
}

export async function GET(request: NextRequest) {
  return handle(request, request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const params = new URLSearchParams();
  form.forEach((value, key) => typeof value === 'string' && params.set(key, value));
  return handle(request, params);
}
