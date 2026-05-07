import express from 'express';
import whatsappService from '../services/whatsapp.js';
import sallaService from '../services/salla.js';

const router = express.Router();

router.post('/whatsapp/test', async (req, res) => {
    const { phone, template, variables } = req.body;
    
    if (!phone || !template) {
        return res.status(400).json({ 
            error: 'Missing required fields: phone, template' 
        });
    }

    try {
        const result = await whatsappService.sendMessage(phone, template, variables);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/salla/test-order', async (req, res) => {
    const mockOrder = {
        order_id: 'TEST-12345',
        customer_name: 'أحمد محمد',
        customer_phone: process.env.TEST_PHONE || '9665XXXXXXXX',
        customer_email: 'test@example.com',
        total: '299.00',
        items_count: 2,
        items: 'منتج 1 (x2)'
    };

    try {
        await whatsappService.sendOrderReceived(mockOrder);
        await whatsappService.sendNewOrderAlert(mockOrder);
        res.json({ success: true, order: mockOrder });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/orders/:id', async (req, res) => {
    try {
        const order = await sallaService.getOrder(req.params.id);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    
    try {
        const order = await sallaService.updateOrderStatus(req.params.id, status);
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
