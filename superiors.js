/* ====================================================================
   RANGOS Y SUPERIORES
   -------------------------------------------------------------------
   AÑADIR UN RANGO NUEVO:
   Añade un objeto al array RANKS con { id, name, icon, minSolved, desc }.
   Los rangos se ordenan solos por minSolved.

   AÑADIR UN SUPERIOR NUEVO:
   Añade un objeto a SUPERIORS con { id, name, role, icon, bio }.
   Luego asígnalo a un caso con superior:'id_del_superior' en cases.js.
   ==================================================================== */

const RANKS = [
  {
    id:'cadete',
    name:'Cadete',
    icon:'🎖️',
    minSolved:0,
    desc:'Recién asignado a la unidad.'
  },
  {
    id:'agente',
    name:'Agente',
    icon:'🥉',
    minSolved:3,
    desc:'Agente de campo con experiencia básica.'
  },
  {
    id:'senior',
    name:'Agente Senior',
    icon:'🥈',
    minSolved:8,
    desc:'Investigador de confianza.'
  },
  {
    id:'detective',
    name:'Detective',
    icon:'🥇',
    minSolved:14,
    desc:'Detective con casos importantes resueltos.'
  },
  {
    id:'inspector',
    name:'Inspector',
    icon:'⭐',
    minSolved:20,
    desc:'Mando operativo de la unidad.'
  },
  {
    id:'comandante',
    name:'Comandante',
    icon:'👑',
    minSolved:24,
    desc:'Jefatura. Respuesta directa al Director.'
  }
];

const SUPERIORS = {
  lisboa: {
    id:'lisboa',
    name:'Capitana Teresa Lisboa',
    role:'Jefa de Unidad',
    icon:'👮‍♀️',
    bio:'Veterana de la unidad. Rigurosa, metódica, no soporta tonterías. Confía en ti... hasta cierto punto.'
  },
  ferreira: {
    id:'ferreira',
    name:'Director Álvaro Ferreira',
    role:'Director General',
    icon:'🎩',
    bio:'Alto mando. Serio, calculador. Solo aparece cuando el caso es realmente delicado.'
  },
  salas: {
    id:'salas',
    name:'Comisario Jefe Ramón Salas',
    role:'Jefe Superior',
    icon:'👨‍✈️',
    bio:'Antiguo investigador de campo. Ahora dirige desde el despacho pero conoce cada caso al detalle.'
  },
  cruz: {
    id:'cruz',
    name:'Subdirectora Marina Cruz',
    role:'Subdirectora Operativa',
    icon:'👩‍💼',
    bio:'Eficiente, directa, sin paciencia para excusas. Coordina todas las unidades especiales.'
  }
};