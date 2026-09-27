const currentUser = JSON.parse(localStorage.getItem('agrikart_user'));
let currentOrderId = null;
let currentAmount = 0;
let allLoadedProducts = []; // Live search ke liye local cache

document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    const navLinks = document.querySelector('.nav-links');
    const existingAnchorTags = navLinks.querySelectorAll('a');
    const profileLink = existingAnchorTags[existingAnchorTags.length - 1];

    if (currentUser.role === 'FARMER') {
        const studioLink = document.createElement('a');
        studioLink.href = 'farmer.html';
        studioLink.innerHTML = '🌾 Farmer Studio';
        studioLink.style.color = 'var(--neon-green)';
        studioLink.style.fontWeight = '700';
        navLinks.insertBefore(studioLink, profileLink);
    }

    profileLink.innerHTML = `<span style="color: var(--neon-green); font-weight: 600;">👤 Hi, ${currentUser.fullName}</span>`;

    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to Logout?")) {
            localStorage.removeItem('agrikart_user');
            window.location.href = 'login.html';
        }
    });

    // Live Search Listener
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            handleLiveSearch(e.target.value.trim().toLowerCase());
        });
    }

    fetchProducts();
});

// ====== Fetch Products from Backend ======
async function fetchProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '<p style="color: var(--text-muted);">Syncing with live farms...</p>'; 

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/products`);
        allLoadedProducts = await response.json();
        
        renderProductCards(allLoadedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        document.getElementById('productGrid').innerHTML = '<p style="color: red;">Failed to load live stock. Backend engine check karein.</p>';
    }
}

// ====== Render Product Grid Cards ======
function renderProductCards(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = ''; 

    if (products.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No matching crops found.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'card fade-in-up';
        
        let actionHtml = '';
        if (currentUser.role === 'FARMER') {
            actionHtml = `<div style="color: var(--text-muted); text-align: center; margin-top: 10px; font-size: 13px; border: 1px dashed var(--glass-border); padding: 6px; border-radius: 6px;">Market Preview (Farmer Mode)</div>`;
        } else {
            actionHtml = `<button class="buy-btn" onclick="placeOrder(${product.id}, ${product.price})">Buy Now</button>`;
        }

        const farmerName = product.farmer ? product.farmer.fullName : 'Direct Farm';

        card.innerHTML = `
            <h3>${product.productName}</h3>
            <p class="desc">${product.description}</p>
            <div class="price">₹${product.price} <span style="font-size: 14px; color: #888;">/ kg</span></div>
            <div class="stock">Available Stock: <strong>${product.stockQuantity} kg</strong></div>
            <div class="farmer">👨‍🌾 Grown by: ${farmerName}</div>
            ${actionHtml}
        `;
        
        grid.appendChild(card);
    });
}

// ====== Live Search Engine ======
function handleLiveSearch(query) {
    if (!query) {
        renderProductCards(allLoadedProducts);
        return;
    }

    const filtered = allLoadedProducts.filter(item => {
        const nameMatch = item.productName.toLowerCase().includes(query);
        const descMatch = item.description ? item.description.toLowerCase().includes(query) : false;
        const farmerMatch = item.farmer && item.farmer.fullName ? item.farmer.fullName.toLowerCase().includes(query) : false;
        return nameMatch || descMatch || farmerMatch;
    });

    renderProductCards(filtered);
}

// ====== Order Initiation ======
async function placeOrder(productId, price) {
    const orderData = {
        quantity: 1, 
        totalPrice: price, 
        customer: { id: currentUser.id }, 
        product: { id: productId }
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const savedOrder = await response.json();
            currentOrderId = savedOrder.id; 
            currentAmount = price;
            
            document.getElementById('modalAmount').innerText = currentAmount.toFixed(2);
            document.getElementById('btnAmount').innerText = currentAmount.toFixed(2);
            document.getElementById('paymentModal').style.display = 'flex';
        } else {
            const err = await response.text();
            alert('Order placement failed: ' + err);
        }
    } catch (error) {
        console.error("Order connection error:", error);
        alert('Server response nahi de raha hai.');
    }
}

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('paymentModal').style.display = 'none';
});

// ====== Payment Flow ======
document.getElementById('processPaymentBtn').addEventListener('click', async () => {
    const selectedMethod = document.querySelector('input[name="payMethod"]:checked').value;
    const btn = document.getElementById('processPaymentBtn');
    
    btn.innerHTML = 'Processing Payment... <span style="font-size: 12px">🔄</span>';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    const paymentReq = {
        orderId: currentOrderId,
        amount: currentAmount,
        paymentMethod: selectedMethod
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/payments/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentReq)
        });

        if (response.ok) {
            const receipt = await response.json();
            
            await fetch(`${CONFIG.API_BASE_URL}/api/orders/${currentOrderId}/status?status=SHIPPED`, {
                method: 'PUT'
            });
            
            setTimeout(() => {
                document.getElementById('paymentModal').style.display = 'none';
                alert(`✅ Payment Successful!\n\nTransaction ID: ${receipt.transactionId}\nAmount: ₹${currentAmount}\nMethod: ${selectedMethod}\n\nThank you ${currentUser.fullName}! Your fresh farm produce is now marked as SHIPPED.`);
                
                btn.innerHTML = `Secure Pay ₹<span id="btnAmount">${currentAmount.toFixed(2)}</span>`;
                btn.style.opacity = '1';
                btn.disabled = false;
                
                fetchProducts(); 
            }, 1500);
        } else {
            throw new Error("Payment Gateway Error");
        }
    } catch (error) {
        alert("Payment process nahi ho paya!");
        btn.innerHTML = `Secure Pay ₹<span id="btnAmount">${currentAmount.toFixed(2)}</span>`;
        btn.style.opacity = '1';
        btn.disabled = false;
    }
});

// Multi-language
const translations = {
    'EN': { 
        title: "Fresh From The <span>Smart Farm</span>", 
        search: "Search for grains, vegetables, farmers...", 
        stock: "Live Stock" 
    },
    'HI': { 
        title: "सीधे <span>स्मार्ट फार्म</span> से ताज़ा", 
        search: "अनाज, सब्जियां, किसान खोजें...", 
        stock: "लाइव स्टॉक" 
    },
    'OD': { 
        title: "ସିଧାସଳଖ <span>ସ୍ମାର୍ଟ ଫାର୍ମ</span> ରୁ ତାଜା", 
        search: "ଶସ୍ୟ, ପନିପରିବା, କୃଷକମାନଙ୍କୁ ଖୋଜନ୍ତୁ...", 
        stock: "ଲାଇଭ୍ ଷ୍ଟକ୍" 
    }
};

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const selectedLang = e.target.innerText;
        document.querySelector('.hero h1').innerHTML = translations[selectedLang].title;
        document.getElementById('searchBar').placeholder = translations[selectedLang].search;
        document.querySelector('.section-header h2').innerText = translations[selectedLang].stock;
    });
});