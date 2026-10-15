/* ====================================================================
   CASOS
   -------------------------------------------------------------------
   De momento hay 5 casos (uno por cada tipo de escena) para poder
   perfeccionar cada habitación con detalle antes de añadir más.

   sceneType:
     - 'despacho'   → escritorio con cajones, archivador, estanterías
     - 'dormitorio' → cama, armarios, mesillas
     - 'biblioteca' → estanterías de suelo a techo, mesa central
     - 'exterior'   → jardín nocturno con banco, farolas, árboles
     - 'teatro'     → escenario con cortinas, cajas, focos

   corpsePose (opcional): 'supine' | 'side' | 'prone' | 'curled' | 'seated'
   ==================================================================== */

const CASES = [
{
  id:'teatro', num:'CASO #001', title:'Muerte en el Teatro Cervantes',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'teatro',
  location:'Camerino 3, Teatro Cervantes', time:'23:40 h',
  victim:'Nicolás Ferrer «El Gran Nicolás»', cause:'Envenenamiento',
  intro:'El Gran Nicolás yace desplomado en el suelo del escenario. Una taza de té a medio beber, un azucarero forzado y una carta arrugada. El asesino estuvo aquí hace minutos.',
  objects:[
    {id:'taza',name:'Taza de té',icon:'☕',desc:'A medio beber. En el fondo, un residuo oscuro con olor penetrante.',clue:'El té contiene cianuro.'},
    {id:'azucarero',name:'Azucarero',icon:'🍬',desc:'Cerrado con fuerza inusual. Un hilo azul atrapado en la rosca.',clue:'Hilo azul: coincide con el pañuelo.'},
    {id:'panuelo',name:'Pañuelo D.M.',icon:'🧣',desc:'Tela blanca con iniciales bordadas. Huele a jazmín.',clue:'El pañuelo huele a jazmín (perfume de Leticia).'},
    {id:'carta',name:'Carta amenazante',icon:'✉️',desc:'Sobre arrugado con matasellos de hoy. "Te vas a arrepentir."',clue:'Recibió una amenaza esa mañana.'},
    {id:'llave',name:'Llave del camerino',icon:'🔑',desc:'Bajo el sillón. No pertenece a Nicolás.',clue:'Llave de una persona ajena.'}
  ],
  suspects:[
    {id:'aurora',name:'Aurora Ferrer',role:'Esposa',icon:'🌹',questions:[
      {q:'¿Dónde estaba?',a:'En el camerino contiguo.'},
      {q:'¿Quién abría el azucarero a Nicolás?',a:'Yo siempre. Tenía artritis.',clue:'Solo los más cercanos saben lo del azucarero.'},
      {q:'¿Reconoces este pañuelo?',a:'Huele a jazmín, como el perfume de Leticia.',clue:'El pañuelo huele a jazmín.'}
    ]},
    {id:'damian',name:'Damián Mendoza',role:'Mago rival',icon:'🎩',questions:[
      {q:'¿Dónde estabas a las 23:30?',a:'En el bar. Perdí mi pañuelo allí, sobre las 22:30.'},
      {q:'¿Cuándo perdiste el pañuelo?',a:'Sobre las 22:30. Alguien lo cogió del bar.',clue:'Alguien robó el pañuelo a las 22:30.'},
      {q:'¿Conoces a Leticia?',a:'Sí. La manager. Anda muy nerviosa por dinero.',clue:'Leticia anda mal de dinero.'}
    ]},
    {id:'leticia',name:'Leticia Gómez',role:'Manager del teatro',icon:'💼',questions:[
      {q:'¿Dónde estabas a las 23:40?',a:'Contando la recaudación. Hay un ticket que no aparece...',clue:'Leticia sabía del ticket faltante.'},
      {q:'¿Usas perfume de jazmín?',a:'Sí, siempre. ¿Por qué lo preguntas?',clue:'Leticia usa jazmín.'},
      {q:'¿Discutiste con Nicolás?',a:'Por un asunto de entradas. Nada importante.'}
    ]},
    {id:'oscar',name:'Óscar Ruiz',role:'Tramoyista',icon:'🔧',questions:[
      {q:'¿Viste algo raro?',a:'A Leticia saliendo del camerino sobre las 23:35 con una taza.',clue:'Óscar la vio salir con una taza.'},
      {q:'¿Notaste algún olor?',a:'Sí, a almendras. Pensé que era ambientador.'}
    ]}
  ],
  killer:'leticia',
  solution:'Leticia envenenó a Nicolás con cianuro en el té. Robó el pañuelo de Damián en el bar para incriminarle. Un hilo azul quedó atrapado en el azucarero. Como no sabía que Nicolás no podía abrir frascos por su artritis, cerró la tapa con demasiada fuerza y se delató.',
  keyEvidence:['Hilo azul en el azucarero','Pañuelo con perfume de jazmín','Ticket faltante','Óscar la vio salir del camerino']
},
{
  id:'hotel', num:'CASO #002', title:'El último brindis en el Hotel Mirador',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'dormitorio',
  location:'Suite 502, Hotel Mirador', time:'23:15 h',
  victim:'Elena Vargas', cause:'Envenenamiento',
  intro:'La dueña del hotel yace en la habitación. Copa de champán a medio beber, labios azulados. La puerta estaba cerrada con pestillo por dentro. La caja fuerte está abierta.',
  objects:[
    {id:'copa',name:'Copa de champán',icon:'🥂',desc:'A medio beber. Polvo blanco en el fondo.',clue:'Contiene benzodiazepina.'},
    {id:'botella',name:'Botella de champán',icon:'🍾',desc:'Casi llena, sin huellas en el cristal.',clue:'Alguien limpió la botella.'},
    {id:'nota',name:'Nota mecanografiada',icon:'📝',desc:'"Nos vemos a las 23:00. No falles." Impresa a las 22:45.',clue:'Salió de la impresora de recepción.'},
    {id:'panuelo',name:'Pañuelo A.M.',icon:'🧣',desc:'Sobre la cama. Huele a colonia cítrica.',clue:'El pañuelo huele a la colonia de Andrés.'},
    {id:'frasco',name:'Frasco de somníferos',icon:'🧪',desc:'Vacío, con etiqueta arrancada.',clue:'Los somníferos de Elena están agotados.'},
    {id:'llave',name:'Llave maestra',icon:'🔑',desc:'Bajo el sillón. Es de un empleado.',clue:'Alguien con acceso interno pudo entrar.'}
  ],
  suspects:[
    {id:'marcos',name:'Marcos Vargas',role:'Sobrino de Elena',icon:'🎰',questions:[
      {q:'¿Dónde estabas a las 23:00?',a:'En el casino del hotel. Salí un momento a fumar.'},
      {q:'¿Qué relación con Elena?',a:'De negocios. Heredo, sí. Pero no lo necesito.',clue:'El sobrino hereda todo.'},
      {q:'¿Por qué tienes una mancha de vino?',a:'Un camarero tropezó conmigo en el casino.'}
    ]},
    {id:'andres',name:'Andrés Miralles',role:'Sumiller',icon:'🍷',questions:[
      {q:'¿Dónde estabas entre 22:30 y 23:30?',a:'En el bar. Subí a descorchar el champán a las 22:30 y me fui.'},
      {q:'¿Tienes deudas?',a:'Unas cuantas. Elena iba a prestarme dinero.',clue:'Andrés dependía del préstamo de Elena.'},
      {q:'¿Es tuyo este pañuelo?',a:'Sí... lo perdí esta tarde en el office.'},
      {q:'¿Alguien pudo entrar a la bodega?',a:'La cámara exterior está fundida. Y el montacargas no cierra bien.',clue:'La bodega tiene acceso alternativo.'}
    ]},
    {id:'clara',name:'Clara Montes',role:'Camarera',icon:'🧹',questions:[
      {q:'¿Por qué entraste?',a:'Elena pidió hielo. La puerta tenía pestillo, la abrí con la maestra.'},
      {q:'¿De quién es este pendiente?',a:'Mío. Se me cayó uno esta noche en el pasillo.'},
      {q:'¿Viste a alguien?',a:'A Andrés bajando por la escalera de servicio.'}
    ]},
    {id:'ivan',name:'Dr. Iván Serrano',role:'Médico del hotel',icon:'🩺',questions:[
      {q:'¿Por qué le recetaste somníferos?',a:'Insomnio. Dosis baja. No pudo tomárselos todos sola.'},
      {q:'¿Alguien más tuvo acceso?',a:'La consulta no la cierro siempre.'}
    ]}
  ],
  killer:'andres',
  solution:'Andrés envenenó a Elena. Tenía deudas de juego, Elena lo sabía y amenazaba con despedirlo. Subió a las 22:30, añadió benzodiazepina a la copa con un guante de látex, manipuló la botella para no dejar huellas y dejó caer su pañuelo A.M. en la habitación.',
  keyEvidence:['Pañuelo A.M. con colonia cítrica','Deudas de juego de Andrés','Acceso al montacargas','Somnífero en la copa']
},
{
  id:'joyeria', num:'CASO #003', title:'El robo de la Joyería Dior',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'despacho',
  location:'Joyería Dior, Calle Mayor', time:'19:30 h',
  victim:'Sr. Dior', cause:'Golpe en la nuca',
  intro:'La joyería acababa de cerrar. El Sr. Dior yace detrás del mostrador. La caja fuerte está abierta sin forzar. Falta el collar estrella.',
  objects:[
    {id:'caja',name:'Caja fuerte',icon:'🔒',desc:'Abierta con la combinación correcta. No hay marcas de fuerza.',clue:'El ladrón conocía la combinación.'},
    {id:'collar',name:'Vitrina vacía',icon:'💎',desc:'Donde estaba el collar de zafiros. Solo se llevaron esa pieza.',clue:'Solo robaron el collar estrella.'},
    {id:'cuchillo',name:'Cuchillo de cristalero',icon:'🔪',desc:'Herramienta profesional. Restos de vidrio.',clue:'Cortó el cristal de la vitrina.'},
    {id:'guantes',name:'Guantes de látex',icon:'🧤',desc:'Dentro de la papelera. Con restos de sangre.',clue:'El asesino se limpió las manos.'},
    {id:'llave',name:'Llave de la puerta trasera',icon:'🔑',desc:'Bajo el mostrador. Forzada con alicate.',clue:'Entraron por la puerta trasera.'}
  ],
  suspects:[
    {id:'carlos',name:'Carlos Vega',role:'Empleado',icon:'💼',questions:[
      {q:'¿Dónde estabas?',a:'Cerrando la tienda. Salí a las 19:00.'},
      {q:'¿Tienes llave?',a:'Todos los empleados tenemos copia.'},
      {q:'¿Conocías la combinación?',a:'Solo el jefe y yo la sabemos.',clue:'Carlos conocía la combinación.'}
    ]},
    {id:'marta',name:'Marta Ruiz',role:'Clienta habitual',icon:'👩',questions:[
      {q:'¿Estabas en la tienda?',a:'Hasta las 19:00.'},
      {q:'¿Viste algo raro?',a:'Carlos salió corriendo a las 19:10.',clue:'Carlos salió corriendo.'}
    ]},
    {id:'andres',name:'Andrés Dior',role:'Hermano de la víctima',icon:'👨',questions:[
      {q:'¿Dónde estabas?',a:'En casa. Heredo la joyería.'},
      {q:'¿Qué relación tenías?',a:'Mala. Discutíamos por la herencia.'}
    ]},
    {id:'guardia',name:'Vigilante nocturno',role:'Vigilante',icon:'👮',questions:[
      {q:'¿Viste algo?',a:'Un coche sospechoso al lado, motor encendido.'}
    ]}
  ],
  killer:'carlos',
  solution:'Carlos Vega mató al Sr. Dior. Salió a las 19:00, volvió por la puerta trasera con la llave que había manipulado, desconectó la cámara, abrió la caja con la combinación que conocía y cogió el collar estrella. Dior lo sorprendió al volver.',
  keyEvidence:['Caja abierta con la combinación','Cámara desconectada','Carlos salió corriendo','Solo faltó el collar estrella']
},
{
  id:'jardin', num:'CASO #004', title:'Muerte entre las rosas',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'exterior',
  location:'Jardín Botánico Municipal', time:'18:00 h',
  victim:'Dr. Ramírez, botánico', cause:'Envenenamiento por planta',
  intro:'El Dr. Ramírez yace junto a los tejos del jardín. Tenía fama de conocer cada planta del mundo. Alguien usó su propio conocimiento contra él.',
  objects:[
    {id:'taza',name:'Termo de té',icon:'☕',desc:'Amargo inusual. Restos vegetales.',clue:'El té contiene tejo (veneno).'},
    {id:'cuaderno',name:'Cuaderno del botánico',icon:'📓',desc:'Página arrancada justo donde hablaba del tejo.',clue:'Alguien arrancó la página del tejo.'},
    {id:'cuchillo',name:'Tijeras de podar',icon:'✂️',desc:'Con restos de savia verde y resina.',clue:'Usadas para cortar ramas de tejo.'},
    {id:'guantes',name:'Guantes de jardín',icon:'🧤',desc:'Manchados de savia. Son de Sara.',clue:'Los guantes pertenecen a Sara.'},
    {id:'frasco',name:'Frasco de reactivo',icon:'🧪',desc:'Vacio. Con etiqueta de laboratorio.',clue:'Alguien usó un reactivo de laboratorio.'}
  ],
  suspects:[
    {id:'sara',name:'Sara López',role:'Ayudante del botánico',icon:'🌷',questions:[
      {q:'¿Dónde estabas?',a:'Regando el invernadero.'},
      {q:'¿Qué relación tenías?',a:'Me iba a despedir. Decía que era lenta.',clue:'Sara iba a ser despedida.'},
      {q:'¿Son tuyos estos guantes?',a:'Sí... pero los dejé en el cobertizo esta mañana.'}
    ]},
    {id:'marcos',name:'Marcos Ibáñez',role:'Rival académico',icon:'🎓',questions:[
      {q:'¿Dónde estabas?',a:'En una conferencia en la universidad.'},
      {q:'¿Qué relación tenías?',a:'Competíamos por una cátedra. Nada personal.'}
    ]},
    {id:'clara',name:'Clara Vega',role:'Estudiante',icon:'🎒',questions:[
      {q:'¿Dónde estabas?',a:'En la biblioteca.'},
      {q:'¿Sabías de plantas?',a:'Lo básico. El Dr. me enseñaba.'}
    ]},
    {id:'vicente',name:'Vicente Soto',role:'Jardinero jefe',icon:'🌳',questions:[
      {q:'¿Dónde estabas?',a:'Podando los setos.'},
      {q:'¿Viste algo raro?',a:'A Sara discutiendo con el Dr. esta mañana.',clue:'Sara discutió con el Dr. esa mañana.'}
    ]}
  ],
  killer:'sara',
  solution:'Sara López envenenó al Dr. Ramírez. Iba a ser despedida. Cortó ramas de tejo con las tijeras de podar, las infusionó en su termo de té y le añadió el reactivo del laboratorio para intensificar el efecto. Dejó los guantes manchados por descuido.',
  keyEvidence:['Tejo en el té','Guantes de Sara con savia','Iba a ser despedida','Vicente la vio discutir con el Dr.']
},
{
  id:'blackwood', num:'CASO #005', title:'El ocaso de Lord Blackwood',
  difficulty:'MEDIA', superior:'lisboa', sceneType:'biblioteca',
  location:'Mansión Blackwood, Yorkshire', time:'22:15 h',
  victim:'Lord Arthur Blackwood', cause:'Envenenamiento por arsénico',
  intro:'La mansión gime con el viento. Lord Blackwood yace desplomado sobre su escritorio. Sobre la alfombra persa, una nota arrugada con una sola palabra: "Págame".',
  objects:[
    {id:'vaso',name:'Vaso de whisky',icon:'🥃',desc:'Residuo blancuzco en el fondo. Sabor metálico.',clue:'El whisky contiene arsénico.'},
    {id:'carta',name:'Nota anónima',icon:'✉️',desc:'"Págame o hablaré." Letra temblorosa.',clue:'Alguien le exigía dinero.'},
    {id:'libro',name:'Testamento',icon:'📖',desc:'Firmado ayer. Cambia toda la herencia al sobrino.',clue:'El testamento se cambió ayer.'},
    {id:'panuelo',name:'Guante de mujer',icon:'🧣',desc:'Blanco, bajo el sillón. Perfume de rosas.',clue:'Huele a rosas (perfume de Victoria).'},
    {id:'reloj',name:'Reloj de pared',icon:'🕰️',desc:'Parado a las 22:15. El péndulo está doblado.',clue:'Forcejeo a las 22:15.'},
    {id:'llave',name:'Llave del cajón',icon:'🔑',desc:'Bajo la mesa. No es de la casa.',clue:'Llave de fuera, quizá de una caja.'}
  ],
  suspects:[
    {id:'higgins',name:'Sr. Higgins',role:'Mayordomo',icon:'🎩',questions:[
      {q:'¿Quién le sirvió el whisky?',a:'Yo mismo, a las 21:45.'},
      {q:'¿Sabía de las deudas?',a:'El señor no era el único con problemas de dinero.',clue:'Otros también tenían problemas.'}
    ]},
    {id:'victoria',name:'Victoria Blackwood',role:'Hija',icon:'🌹',questions:[
      {q:'¿Sabías del cambio de testamento?',a:'Lo intuía. Íbamos a hablar mañana.',clue:'Victoria sabía del cambio.'},
      {q:'¿Usas perfume de rosas?',a:'Sí, siempre. Es de Grasse.',clue:'Victoria usa rosas.'}
    ]},
    {id:'croft',name:'Edwin Croft',role:'Socio de negocios',icon:'💼',questions:[
      {q:'¿Le debías dinero?',a:'Al contrario. El lord me debía una suma importante.',clue:'Croft dice que el lord le debía dinero.'},
      {q:'¿Fuiste testigo del testamento?',a:'Sí. El lord quería proteger a su hija.'}
    ]},
    {id:'rosa',name:'Rosa Delgado',role:'Doncella',icon:'🧹',questions:[
      {q:'¿Viste a alguien?',a:'A la señorita Victoria bajando por la escalera de servicio a las 22:00.',clue:'Victoria bajó al despacho.'},
      {q:'¿Faltaba algo?',a:'Un guante de la señorita. Lo vi por la tarde.'}
    ]}
  ],
  killer:'victoria',
  solution:'Victoria Blackwood envenenó a su padre. Al saber que quedaba desheredada, bajó por la escalera de servicio, vertió arsénico en su whisky y forcejeó con él. Perdió un guante con su perfume que se quedó bajo el sillón. Cambió la nota para desviar sospechas hacia los acreedores.',
  keyEvidence:['Guante con perfume de rosas','Victoria sabía del testamento','Rosa la vio bajar','Arsénico en el whisky']
}
];