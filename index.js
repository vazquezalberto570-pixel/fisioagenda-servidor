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

let citas = [];

let pacientes = [];

const usuarios = {
  'aldo':  { password:'aldo123',  nombre:'Aldo' },
  'viky':  { password:'viky123',  nombre:'Viky' },
  'sara':  { password:'sara123',  nombre:'Sara' },
  'admin': { password:'admin123', nombre:'Administrador' },
};

// Login
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios[usuario];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  res.json({ ok: true, nombre: user.nombre, usuario });
});

// Obtener citas
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
  const existe = pacientes.find(p => p.telefono === nueva.telefono);
  if (!existe) {
    pacientes.push({ id: Date.now()+1, fisio: nueva.fisio, nombre: nueva.paciente, telefono: nueva.telefono, tipo: nueva.tipo, citas: 1 });
  } else {
    existe.citas++;
  }
  res.json({ ok: true, cita: nueva });
});

// Mover cita
app.put('/citas/:id/mover', (req, res) => {
  const { fisioDestino } = req.body;
  const cita = citas.find(c => c.id == req.params.id);
  if (!cita) return res.status(404).json({ error: 'Cita no encontrada' });
  cita.fisio = fisioDestino;
  res.json({ ok: true, cita });
});

// Quitar cita
app.delete('/citas/:id', (req, res) => {
  citas = citas.filter(c => c.id != req.params.id);
  res.json({ ok: true });
});

// Obtener pacientes
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