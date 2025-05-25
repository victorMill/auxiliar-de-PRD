// Simple authentication check
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('authenticated');
    if (!isAuthenticated) {
        const password = prompt('Digite a senha para acessar o sistema:');
        if (password === '11282755') { // Change this to your desired password
            sessionStorage.setItem('authenticated', 'true');
        } else {
            alert('Senha incorreta!');
            checkAuth();
        }
    }
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', checkAuth); 