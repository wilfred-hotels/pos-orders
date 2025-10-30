import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

  private async loadTemplate() {
    const tplPath = path.join(__dirname, 'templates', 'receipt.hbs');
    const raw = await fs.readFile(tplPath, 'utf8');
    return Handlebars.compile(raw);
  }

  // Return an object describing the generated content. We no longer rely on
  // puppeteer in order to avoid the heavy dependency in deployments. Consumers
  // should handle the 'html' fallback. The returned shape is { type, data }.
  async renderReceiptPdf(order: any): Promise<{ type: 'pdf' | 'html'; data: Buffer }> {
    const compile = await this.loadTemplate();
    const data = this.normalizeOrder(order);
    const html = compile(data);

    // Return HTML fallback as Buffer so callers can send it directly when PDF
    // rendering is not available in the environment.
    return { type: 'html', data: Buffer.from(html, 'utf8') };
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
