import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
// We'll dynamically import puppeteer at runtime so the code can compile in environments
// where the dependency is not installed (tests, CI without browser). This lets us
// provide graceful fallbacks and clearer errors.

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  private async loadTemplate() {
    const tplPath = path.join(__dirname, 'templates', 'receipt.hbs');
    const raw = await fs.readFile(tplPath, 'utf8');
    return Handlebars.compile(raw);
  }

  // order is a Sequelize model instance or plain object
  async renderReceiptPdf(order: any) {
    const compile = await this.loadTemplate();

    const data = this.normalizeOrder(order);
    const html = compile(data);

    // Dynamically import puppeteer to avoid static compile-time dependency
    let puppeteer: any;
    try {
      puppeteer = (await import('puppeteer')).default ?? (await import('puppeteer'));
    } catch (e) {
      this.logger.error('Puppeteer not available: ' + (e as any)?.message);
      throw new Error('PDF generation requires puppeteer to be installed in the runtime environment');
    }

    // Launch puppeteer headless and render PDF
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '12mm', right: '12mm' } });
      return pdf;
    } finally {
      try {
        await browser.close();
      } catch (e) {
        this.logger.warn('Failed to close browser: ' + (e as any)?.message);
      }
    }
  }

  private normalizeOrder(order: any) {
    const items = (order?.items || []).map((it: any) => ({
      name: it.product?.name ?? it.productName ?? 'Item',
      qty: it.quantity,
      unit: (it.product?.price ?? it.unitPrice ?? 0).toFixed ? (it.product?.price ?? it.unitPrice ?? 0).toFixed(2) : String(it.product?.price ?? it.unitPrice ?? 0),
      total: ((it.product?.price ?? it.unitPrice ?? 0) * (it.quantity || 1)).toFixed(2),
    }));

    const total = (order?.total ?? items.reduce((s: number, i: any) => s + parseFloat(i.total), 0)).toFixed(2);

    return {
      id: order?.id,
      code: order?.code,
      createdAt: order?.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString(),
      user: order?.user ? { name: order.user.username ?? order.user.name ?? 'Customer' } : { name: 'Customer' },
      items,
      total,
      source: order?.source ?? 'ecom',
      cartId: order?.cartId ?? null,
    };
  }
}
