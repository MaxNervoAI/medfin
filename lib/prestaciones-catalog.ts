export interface CatalogEntry {
  nombre: string
  esTurno?: boolean
}

export interface Especialidad {
  label: string
  items: CatalogEntry[]
}

export const PRESTACIONES_CATALOG: Especialidad[] = [
  {
    label: 'Medicina General / Familiar',
    items: [
      { nombre: 'Consulta médica general' },
      { nombre: 'Control de paciente crónico' },
      { nombre: 'Certificado médico' },
      { nombre: 'Procedimiento menor ambulatorio' },
      { nombre: 'Turno medicina general', esTurno: true },
    ],
  },
  {
    label: 'Medicina Interna',
    items: [
      { nombre: 'Consulta medicina interna' },
      { nombre: 'Interconsulta intrahospitalaria' },
      { nombre: 'Turno medicina interna', esTurno: true },
    ],
  },
  {
    label: 'Cirugía General',
    items: [
      { nombre: 'Cirugía mayor' },
      { nombre: 'Cirugía laparoscópica' },
      { nombre: 'Cirugía ambulatoria' },
      { nombre: 'Curación quirúrgica' },
      { nombre: 'Retiro de puntos' },
      { nombre: 'Turno cirugía', esTurno: true },
      { nombre: 'Turno pabellón', esTurno: true },
    ],
  },
  {
    label: 'Cardiología',
    items: [
      { nombre: 'Consulta cardiológica' },
      { nombre: 'Ecocardiografía' },
      { nombre: 'Electrocardiograma' },
      { nombre: 'Holter de arritmia' },
      { nombre: 'Holter de presión (MAPA)' },
      { nombre: 'Prueba de esfuerzo' },
      { nombre: 'Turno cardiología', esTurno: true },
    ],
  },
  {
    label: 'Neurología',
    items: [
      { nombre: 'Consulta neurológica' },
      { nombre: 'Electroencefalograma (EEG)' },
      { nombre: 'Electromiografía (EMG)' },
      { nombre: 'Turno neurología', esTurno: true },
    ],
  },
  {
    label: 'Psiquiatría',
    items: [
      { nombre: 'Consulta psiquiátrica' },
      { nombre: 'Evaluación psiquiátrica inicial' },
      { nombre: 'Control psiquiátrico' },
      { nombre: 'Turno psiquiatría', esTurno: true },
    ],
  },
  {
    label: 'Psicología',
    items: [
      { nombre: 'Sesión psicoterapia individual' },
      { nombre: 'Evaluación psicológica' },
      { nombre: 'Sesión psicoterapia de pareja' },
      { nombre: 'Sesión psicoterapia familiar' },
      { nombre: 'Sesión psicoterapia grupal' },
      { nombre: 'Psicología infantil' },
    ],
  },
  {
    label: 'Kinesiología / Fisioterapia',
    items: [
      { nombre: 'Sesión de kinesiología' },
      { nombre: 'Rehabilitación musculoesquelética' },
      { nombre: 'Rehabilitación neurológica' },
      { nombre: 'Rehabilitación respiratoria' },
      { nombre: 'Drenaje linfático' },
      { nombre: 'Electroterapia' },
      { nombre: 'Kinesioterapia domiciliaria' },
      { nombre: 'Turno kinesiología', esTurno: true },
    ],
  },
  {
    label: 'Nutrición y Dietética',
    items: [
      { nombre: 'Consulta nutricional' },
      { nombre: 'Control nutricional' },
      { nombre: 'Evaluación nutricional pediátrica' },
      { nombre: 'Plan alimentario' },
      { nombre: 'Turno nutrición', esTurno: true },
    ],
  },
  {
    label: 'Fonoaudiología',
    items: [
      { nombre: 'Evaluación fonoaudiológica' },
      { nombre: 'Sesión fonoaudiología' },
      { nombre: 'Terapia de lenguaje' },
      { nombre: 'Terapia de voz' },
      { nombre: 'Terapia de deglución' },
    ],
  },
  {
    label: 'Terapia Ocupacional',
    items: [
      { nombre: 'Evaluación terapia ocupacional' },
      { nombre: 'Sesión terapia ocupacional' },
      { nombre: 'Integración sensorial' },
      { nombre: 'Terapia ocupacional domiciliaria' },
    ],
  },
  {
    label: 'Ginecología y Obstetricia',
    items: [
      { nombre: 'Consulta ginecológica' },
      { nombre: 'Ecografía obstétrica' },
      { nombre: 'Control prenatal' },
      { nombre: 'PAP / Citología' },
      { nombre: 'Colposcopía' },
      { nombre: 'Turno ginecología/obstetricia', esTurno: true },
      { nombre: 'Turno maternidad', esTurno: true },
    ],
  },
  {
    label: 'Pediatría',
    items: [
      { nombre: 'Consulta pediátrica' },
      { nombre: 'Control sano' },
      { nombre: 'Turno pediatría', esTurno: true },
      { nombre: 'Turno neonatología', esTurno: true },
    ],
  },
  {
    label: 'Traumatología y Ortopedia',
    items: [
      { nombre: 'Consulta traumatológica' },
      { nombre: 'Cirugía ortopédica' },
      { nombre: 'Artroscopía' },
      { nombre: 'Procedimiento articular' },
      { nombre: 'Turno traumatología', esTurno: true },
    ],
  },
  {
    label: 'Urología',
    items: [
      { nombre: 'Consulta urológica' },
      { nombre: 'Cistoscopía' },
      { nombre: 'Cirugía urológica' },
      { nombre: 'Turno urología', esTurno: true },
    ],
  },
  {
    label: 'Dermatología',
    items: [
      { nombre: 'Consulta dermatológica' },
      { nombre: 'Biopsia de piel' },
      { nombre: 'Cirugía dermatológica' },
      { nombre: 'Crioterapia' },
      { nombre: 'Turno dermatología', esTurno: true },
    ],
  },
  {
    label: 'Endocrinología',
    items: [
      { nombre: 'Consulta endocrinológica' },
      { nombre: 'Control diabetes' },
      { nombre: 'Turno endocrinología', esTurno: true },
    ],
  },
  {
    label: 'Gastroenterología',
    items: [
      { nombre: 'Consulta gastroenterológica' },
      { nombre: 'Endoscopía digestiva alta' },
      { nombre: 'Colonoscopía' },
      { nombre: 'Turno gastroenterología', esTurno: true },
    ],
  },
  {
    label: 'Neumología / Broncopulmonar',
    items: [
      { nombre: 'Consulta broncopulmonar' },
      { nombre: 'Espirometría' },
      { nombre: 'Broncoscopía' },
      { nombre: 'Turno neumología', esTurno: true },
    ],
  },
  {
    label: 'Oftalmología',
    items: [
      { nombre: 'Consulta oftalmológica' },
      { nombre: 'Fondo de ojo' },
      { nombre: 'Cirugía oftalmológica' },
      { nombre: 'Turno oftalmología', esTurno: true },
    ],
  },
  {
    label: 'Otorrinolaringología (ORL)',
    items: [
      { nombre: 'Consulta ORL' },
      { nombre: 'Audiometría' },
      { nombre: 'Cirugía ORL' },
      { nombre: 'Turno ORL', esTurno: true },
    ],
  },
  {
    label: 'Reumatología',
    items: [
      { nombre: 'Consulta reumatológica' },
      { nombre: 'Infiltración articular' },
      { nombre: 'Turno reumatología', esTurno: true },
    ],
  },
  {
    label: 'Odontología',
    items: [
      { nombre: 'Consulta odontológica' },
      { nombre: 'Tratamiento de conducto' },
      { nombre: 'Extracción dentaria' },
      { nombre: 'Cirugía maxilofacial' },
    ],
  },
  {
    label: 'Radiología / Imagenología',
    items: [
      { nombre: 'Informe radiológico' },
      { nombre: 'Ecografía diagnóstica' },
      { nombre: 'Procedimiento guiado por imagen' },
      { nombre: 'Turno radiología', esTurno: true },
    ],
  },
  {
    label: 'Anestesiología',
    items: [
      { nombre: 'Anestesia general' },
      { nombre: 'Anestesia regional' },
      { nombre: 'Turno anestesia', esTurno: true },
      { nombre: 'Turno pabellón anestesia', esTurno: true },
    ],
  },
  {
    label: 'Urgencias y Emergencias',
    items: [
      { nombre: 'Turno urgencias', esTurno: true },
      { nombre: 'Turno UCI', esTurno: true },
      { nombre: 'Turno UTI', esTurno: true },
      { nombre: 'Turno UPC', esTurno: true },
      { nombre: 'Atención de urgencia' },
    ],
  },
]

export function searchPrestaciones(query: string): { especialidad: string; items: CatalogEntry[] }[] {
  const q = query.toLowerCase().trim()
  if (!q) return PRESTACIONES_CATALOG.map(e => ({ especialidad: e.label, items: e.items }))

  return PRESTACIONES_CATALOG
    .map(e => ({
      especialidad: e.label,
      items: e.items.filter(i => i.nombre.toLowerCase().includes(q)),
    }))
    .filter(e => e.items.length > 0)
}
