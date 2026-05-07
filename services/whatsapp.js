import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class WhatsAppService {
    constructor() {
        this.phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
        this.accessToken = process.env.CLOUD_API_ACCESS_TOKEN;
        this.apiVersion = process.env.CLOUD_API_VERSION || 'v18.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
        this.templates = this.loadTemplates();
    }

    loadTemplates() {
        const templatesPath = path.join(__dirname, '../templates/messages.json');
        if (fs.existsSync(templatesPath)) {
            return JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
        }
        return this.getDefaultTemplates();
    }

    getDefaultTemplates() {
        return {
            order_received: {
                name: 'order_received',
                variables: ['customer_name', 'order_id', 'items_count']
            },
            order_prepared: {
                name: 'order_prepared',
                variables: ['customer_name', 'order_id', 'shipping_company']
            },
            order_shipped: {
                name: 'order_shipped',
                variables: ['customer_name', 'order_id', 'tracking_number', 'tracking_url']
            },
            new_order_alert: {
                name: 'new_order_alert',
                variables: ['order_id', 'customer_name', 'total', 'items']
            }
        };
    }

    normalizePhone(phone) {
        let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
        if (!cleaned.startsWith('966') && !cleaned.startsWith('20')) {
            if (cleaned.startsWith('5')) {
                cleaned = '966' + cleaned;
            } else if (cleaned.startsWith('0')) {
                cleaned = '966' + cleaned.substring(1);
            }
        }
        if (cleaned.startsWith('0')) {
            cleaned = '966' + cleaned.substring(1);
        }
        return cleaned;
    }

    async sendMessage(to, templateName, variables = {}) {
        try {
            const phone = this.normalizePhone(to);
            const message = this.formatMessage(templateName, variables);

            const result = await axios.post(
                this.baseUrl,
                {
                    messaging_product: 'whatsapp',
                    to: phone,
                    type: 'text',
                    text: { body: message }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(`✅ WhatsApp sent to ${phone}:`, result.data);
            return { success: true, message_id: result.data?.messages?.[0]?.id };
        } catch (error) {
            console.error(`❌ WhatsApp error:`, error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    formatMessage(templateName, variables) {
        const messages = {
            order_received: `مرحباً ${variables.customer_name}! 🎉\nتم استلام طلبك رقم #${variables.order_id}\nعدد المنتجات: ${variables.items_count}\nسنتواصل معك قريباً لتأكيد الطلب.`,
            
            order_prepared: `مرحباً ${variables.customer_name}! ✅\nتم تجهيز طلبك رقم #${variables.order_id}\nفي انتظار شركة الشحن لاستلام الطلب.`,
            
            order_shipped: `مرحباً ${variables.customer_name}! 📦\nتم شحن طلبك رقم #${variables.order_id}\nشركة الشحن: ${variables.shipping_company}\nرقم التتبع: ${variables.tracking_number}\nتتبع الشحنة: ${variables.tracking_url}`,
            
            new_order_alert: `🛒 طلب جديد!\n\nرقم الطلب: #${variables.order_id}\nالعميل: ${variables.customer_name}\nالمبلغ: ${variables.total} ريال\nالمنتجات: ${variables.items}\n\n⚡ من فضلك قم بتجهيز الطلب`
        };

        return messages[templateName] || templateName;
    }

    async sendOrderReceived(order) {
        return this.sendMessage(order.customer_phone, 'order_received', {
            customer_name: order.customer_name,
            order_id: order.order_id,
            items_count: order.items_count
        });
    }

    async sendOrderPrepared(order) {
        return this.sendMessage(order.customer_phone, 'order_prepared', {
            customer_name: order.customer_name,
            order_id: order.order_id
        });
    }

    async sendOrderShipped(order, tracking) {
        return this.sendMessage(order.customer_phone, 'order_shipped', {
            customer_name: order.customer_name,
            order_id: order.order_id,
            shipping_company: tracking.company,
            tracking_number: tracking.number,
            tracking_url: tracking.url
        });
    }

    async sendNewOrderAlert(order) {
        const adminPhone = process.env.ADMIN_PHONE;
        if (!adminPhone) {
            console.log('⚠️ ADMIN_PHONE not configured, skipping admin alert');
            return { success: false, error: 'Admin phone not configured' };
        }
        return this.sendMessage(adminPhone, 'new_order_alert', {
            order_id: order.order_id,
            customer_name: order.customer_name,
            total: order.total,
            items: order.items
        });
    }
}

export default new WhatsAppService();
