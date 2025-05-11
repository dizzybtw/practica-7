require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000; // Cambiado a 5000

// Config Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/ping', (req, res) => {
  res.send('¡Servidor activo!');
});

// Iniciar con manejo de errores mejorado
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ==============================
  🚀 Servidor en http://localhost:${PORT}
  ==============================
  `);
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
  console.log('Prueba estos comandos:');
  console.log(`sudo lsof -i :${PORT}`);
  console.log(`kill -9 <PID>`);
  console.log(`O usa otro puerto: PORT=5001 npm start`);
});