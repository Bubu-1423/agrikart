let isLoginMode = true; 

// Saare DOM elements
const toggleLink = document.getElementById('toggleLink');
const toggleMsg = document.getElementById('toggleMsg');
const nameGroup = document.getElementById('nameGroup');
const fullNameInput = document.getElementById('fullName');
const submitBtn = document.getElementById('submitBtn');
const formTitle = document.querySelector('.brand-header p');
const form = document.getElementById('loginForm');

// Mode toggle (Login <-> Sign Up)
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        nameGroup.style.display = 'none';
        fullNameInput.required = false; 
        
        submitBtn.innerText = 'Secure Login';
        toggleMsg.innerText = "Don't have an account?";
        toggleLink.innerText = "Sign Up";
        formTitle.innerText = "Welcome back to the smart farm";
    } else {
        nameGroup.style.display = 'block';
        fullNameInput.required = true; 
        
        submitBtn.innerText = 'Create Account';
        toggleMsg.innerText = "Already have an account?";
        toggleLink.innerText = "Login";
        formTitle.innerText = "Join the smart farming revolution";
    }
});

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.querySelector('input[name="role"]:checked').value;
    
    if (isLoginMode) {
        // ================= LOGIN FLOW =================
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone, password: password })
            });

            if (response.ok) {
                const userData = await response.json();
                
                if (userData.role !== role) {
                    alert(`Login Failed: Aapka registered role ${userData.role} hai, ${role} nahi!`);
                    return;
                }
                
                // Session save karna
                localStorage.setItem('agrikart_user', JSON.stringify(userData));
                alert('Login Successful! Welcome ' + userData.fullName);

                // Role-based redirection
                if (userData.role === 'FARMER') {
                    window.location.href = 'farmer.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                alert('Invalid Phone Number or Password!');
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert('Backend server band hai! Terminal check karo.');
        }
    } else {
        // ================= SIGN UP FLOW =================
        const fullName = fullNameInput.value.trim();
        const newUser = { fullName, phoneNumber: phone, password, role };

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                alert(`Account Created Successfully! 🎉 Welcome ${fullName}. Ab login karke continue karein.`);
                toggleLink.click();
                document.getElementById('password').value = '';
            } else {
                const errMsg = await response.text();
                alert('Registration Failed: ' + errMsg);
            }
        } catch (error) {
            console.error("Registration Error:", error);
            alert('Backend server connect nahi ho raha hai!');
        }
    }
});