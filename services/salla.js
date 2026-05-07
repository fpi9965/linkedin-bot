import 'dotenv/config';
import axios from 'axios';

class SallaService {
    constructor() {
        this.baseUrl = 'https://api.salla.dev/admin/v2';
        this.token = process.env.SALLA_TOKEN;
        this.headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    async getOrder(orderId) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/orders/${orderId}`,
                { headers: this.headers }
            );
            return response.data.data;
        } catch (error) {
            console.error(`❌ Salla API error:`, error.response?.data || error.message);
            throw error;
        }
    }

    async getOrders(params = {}) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/orders`,
                { 
                    headers: this.headers,
                    params: {
                        limit: params.limit || 25,
                        page: params.page || 1,
                        status: params.status
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error(`❌ Salla API error:`, error.response?.data || error.message);
            throw error;
        }
    }

    async updateOrderStatus(orderId, status) {
        const statusMap = {
            'pending': 'pending',
            'processing': 'processing',
            'prepared': 'prepared',
            'shipped': 'shipped',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };

        try {
            const response = await axios.put(
                `${this.baseUrl}/orders/${orderId}`,
                { status: statusMap[status] || status },
                { headers: this.headers }
            );
            return response.data.data;
        } catch (error) {
            console.error(`❌ Salla API error:`, error.response?.data || error.message);
            throw error;
        }
    }

    async updateShipping(orderId, shippingData) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/orders/${orderId}/shipping`,
                {
                    shipping_company: shippingData.company,
                    tracking_number: shippingData.tracking_number,
                    tracking_url: shippingData.tracking_url
                },
                { headers: this.headers }
            );
            return response.data.data;
        } catch (error) {
            console.error(`❌ Salla Shipping error:`, error.response?.data || error.message);
            throw error;
        }
    }

    parseWebhookPayload(event, data) {
        const orderData = {
            order_id: data.id || data.order_id,
            status: data.status,
            customer_name: data.customer?.name || data.buyer_name,
            customer_phone: data.customer?.mobile || data.buyer_phone,
            customer_email: data.customer?.email || data.buyer_email,
            total: data.total || data.order_total,
            items_count: data.items?.length || data.items_count,
            items: this.formatItems(data.items || data.order_items),
            shipping_address: data.shipping_address || data.address,
            created_at: data.created_at || data.date
        };

        return {
            event,
            order: orderData,
            timestamp: new Date().toISOString()
        };
    }

    formatItems(items) {
        if (!items || !Array.isArray(items)) return '';
        return items.map(item => 
            `${item.name || item.product_name} (x${item.quantity || item.qty})`
        ).join(', ');
    }
}

export default new SallaService();
