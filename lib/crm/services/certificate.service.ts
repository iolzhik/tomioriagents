import fs from 'fs';
import path from 'path';
import { GiftCertificate, CertificateStatus } from '../types';

const CERTIFICATES_PATH = path.join(process.cwd(), 'knowledge', 'crm_gift_certificates.json');

function readCertificates(): GiftCertificate[] {
  if (!fs.existsSync(CERTIFICATES_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(CERTIFICATES_PATH, 'utf8')); } catch { return []; }
}

function writeCertificates(certs: GiftCertificate[]): void {
  const dir = path.dirname(CERTIFICATES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CERTIFICATES_PATH, JSON.stringify(certs, null, 2), 'utf8');
}

export function generateCertificateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `GIFT-${segment()}-${segment()}`;
}

export function issueCertificate(amount: number, issuedBy: string, expiresAt: string): GiftCertificate {
  const certs = readCertificates();
  const cert: GiftCertificate = {
    certificateId: 'cert-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    code: generateCertificateCode(),
    amount,
    issuedAt: new Date().toISOString(),
    issuedBy,
    status: 'active' as CertificateStatus,
    expiresAt,
  };
  writeCertificates([...certs, cert]);
  return cert;
}

export function validateCertificate(
  code: string,
  now: Date
): { valid: true; certificate: GiftCertificate } | { valid: false; error: string } {
  const cert = getCertificateByCode(code);
  if (!cert) return { valid: false, error: 'Certificate not found' };
  if (cert.status !== 'active') return { valid: false, error: `Certificate is ${cert.status}` };
  if (new Date(cert.expiresAt) <= now) return { valid: false, error: 'Certificate has expired' };
  return { valid: true, certificate: cert };
}

export function applyCertificate(code: string, leadId: string): GiftCertificate {
  const certs = readCertificates();
  const idx = certs.findIndex(c => c.code === code);
  if (idx === -1) throw new Error('Certificate not found');
  const updated: GiftCertificate = { ...certs[idx], status: 'used', usedInLeadId: leadId };
  certs[idx] = updated;
  writeCertificates(certs);
  return updated;
}

export function listCertificates(): GiftCertificate[] {
  return readCertificates();
}

export function getCertificateByCode(code: string): GiftCertificate | undefined {
  return readCertificates().find(c => c.code === code);
}
