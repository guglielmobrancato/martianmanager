// Martian Manager - Onboarding Logic

document.addEventListener('DOMContentLoaded', () => {
    let currentSlide = 1;
    const totalSlides = 4;
    
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const progressBar = document.getElementById('progressBar');
    const finishBtn = document.getElementById('finishOnboardBtn');
    
    // Email Mock Function
    function sendMockEmail(to, subject, body) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div style="font-size: 1.5rem; float: right;">📨</div>
            <h4 style="color: var(--accent);">Email Automatizzata</h4>
            <p style="color: #fff; margin-bottom: 0.3rem;"><strong>A:</strong> ${to}</p>
            <p style="margin-bottom: 0.3rem;"><strong>Ogg:</strong> ${subject}</p>
            <p style="white-space: pre-wrap; font-size: 0.75rem;">${body}</p>
        `;
        document.getElementById('toastBox').appendChild(toast);
        setTimeout(() => toast.remove(), 7000);
    }

    function updateSlider() {
        // Update Slides
        slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev');
            if (index + 1 === currentSlide) {
                slide.classList.add('active');
            } else if (index + 1 < currentSlide) {
                slide.classList.add('prev');
            }
        });
        
        // Update Buttons
        prevBtn.style.visibility = (currentSlide === 1) ? 'hidden' : 'visible';
        
        if (currentSlide === totalSlides) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
        }
        
        // Progress Bar
        progressBar.style.width = ((currentSlide - 1) / (totalSlides - 1)) * 100 + '%';
    }
    
    nextBtn.addEventListener('click', () => {
        // Validation for slide 2 (Contracts)
        if (currentSlide === 2) {
            const nda = document.getElementById('nda').checked;
            const cf = document.getElementById('signerCF').value.trim();
            const dob = document.getElementById('signerDOB').value;
            const address = document.getElementById('signerAddress').value.trim();
            
            if (!nda || !cf || !dob || !address) {
                alert('Attenzione: Devi compilare i campi obbligatori (CF, Data Nascita, Indirizzo) e accettare materialmente l\'accordo.');
                return;
            }

            // Simulate Email Trigger
            const today = new Date().toLocaleDateString('it-IT');
            const userStr = sessionStorage.getItem('martian_user');
            const userMail = userStr ? JSON.parse(userStr).email : 'Sconosciuto';
            
            sendMockEmail('Manager (Tutti)', 'Nuova Firma Contratto Tirocinio', 
                `Il tirocinante [${userMail}] ha accettato il contratto in data ${today}.\nC.F.: ${cf.toUpperCase()}\nIndirizzo: ${address}`
            );
        }
        
        if (currentSlide < totalSlides) {
            currentSlide++;
            updateSlider();
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentSlide > 1) {
            currentSlide--;
            updateSlider();
        }
    });
    
    finishBtn.addEventListener('click', () => {
        // Signify that onboarding is done
        const userStr = sessionStorage.getItem('martian_user');
        const u = userStr ? JSON.parse(userStr) : {};
        localStorage.setItem('intern_onboarded_' + (u.username || 'default'), 'true');
        // Redirect to Dashboard
        window.location.href = 'dashboard.html';
    });
    
    updateSlider();
});
