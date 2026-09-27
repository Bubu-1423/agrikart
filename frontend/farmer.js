const currentUser = JSON.parse(localStorage.getItem('agrikart_user'));

document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    if (currentUser.role !== 'FARMER') {
        alert("Access Denied: Only Farmers can view this studio!");
        window.location.href = 'index.html';
        return;
    }

    const profileLink = document.getElementById('profileLink');
    profileLink.innerHTML = `<span style="color: var(--neon-green); font-weight: 600;">👨‍🌾 ${currentUser.fullName}</span>`;
    
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Logout from Farmer Studio?")) {
            localStorage.removeItem('agrikart_user');
            window.location.href = 'login.html';
        }
    });

    fetchFarmerProducts();
    fetchIncomingOrders();
});

// ====== TAB SWITCHER ======
function switchTab(tabName) {
    const tabCrops = document.getElementById('tabCrops');
    const tabOrders = document.getElementById('tabOrders');
    const cropsView = document.getElementById('cropsView');
    const ordersView = document.getElementById('ordersView');

    if (tabName === 'crops') {
        tabCrops.classList.add('active');
        tabOrders.classList.remove('active');
        cropsView.style.display = 'block';
        ordersView.style.display = 'none';
    } else {
        tabOrders.classList.add('active');
        tabCrops.classList.remove('active');
        cropsView.style.display = 'none';
        ordersView.style.display = 'block';
        fetchIncomingOrders(); // Refresh orders on click
    }
}

// ====== NAYA CROP PUBLISH KARNA ======
const productForm = document.getElementById('addProductForm');
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('addBtn');
    submitBtn.innerText = "Publishing...";
    submitBtn.disabled = true;

    const newProduct = {
        productName: document.getElementById('cropName').value.trim(),
        price: parseFloat(document.getElementById('cropPrice').value),
        stockQuantity: parseInt(document.getElementById('cropStock').value),
        description: document.getElementById('cropDesc').value.trim(),
        farmer: { id: currentUser.id }
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (response.ok) {
            alert(`✅ ${newProduct.productName} successfully published to Marketplace!`);
            productForm.reset();
            fetchFarmerProducts();
        } else {
            const errorText = await response.text();
            alert("Error adding crop: " + errorText);
        }
    } catch (error) {
        console.error("Add crop error:", error);
        alert("Backend server se connect nahi ho pa raha!");
    } finally {
        submitBtn.innerText = "Publish to Market";
        submitBtn.disabled = false;
    }
});

// ====== FARMER CROPS FETCH ======
async function fetchFarmerProducts() {
    const grid = document.getElementById('farmerProductGrid');

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`);
        const allProducts = await response.json();

        const myProducts = allProducts.filter(p => p.farmer && p.farmer.id === currentUser.id);
        grid.innerHTML = '';

        if (myProducts.length === 0) {
            grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No crops listed yet. Use the left form to list your first produce.</p>';
            return;
        }

        myProducts.reverse().forEach(product => {
            const card = document.createElement('div');
            card.className = 'card fade-in-up';
            card.innerHTML = `
                <h3>${product.productName}</h3>
                <p class="desc">${product.description}</p>
                <div class="price">₹${product.price} <span style="font-size: 14px; color: #888;">/ kg</span></div>
                <div class="stock">Live Stock: <strong>${product.stockQuantity} kg</strong></div>
                <div style="margin-top: 10px; font-size: 12px; color: var(--neon-green); font-weight: 600;">● Active on Market</div>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Fetch products error:", error);
        grid.innerHTML = '<p style="color: red;">Failed to load crops.</p>';
    }
}

// ====== INCOMING ORDERS & STATUS ENGINE ======
async function fetchIncomingOrders() {
    const container = document.getElementById('incomingOrdersContainer');
    const badge = document.getElementById('pendingBadge');

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`);
        const allOrders = await response.json();

        // Sirf wahi orders nikalo jo is logged-in farmer ke product ke hain
        const mySales = allOrders.filter(order => order.product && order.product.farmer && order.product.farmer.id === currentUser.id);

        const pendingCount = mySales.filter(o => o.status === 'PENDING' || o.status === 'SHIPPED').length;
        badge.innerText = `(${pendingCount})`;

        container.innerHTML = '';

        if (mySales.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No customer purchases for your produce yet.</p>';
            return;
        }

        mySales.reverse().forEach(order => {
            const date = new Date(order.orderDate).toLocaleDateString('en-IN', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            // Action Button based on status
            let actionBtnHtml = '';
            if (order.status === 'PENDING') {
                actionBtnHtml = `<button class="status-action-btn btn-ship" onclick="updateOrderStatus(${order.id}, 'SHIPPED')">Ship Order 🚚</button>`;
            } else if (order.status === 'SHIPPED') {
                actionBtnHtml = `<button class="status-action-btn btn-deliver" onclick="updateOrderStatus(${order.id}, 'DELIVERED')">Mark Delivered ✅</button>`;
            } else if (order.status === 'DELIVERED') {
                actionBtnHtml = `<span style="color: var(--neon-green); font-weight: 600; font-size: 13px;">✓ Delivered</span>`;
            }

            const card = document.createElement('div');
            card.className = 'incoming-order-card fade-in-up';
            card.innerHTML = `
                <div class="order-info">
                    <h4>${order.product.productName} (${order.quantity} kg)</h4>
                    <p>👤 <strong>Buyer:</strong> ${order.customer ? order.customer.fullName : 'Customer'} | 📞 ${order.customer ? order.customer.phoneNumber : 'N/A'}</p>
                    <p>📅 <strong>Date:</strong> ${date} | <strong>Total:</strong> ₹${order.totalPrice.toFixed(2)}</p>
                </div>
                <div class="action-container">
                    <span class="status-badge status-${order.status}">${order.status}</span>
                    ${actionBtnHtml}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Fetch sales error:", error);
        container.innerHTML = '<p style="color: red;">Failed to load incoming orders.</p>';
    }
}

// ====== STATUS UPDATE HANDLER ======
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/status?status=${newStatus}`, {
            method: 'PUT'
        });

        if (response.ok) {
            // UI refresh
            fetchIncomingOrders();
        } else {
            alert("Status update fail ho gaya!");
        }
    } catch (error) {
        console.error("Update error:", error);
        alert("Server response nahi de raha!");
    }
}