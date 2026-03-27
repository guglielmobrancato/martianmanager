// Martian Manager - Core Logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailOrUser = document.getElementById('email').value.toLowerCase().replace(/\s/g, '');
            const password = document.getElementById('password').value;
            
            // 1. Controllo DB Locale (Utenti Registrati)
            let usersDB = JSON.parse(localStorage.getItem('msh_users_db')) || [];
            let foundUser = usersDB.find(u => (u.username === emailOrUser || u.workEmail === emailOrUser) && u.password === password);
            
            if (foundUser) {
                sessionStorage.setItem('martian_user', JSON.stringify({ role: foundUser.role, email: foundUser.workEmail, username: foundUser.username }));
                if (foundUser.role === 'intern') {
                    const isFirstLogin = !localStorage.getItem('intern_onboarded_' + foundUser.username);
                    if (isFirstLogin) {
                        window.location.href = 'onboarding.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    window.location.href = 'dashboard.html';
                }
                return;
            }

            // 2. Accesso Manager Hardcoded
            if (emailOrUser.includes('g.brancato') || emailOrUser.includes('info@') || emailOrUser.includes('g.dimaio') || emailOrUser.includes('m.kovalova')) {
                if (password === 'martianmanager') {
                    sessionStorage.setItem('martian_user', JSON.stringify({ role: 'admin', email: emailOrUser }));
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Access Denied. Password manager errata.');
                }
            } else if (emailOrUser === 'interns@martestudios.com' || emailOrUser === 'intern@martestudios.com' || emailOrUser === 'intern') {
                // Tirocinante / Collaboratore Base di Default
                const username = 'default';
                const email = 'interns@martestudios.com';
                const isFirstLogin = !localStorage.getItem('intern_onboarded_' + username);
                sessionStorage.setItem('martian_user', JSON.stringify({ role: 'intern', email: email, username: username }));
                
                if (isFirstLogin) {
                    window.location.href = 'onboarding.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                alert('Access Denied. Username/Email o Password non validi o utente non registrato correttamente.');
            }
        });
    }
});
