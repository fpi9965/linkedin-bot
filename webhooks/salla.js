import express from 'express';
import crypto from 'crypto';
import sallaService from '../services/salla.js';
import whatsappService from '../services/whatsapp.js';

const router = express.Router();

router.post('/salla/webhook', verifySallaWebhook, handleSallaWebhook);

function verifySallaWebhook(req, res, next) {
    const signature = req.headers['x-salla-signature'];
    const secret = process.env.SALLA_WEBHOOK_SECRET;

    if (!secret) {
        console.log('⚠️ No webhook secret configured, skipping verification');
        return next();
    }

    const hash = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature !== hash) {
        console.log('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
}

async function handleSallaWebhook(req, res) {
    const { event, data } = req.body;
    
    console.log(`📨 Salla Webhook: ${event}`, data);

    try {
        const parsed = sallaService.parseWebhookPayload(event, data);
        const { order } = parsed;

        switch (event) {
            case 'order.created':
            case 'orders.created':
                await handleNewOrder(order);
                break;

            case 'order.updated':
            case 'orders.status.updated':
                await handleOrderStatusUpdate(order);
                break;

            case 'order.shipment_created':
            case 'orders.shipment.created':
                await handleOrderShipped(order);
                break;

            default:
                console.log(`📝 Unhandled event: ${event}`);
        }

        res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function handleNewOrder(order) {
    console.log(`🛒 Processing new order #${order.order_id}`);

    await whatsappService.sendOrderReceived(order);
    await whatsappService.sendNewOrderAlert(order);
}

async function handleOrderStatusUpdate(order) {
    console.log(`📦 Order #${order.order_id} status: ${order.status}`);

    if (order.status === 'prepared' || order.status === 'processing') {
        await whatsappService.sendOrderPrepared(order);
    }
}

async function handleOrderShipped(order) {
    console.log(`📦 Order #${order.order_id} shipped`);

    const tracking = {
        company: order.shipping_company || 'شركة الشحن',
        number: order.tracking_number || order.shipment_id,
        url: order.tracking_url || `https://salla.sa/track/${order.order_id}`
    };

    await whatsappService.sendOrderShipped(order, tracking);
}

export default router;
