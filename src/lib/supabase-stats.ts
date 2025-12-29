
import { supabase } from './supabase';

export interface DashboardStats {
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    newCustomers: number;
    pendingOrders: number;
    pendingPaymentCount: number;
    pendingPaymentAmount: number;
}


// Helper function to fetch all data with pagination (to bypass 1000 rows limit)
const fetchAll = async (query: any) => {
    let allData: any[] = [];
    let page = 0;
    const size = 1000;

    while (true) {
        const { data, error } = await query.range(page * size, (page + 1) * size - 1);
        if (error) throw error;

        if (data) {
            allData = allData.concat(data);
            if (data.length < size) break;
        } else {
            break;
        }
        page++;
    }
    return allData;
};

export const getSupabaseDashboardStats = async (startDate: string, endDate: string, branchName?: string) => {
    let query = supabase
        .from('orders')
        .select('total_amount, payment_status, status', { count: 'exact' })
        .gte('order_date', startDate)
        .lte('order_date', endDate);

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    // Use fetchAll to get all data
    const data = await fetchAll(query);
    const count = data.length;

    const stats = {
        totalRevenue: 0,
        orderCount: count || 0,
        averageOrderValue: 0,
        newCustomers: 0,
        pendingOrders: 0,
        pendingPaymentCount: 0,
        pendingPaymentAmount: 0
    };

    data.forEach((order: any) => {
        // 결제 완료 또는 완결 처리된 주문만 매출에 포함
        if (order.payment_status === 'paid' || order.payment_status === 'completed' || order.payment_status === '완결') {
            stats.totalRevenue += Number(order.total_amount);
        }

        if (order.status === 'processing' || order.status === 'pending') {
            stats.pendingOrders += 1;
        }

        if (order.payment_status === 'pending') {
            stats.pendingPaymentCount += 1;
            stats.pendingPaymentAmount += Number(order.total_amount);
        }
    });

    // 고객 수 집계 (customers 테이블에서 해당 지점 고객 수 조회)
    // Note: Customers table might also need pagination if it's huge, but 'count' with head:true bypasses limit usually?
    // Actually count with head:true is safer.
    let customerQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

    if (branchName && branchName !== '전체') {
        customerQuery = customerQuery.eq('branch', branchName);
    }

    const { count: customerCount } = await customerQuery;
    stats.newCustomers = customerCount || 0;

    stats.averageOrderValue = stats.orderCount > 0 ? stats.totalRevenue / stats.orderCount : 0;

    return stats;
};

export const getSupabaseDailySales = async (startDate: string, endDate: string, branchName?: string) => {
    let query = supabase
        .from('orders')
        .select('order_date, total_amount, branch_name, payment_status')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('payment_status', ['paid', 'completed', '완결'])
        .order('order_date', { ascending: true });

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    const data = await fetchAll(query);

    // Group by date
    const grouped: Record<string, any> = {};
    data.forEach((order: any) => {
        const orderDate = new Date(order.order_date);
        const date = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
        if (!grouped[date]) {
            grouped[date] = { date, totalSales: 0, branches: {} };
        }
        grouped[date].totalSales += Number(order.total_amount);

        const bName = order.branch_name || '기타';
        grouped[date].branches[bName] = (grouped[date].branches[bName] || 0) + Number(order.total_amount);
    });

    return Object.values(grouped);
};

export const getSupabaseBranchSales = async (startDate: string, endDate: string) => {
    const query = supabase
        .from('orders')
        .select('branch_name, total_amount')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('payment_status', ['paid', 'completed', '완결']);

    const data = await fetchAll(query);

    const branchSales: Record<string, { sales: number, orders: number }> = {};
    data.forEach((order: any) => {
        const name = order.branch_name || '지점 미지정';
        if (!branchSales[name]) {
            branchSales[name] = { sales: 0, orders: 0 };
        }
        branchSales[name].sales += Number(order.total_amount);
        branchSales[name].orders += 1;
    });

    return Object.entries(branchSales).map(([name, stats]) => ({
        branchName: name,
        ...stats
    })).sort((a, b) => b.sales - a.sales);
};

export const getSupabaseTopProducts = async (startDate: string, endDate: string, branchName?: string, limit: number = 10) => {
    let query = supabase
        .from('orders')
        .select('raw_data')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('payment_status', ['paid', 'completed', '완결']);

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    const data = await fetchAll(query);

    const productStats: Record<string, { name: string, quantity: number, sales: number }> = {};

    data.forEach((order: any) => {
        const items = order.raw_data.items || order.raw_data.products || [];
        items.forEach((item: any) => {
            const id = item.id || item.productId;
            const name = item.name || item.productName;
            if (!id) return;

            if (!productStats[id]) {
                productStats[id] = { name, quantity: 0, sales: 0 };
            }
            productStats[id].quantity += Number(item.quantity || 0);
            productStats[id].sales += Number(item.price || 0) * Number(item.quantity || 0);
        });
    });

    return Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit);
};

export const getSupabasePaymentMethodStats = async (startDate: string, endDate: string, branchName?: string) => {
    let query = supabase
        .from('orders')
        .select('payment_method, total_amount')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('payment_status', ['paid', 'completed', '완결']);

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    const data = await fetchAll(query);

    const methodStats: Record<string, { sales: number, orders: number }> = {};
    data.forEach((order: any) => {
        const method = order.payment_method || 'unknown';
        if (!methodStats[method]) {
            methodStats[method] = { sales: 0, orders: 0 };
        }
        methodStats[method].sales += Number(order.total_amount);
        methodStats[method].orders += 1;
    });

    return Object.entries(methodStats).map(([method, stats]) => ({
        method,
        ...stats
    })).sort((a, b) => b.sales - a.sales);
};

export const getSupabaseWeeklySales = async (startDate: string, endDate: string, branchName?: string) => {
    let query = supabase
        .from('orders')
        .select('order_date, total_amount, branch_name')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('payment_status', ['paid', 'completed', '완결']);

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    const data = await fetchAll(query);

    const grouped: Record<string, any> = {};
    data.forEach((order: any) => {
        const date = new Date(order.order_date);
        const weekStart = new Date(date);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
        if (!grouped[weekKey]) {
            grouped[weekKey] = { weekKey, totalSales: 0, branches: {}, start: weekStart };
        }
        grouped[weekKey].totalSales += Number(order.total_amount);
        const bName = order.branch_name || '기타';
        grouped[weekKey].branches[bName] = (grouped[weekKey].branches[bName] || 0) + Number(order.total_amount);
    });

    return Object.values(grouped).sort((a, b) => (a as any).weekKey.localeCompare((b as any).weekKey));
};

export const getSupabaseMonthlySales = async (startDate: string, endDate: string, branchName?: string) => {
    let query = supabase
        .from('orders')
        .select('order_date, total_amount, branch_name')
        .gte('order_date', startDate)
        .lte('order_date', endDate)
        .in('payment_status', ['paid', 'completed', '완결']);

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    const data = await fetchAll(query);

    const grouped: Record<string, any> = {};
    data.forEach((order: any) => {
        const orderDate = new Date(order.order_date);
        const date = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        if (!grouped[date]) {
            grouped[date] = { month: date, totalSales: 0, branches: {} };
        }
        grouped[date].totalSales += Number(order.total_amount);
        const bName = order.branch_name || '기타';
        grouped[date].branches[bName] = (grouped[date].branches[bName] || 0) + Number(order.total_amount);
    });

    return Object.values(grouped).sort((a, b) => (a as any).month.localeCompare((b as any).month));
};

export const getSupabaseRecentOrders = async (branchName?: string, limit: number = 10) => {
    let query = supabase
        .from('orders')
        .select(`
            id,
            orderer_name,
            order_date,
            total_amount,
            status,
            branch_name,
            raw_data
        `)
        .order('order_date', { ascending: false })
        .limit(limit);

    if (branchName && branchName !== '전체') {
        query = query.eq('branch_name', branchName);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(order => {
        const orderData = order.raw_data as any;
        let productNames = '상품 정보 없음';
        const items = orderData.items || orderData.products || [];
        if (Array.isArray(items) && items.length > 0) {
            productNames = items.map((item: any) => item.name || item.productName || '상품명 없음').join(', ');
        }

        return {
            id: order.id,
            orderer: {
                name: order.orderer_name || '주문자 정보 없음',
                contact: orderData.orderer?.contact || '',
                company: orderData.orderer?.company || '',
                email: orderData.orderer?.email || ''
            },
            orderDate: order.order_date,
            total: Number(order.total_amount),
            status: order.status || 'pending',
            branchName: order.branch_name || '지점 미지정',
            productNames: productNames
        };
    });
};
