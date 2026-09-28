/*
  Webpay Plus (Transbank) — the standard card/debit payment in Chile.
  Defaults to Transbank's public INTEGRATION environment (test cards, no real charges).
  Production requires the merchant's own commerce code + API key via environment variables.
*/
import 'server-only';
import { IntegrationApiKeys, IntegrationCommerceCodes, WebpayPlus } from 'transbank-sdk';

export function webpayTransaction() {
  if (process.env.WEBPAY_ENV === 'production') {
    const code = process.env.WEBPAY_COMMERCE_CODE;
    const key = process.env.WEBPAY_API_KEY;
    if (!code || !key) throw new Error('WEBPAY_COMMERCE_CODE and WEBPAY_API_KEY are required in production.');
    return WebpayPlus.Transaction.buildForProduction(code, key);
  }
  return WebpayPlus.Transaction.buildForIntegration(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
  );
}

export const isWebpayTestMode = () => process.env.WEBPAY_ENV !== 'production';
