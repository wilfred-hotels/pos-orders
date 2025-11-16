import { Controller, Post } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Minimal guest helper — returns a short guestId the frontend can persist.
 * The guestId is just a random UUID and is used as the `userId` on carts.
 */
@ApiTags('Guests')
@Controller('guests')
export class GuestsController {
  @Post()
  @ApiOperation({ summary: 'Create a guest id for anonymous users' })
  @ApiResponse({ status: 201, description: 'Guest id', schema: { example: { guestId: 'guest-uuid' } } })
  createGuest() {
    // crypto.randomUUID is available on modern Node.js runtimes; fallback to timestamp-based id if not.
    const guestId = typeof randomUUID === 'function' ? randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return { guestId };
  }
}
