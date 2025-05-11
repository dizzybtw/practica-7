const SUPABASE_URL = 'https://hyeydzqftsuoqpbsigkh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5ZXlkenFmdHN1b3FwYnNpZ2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTQyMzQsImV4cCI6MjA2MjQ3MDIzNH0.xDuEt0LlJ9MwVmGjSCg8pyMlOWjOBBzN4q9TGpKbDVA';

// DOM Elements
const userTableBody = document.getElementById('userTableBody');
const userForm = document.getElementById('userForm');
const loginForm = document.getElementById('loginForm');
const refreshBtn = document.getElementById('refreshBtn');
const newUserBtn = document.getElementById('newUserBtn');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = document.getElementById('submitBtn');
const formTitle = document.getElementById('formTitle');
const userInfo = document.getElementById('userInfo');
const loadingSpinners = document.querySelectorAll('.loading-spinner');
const errorContainer = document.getElementById('errorContainer');

// Variables de estado
let currentMode = 'create'; // 'create' or 'edit' or 'view'
let currentUserId = null;

// Eventos
document.addEventListener('DOMContentLoaded', () => {
  checkLoggedInUser();
  loadUsers();
 
  // Asignar eventos
  if (refreshBtn) refreshBtn.addEventListener('click', loadUsers);
  if (newUserBtn) newUserBtn.addEventListener('click', setCreateMode);
  if (editBtn) editBtn.addEventListener('click', setEditMode);
  if (deleteBtn) deleteBtn.addEventListener('click', showDeleteConfirmation);
  if (cancelBtn) cancelBtn.addEventListener('click', cancelAction);
  if (userForm) userForm.addEventListener('submit', handleUserSubmit);
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
});

function checkLoggedInUser() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (user) {
    showUserInfo(`Logged in as: ${user.nombre_usuario} (${user.email})`);
  }
}

function showUserInfo(message) {
  userInfo.textContent = message;
  userInfo.style.display = 'block';
}

function displayError(message) {
  const errorAlert = document.createElement('div');
  errorAlert.className = 'alert alert-danger alert-dismissible fade show';
  errorAlert.role = 'alert';
  errorAlert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  errorContainer.appendChild(errorAlert);
 
  setTimeout(() => {
    errorAlert.remove();
  }, 5000);
}

async function loadUsers() {
  try {
    showLoading(true);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
   
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
   
    const users = await res.json();
    renderUserTable(users);
  } catch (err) {
    console.error('Error loading users:', err);
    displayError(`Error loading users: ${err.message}`);
    showError('Failed to load users.');
  } finally {
    showLoading(false);
  }
}

function renderUserTable(users) {
  userTableBody.innerHTML = '';
  if (!users || users.length === 0) {
    userTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
    return;
  }

  users.forEach(user => {
    const row = document.createElement('tr');
    let userType, badgeClass;
    if (user.usuario_superadministrador) {
      userType = 'Super Admin';
      badgeClass = 'bg-danger';
      row.classList.add('superadmin-card');
    } else if (user.usuario_administrador) {
      userType = 'Admin';
      badgeClass = 'bg-success';
      row.classList.add('admin-card');
    } else {
      userType = 'User';
      badgeClass = 'bg-primary';
      row.classList.add('user-card');
    }

    row.innerHTML = `
      <td>${user.id_usuario}</td>
      <td>${user.nombre_usuario}</td>
      <td>${user.email}</td>
      <td><span class="badge ${badgeClass} user-type-badge">${userType}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-info view-details me-1" data-id="${user.id_usuario}">
          <i class="bi bi-eye"></i> View
        </button>
        <button class="btn btn-sm btn-outline-warning edit-user me-1" data-id="${user.id_usuario}">
          <i class="bi bi-pencil"></i> Edit
        </button>
        <button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id_usuario}">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    `;
    userTableBody.appendChild(row);
  });

  // Add event listeners
  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = btn.getAttribute('data-id');
      loadUserDetails(userId);
    });
  });

  document.querySelectorAll('.edit-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = btn.getAttribute('data-id');
      loadUserDetails(userId);
      setEditMode();
    });
  });

  document.querySelectorAll('.delete-user').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const userId = btn.getAttribute('data-id');
      currentUserId = userId;
      showDeleteConfirmation();
    });
  });

  document.querySelectorAll('#userTable tbody tr').forEach(row => {
    row.addEventListener('click', () => {
      const userId = row.cells[0].textContent;
      loadUserDetails(userId);
    });
  });
}

async function loadUserDetails(userId) {
  try {
    showLoading(true);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id_usuario=eq.${userId}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const users = await res.json();
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const user = users[0];
    populateForm(user);
    setViewMode();
    currentUserId = userId;
    
  } catch (err) {
    console.error('Error loading user details:', err);
    displayError(`Error loading user: ${err.message}`);
  } finally {
    showLoading(false);
  }
}

function populateForm(user) {
  document.getElementById('userId').value = user.id_usuario;
  document.getElementById('identification').value = user.identificacion;
  document.getElementById('username').value = user.nombre_usuario;
  document.getElementById('email').value = user.email;
 
  // Clear password field
  document.getElementById('password').value = '';
 
  // Set user type
  if (user.usuario_superadministrador) {
    document.getElementById('superadminUser').checked = true;
  } else if (user.usuario_administrador) {
    document.getElementById('adminUser').checked = true;
  } else {
    document.getElementById('normalUser').checked = true;
  }
}

function setCreateMode() {
  currentMode = 'create';
  currentUserId = null;
 
  // Reset form
  userForm.reset();
  document.getElementById('userId').value = '';
 
  // Update UI
  formTitle.textContent = 'Register New User';
  document.getElementById('submitText').textContent = 'Register';
  submitBtn.classList.remove('btn-warning');
  submitBtn.classList.add('btn-primary');
  submitBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'none';
  editBtn.disabled = true;
  deleteBtn.disabled = true;
 
  // Enable all fields
  setFormEditable(true);
}

function setViewMode() {
  currentMode = 'view';
 
  // Update UI
  formTitle.textContent = 'User Details';
  submitBtn.style.display = 'none';
  cancelBtn.style.display = 'none';
  editBtn.disabled = false;
  deleteBtn.disabled = false;
 
  // Disable all fields
  setFormEditable(false);
}

function setEditMode() {
  currentMode = 'edit';
 
  // Update UI
  formTitle.textContent = 'Edit User';
  document.getElementById('submitText').textContent = 'Update';
  submitBtn.classList.remove('btn-primary');
  submitBtn.classList.add('btn-warning');
  submitBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'inline-block';
  editBtn.disabled = true;
  deleteBtn.disabled = true;
 
  // Enable all fields except ID
  setFormEditable(true);
  document.getElementById('identification').readOnly = false;
}

function cancelAction() {
  if (currentUserId) {
    loadUserDetails(currentUserId); // Reload user data
    setViewMode();
  } else {
    setCreateMode();
  }
}

function setFormEditable(editable) {
  const inputs = userForm.querySelectorAll('input:not([type="hidden"]), select, textarea');
  inputs.forEach(input => {
    if (input.type === 'radio' || input.type === 'checkbox') {
      input.disabled = !editable;
    } else {
      input.readOnly = !editable;
      if (editable) {
        input.classList.remove('form-mode-view');
      } else {
        input.classList.add('form-mode-view');
      }
    }
  });
 
  // Special case for password field
  const passwordField = document.getElementById('password');
  if (editable) {
    passwordField.placeholder = 'Enter new password (leave blank to keep current)';
    passwordField.required = false;
  } else {
    passwordField.placeholder = 'Password (hidden)';
    passwordField.required = true;
  }
}

async function handleUserSubmit(e) {
  e.preventDefault();
  try {
    showLoading(true, 'submit');
    
    const formData = {
      identificacion: document.getElementById('identification').value,
      nombre_usuario: document.getElementById('username').value,
      email: document.getElementById('email').value,
      usuario_normal: document.getElementById('normalUser').checked,
      usuario_administrador: document.getElementById('adminUser').checked,
      usuario_superadministrador: document.getElementById('superadminUser').checked
    };
    
    // Solo actualizar contraseña si se proporcionó una nueva
    const password = document.getElementById('password').value;
    if (password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      formData.clave_encriptada = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    let url, method;
    if (currentMode === 'create') {
      url = `${SUPABASE_URL}/rest/v1/usuarios`;
      method = 'POST';
    } else {
      url = `${SUPABASE_URL}/rest/v1/usuarios?id_usuario=eq.${currentUserId}`;
      method = 'PATCH';
    }

    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Error saving user');
    }

    Swal.fire({
      icon: 'success',
      title: currentMode === 'create' ? 'User created' : 'User updated',
      text: 'Operation completed successfully',
      timer: 2000,
      showConfirmButton: false
    });

    loadUsers();
    if (currentMode === 'create') {
      setCreateMode();
    } else {
      setViewMode();
    }
    
  } catch (err) {
    console.error('Save error:', err);
    displayError(`Save error: ${err.message}`);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message
    });
  } finally {
    showLoading(false, 'submit');
  }
}

function showDeleteConfirmation() {
  if (!currentUserId) {
    displayError('No user selected for deletion');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
  modal.show();
 
  document.getElementById('confirmDeleteBtn').onclick = async () => {
    try {
      modal.hide();
      showLoading(true);
     
      const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?id_usuario=eq.${currentUserId}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`
        }
      });
     
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
     
      Swal.fire({
        icon: 'success',
        title: 'User deleted',
        text: 'User deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
     
      setCreateMode();
      loadUsers();
     
    } catch (err) {
      console.error('Delete error:', err);
      displayError(`Delete error: ${err.message}`);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message
      });
    } finally {
      showLoading(false);
    }
  };
}

async function handleLogin(e) {
  e.preventDefault();
  try {
    showLoading(true, 'login');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Hash de la contraseña para comparar
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const users = await res.json();
    const user = users[0];

    if (!user) {
      throw new Error('User not found. Please check your email address.');
    }

    // Comparación segura de hashes
    if (user.clave_encriptada !== passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    Swal.fire({
      icon: 'success',
      title: 'Login successful',
      text: `Welcome, ${user.nombre_usuario}`,
      timer: 2000,
      showConfirmButton: false
    });

    // Guardar sesión y mostrar información del usuario
    localStorage.setItem('currentUser', JSON.stringify(user));
    showUserInfo(`Logged in as: ${user.nombre_usuario} (${user.email})`);
   
  } catch (err) {
    console.error('Login error:', err);
   
    // Mostrar mensaje de error específico
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: err.message,
      timer: 3000,
      showConfirmButton: true
    });
   
  } finally {
    showLoading(false, 'login');
  }
}

function showLoading(show, target = 'all') {
  if (target === 'all') {
    loadingSpinners.forEach(sp => sp.style.display = show ? 'inline-block' : 'none');
  } else if (target === 'submit' && userForm) {
    toggleBtnLoading('submitText', userForm, show);
  } else if (target === 'login' && loginForm) {
    toggleBtnLoading('loginText', loginForm, show);
  }
}

function toggleBtnLoading(textId, form, show) {
  const textElement = form.querySelector(`#${textId}`);
  const spinner = form.querySelector('.loading-spinner');
  const button = form.querySelector('button[type="submit"]');
 
  if (textElement) textElement.style.display = show ? 'none' : 'inline-block';
  if (spinner) spinner.style.display = show ? 'inline-block' : 'none';
  if (button) button.disabled = show;
}

function showError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    timer: 3000
  });
}