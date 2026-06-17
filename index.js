const express = require('express');
const cors = require('cors');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

let citas = [];
let pacientes = [];
const usuarios = {
  'aldo':  { password:'aldo123',  nombre:'Aldo' },
  'viky':  { password:'viky123',  nombre:'Viky' },
  'sara':  { password:'sara123',  nombre:'Sara' },
  'admin': { password:'admin123', nombre:'Administrador' },
};

let sock = null;
let qrActual = null;
let waConectado = false;

async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrActual = qr;
      waConectado = false;
      console.log('📱 Escanea este QR:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      waConectado = true;
      qrActual = null;
      console.log('✅ WhatsApp conectado!');
    }
    if (connection === 'close') {
      waConectado = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Reconectando...');
        setTimeout(conectarWhatsApp, 3000);
      }
    }
  });
}

async function mandarMensaje(telefono, mensaje) {
  if (!sock || !waConectado) return false;
  try {
    const numero = telefono.replace(/\D/g, '');
    await sock.sendMessage(`${numero}@s.whatsapp.net`, { text: mensaje });
    console.log(`✅ WA enviado a ${numero}`);
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

function programarRecordatorios() {
  const ahora = new Date();
  const proximas7am = new Date();
  proximas7am.setHours(7, 0, 0, 0);
  if (ahora >= proximas7am) proximas7am.setDate(proximas7am.getDate() + 1);
  const msHasta7am = proximas7am - ahora;
  setTimeout(() => {
    mandarRecordatoriosHoy();
    setInterval(mandarRecordatoriosHoy, 24 * 60 * 60 * 1000);
  }, msHasta7am);
  console.log(`⏰ Recordatorios programados para las 7:00 AM`);
}

async function mandarRecordatoriosHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(c => c.fecha === hoy && c.wa);
  console.log(`📋 ${citasHoy.length} recordatorios hoy`);
  for (const cita of citasHoy) {
    const msg = `Hola ${cita.paciente.split(' ')[0]} 👋 Te recordamos que *hoy tienes tu cita de fisioterapia* a las *${cita.hora}*.\n\n📍 Clínica de Fisioterapia\n\n¡Te esperamos! 😊`;
    const ok = await mandarMensaje(cita.telefono, msg);
    if (ok) {
      cita.waEnviado = true;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

// RUTAS
app.get('/wa/status', (req, res) => res.json({ conectado: waConectado, qr: qrActual }));

app.post('/wa/prueba', async (req, res) => {
  const ok = await mandarMensaje(req.body.telefono, '✅ Prueba FisioAgenda — WhatsApp funcionando!');
  res.json({ ok });
});

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios[usuario];
  if (!user || user.password !== password) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.json({ ok: true, nombre: user.nombre, usuario });
});

app.get('/citas', (req, res) => {
  const { fisio, fecha } = req.query;
  let r = citas;
  if (fisio && fisio !== 'admin') r = r.filter(c => c.fisio === fisio);
  if (fecha) r = r.filter(c => c.fecha === fecha);
  res.json(r);
});

app.post('/citas', (req, res) => {
  const nueva = { ...req.body, id: Date.now(), waEnviado: false };
  citas.push(nueva);
  const existe = pacientes.find(p => p.telefono === nueva.telefono);
  if (!existe) {
    pacientes.push({ id: Date.now()+1, fisio: nueva.fisio, nombre: nueva.paciente, telefono: nueva.telefono, tipo: nueva.tipo, citas: 1 });
  } else {
    existe.citas++;
  }
  res.json({ ok: true, cita: nueva });
});

app.put('/citas/:id/mover', (req, res) => {
  const cita = citas.find(c => c.id == req.params.id);
  if (!cita) return res.status(404).json({ error: 'No encontrada' });
  cita.fisio = req.body.fisioDestino;
  res.json({ ok: true, cita });
});

app.delete('/citas/:id', (req, res) => {
  citas = citas.filter(c => c.id != req.params.id);
  res.json({ ok: true });
});

app.get('/pacientes', (req, res) => {
  const { fisio } = req.query;
  let r = pacientes;
  if (fisio && fisio !== 'admin') r = r.filter(p => p.fisio === fisio);
  res.json(r);
});

app.get('/', (req, res) => res.json({ mensaje: '✅ Servidor FisioAgenda funcionando' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
  conectarWhatsApp();
  programarRecordatorios();
});
ENDOFFILE
Salida

const express = require('express');
const cors = require('cors');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

let citas = [];
let pacientes = [];
const usuarios = {
  'aldo':  { password:'aldo123',  nombre:'Aldo' },
  'viky':  { password:'viky123',  nombre:'Viky' },
  'sara':  { password:'sara123',  nombre:'Sara' },
  'admin': { password:'admin123', nombre:'Administrador' },
};

let sock = null;
let qrActual = null;
let waConectado = false;

async function conectarWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  sock = makeWASocket({ auth: state, printQRInTerminal: true });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrActual = qr;
      waConectado = false;
      console.log('📱 Escanea este QR:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      waConectado = true;
      qrActual = null;
      console.log('✅ WhatsApp conectado!');
    }
    if (connection === 'close') {
      waConectado = false;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Reconectando...');
        setTimeout(conectarWhatsApp, 3000);
      }
    }
  });
}

async function mandarMensaje(telefono, mensaje) {
  if (!sock || !waConectado) return false;
  try {
    const numero = telefono.replace(/\D/g, '');
    await sock.sendMessage(`${numero}@s.whatsapp.net`, { text: mensaje });
    console.log(`✅ WA enviado a ${numero}`);
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

function programarRecordatorios() {
  const ahora = new Date();
  const proximas7am = new Date();
  proximas7am.setHours(7, 0, 0, 0);
  if (ahora >= proximas7am) proximas7am.setDate(proximas7am.getDate() + 1);
  const msHasta7am = proximas7am - ahora;
  setTimeout(() => {
    mandarRecordatoriosHoy();
    setInterval(mandarRecordatoriosHoy, 24 * 60 * 60 * 1000);
  }, msHasta7am);
  console.log(`⏰ Recordatorios programados para las 7:00 AM`);
}

async function mandarRecordatoriosHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(c => c.fecha === hoy && c.wa);
  console.log(`📋 ${citasHoy.length} recordatorios hoy`);
  for (const cita of citasHoy) {
    const msg = `Hola ${cita.paciente.split(' ')[0]} 👋 Te recordamos que *hoy tienes tu cita de fisioterapia* a las *${cita.hora}*.\n\n📍 Clínica de Fisioterapia\n\n¡Te esperamos! 😊`;
    const ok = await mandarMensaje(cita.telefono, msg);
    if (ok) {
      cita.waEnviado = true;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
}

// RUTAS
app.get('/wa/status', (req, res) => res.json({ conectado: waConectado, qr: qrActual }));

app.post('/wa/prueba', async (req, res) => {
  const ok = await mandarMensaje(req.body.telefono, '✅ Prueba FisioAgenda — WhatsApp funcionando!');
  res.json({ ok });
});

app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios[usuario];
  if (!user || user.password !== password) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.json({ ok: true, nombre: user.nombre, usuario });
});

app.get('/citas', (req, res) => {
  const { fisio, fecha } = req.query;
  let r = citas;
  if (fisio && fisio !== 'admin') r = r.filter(c => c.fisio === fisio);
  if (fecha) r = r.filter(c => c.fecha === fecha);
  res.json(r);
});

app.post('/citas', (req, res) => {
  const nueva = { ...req.body, id: Date.now(), waEnviado: false };
  citas.push(nueva);
  const existe = pacientes.find(p => p.telefono === nueva.telefono);
  if (!existe) {
    pacientes.push({ id: Date.now()+1, fisio: nueva.fisio, nombre: nueva.paciente, telefono: nueva.telefono, tipo: nueva.tipo, citas: 1 });
  } else {
    existe.citas++;
  }
  res.json({ ok: true, cita: nueva });
});

app.put('/citas/:id/mover', (req, res) => {
  const cita = citas.find(c => c.id == req.params.id);
  if (!cita) return res.status(404).json({ error: 'No encontrada' });
  cita.fisio = req.body.fisioDestino;
  res.json({ ok: true, cita });
});

app.delete('/citas/:id', (req, res) => {
  citas = citas.filter(c => c.id != req.params.id);
  res.json({ ok: true });
});

app.get('/pacientes', (req, res) => {
  const { fisio } = req.query;
  let r = pacientes;
  if (fisio && fisio !== 'admin') r = r.filter(p => p.fisio === fisio);
  res.json(r);
});

app.get('/', (req, res) => res.json({ mensaje: '✅ Servidor FisioAgenda funcionando' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor en puerto ${PORT}`);
  conectarWhatsApp();
  programarRecordatorios();
});
