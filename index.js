const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Base de datos temporal en memoria (después conectamos la real)
let citas = [
  { id:1, fisio:'dr.carlos', paciente:'Rosa García', telefono:'+528671112233', tipo:'Rehab. hombro', fecha:'2025-06-12', hora:'13:00', wa:true },
  { id:2, fisio:'dr.carlos', paciente:'María Sánchez', telefono:'+528672223344', tipo:'Terapia cervical', fecha:'2025-06-12', hora:'14:00', wa:true },
  { id:3, fisio:'dra.laura', paciente:'Ana López', telefono:'+528676667788', tipo:'Rehab. columna', fecha:'2025-06-12', hora:'15:00', wa:true },
  { id:4, fisio:'miguel', paciente:'Fernando Cruz', telefono:'+528671002200', tipo:'Rehab. tobillo', fecha:'2025-06-12', hora:'13:00', wa:true },
  { id:5, fisio:'sofia', paciente:'Jorge Reyes', telefono:'+528673004400', tipo:'Rehab. espalda', fecha:'2025-06-12', hora:'14:00', wa:true },
];

let pacientes = [
  { id:1, fisio:'dr.carlos', nombre:'Rosa García', telefono:'+528671112233', tipo:'Rehab. hombro', citas:8 },
  { id:2, fisio:'dr.carlos', nombre:'María Sánchez', telefono:'+528672223344', tipo:'Terapia cervical', citas:5 },
  { id:3, fisio:'dra.laura', nombre:'Ana López', telefono:'+528676667788', tipo:'Rehab. columna', citas:10 },
  { id:4, fisio:'miguel', nombre:'Fernando Cruz', telefono:'+528671002200', tipo:'Rehab. tobillo', citas:3 },
  { id:5, fisio:'sofia', nombre:'Jorge Reyes', telefono:'+528673004400', tipo:'Rehab. espalda', citas:6 },
];

const usuarios = {
  'dr.carlos': { password:'carlos123', nombre:'Dr. Carlos Martínez' },
  'dra.laura': { password:'laura123',  nombre:'Dra. Laura Rodríguez' },
  'miguel':    { password:'miguel123', nombre:'Miguel González' },
  'sofia':     { password:'sofia123',  nombre:'Sofía Ortega' },
  'admin':     { password:'admin123',  nombre:'Administrador' },
};

// ── RUTAS ──

// Login
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios[usuario];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  res.json({ ok: true, nombre: user.nombre, usuario });
});

// Obtener citas (por fisio o todas si es admin)
app.get('/citas', (req, res) => {
  const { fisio, fecha } = req.query;
  let resultado = citas;
  if (fisio && fisio !== 'admin') resultado = resultado.filter(c => c.fisio === fisio);
  if (fecha) resultado = resultado.filter(c => c.fecha === fecha);
  res.json(resultado);
});

// Crear cita
app.post('/citas', (req, res) => {
  const nueva = { ...req.body, id: Date.now() };
  citas.push(nueva);
  // Agregar paciente si no existe
  const existe = pacientes.find(p => p.telefono === nueva.telefono);
  if (!existe) {
    pacientes.push({ id: Date.now()+1, fisio: nueva.fisio, nombre: nueva.paciente, telefono: nueva.telefono, tipo: nueva.tipo, citas: 1 });
  }
  res.json({ ok: true, cita: nueva });
});

// Mover cita (admin)
app.put('/citas/:id/mover', (req, res) => {
  const { fisioDestino } = req.body;
  const cita = citas.find(c => c.id == req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  cita.fisio = fisioDestino;
  res.json({ ok: true, cita });
});

// Quitar cita (admin)
app.delete('/citas/:id', (req, res) => {
  citas = citas.filter(c => c.id != req.params.id);
  res.json({ ok: true });
});

// Obtener pacientes por fisio
app.get('/pacientes', (req, res) => {
  const { fisio } = req.query;
  let resultado = pacientes;
  if (fisio && fisio !== 'admin') resultado = resultado.filter(p => p.fisio === fisio);
  res.json(resultado);
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: '✅ Servidor FisioAgenda funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});