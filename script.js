  // -----------------------------
  // Explicación (también disponible como comentarios):
  // -----------------------------
  // 1) Regex utilizadas:
  //    - emailRegex: ^\S+@\S+\.\S+$
  //      * Explicación: busca una cadena sin espacios que tenga un '@' y un '.' con texto alrededor.
  //      * Es simple y práctica para validación del cliente. No garantiza existencia del dominio.
  //    - phoneRegex: ^\+?\d{7,15}$
  //      * Explicación: permite opcionalmente un '+' al inicio (códigos internacionales) y entre 7 y 15 dígitos.
  //    - passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/
  //      * Explicación: exige al menos una minúscula, una mayúscula, un dígito y un carácter especial (no alfanumérico), y longitud mínima 8.
  //
  // 2) Manejo del bloqueo:
  //    - Cada usuario guardado en localStorage tiene propiedades:
  //      name, email, phone, passHash, failedAttempts, locked (boolean).
  //    - Cuando un intento de login falla, aumentamos failedAttempts.
  //    - Si llega a 3, se establece locked = true.
  //    - Cuando la cuenta está bloqueada, se muestra mensaje y enlace para recuperar contraseña.
  //    - Al actualizar la contraseña desde la recuperación, failedAttempts = 0 y locked = false.
  //
  // 3) Validación de contraseña:
  //    - Se usa passwordRegex en registro y recuperación.
  //
  // 4) Recuperación de contraseña:
  //    - Si el usuario existe, se actualiza el hash y se desbloquea la cuenta.
  //
  // Nota: Este sistema es un DEMO sin backend real.

  const emailRegex = /^\S+@\S+\.\S+$/;
  const phoneRegex = /^\+?\d{7,15}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

  function getUsers(){
    try{ return JSON.parse(localStorage.getItem('demo_users')||'{}'); }
    catch(e){ return {} }
  }
  function saveUsers(u){ localStorage.setItem('demo_users', JSON.stringify(u)); }

  async function hashPassword(password){
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const arr = Array.from(new Uint8Array(hash));
    return arr.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  const regName = document.getElementById('regName');
  const regEmail = document.getElementById('regEmail');
  const regPhone = document.getElementById('regPhone');
  const regPassword = document.getElementById('regPassword');
  const btnRegister = document.getElementById('btnRegister');
  const regFeedback = document.getElementById('regFeedback');
  const regShow = document.getElementById('regShow');

  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const btnLogin = document.getElementById('btnLogin');
  const loginFeedback = document.getElementById('loginFeedback');
  const recoverLink = document.getElementById('recoverLink');
  const loginShow = document.getElementById('loginShow');

  const recEmail = document.getElementById('recEmail');
  const recPassword = document.getElementById('recPassword');
  const btnRecover = document.getElementById('btnRecover');
  const recFeedback = document.getElementById('recFeedback');
  const recShow = document.getElementById('recShow');

  regShow.addEventListener('change', ()=> regPassword.type = regShow.checked ? 'text' : 'password');
  loginShow.addEventListener('change', ()=> loginPassword.type = loginShow.checked ? 'text' : 'password');
  recShow.addEventListener('change', ()=> recPassword.type = recShow.checked ? 'text' : 'password');

  btnRegister.addEventListener('click', async ()=>{
    regFeedback.textContent = '';
    const name = regName.value.trim();
    const email = regEmail.value.trim().toLowerCase();
    const phone = regPhone.value.trim();
    const password = regPassword.value;

    if(!name || !email || !phone || !password){
      regFeedback.innerHTML = '<span class="error">Todos los campos son obligatorios.</span>'; 
      return;
    }
    if(!emailRegex.test(email)){
      regFeedback.innerHTML = '<span class="error">Correo inválido.</span>'; 
      return;
    }
    if(!phoneRegex.test(phone)){
      regFeedback.innerHTML = '<span class="error">Número de móvil inválido.</span>'; 
      return;
    }
    if(!passwordRegex.test(password)){
      regFeedback.innerHTML = '<span class="error">Contraseña débil.</span>'; 
      return;
    }

    const users = getUsers();
    if(users[email]){
      regFeedback.innerHTML = '<span class="error">Ya existe una cuenta con ese correo.</span>';
      return;
    }

    const passHash = await hashPassword(password);
    users[email] = { name, email, phone, passHash, failedAttempts:0, locked:false };
    saveUsers(users);

    regFeedback.innerHTML = '<span class="success">Registro exitoso. Ahora puede iniciar sesión.</span>';
    regName.value=''; regEmail.value=''; regPhone.value=''; regPassword.value='';
  });

  btnLogin.addEventListener('click', async ()=>{
    loginFeedback.textContent=''; 
    recoverLink.style.display='none';
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if(!email || !password){
      loginFeedback.innerHTML = '<span class="error">Ingrese usuario y contraseña.</span>'; 
      return;
    }
    if(!emailRegex.test(email)){
      loginFeedback.innerHTML = '<span class="error">Correo inválido.</span>'; 
      return;
    }

    const users = getUsers();
    const u = users[email];

    if(!u){
      loginFeedback.innerHTML = '<span class="error">Usuario o contraseña incorrectos.</span>'; 
      return;
    }
    if(u.locked){
      loginFeedback.innerHTML = '<span class="error">Cuenta bloqueada por intentos fallidos.</span>';
      recoverLink.style.display='inline';
      return;
    }

    const passHash = await hashPassword(password);
    if(passHash === u.passHash){
      u.failedAttempts = 0;
      saveUsers(users);
      loginFeedback.innerHTML = '<span class="success">Bienvenido al sistema, '+escapeHtml(u.name)+'</span>';
      loginEmail.value=''; loginPassword.value='';
    }
    else{
      u.failedAttempts = (u.failedAttempts||0) + 1;
      let msg = 'Usuario o contraseña incorrectos.';
      if(u.failedAttempts >= 3){
        u.locked = true;
        msg = 'Cuenta bloqueada por intentos fallidos.';
        recoverLink.style.display='inline';
      }
      saveUsers(users);
      loginFeedback.innerHTML = '<span class="error">'+msg+'</span>';
    }
  });

  recoverLink.addEventListener('click', ()=>{
    recEmail.value = loginEmail.value.trim().toLowerCase();
    recPassword.focus();
  });

  btnRecover.addEventListener('click', async ()=>{
    recFeedback.textContent='';
    const email = recEmail.value.trim().toLowerCase();
    const newPass = recPassword.value;

    if(!email || !newPass){
      recFeedback.innerHTML = '<span class="error">Ingrese correo y nueva contraseña.</span>'; 
      return;
    }
    if(!emailRegex.test(email)){
      recFeedback.innerHTML = '<span class="error">Correo inválido.</span>'; 
      return;
    }
    if(!passwordRegex.test(newPass)){
      recFeedback.innerHTML = '<span class="error">Contraseña no cumple requisitos.</span>'; 
      return;
    }

    const users = getUsers();
    const u = users[email];

    if(!u){
      recFeedback.innerHTML = '<span class="error">No existe una cuenta con ese correo.</span>';
      return;
    }

    const newHash = await hashPassword(newPass);
    u.passHash = newHash;
    u.failedAttempts = 0;
    u.locked = false;
    saveUsers(users);

    recFeedback.innerHTML = '<span class="success">Contraseña actualizada. Ahora puede iniciar sesión.</span>';
    recPassword.value=''; recEmail.value='';
  });

  function escapeHtml(str){
    return String(str).replace(/[&"'<>]/g, s => ({
      '&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'
    })[s]);
  }

  (async function createDemo(){
    const users = getUsers();
    if(!users['demo@ejemplo.com']){
      users['demo@ejemplo.com'] = { 
        name:'Usuario Demo',
        email:'demo@ejemplo.com',
        phone:'+59171234567',
        passHash: await hashPassword('Demo@1234'),
        failedAttempts:0,
        locked:false 
      };
      saveUsers(users);
    }
  })();
