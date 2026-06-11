import { Router, raw } from 'express';
import { BillingController } from './billing.controller';

const router = Router();
const billingController = new BillingController();

// Webhook needs raw Buffer payload for cryptographic signature verification
router.post('/webhook', raw({ type: 'application/json' }), billingController.webhook);

export default router;
