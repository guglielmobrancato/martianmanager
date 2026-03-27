// Martian Manager v2 - Core App Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. AUTH & HEADER SETUP
    const userStr = sessionStorage.getItem('martian_user');
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }
    const user = JSON.parse(userStr);
    const isAdmin = user.role === 'admin';
    
    document.getElementById('dateDisplay').innerText = new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const userNameEl = document.getElementById('userName');

    if (isAdmin) {
        let checkMail = user.email || '';
        if (checkMail.includes('g.brancato')) userNameEl.innerText = 'Guglielmo Brancato';
        else if (checkMail.includes('info@')) userNameEl.innerText = 'Vincenzo Lo Iacono';
        else if (checkMail.includes('g.dimaio')) userNameEl.innerText = 'Giuseppe Di Maio';
        else if (checkMail.includes('m.kovalova')) userNameEl.innerText = 'Mishelle Kovalova';
        else userNameEl.innerText = user.email ? user.email.split('@')[0].toUpperCase() : 'MANAGER';
        
        document.getElementById('userRole').innerText = checkMail.includes('m.kovalova') ? 'Head of Development' : 'Manager';
        document.getElementById('userInitial').innerText = userNameEl.innerText.charAt(0);
        
        // Show Admin Tools
        document.getElementById('btnNewProject').style.display = 'block';
        document.getElementById('hrMenuLink').style.display = 'block';
        document.getElementById('directoryMenuLink').style.display = 'block';
        document.getElementById('btnNewTask').style.display = 'block';
    } else {
        userNameEl.innerText = 'Tirocinante / Trainee (Sim.)';
        document.getElementById('userRole').innerText = 'Intern';
        document.querySelector('.intern-only-panel').style.display = 'block';
        
        // Find full intern data
        const allU = JSON.parse(localStorage.getItem('msh_users_db')) || [];
        const fullIntern = allU.find(u => u.username === user.username || u.workEmail === user.email);
        
        if (fullIntern && fullIntern.startDate && fullIntern.endDate) {
            document.getElementById('internDatesPanel').style.display = 'block';
            document.getElementById('valInternStart').innerText = fullIntern.startDate;
            document.getElementById('valInternEnd').innerText = fullIntern.endDate;
            
            // Check 15 days warning
            const end = new Date(fullIntern.endDate);
            const today = new Date();
            const diffTime = end - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 15 && diffDays >= 0) {
                document.getElementById('internEndWarning').style.display = 'block';
                // Mock notification
                if(!sessionStorage.getItem('notified_15days')) {
                    setTimeout(() => {
                        sendMockEmail('Manager Team', `Avviso Scadenza Tirocinio: ${fullIntern.firstName} ${fullIntern.lastName}`, `Il tirocinio scade fra ${diffDays} giorni (${fullIntern.endDate}). Valutare inserimento formale o proroga.`);
                        sessionStorage.setItem('notified_15days', '1');
                    }, 3000);
                }
            }
        }
    }

    // Carica Immagine Profilo se esistente
    const savedPic = localStorage.getItem('msh_avatar_' + user.email.toLowerCase());
    const topAvatar = document.getElementById('userInitial');
    const bigPreviewPrefix = document.getElementById('profilePicPreviewBig');
    
    if (savedPic) {
        topAvatar.innerHTML = `<img src="${savedPic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        if (bigPreviewPrefix) {
            bigPreviewPrefix.innerHTML = `<img src="${savedPic}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    } else {
        if (!isAdmin) {
            topAvatar.innerText = 'T';
            topAvatar.style.background = 'var(--text-muted)';
        }
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    // 2. VIEW ROUTER LOGIC
    window.switchView = function(viewId) {
        // Hide all
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        // Deactivate links
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Show target
        document.getElementById('view-' + viewId).classList.add('active');
        const activeLink = document.querySelector(`.nav-btn[data-target="${viewId}"]`);
        if(activeLink) activeLink.classList.add('active');

        // Update Title
        const titles = {
            'projects': 'Hub Operativo (Progetti)',
            'kanban': 'Bacheca Lavorazioni',
            'archive': 'Storico Lavorazioni Completate',
            'calendar': 'Home / Calendario Eventi',
            'academy': 'Centro Apprendimento',
            'hr': 'Performance e KPI Tirocinanti',
            'directory': 'Anagrafica Confidenziale',
            'team': 'Rubrica Organico Aziendale',
            'vault': 'Vault Password Sicuro',
            'profile': 'Il Mio Profilo Stage',
            'reimburse': 'Gestione Rimborsi Spesa'
        };
        document.getElementById('viewTitle').innerText = titles[viewId];
    }

    // Mobile Hamburger Menu
    const hambBtn = document.getElementById('hamburgerBtn');
    const closeBtn = document.getElementById('closeMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    
    function toggleMenu() {
        navMenu.classList.toggle('open');
        navOverlay.classList.toggle('open');
    }
    
    if(hambBtn) hambBtn.addEventListener('click', toggleMenu);
    if(closeBtn) closeBtn.addEventListener('click', toggleMenu);
    if(navOverlay) navOverlay.addEventListener('click', toggleMenu);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if(window.innerWidth <= 900) toggleMenu(); // auto-close on mobile
            switchView(btn.getAttribute('data-target'));
        });
    });

    // 3. MOCK DB & EMAIL SYSTEM
    function sendMockEmail(to, subject, body = '') {
        // Redirezione aziendale automatica per i tirocinanti -> intern@martestudios.com
        let finalTo = to;
        const allUsers = JSON.parse(localStorage.getItem('msh_users_db')) || [];
        const targetedUser = allUsers.find(u => u.firstName === to || (u.firstName + ' ' + u.lastName) === to || u.workEmail === to);
        
        if (targetedUser && targetedUser.role === 'intern') {
            finalTo = 'intern@martestudios.com'; 
        } else if (to.toLowerCase().includes('intern') || to.toLowerCase().includes('tirocinante')) {
            finalTo = 'intern@martestudios.com';
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div style="font-size: 1.5rem; float: right;">📨</div>
            <h4 style="color: var(--accent);">Notifica Email di Sistema</h4>
            <p style="color: #fff; margin-bottom: 0.3rem;"><strong>A:</strong> ${finalTo}</p>
            <p><strong>Oggetto:</strong> ${subject}</p>
            ${body ? `<p style="font-size:0.75rem; margin-top:0.4rem; color:var(--text-muted); white-space:pre-wrap;">${body}</p>` : ''}
        `;
        document.getElementById('toastBox').appendChild(toast);
        // Play sound if you wanted, but we just remove it after 6s
        setTimeout(() => toast.remove(), 6000);
    }

    let db = {
        projects: [
            { id: 1, name: 'Campagna Social Marzo', type: 'Piano Editoriale' },
            { id: 2, name: 'Shooting Velvet Mag', type: 'Produzione Film' },
            { id: 3, name: 'Milano Film Fest Showcase', type: 'Organizzazione Evento' }
        ],
        tasks: [
            { id: 101, projId: 1, title: 'Creazione Reel Teaser', desc: 'Montare i 3 reel su Resolve.', status: 'validation', assignee: 'Intern 1' },
            { id: 102, projId: 1, title: 'Draft Copywriting', desc: 'Scrivere le didascalie.', status: 'todo', assignee: 'Mishelle' },
            { id: 103, projId: 2, title: 'Noleggio Attrezzature', desc: 'Prenotare lenti da Marte Studios Rental.', status: 'doing', assignee: 'Intern 2' },
            { id: 104, projId: 3, title: 'Logistica Pass Ospiti', desc: 'Inviare moduli accreditamento.', status: 'validation', assignee: 'Intern 1' },
            { id: 105, projId: 1, title: 'Test Campagna Ads FB', desc: 'Lancio pilota.', status: 'done', assignee: 'Mishelle Kovalova', createdBy: 'Vincenzo Lo Iacono', createdAt: '20/03/2026', completedBy: 'Mishelle Kovalova', completedAt: '25/03/2026', approvedBy: 'Guglielmo Brancato', approvedAt: '26/03/2026' }
        ],
        interns: [
            { name: 'Intern 1', entity: 'Brancamedia STP', start: '2025-01-10', end: '2025-06-10', speedKPI: 85, note: '' },
            { name: 'Intern 2', entity: 'Marte Energy', start: '2025-02-01', end: '2025-08-01', speedKPI: 92, note: '' }
        ],
        cinemaEvents: [
            { title: "Mostra Internazionale d'Arte Cinematografica", date: "27 Agosto - 6 Settembre", location: "Venezia, IT", type: "Festival Mondiale", icon: "🦁" },
            { title: "Festa del Cinema di Roma", date: "16 - 27 Ottobre", location: "Roma, IT", type: "Festival", icon: "🏛️" },
            { title: "MIA Market (Mercato Audiovisivo)", date: "14 - 18 Ottobre", location: "Roma, IT", type: "Mercato B2B", icon: "🤝" },
            { title: "Torino Film Festival (TFF)", date: "22 - 30 Novembre", location: "Torino, IT", type: "Festival A-List", icon: "🎬" },
            { title: "David di Donatello", date: "Stagione Primaverile (TBA)", location: "Roma, IT", type: "Premiazione Estesa", icon: "🏆" },
            { title: "Giffoni Film Festival", date: "18 - 27 Luglio", location: "Giffoni, IT", type: "Festival Kids", icon: "🧒" },
            { title: "Bif&st Bari International Film Fest", date: "16 - 23 Marzo", location: "Bari, IT", type: "Festival Nazionale", icon: "🎭" },
            { title: "European Film Market (EFM)", date: "13 - 19 Febbraio", location: "Berlino, DE", type: "Mercato Europeo", icon: "🐻" },
            { title: "Marché du Film (Cannes)", date: "13 - 24 Maggio", location: "Cannes, FR", type: "Mercato Global", icon: "🌴" }
        ]
    };

    // Helper: Map Type to Class
    function getTypeClass(type) {
        if(type.includes('Film')) return 'film';
        if(type.includes('Evento')) return 'event';
        return 'editorial';
    }

    // 4. RENDER VISTE (PROJECTS, KANBAN, HR)
    function renderApp() {
        // --- 4a. Render Projects ---
        const projContainer = document.getElementById('projectsContainer');
        projContainer.innerHTML = '';
        const filterSelect = document.getElementById('filterProjectKanban');
        filterSelect.innerHTML = '<option value="all">Tutti i Progetti</option>';

        db.projects.forEach(p => {
            // Card
            const div = document.createElement('div');
            div.className = 'project-card';
            const stats = db.tasks.filter(t => t.projId === p.id);
            const toValidate = stats.filter(t => t.status === 'validation').length;
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <span class="tag ${getTypeClass(p.type)}">${p.type}</span>
                    ${isAdmin ? `<button onclick="deleteProject(${p.id}, event)" style="background:transparent; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem;" title="Elimina Progetto">🗑</button>` : ''}
                </div>
                <h3 style="margin: 0.5rem 0; font-size: 1.2rem;">${p.name}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">Totale Task: ${stats.length}</p>
                <div style="font-size: 0.8rem; display: flex; justify-content: space-between;">
                    <span style="color: var(--accent);">Da Convalidare: ${toValidate}</span>
                    <button class="btn btn-outline" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;" onclick="filterKanbanAndSwitch(${p.id})">Apri Board</button>
                </div>
            `;
            projContainer.appendChild(div);

            // Select
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            filterSelect.appendChild(opt);
        });

        // --- 4b. Render Calendar Events ---
        const calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            calendarGrid.innerHTML = '';
            db.cinemaEvents.forEach(ev => {
                calendarGrid.innerHTML += `
                    <div class="glass-panel" style="padding: 1.8rem; border-left: 4px solid var(--accent); display: flex; flex-direction: column;">
                        <div style="font-size: 2.2rem; margin-bottom: 0.8rem;">${ev.icon}</div>
                        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem; flex-grow: 1;">${ev.title}</h4>
                        <div style="color: var(--warning); font-weight: bold; font-size: 0.9rem; margin-bottom: 0.3rem;">📅 ${ev.date}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">📍 ${ev.location}</div>
                        <div style="margin-top: auto;">
                            <span class="tag" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-size: 0.7rem;">🎬 ${ev.type}</span>
                        </div>
                    </div>
                `;
            });
        }

        // --- 4c. Render Kanban ---
        renderKanban('all');

        // --- 4c. Render HR KPI (Admins Only) ---
        if(isAdmin) {
            const hrTableBody = document.querySelector('#hrTable tbody');
            hrTableBody.innerHTML = '';
            db.interns.forEach((intern, idx) => {
                const tr = document.createElement('tr');
                const adminView = `
                    <textarea class="intern-note" data-idx="${idx}" placeholder="Scrivi valutazione confidenziale..." style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: #fff; padding: 0.5rem; font-family: var(--font-body); border-radius: 4px; resize: vertical;">${intern.note}</textarea>
                `;
                tr.innerHTML = `
                    <td><strong>${intern.name}</strong></td>
                    <td><span class="tag">${intern.entity}</span></td>
                    <td style="font-size: 0.85rem;">Dal ${intern.start}<br>al ${intern.end}</td>
                    <td>8 / 10 <span style="color:var(--success); font-size:0.8rem;">(Eccellente)</span></td>
                    <td><div style="background: rgba(255,255,255,0.1); width: 100px; height: 6px; border-radius: 3px; display:inline-block; vertical-align:middle; margin-right: 10px;"><div style="background: var(--accent); width: ${intern.speedKPI}%; height: 100%; border-radius: 3px;"></div></div> ${intern.speedKPI} KPI</td>
                    <td>${adminView}</td>
                `;
                hrTableBody.appendChild(tr);
            });

            // Save notes logic
            document.querySelectorAll('.intern-note').forEach(area => {
                area.addEventListener('change', (e) => {
                    const i = e.target.getAttribute('data-idx');
                    db.interns[i].note = e.target.value;
                    // Note are saved to "mock DB"
                });
            });

            // --- Render Anagrafica (Directory) ---
            const dirTable = document.querySelector('#directoryTable tbody');
            dirTable.innerHTML = '';
            const registeredUsers = JSON.parse(localStorage.getItem('msh_users_db')) || [];
            
            registeredUsers.forEach(u => {
                let badge = u.role === 'admin' ? '<span class="tag film">Manager</span>' : '<span class="tag">Intern</span>';
                if (u.workEmail && u.workEmail.includes('m.kovalova')) badge = '<span class="tag film">Head of Development</span>';
                let internInfo = u.role === 'intern' ? `<strong>Dal ${u.startDate} al ${u.endDate}</strong><br><em style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:5px; max-width:250px;">Aspettative: "${u.expectations || 'Non inserite'}"</em>` : '<span style="color:var(--text-muted)">N/A</span>';
                
                dirTable.innerHTML += `
                    <tr>
                        <td><strong>${u.firstName} ${u.lastName}</strong></td>
                        <td>${badge}<br><span style="font-size:0.85rem; color:var(--text-muted); padding-top:4px; display:inline-block;">${u.workEmail}</span></td>
                        <td style="font-size:0.85rem; color:var(--accent);">📞 ${u.phone}<br>✉️ ${u.personalEmail}</td>
                        <td style="font-size:0.85rem;">${internInfo}</td>
                    </tr>
                `;
            });
            
            // Add a mock row if DB is empty to showcase the view
            if(registeredUsers.length === 0) {
                 dirTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem; color:var(--text-muted);">Nessun utente ancora registrato sul database reale. Fai una prova registrando un utente!</td></tr>`;
            }
        }

        // --- Render Public Team ---
        const teamContainer = document.getElementById('teamContainer');
        teamContainer.innerHTML = '';
        const allUsers = JSON.parse(localStorage.getItem('msh_users_db')) || [];
        
        let displayUsers = [...allUsers];
        // Inietta i soci mock per popolare splendidamente la rubrica all'inizio
        if(displayUsers.filter(u => u.role === 'admin').length === 0) {
            displayUsers.push(
                { firstName: 'Guglielmo', lastName: 'Brancato', role: 'admin', workEmail: 'g.brancato@martestudios.com', phone: '+39 339 834 1964' },
                { firstName: 'Vincenzo', lastName: 'Lo Iacono', role: 'admin', workEmail: 'info@martestudios.com', phone: '+39 327 099 3321' },
                { firstName: 'Giuseppe', lastName: 'Di Maio', role: 'admin', workEmail: 'g.dimaio@martestudios.com', phone: '+39 334 222 4723' },
                { firstName: 'Mishelle', lastName: 'Kovalova', role: 'admin', workEmail: 'm.kovalova@martestudios.com', phone: '+39 320 686 6333' }
            );
        }

        displayUsers.forEach(u => {
            const upic = localStorage.getItem('msh_avatar_' + u.workEmail.toLowerCase());
            let avatarHtml = `<span style="font-size: 2rem; color: var(--text-muted);">${u.firstName.charAt(0)}</span>`;
            if (upic) {
                avatarHtml = `<img src="${upic}">`;
            }
            
            let badge = u.role === 'admin' ? '<span class="tag film" style="margin-bottom:1rem; display:inline-block;">Manager / Founder</span>' : '<span class="tag" style="margin-bottom:1rem; display:inline-block;">Tirocinante / Staff</span>';
            if (u.workEmail && u.workEmail.includes('m.kovalova')) badge = '<span class="tag film" style="margin-bottom:1rem; display:inline-block;">Head of Development</span>';
            
            teamContainer.innerHTML += `
                <div class="team-card">
                    <div class="team-avatar">${avatarHtml}</div>
                    <h4 style="margin-bottom: 0.2rem;">${u.firstName} ${u.lastName}</h4>
                    ${badge}
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 1rem; line-height: 1.6;">
                        <div style="margin-bottom: 0.3rem;">✉️ <a href="mailto:${u.workEmail}" style="color: var(--accent); text-decoration: none;">${u.workEmail}</a></div>
                        ${u.phone ? `<div>📞 ${u.phone}</div>` : ''}
                    </div>
                </div>
            `;
        });

        // --- Render Archive ---
        const archiveContainer = document.getElementById('archiveContainer');
        if (archiveContainer) {
            archiveContainer.innerHTML = '';
            
            const doneTasks = db.tasks.filter(t => t.status === 'done');
            if (doneTasks.length === 0) {
                archiveContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Nessun task è stato ancora completato e archiviato.</p>';
            } else {
                db.projects.forEach(p => {
                    const pTasks = doneTasks.filter(t => t.projId === p.id);
                    if (pTasks.length > 0) {
                        let html = `<div style="margin-bottom: 2rem; padding: 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: rgba(0,0,0,0.2);">`;
                        html += `<h4 style="color: #fff; margin-bottom: 1rem; font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">📁 Progetto: ${p.name}</h4>`;
                        html += `<table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">`;
                        html += `<thead><tr><th style="color: var(--text-muted); padding: 0.5rem; text-align:left;">Task</th><th style="color: var(--text-muted); padding: 0.5rem; text-align:left;">Creazione</th><th style="color: var(--text-muted); padding: 0.5rem; text-align:left;">Completamento</th><th style="color: var(--text-muted); padding: 0.5rem; text-align:left;">Approvazione Manager</th></tr></thead><tbody>`;
                        
                        pTasks.forEach(task => {
                            let created = task.createdAt ? `${task.createdAt}<br><span style="color:var(--accent); font-size:0.75rem;">Da: ${task.createdBy}</span>` : 'N/A';
                            let completed = task.completedAt ? `${task.completedAt}<br><span style="color:var(--accent); font-size:0.75rem;">Da: ${task.completedBy}</span>` : 'N/A';
                            let approved = task.approvedAt ? `${task.approvedAt} <br><span style="color:var(--success); font-size:0.75rem;">✅ ${task.approvedBy}</span>` : '<span style="color:var(--text-muted)">Storico (Auto)</span>';
                            
                            html += `<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 0.5rem;"><strong>${task.title}</strong><br><span style="color:var(--text-muted); font-size:0.75rem;">Assigned: ${task.assignee}</span></td>
                                        <td style="padding: 0.5rem;">${created}</td>
                                        <td style="padding: 0.5rem;">${completed}</td>
                                        <td style="padding: 0.5rem;">${approved}</td>
                                     </tr>`;
                        });
                        
                        html += `</tbody></table></div>`;
                        archiveContainer.innerHTML += html;
                    }
                });
            }
        }
    }

    function renderKanban(projectId) {
        const cols = {
            todo: document.getElementById('col-todo'),
            doing: document.getElementById('col-doing'),
            validation: document.getElementById('col-validation')
        };
        
        // Clear tasks keeping headers
        cols.todo.innerHTML = '<h4 style="margin-bottom: 1rem;">Da Fare</h4>';
        cols.doing.innerHTML = '<h4 style="margin-bottom: 1rem;">In Lavorazione</h4>';
        cols.validation.innerHTML = '<h4 style="margin-bottom: 1rem; color: var(--accent);">Da Convalidare</h4>';

        let filteredTasks = db.tasks;
        if(projectId !== 'all') {
            filteredTasks = db.tasks.filter(t => t.projId == projectId);
        }

        filteredTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'task-card';
            
            // Trova progetto
            const pName = db.projects.find(p => p.id === task.projId)?.name || 'Vario';

            // Drive / Docs rendering helper
            const driveLink = db.projects.find(p => p.id === task.projId)?.drive || '#';

            let actionBtn = '';
            if(!isAdmin && task.status === 'doing') {
                actionBtn = `<button class="btn btn-primary" style="padding: 0.3rem 0.5rem; font-size: 0.7rem; width:100%; margin-top: 1rem;" onclick="moveTask(${task.id}, 'validation')">Richiedi Convalida</button>`;
            } else if (isAdmin && task.status === 'validation') {
                actionBtn = `<button class="btn btn-primary" style="background: var(--success); padding: 0.3rem 0.5rem; font-size: 0.7rem; width:100%; margin-top: 1rem;" onclick="validateTask(${task.id})">Approva ed Archivia</button>`;
            } else if (!isAdmin && task.status === 'todo') {
                actionBtn = `<button class="btn btn-outline" style="padding: 0.3rem 0.5rem; font-size: 0.7rem; width:100%; margin-top: 1rem;" onclick="moveTask(${task.id}, 'doing')">Inizia Lavorazione</button>`;
            }

            div.innerHTML = `
                <div style="font-size: 0.7rem; color: var(--accent); margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                    <span>${pName}</span>
                    <a href="${driveLink}" target="_blank" style="color: var(--text-muted); text-decoration: none;">📁 Drive Progetto</a>
                </div>
                <h4 style="margin-bottom: 0.5rem;">${task.title}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${task.desc}</p>
                <div class="task-meta">
                    <span>👤 ${task.assignee}</span>
                </div>
                ${actionBtn}
            `;
            cols[task.status].appendChild(div);
        });
    }

    // Global Functions for UI interaction
    window.filterKanbanAndSwitch = function(projId) {
        document.getElementById('filterProjectKanban').value = projId;
        renderKanban(projId);
        switchView('kanban');
    };

    window.moveTask = function(taskId, newStatus) {
        const task = db.tasks.find(t => t.id === taskId);
        if(task) {
            task.status = newStatus;
            
            // Send Mock Email Logic
            if(newStatus === 'validation') {
                task.completedBy = document.getElementById('userName').innerText;
                task.completedAt = new Date().toLocaleDateString('it-IT');
                sendMockEmail('Manager Team', `Tirocinante ha richiesto convalida per: ${task.title}`);
            }
            
            renderKanban(document.getElementById('filterProjectKanban').value);
            renderApp();
        }
    };

    window.validateTask = function(taskId) {
        const task = db.tasks.find(t => t.id === taskId);
        if(task) {
            task.status = 'done';
            task.approvedBy = document.getElementById('userName').innerText;
            task.approvedAt = new Date().toLocaleDateString('it-IT');
            sendMockEmail(task.assignee, `OTTIMO LAVORO! Il Manager ha approvato il task: ${task.title}`);
            renderKanban(document.getElementById('filterProjectKanban').value);
            renderApp();
        }
    };

    document.getElementById('filterProjectKanban').addEventListener('change', (e) => {
        renderKanban(e.target.value);
    });

    window.deleteProject = function(id, event) {
        event.stopPropagation();
        if(confirm('Attenzione! Sei davvero sicuro di voler eliminare in via definitiva l\'intero progetto e TUTTI i task associati ad esso? L\'operazione non è annullabile.')) {
            db.projects = db.projects.filter(p => p.id !== id);
            db.tasks = db.tasks.filter(t => t.projId !== id);
            
            // Re-render and navigate mostly back to hub
            document.getElementById('filterProjectKanban').value = 'all';
            renderApp();
            
            // Show toast 
            sendMockEmail('Manager Team', "Notifica di Sistema: Progetto Eliminato", "Un progetto operativo è stato eliminato dalla board centrale dei manager.");
        }
    };

    // 5. MODALS E FORM LOGIC
    if(isAdmin) {
        document.getElementById('btnNewProject').addEventListener('click', () => {
            document.getElementById('modalProject').classList.add('active');
        });

        document.getElementById('formCreateProject').addEventListener('submit', (e) => {
            e.preventDefault();
            const pName = document.getElementById('projName').value;
            const pType = document.getElementById('projType').value;
            const pDrive = document.getElementById('projDrive').value;
            const newId = db.projects.length + 1;
            
            db.projects.push({ id: newId, name: pName, type: pType, drive: pDrive });
            document.getElementById('modalProject').classList.remove('active');
            
            alert(`Progetto "${pName}" creato con successo! Ora puoi assegnargli dei Task.`);
            document.getElementById('formCreateProject').reset();
            renderApp();
        });

        // --- Create Task Logic ---
        document.getElementById('btnNewTask').addEventListener('click', () => {
            const currentProjId = document.getElementById('filterProjectKanban').value;
            if (currentProjId === 'all') {
                alert('Attenzione: Devi prima selezionare un progetto specifico dal menu a tendina per potergli assegnare un task!');
                return;
            }
            document.getElementById('taskProjId').value = currentProjId;
            
            // Popola finti assegnatari
            const selectAssignee = document.getElementById('taskAssignee');
            selectAssignee.innerHTML = '<option value="Tirocinante 1">Tirocinante 1</option><option value="Tirocinante 2">Tirocinante 2</option><option value="Mishelle (Staff)">Mishelle (Staff)</option>';
            
            const registeredUsers = JSON.parse(localStorage.getItem('msh_users_db')) || [];
            registeredUsers.filter(u => u.role === 'intern').forEach(u => {
                selectAssignee.innerHTML += `<option value="${u.firstName}">${u.firstName} ${u.lastName}</option>`;
            });

            document.getElementById('modalTask').classList.add('active');
        });

        document.getElementById('formCreateTask').addEventListener('submit', (e) => {
            e.preventDefault();
            const pId = parseInt(document.getElementById('taskProjId').value);
            const tTitle = document.getElementById('taskTitle').value;
            const tAssign = document.getElementById('taskAssignee').value;
            const tDead = document.getElementById('taskDeadline').value;
            const taskDocs = document.getElementById('taskDocs').value;
            let finalDesc = document.getElementById('taskDesc').value + `\n<br><strong>Scadenza:</strong> ${tDead}`;
            
            if(taskDocs) {
                finalDesc += `<br><a href="${taskDocs}" target="_blank" style="color:var(--accent);">📄 Apri File Collegato</a>`;
            }

            db.tasks.push({
                id: Date.now(),
                projId: pId,
                title: tTitle,
                desc: finalDesc,
                status: 'todo',
                assignee: tAssign,
                createdBy: document.getElementById('userName').innerText,
                createdAt: new Date().toLocaleDateString('it-IT')
            });
            
            document.getElementById('modalTask').classList.remove('active');
            document.getElementById('formCreateTask').reset();
            
            sendMockEmail(tAssign, `Nuovo Task Assegnato: ${tTitle}`);
            
            // Renderizza di nuovo la bacheca del progetto selezionato
            renderKanban(pId.toString());
        });

        // --- Create Intern Logic ---
        const btnGenIntern = document.getElementById('btnGenerateIntern');
        if (btnGenIntern) {
            btnGenIntern.addEventListener('click', () => {
                document.getElementById('modalGenerateIntern').style.display = 'flex';
            });
        }

        const formGenIntern = document.getElementById('formGenerateIntern');
        if (formGenIntern) {
            formGenIntern.addEventListener('submit', (e) => {
                e.preventDefault();
                const iName = document.getElementById('intName').value;
                const iSurname = document.getElementById('intSurname').value;
                const iUsername = document.getElementById('intUsername').value.toLowerCase().replace(/\s/g, '');
                const iPass = document.getElementById('intPassword').value;

                let users = JSON.parse(localStorage.getItem('msh_users_db')) || [];
                if(users.find(u => u.username === iUsername)) {
                    alert('Errore: Username già in uso.');
                    return;
                }

                const sDate = new Date();
                const eDate = new Date();
                eDate.setMonth(eDate.getMonth() + 6);

                users.push({
                    role: 'intern',
                    firstName: iName,
                    lastName: iSurname,
                    username: iUsername,
                    password: iPass,
                    workEmail: 'interns@martestudios.com',
                    personalEmail: '',
                    phone: '',
                    startDate: sDate.toISOString().split('T')[0],
                    endDate: eDate.toISOString().split('T')[0]
                });

                localStorage.setItem('msh_users_db', JSON.stringify(users));
                document.getElementById('modalGenerateIntern').style.display = 'none';
                formGenIntern.reset();
                alert(`Account tirocinante '${iUsername}' creato! Ora l'utente può fare login.`);
                renderApp();
            });
        }
    }

    // Profile Pic Upload Logic
    document.getElementById('uploadProfilePic').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Light compression mock reading
            const reader = new FileReader();
            reader.onload = function(evt) {
                const base64Data = evt.target.result;
                try {
                    localStorage.setItem('msh_avatar_' + user.email.toLowerCase(), base64Data);
                    sendMockEmail(user.email, "Foto Profilo Aggiornata Correttamente.");
                    setTimeout(() => window.location.reload(), 1500);
                } catch (e) {
                    alert("Errore quota superata. L'immagine è troppo pesante per esser salvata nel database-browser.");
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Tirocinante Profile Form
    document.getElementById('internDatesForm').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Richiesta Variazione inviata a The Martian Manager Hub.');
        document.getElementById('internDatesForm').reset();
    });

    // Reimbursement Form Logic
    const reimburseForm = document.getElementById('formReimburse');
    if(reimburseForm) {
        reimburseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const activity = document.getElementById('reActivity').value;
            const amount = document.getElementById('reAmount').value;
            const iban = document.getElementById('reIban').value;
            
            // Invio la pratica direttamente a Vincenzo, come richiesto
            sendMockEmail('vincenzo@martestudios.com', `Nuova Pratica di Rimborso: ${activity}`, `Importo Corrisposto: €${amount}\nIBAN Beneficiario: ${iban}\n(La piattaforma ha convalidato e protocollato ricevute/PDF adiacenti nel server)`);
            
            alert("Richiesta di rimborso inviata con successo a Vincenzo (Dipartimento Amministrativo).");
            reimburseForm.reset();
        });
    }

    // Change Password Form Logic
    const passForm = document.getElementById('formChangePassword');
    if(passForm) {
        passForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPass = document.getElementById('newPass').value;
            
            const allU = JSON.parse(localStorage.getItem('msh_users_db')) || [];
            const userIndex = allU.findIndex(u => (u.username && u.username === user.username) || u.workEmail === user.email);
            
            if (userIndex !== -1) {
                allU[userIndex].password = newPass;
                localStorage.setItem('msh_users_db', JSON.stringify(allU));
                alert("Password aggiornata con successo! Per sicurezza ora sarai reindirizzato al login.");
                document.getElementById('logoutBtn').click();
            } else {
                alert("Account non trovato nel database reale per la modifica della password. Prova con una mail di demo.");
            }
        });
    }

    // Inizializza l'applicazione
    renderApp();
});
