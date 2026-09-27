const currentUser = JSON.parse(localStorage.getItem('agrikart_user'));

document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Set Profile Name
    const profileLink = document.getElementById('profileLink');
    profileLink.innerHTML = `<span style="color: var(--neon-green); font-weight: 600;">👤 Hi, ${currentUser.fullName}</span>`;
    
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if(confirm("Are you sure you want to Logout?")) {
            localStorage.removeItem('agrikart_user');
            window.location.href = 'login.html';
        }
    });

    fetchMyOrders();
});

async function fetchMyOrders() {
    const container = document.getElementById('ordersContainer');
    
    try {
        const response = await fetch('http://localhost:8080/api/orders');
        const allOrders = await response.json();
        
        // Filter orders only for the current user ID
        const myOrders = allOrders.filter(order => order.customer.id === currentUser.id);
        
        container.innerHTML = '';

        if (myOrders.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; font-size: 18px;">You haven't placed any orders yet. <a href="index.html" style="color: var(--neon-green);">Go to Market</a></p>`;
            return;
        }

        // Display Orders latest first
        myOrders.reverse().forEach(order => {
            const date = new Date(order.orderDate).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const card = document.createElement('div');
            card.className = 'card order-card fade-in-up';
            
            card.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#ORD-00${order.id}</span>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
                <div class="order-details">
                    <h3>${order.product.productName}</h3>
                    <p style="color: var(--text-muted);">👨‍🌾 Farmer: ${order.product.farmer.fullName}</p>
                    <p style="color: var(--text-muted);">📅 ${date}</p>
                    <p>Quantity: ${order.quantity} kg</p>
                    <div class="order-total">Total: ₹${order.totalPrice.toFixed(2)}</div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Fetch orders error:", error);
        container.innerHTML = '<p style="color: red;">Failed to connect to backend server.</p>';
    }
}