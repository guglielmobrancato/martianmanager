// Martian Manager - Registration Logic

document.addEventListener('DOMContentLoaded', () => {
    let selectedRole = 'intern';
    const roleBtns = document.querySelectorAll('.radio-btn');
    
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            roleBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedRole = btn.getAttribute('data-role');
        });
    });

    // Navigation
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3-intern');
    const step4 = document.getElementById('step4-welcome');

    document.getElementById('btnNext1').addEventListener('click', () => {
        step1.classList.remove('active');
        step2.classList.add('active');
    });

    document.getElementById('btnPrev2').addEventListener('click', () => {
        step2.classList.remove('active');
        step1.classList.add('active');
    });

    document.getElementById('btnNext2').addEventListener('click', () => {
        // Simple Validation
        if(!document.getElementById('rFirstName').value || !document.getElementById('rWorkEmail').value || !document.getElementById('rUsername').value || !document.getElementById('rPassword').value) {
            alert("Compila tutti i campi anagrafici per proseguire.");
            return;
        }

        step2.classList.remove('active');
        if (selectedRole === 'intern') {
            step3.classList.add('active');
        } else {
            // Se manager ha finito, salva e va login
            saveUserAndLogin();
        }
    });

    document.getElementById('btnPrev3').addEventListener('click', () => {
        step3.classList.remove('active');
        step2.classList.add('active');
    });

    document.getElementById('btnNext3').addEventListener('click', () => {
        if(!document.getElementById('rStart').value || !document.getElementById('rTutorName').value || !document.getElementById('rTutorEmail').value) {
            alert("Spiegaci le date di operatività e fornisci il Nome/Email del tuo Tutor prima di proseguire!");
            return;
        }
        step3.classList.remove('active');
        step4.classList.add('active');
    });

    document.getElementById('btnCompleteIntern').addEventListener('click', () => {
        saveUserAndLogin();
    });

    function saveUserAndLogin() {
        // Costruzione Utente
        const userData = {
            id: Date.now(),
            role: selectedRole,
            firstName: document.getElementById('rFirstName').value,
            lastName: document.getElementById('rLastName').value,
            username: document.getElementById('rUsername').value.toLowerCase().replace(/\s/g, ''),
            password: document.getElementById('rPassword').value,
            personalEmail: document.getElementById('rPersonalEmail').value,
            phone: document.getElementById('rPhone').value,
            workEmail: document.getElementById('rWorkEmail').value.toLowerCase(),
            internStart: document.getElementById('rStart').value,
            internEnd: document.getElementById('rEnd').value,
            tutorName: document.getElementById('rTutorName').value,
            tutorEmail: document.getElementById('rTutorEmail').value,
            expectations: document.getElementById('rExpectations').value,
            registeredAt: new Date().toISOString()
        };
        // Salvo nel "Database App" (localStorage per simulazione persistente)
        let usersDB = JSON.parse(localStorage.getItem('msh_users_db')) || [];
        usersDB.push(userData);
        localStorage.setItem('msh_users_db', JSON.stringify(usersDB));

        // Auto-login post registrazione
        sessionStorage.setItem('martian_user', JSON.stringify({ role: userData.role, email: userData.workEmail, username: userData.username }));
        
        // Se è intern salta l'onboarding contrattuale per semplicità (la registrazione vale come tale) o ci va
        if(userData.role === 'intern') {
            window.location.href = 'onboarding.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
});
