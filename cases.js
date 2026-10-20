/* ====================================================================
   CASOS
   -------------------------------------------------------------------
   sceneType:
     - 'despacho'   → chimenea, sillón de cuero, escritorio, estanterías
     - 'dormitorio' → cama con dosel, tocador con espejos, ventana con cortina
     - 'biblioteca' → estanterías enormes, columnas, casetones, candil
     - 'exterior'   → jardín nocturno con estanque, farolas, árboles
     - 'teatro'     → escenario con cortinas, camerino con espejos, focos

   corpsePose (opcional): 'supine' | 'side' | 'prone' | 'curled' | 'seated'

   sceneConfig (opcional): permite ajustar la habitación generada.
   ==================================================================== */

const CASES = [
{
  id:'teatro', num:'CASO #001', title:'Muerte en el Teatro Cervantes',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'teatro',
  location:'Camerino 3, Teatro Cervantes', time:'23:40 h',
  victim:'Nicolás Ferrer «El Gran Nicolás»', cause:'Envenenamiento',
  corpseSpot:0, victimLook:{v:1,body:'masc',build:1,height:2,skin:0xd8a888,hair:'slick',hairColor:0x1a1a1e,facial:'mustache',top:'suit',topColor:0x14141a,topColor2:0xb02020,neck:'bowtie',neckColor:0xb02020,bottom:'trousers',bottomColor:0x14141a,shoes:'oxford',hat:'tophat',hatColor:0x14141a,extra:'watch'},
  intro:'El Gran Nicolás yace desplomado en el suelo del escenario. Una taza de té a medio beber, un azucarero forzado y una carta arrugada. El asesino estuvo aquí hace minutos.',
  sceneConfig:{ size:16, height:6 },
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
  difficulty:'FÁCIL', superior:'moreno', sceneType:'dormitorio',
  location:'Suite 502, Hotel Mirador', time:'23:15 h',
  victim:'Elena Vargas', cause:'Envenenamiento',
  corpseSpot:1, victimLook:{v:1,body:'fem',build:0,height:2,skin:0xecc4a0,hair:'long',hairColor:0x2a1a10,top:'dress',topColor:0xe8dcf0,topColor2:0xb890d0,bottom:'skirt',shoes:'flats',shoeColor:0xe8dcf0,neck:'necklace',extra:'earrings'},
  intro:'La dueña del hotel yace en la habitación. Copa de champán a medio beber, labios azulados. La puerta estaba cerrada con pestillo por dentro. La caja fuerte está abierta.',
  sceneConfig:{ size:11, height:3.0, wainscot:true, wainscotH:0.9 },
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
  difficulty:'FÁCIL', superior:'cruz', sceneType:'despacho',
  location:'Joyería Dior, Calle Mayor', time:'19:30 h',
  victim:'Sr. Dior', cause:'Golpe en la nuca',
  corpseSpot:1, victimLook:{v:1,body:'masc',build:1,height:3,skin:0xecc4a0,hair:'side',hairColor:0xb0b0b0,facial:'none',top:'suit',topColor:0x4a4a52,topColor2:0xe8e8e8,neck:'bowtie',neckColor:0x2a3a5a,bottom:'trousers',bottomColor:0x3a3a40,shoes:'oxford',glasses:'round',extra:'watch'},
  intro:'La joyería acababa de cerrar. El Sr. Dior yace detrás del mostrador. La caja fuerte está abierta sin forzar. Falta el collar estrella.',
  sceneConfig:{ size:12, height:3.2 },
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
  difficulty:'FÁCIL', superior:'salas', sceneType:'exterior',
  location:'Jardín Botánico Municipal', time:'18:00 h',
  victim:'Dr. Ramírez, botánico', cause:'Envenenamiento por planta',
  corpseSpot:1, victimLook:{v:1,body:'masc',build:1,height:2,skin:0xd8a888,hair:'short',hairColor:0xd0d0d0,facial:'goatee',top:'vest',topColor:0x3a5a2a,topColor2:0xe8e0c8,bottom:'trousers',bottomColor:0x5a4a2a,shoes:'boots',shoeColor:0x4a2a14,hat:'fedora',hatColor:0xb8a070,glasses:'round'},
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
  difficulty:'MEDIA', superior:'guerra', sceneType:'biblioteca',
  location:'Mansión Blackwood, Yorkshire', time:'22:15 h',
  victim:'Lord Arthur Blackwood', cause:'Envenenamiento por arsénico',
  corpseSpot:1, victimLook:{v:1,body:'masc',build:2,height:3,skin:0xecc4a0,hair:'slick',hairColor:0xd0d0d0,facial:'mustache',top:'suit',topColor:0x3a1414,topColor2:0xe8e8e8,neck:'tie',neckColor:0x14141a,bottom:'trousers',bottomColor:0x2a1a1a,shoes:'oxford',hat:'bowler',hatColor:0x14141a,glasses:'monocle',extra:'watch'},
  intro:'La mansión gime con el viento. Lord Blackwood yace desplomado sobre su escritorio. Sobre la alfombra persa, una nota arrugada con una sola palabra: "Págame".',
  sceneConfig:{ size:14, height:4.0 },
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
},
{
  id:'circo', num:'CASO #006', title:'Función final en el Circo Aurora',
  difficulty:'MEDIA', superior:'moreno', sceneType:'teatro',
  location:'Carpa principal, Circo Aurora', time:'21:50 h',
  victim:'Trapecio de Oro «René»', cause:'Caída provocada',
  corpseSpot:4, victimLook:{v:1,body:'masc',build:0,height:2,skin:0xc89878,hair:'short',hairColor:0x2a1a10,facial:'none',top:'tshirt',topColor:0xc02030,topColor2:0xe0a040,bottom:'trousers',bottomColor:0xe8e8e8,shoes:'sneakers',shoeColor:0xe0a040},
  intro:'El trapecista estrella cayó desde diez metros en plena función. El público aplaudía aún cuando el cuerpo tocó la red... que había sido cortada. Faltaba un cable.',
  sceneConfig:{ size:16, height:6 },
  objects:[
    {id:'cuerda',name:'Cuerda cortada',icon:'🪢',desc:'Corte limpio, no desgaste natural.',clue:'La red fue cortada con un objeto afilado.'},
    {id:'cuchillo',name:'Cuchilla de tramoyista',icon:'🔪',desc:'Oculta entre las cajas. Restos de fibra azul.',clue:'La cuchilla cortó la red.'},
    {id:'llave',name:'Llave del vestuario',icon:'🔑',desc:'En el bolsillo de un chaleco. No es de René.',clue:'Alguien entró al vestuario.'},
    {id:'nota',name:'Carta arrugada',icon:'📝',desc:'"Esta noche será tu última función."',clue:'Amenaza directa esa misma tarde.'},
    {id:'frasco',name:'Frasco de éter',icon:'🧪',desc:'Casi vacío. Etiqueta del botiquín.',clue:'René fue drogado antes de subir.'},
    {id:'flores',name:'Ramo de rosas',icon:'🌹',desc:'Con tarjeta. "De tu admiradora secreta."',clue:'La tarjeta tiene la letra de Marisol.'}
  ],
  suspects:[
    {id:'marisol',name:'Marisol Vega',role:'Trapecista compañera',icon:'💃',questions:[
      {q:'¿Dónde estabas al caer?',a:'En la plataforma opuesta. Vi cómo caía.'},
      {q:'¿Qué relación tenías con René?',a:'Competíamos por el número principal.',clue:'Marisol quería el papel de René.'},
      {q:'¿Son tuyas estas rosas?',a:'Sí... se las regalé antes de la función.'}
    ]},
    {id:'otero',name:'Don Otero',role:'Dueño del circo',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'Contando la taquilla.'},
      {q:'¿Tenía deudas René?',a:'Con medio mundo. Hasta conmigo.',clue:'René debía dinero a varios.'}
    ]},
    {id:'lucas',name:'Lucas Vidal',role:'Tramoyista',icon:'🔧',questions:[
      {q:'¿Revisaste la red?',a:'La revisé a las 20:00. Estaba perfecta.'},
      {q:'¿Faltaba alguna herramienta?',a:'Sí, una cuchilla. La dejé en el cajón.',clue:'Faltaba la cuchilla de Lucas.'}
    ]},
    {id:'priscila',name:'Priscila Ferrer',role:'Contorsionista',icon:'💫',questions:[
      {q:'¿Viste algo raro?',a:'A Marisol entrando al almacén antes de la función.',clue:'Marisol estuvo en el almacén.'}
    ]}
  ],
  killer:'marisol',
  solution:'Marisol Vega cortó la red de seguridad para eliminar a René y ocupar su número central. Le dio éter en el camerino para que subiera aturdido, subió a la plataforma opuesta a la vista de todos y dejó las rosas con su letra para fingir admiración. La cuchilla con fibra azul coincidía con la red cortada.',
  keyEvidence:['Cuchilla con fibra azul','Frasco de éter','Carta amenazante','Priscila la vio en el almacén']
},
{
  id:'faro', num:'CASO #007', title:'El silencio del Faro de Punta Negra',
  difficulty:'DIFÍCIL', superior:'ferreira', sceneType:'exterior',
  location:'Faro de Punta Negra, Costa Brava', time:'04:30 h',
  victim:'Faroero Tomás Roca', cause:'Apaleamiento',
  corpseSpot:4, victimLook:{v:1,body:'masc',build:2,height:2,skin:0xb88868,hair:'short',hairColor:0x6a4426,facial:'beard',top:'sweater',topColor:0x2a3a5a,topColor2:0xe8e8e8,bottom:'trousers',bottomColor:0x3a3a40,shoes:'boots',shoeColor:0x2a1a10,hat:'cap',hatColor:0x2a3a5a},
  intro:'Solo. Noche de temporal. El faro lleva 6 horas apagado y un carguero rozó las rocas. El farero aparece al pie del acantilado. Un cabo roto, una bitácora con la última entrada arrancada.',
  objects:[
    {id:'cuerda',name:'Cabo seccionado',icon:'🪢',desc:'Corte limpio, no por roca.',clue:'El cabo fue cortado a propósito.'},
    {id:'cuaderno',name:'Bitácora del faro',icon:'📓',desc:'Última entrada arrancada. Quedan restos de grafito.',clue:'Alguien arrancó la última página.'},
    {id:'baston',name:'Bastón de paseo',icon:'🦯',desc:'Con restos de sangre en la contera.',clue:'El bastón fue el arma homicida.'},
    {id:'mancha',name:'Mancha de sangre',icon:'🩸',desc:'Salpicadura en las rocas. No coincide con la caída.',clue:'Hubo forcejeo arriba, no caída directa.'},
    {id:'cerillas',name:'Caja de cerillas húmeda',icon:'🔥',desc:'Aún con restos de tabaco negro.',clue:'La caja no era de Tomás, él no fumaba.'},
    {id:'reloj',name:'Reloj de bolsillo',icon:'⌚',desc:'Roto a las 04:02. La cadena, arrancada.',clue:'Hora exacta del forcejeo.'}
  ],
  suspects:[
    {id:'nerea',name:'Nerea Roca',role:'Sobrina del farero',icon:'👩‍🦰',questions:[
      {q:'¿Dónde estabas?',a:'En casa, con el temporal no se podía salir.'},
      {q:'¿Qué pasará con el faro?',a:'Lo heredo yo. Ya hay un comprador.',clue:'Nerea hereda el faro y ya tiene comprador.'},
      {q:'¿Fuma?',a:'Sí, tabaco negro. Pero no salí de casa.'}
    ]},
    {id:'guillermo',name:'Guillermo Sanz',role:'Contrabandista',icon:'🚬',questions:[
      {q:'¿Qué hacías por aquí?',a:'Nada. Estaba en el puerto.'},
      {q:'¿Conocías a Tomás?',a:'Nos veíamos a veces. Compraba tabaco.',clue:'Tomás y Guillermo tenían trato.'}
    ]},
    {id:'alcalde',name:'Alcalde Prats',role:'Alcalde del pueblo',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En el ayuntamiento. Hay acta.'},
      {q:'¿Por qué quería cerrar el faro?',a:'Cuestión de presupuesto.',clue:'El alcalde presionaba para cerrar el faro.'}
    ]},
    {id:'mendez',name:'Capitán Méndez',role:'Capitán del carguero',icon:'⚓',questions:[
      {q:'¿Por qué no avisó?',a:'El faro estaba apagado. No vi la costa.',clue:'El faro apagado causó el incidente.'}
    ]}
  ],
  killer:'nerea',
  solution:'Nerea Roca subió al faro, discutió con su tío por la herencia, le arrancó el reloj en el forcejeo, le dio un golpe con su propio bastón de paseo, cortó el cabo de la barandilla y arrojó el cuerpo al vacío para simular un accidente. Arrancó la última página de la bitácora donde Tomás había anotado que su sobrina subía esa noche. Dejó caer su caja de cerillas sin darse cuenta.',
  keyEvidence:['Bastón con sangre en la contera','Caja de cerillas de Nerea','Bitácora arrancada','Reloj roto a las 04:02']
},
{
  id:'museo', num:'CASO #008', title:'La noche del Museo Egipcio',
  difficulty:'DIFÍCIL', superior:'guerra', sceneType:'biblioteca',
  location:'Museo Egipcio, Sala de los Sarcófagos', time:'02:15 h',
  victim:'Dr. Ahmed Faruk', cause:'Asfixia',
  corpseSpot:3, victimLook:{v:1,body:'masc',build:1,height:2,skin:0xa87858,hair:'short',hairColor:0x0e0a08,facial:'stubble',top:'labcoat',topColor:0xf0f0ec,topColor2:0x2a3a5a,neck:'tie',neckColor:0x2a3a5a,bottom:'trousers',bottomColor:0x2a2a30,shoes:'oxford',glasses:'square'},
  intro:'El egiptólogo aparece dentro de un sarcófago abierto. La cámara de seguridad fundida. La sala sellada por dentro. Un escarabeo desaparecido de la vitrina principal.',
  sceneConfig:{ size:14, height:3.6 },
  objects:[
    {id:'collar',name:'Vitrina del escarabeo',icon:'💎',desc:'Rota desde dentro. El escarabeo ha desaparecido.',clue:'El escarabeo fue el único objeto robado.'},
    {id:'panuelo',name:'Guante quirúrgico',icon:'🧤',desc:'En el sarcófago. Marca de una clínica.',clue:'Guante de la Clínica del Nilo.'},
    {id:'frasco',name:'Frasco de cloroformo',icon:'🧪',desc:'Vacío, con etiqueta de laboratorio universitario.',clue:'Usaron cloroformo para dormirlo.'},
    {id:'carta',name:'Carta del museo',icon:'✉️',desc:'"El escarabeo no saldrá del país." Firmada con iniciales A.F.',clue:'Faruk se oponía a la venta.'},
    {id:'libro',name:'Catálogo de subastas',icon:'📖',desc:'Con una página marcada: escarabeo de Amón. Valor: 2M€.',clue:'El escarabeo valía dos millones.'},
    {id:'huella',name:'Huella en el sarcófago',icon:'👣',desc:'Parcial, talla 43. No es del Dr.',clue:'Huella de un hombre calzado, talla 43.'}
  ],
  suspects:[
    {id:'sami',name:'Sami Faruk',role:'Hermano de la víctima',icon:'🧔',questions:[
      {q:'¿Dónde estabas?',a:'Cenando con el cónsul.'},
      {q:'¿Sabías del escarabeo?',a:'Solo que Ahmed quería devolverlo a Egipto.',clue:'Sami estaba en contra de devolverlo.'},
      {q:'¿Calzas el 43?',a:'Sí, ¿por qué?'}
    ]},
    {id:'helena',name:'Dra. Helena Bosch',role:'Restauradora',icon:'👩‍🔬',questions:[
      {q:'¿Dónde estabas?',a:'En el laboratorio, restaurando otra pieza.'},
      {q:'¿Tienes cloroformo en el laboratorio?',a:'Sí, para limpiar resinas.',clue:'Helena tenía acceso al cloroformo.'},
      {q:'¿Y guantes quirúrgicos?',a:'Los usamos siempre.'}
    ]},
    {id:'naser',name:'Naser El-Amin',role:'Coleccionista privado',icon:'💰',questions:[
      {q:'¿Qué hacías aquí?',a:'Doné una pieza al museo.'},
      {q:'¿Querías el escarabeo?',a:'Hice una oferta. Fue rechazada.',clue:'Naser ofreció dinero por el escarabeo.'}
    ]},
    {id:'vigilante',name:'Andrés Pulido',role:'Vigilante de noche',icon:'👮',questions:[
      {q:'¿Cómo está la cámara fundida?',a:'No lo sé, cuando llegué ya estaba así.'},
      {q:'¿Viste a alguien?',a:'A la Dra. Bosch cruzando el pasillo a la 01:40.',clue:'Helena salió del laboratorio antes de la hora.'}
    ]}
  ],
  killer:'helena',
  solution:'La Dra. Helena Bosch asfixió al Dr. Faruk. Sabía que él bloquearía la venta del escarabeo al coleccionista Naser, con quien tenía un acuerdo económico. Le dio cloroformo, lo metió en el sarcófago, fundió la cámara y robó el escarabeo. El guante quirúrgico con la marca de la Clínica del Nilo la delató.',
  keyEvidence:['Guante de la Clínica del Nilo','Cloroformo del laboratorio','Carta de Faruk contra la venta','Vigilante la vio salir a la 01:40']
}
];