#!/usr/bin/env node

// Script to populate JSON database with mock data
// Run with: node scripts/seed-json-db.js

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, '../.data');
const MOCK_USER_ID = 'local-user-id';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
function writeJsonFile(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Created ${filename} with ${data.length} records`);
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Mock data generators
const mockProfiles = [
  {
    id: MOCK_USER_ID,
    nombre: 'Dr. Juan Pérez',
    email: 'local@medfin.dev',
    especialidad: 'Medicina General',
    created_at: new Date('2024-01-15').toISOString()
  }
];

const mockInstituciones = [
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Clínica San José',
    rut: '76.123.456-7',
    activa: true,
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Hospital del Trabajador',
    rut: '78.987.654-3',
    activa: true,
    created_at: new Date('2024-02-01').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Centro Médico Las Condes',
    rut: '82.456.789-1',
    activa: true,
    created_at: new Date('2024-02-15').toISOString()
  }
];

const mockTiposPrestacion = [
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Consulta Medicina General',
    es_turno: false,
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Cirugía Menor',
    es_turno: false,
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Endoscopia Digestiva',
    es_turno: false,
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Turno Guardia',
    es_turno: true,
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Ecografía',
    es_turno: false,
    created_at: new Date('2024-01-20').toISOString()
  },
  {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    nombre: 'Electrocardiograma',
    es_turno: false,
    created_at: new Date('2024-01-20').toISOString()
  }
];

// Generate reglas_plazo for each institution and service type
const mockReglasPlazo = [];
const tiposPrestacionNombres = mockTiposPrestacion.map(tp => tp.nombre);

mockInstituciones.forEach(institucion => {
  tiposPrestacionNombres.forEach(nombreTipo => {
    mockReglasPlazo.push({
      id: randomUUID(),
      user_id: MOCK_USER_ID,
      institucion_id: institucion.id,
      tipo_prestacion_nombre: nombreTipo,
      dias_emitir_boleta: randomInt(3, 10),
      dias_recibir_pago: randomInt(25, 45),
      created_at: new Date('2024-02-01').toISOString()
    });
  });
});

// Generate prestaciones (services rendered)
const mockPrestaciones = [];
const estados = ['realizada', 'boleta_emitida', 'pagada'];
const tiposDocumento = ['boleta', 'factura'];

// Generate 50 prestaciones over the last 6 months
for (let i = 0; i < 50; i++) {
  const institucion = randomChoice(mockInstituciones);
  const tipoPrestacion = randomChoice(mockTiposPrestacion);
  const fechaPrestacion = randomDate(
    new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    new Date()
  );
  
  // Find corresponding regla_plazo
  const reglaPlazo = mockReglasPlazo.find(rp => 
    rp.institucion_id === institucion.id && 
    rp.tipo_prestacion_nombre === tipoPrestacion.nombre
  );
  
  const diasEmitirBoleta = reglaPlazo?.dias_emitir_boleta || 5;
  const diasRecibirPago = reglaPlazo?.dias_recibir_pago || 30;
  
  const fechaLimiteBoleta = addDays(fechaPrestacion, diasEmitirBoleta);
  const estado = randomChoice(estados);
  
  let fechaBoletaEmitida = null;
  let fechaLimitePago = null;
  let fechaPagoRecibido = null;
  let numeroDocumento = null;
  
  if (estado !== 'realizada') {
    fechaBoletaEmitida = randomDate(fechaPrestacion, fechaLimiteBoleta);
    fechaLimitePago = addDays(fechaBoletaEmitida, diasRecibirPago);
    numeroDocumento = `${randomInt(100000, 999999)}-${randomInt(1, 9)}`;
    
    if (estado === 'pagada') {
      fechaPagoRecibido = randomDate(fechaBoletaEmitida, fechaLimitePago);
    }
  }
  
  let montoBruto, horas, valorHora;
  if (tipoPrestacion.es_turno) {
    horas = randomFloat(4, 12, 1);
    valorHora = randomFloat(15000, 25000);
    montoBruto = Math.round(horas * valorHora);
  } else {
    montoBruto = randomInt(30000, 300000);
    horas = null;
    valorHora = null;
  }
  
  const retencionPct = 14.5;
  const montoRetencion = Math.round(montoBruto * retencionPct / 100);
  const montoNeto = montoBruto - montoRetencion;
  
  mockPrestaciones.push({
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    institucion_id: institucion.id,
    institucion_nombre: institucion.nombre,
    tipo_prestacion: tipoPrestacion.nombre,
    es_turno: tipoPrestacion.es_turno,
    fecha_prestacion: fechaPrestacion.toISOString().split('T')[0],
    fecha_limite_boleta: fechaLimiteBoleta.toISOString().split('T')[0],
    fecha_boleta_emitida: fechaBoletaEmitida?.toISOString().split('T')[0] || null,
    fecha_limite_pago: fechaLimitePago?.toISOString().split('T')[0] || null,
    fecha_pago_recibido: fechaPagoRecibido?.toISOString().split('T')[0] || null,
    monto_bruto: montoBruto,
    retencion_pct: retencionPct,
    monto_retencion: montoRetencion,
    monto_neto: montoNeto,
    horas: horas,
    valor_hora: valorHora,
    estado: estado,
    tipo_documento: randomChoice(tiposDocumento),
    numero_documento: numeroDocumento,
    notas: i % 5 === 0 ? randomChoice([
      'Paciente con dolor abdominal',
      'Control postoperatorio',
      'Evaluación cardiológica rutinaria',
      'Estudio gastrointestinal completo',
      'Urgencia traumatológica'
    ]) : null,
    created_at: fechaPrestacion.toISOString(),
    updated_at: fechaPagoRecibido ? fechaPagoRecibido.toISOString() : fechaPrestacion.toISOString()
  });
}

// Sort prestaciones by date (newest first)
mockPrestaciones.sort((a, b) => new Date(b.fecha_prestacion) - new Date(a.fecha_prestacion));

// Write all mock data files
console.log('Creating mock data for JSON database...\n');

writeJsonFile('profiles.json', mockProfiles);
writeJsonFile('instituciones.json', mockInstituciones);
writeJsonFile('tipos_prestacion.json', mockTiposPrestacion);
writeJsonFile('reglas_plazo.json', mockReglasPlazo);
writeJsonFile('prestaciones.json', mockPrestaciones);

console.log('\n✅ Mock data generation completed!');
console.log('\n📊 Summary:');
console.log(`- Profiles: ${mockProfiles.length}`);
console.log(`- Institutions: ${mockInstituciones.length}`);
console.log(`- Service Types: ${mockTiposPrestacion.length}`);
console.log(`- Deadline Rules: ${mockReglasPlazo.length}`);
console.log(`- Services Rendered: ${mockPrestaciones.length}`);
console.log(`\n💰 Total amount in services: $${mockPrestaciones.reduce((sum, p) => sum + p.monto_bruto, 0).toLocaleString('es-CL')}`);
console.log(`💰 Net amount after retention: $${mockPrestaciones.reduce((sum, p) => sum + p.monto_neto, 0).toLocaleString('es-CL')}`);

const statusCount = mockPrestaciones.reduce((acc, p) => {
  acc[p.estado] = (acc[p.estado] || 0) + 1;
  return acc;
}, {});
console.log(`\n📈 Services by status:`, statusCount);
