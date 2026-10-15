/* ====================================================================
   CASOS
   -------------------------------------------------------------------
   AÑADIR UN CASO NUEVO:
   1. Copia cualquier bloque { id:'...', ... } de los que hay aquí.
   2. Pégalo antes del corchete final del array CASES.
   3. Cambia el `id` por uno único.
   4. `killer` debe coincidir EXACTAMENTE con el id de un sospechoso.

   sceneType: tipo de habitación 3D
     - 'despacho'   → escritorio, silla, 2 estanterías, cuadros, ventanas
     - 'dormitorio' → cama, mesillas, armario, lámparas
     - 'biblioteca' → 8 estanterías, mesa central, mármol
     - 'exterior'   → jardín, árboles, banco, farolas
     - 'teatro'     → escenario con cortinas rojas, focos

   corpsePose (opcional): postura del cadáver
     - 'supine' (boca arriba)
     - 'side' (de lado)
     - 'prone' (boca abajo)
     - 'curled' (ovillado)
     - 'seated' (sentado)
     Si no se especifica, se usa la postura por defecto del sceneType.
   ==================================================================== */

const CASES = [
{
  id:'teatro', num:'CASO #001', title:'Muerte en el Teatro Cervantes',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'teatro',
  location:'Camerino 3, Teatro Cervantes', time:'23:40 h',
  victim:'Nicolás Ferrer «El Gran Nicolás»', cause:'Envenenamiento',
  intro:'El Gran Nicolás yace en su sillón con una taza de té a medio beber. La puerta no tiene cerradura y la ventana está cerrada por dentro.',
  objects:[
    {id:'taza',name:'Taza de té',icon:'☕',desc:'Huele a almendras amargas.',clue:'El té contiene cianuro.'},
    {id:'azucarero',name:'Azucarero',icon:'🍬',desc:'Cerrado muy fuerte. Un hilo azul en la tapa.',clue:'Hilo azul: coincide con el pañuelo.'},
    {id:'panuelo',name:'Pañuelo D.M.',icon:'🧣',desc:'Huele a jazmín, no a sándalo.',clue:'El pañuelo huele a jazmín (Leticia).'},
    {id:'ticket',name:'Ticket F3-A7',icon:'🎫',desc:'Sin registro en taquilla.',clue:'Ticket sin registro: reventa de entradas.'},
    {id:'pastillas',name:'Pastillas artritis',icon:'💊',desc:'Casi vacío.',clue:'Nicolás no podía abrir el azucarero solo.'}
  ],
  suspects:[
    {id:'aurora',name:'Aurora Ferrer',role:'Esposa',icon:'🌹',questions:[
      {q:'¿Dónde estaba?',a:'En el camerino contiguo.'},
      {q:'¿Quién abría el azucarero?',a:'Yo siempre. Tiene artritis.',clue:'Solo los cercanos saben lo del azucarero.'},
      {q:'¿Vio el pañuelo?',a:'Huele a jazmín, como el perfume de Leticia.',clue:'El pañuelo huele a jazmín (Leticia).'}
    ]},
    {id:'damian',name:'Damián Mendoza',role:'Mago rival',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En el bar. Perdí mi pañuelo allí.'},
      {q:'¿Cuándo lo perdió?',a:'Sobre las 22:30.',clue:'Robaron el pañuelo a las 22:30.'},
      {q:'¿Conoce a Leticia?',a:'Sí. Anda nerviosa por dinero.',clue:'Leticia anda mal de dinero.'}
    ]},
    {id:'leticia',name:'Leticia Gómez',role:'Manager',icon:'💼',questions:[
      {q:'¿Dónde estaba?',a:'Contando la recaudación. El ticket F3-A7 no aparece...',clue:'Leticia conocía el ticket faltante.'},
      {q:'¿Usa jazmín?',a:'Sí, siempre.',clue:'Leticia usa jazmín.'},
      {q:'¿Discutió con Nicolás?',a:'Por entradas. Nada.'}
    ]},
    {id:'oscar',name:'Óscar Ruiz',role:'Tramoyista',icon:'🔧',questions:[
      {q:'¿Vio algo?',a:'A Leticia saliendo del camerino a las 23:35 con una taza.',clue:'Óscar la vio salir con una taza.'},
      {q:'¿Olor raro?',a:'Sí, a almendras cerca del camerino.'}
    ]}
  ],
  killer:'leticia',
  solution:'Leticia envenenó a Nicolás con cianuro. Robó el pañuelo de Damián para incriminarlo. Cerró el azucarero con fuerza sin saber lo de la artritis.',
  keyEvidence:['Hilo azul en el azucarero','Pañuelo huele a jazmín','Ticket faltante','Óscar la vio salir']
},
{
  id:'hotel', num:'CASO #002', title:'El último brindis en el Hotel Mirador',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'dormitorio',
  location:'Suite 502, Hotel Mirador', time:'23:15 h',
  victim:'Elena Vargas', cause:'Envenenamiento',
  intro:'Elena yace en el balcón. Copa de champán a medio beber, labios azulados. La puerta estaba cerrada con pestillo por dentro.',
  objects:[
    {id:'copa',name:'Copa de champán',icon:'🥂',desc:'Polvo blanco en el fondo.',clue:'Contiene benzodiazepina.'},
    {id:'botella',name:'Botella',icon:'🍾',desc:'Sin huellas.',clue:'Alguien limpió la botella.'},
    {id:'nota',name:'Nota mecanografiada',icon:'📝',desc:'"Nos vemos a las 23:00."',clue:'Salió de la impresora de recepción.'},
    {id:'panuelo',name:'Pañuelo A.M.',icon:'🧣',desc:'Huele a cítrico.',clue:'Pañuelo con colonia cítrica de Andrés.'},
    {id:'somni',name:'Somníferos',icon:'💊',desc:'Vacío.',clue:'Somníferos agotados.'},
    {id:'guante',name:'Guante de látex',icon:'🧤',desc:'Con polvo blanco.',clue:'Guante usado para el somnífero.'}
  ],
  suspects:[
    {id:'marcos',name:'Marcos Vargas',role:'Sobrino',icon:'🎰',questions:[
      {q:'¿Dónde estaba?',a:'En el casino.'},
      {q:'¿Qué relación con Elena?',a:'De negocios. Heredo, sí.'},
      {q:'¿Mancha de vino?',a:'Un camarero tropezó en el casino.'}
    ]},
    {id:'andres',name:'Andrés Miralles',role:'Sumiller',icon:'🍷',questions:[
      {q:'¿Dónde estaba?',a:'En el bar. Subí a descorchar a las 22:30.'},
      {q:'¿Tiene deudas?',a:'Elena iba a prestarme.',clue:'Andrés dependía del préstamo de Elena.'},
      {q:'¿Es suyo el pañuelo?',a:'Sí... lo perdí en el office.'}
    ]},
    {id:'clara',name:'Clara Montes',role:'Camarera',icon:'🧹',questions:[
      {q:'¿Por qué entró?',a:'Elena pidió hielo. La puerta tenía pestillo.'},
      {q:'¿De quién es el pendiente?',a:'Mío. Se me cayó uno.'},
      {q:'¿Vio a alguien?',a:'A Andrés bajando por la escalera de servicio.'}
    ]},
    {id:'ivan',name:'Dr. Iván',role:'Médico',icon:'🩺',questions:[
      {q:'¿Por qué le recetó somníferos?',a:'Insomnio. Dosis baja.'},
      {q:'¿Alguien más tuvo acceso?',a:'La consulta no la cierro siempre.'}
    ]}
  ],
  killer:'andres',
  solution:'Andrés envenenó a Elena. Tenía deudas, Elena iba a despedirlo. Añadió benzodiazepina a la copa con un guante de látex y dejó caer su pañuelo A.M.',
  keyEvidence:['Pañuelo A.M.','Deudas de Andrés','Montacargas sin cámara','Somnífero en la copa']
},
{
  id:'joyeria', num:'CASO #003', title:'El robo de la Joyería Dior',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'despacho',
  location:'Joyería Dior, Calle Mayor', time:'19:30 h',
  victim:'Sr. Dior', cause:'Golpe en la nuca',
  intro:'La joyería acaba de cerrar. El Sr. Dior yace tras el mostrador. Falta el collar estrella. La caja fuerte está abierta, no forzada.',
  objects:[
    {id:'caja',name:'Caja fuerte',icon:'🔓',desc:'Abierta con la combinación.',clue:'El ladrón conocía la combinación.'},
    {id:'collar',name:'Collar desaparecido',icon:'💎',desc:'Falta solo el más valioso.',clue:'Solo se llevaron el collar estrella.'},
    {id:'puerta',name:'Puerta trasera',icon:'🚪',desc:'Sin forzar.',clue:'El asesino tenía llave trasera.'},
    {id:'camara',name:'Cámara',icon:'📹',desc:'Desconectada a las 19:15.',clue:'Sabía cómo desconectar la cámara.'},
    {id:'sangre',name:'Sangre',icon:'🩸',desc:'En el borde del mostrador.',clue:'Grupo A+.'}
  ],
  suspects:[
    {id:'carlos',name:'Carlos Vega',role:'Empleado',icon:'💼',questions:[
      {q:'¿Dónde estaba?',a:'Cerrando la tienda. Salí a las 19:00.'},
      {q:'¿Tiene llave?',a:'Todos los empleados tenemos copia.'},
      {q:'¿Conocía la combinación?',a:'Solo el jefe y yo.',clue:'Carlos conocía la combinación.'}
    ]},
    {id:'marta',name:'Marta Ruiz',role:'Clienta',icon:'👩',questions:[
      {q:'¿Estaba?',a:'Hasta las 19:00.'},
      {q:'¿Vio algo?',a:'Carlos salió corriendo a las 19:10.',clue:'Carlos salió corriendo.'}
    ]},
    {id:'andres',name:'Andrés Dior',role:'Hermano',icon:'👨',questions:[
      {q:'¿Dónde estaba?',a:'En casa. Heredo la joyería.'},
      {q:'¿Relación?',a:'Mala. Discutimos por la herencia.'}
    ]},
    {id:'guardia',name:'Vigilante Nocturno',role:'Vigilante',icon:'👮',questions:[
      {q:'¿Vio algo?',a:'Un coche sospechoso al lado.'}
    ]}
  ],
  killer:'carlos',
  solution:'Carlos Vega mató al Sr. Dior. Salió a las 19:00, volvió por la puerta trasera, desconectó la cámara, abrió la caja con la combinación que conocía y cogió el collar. Dior lo sorprendió.',
  keyEvidence:['Caja abierta con combinación','Cámara desconectada','Carlos salió corriendo','Solo faltó el collar estrella']
},
{
  id:'jardin', num:'CASO #004', title:'Muerte entre las rosas',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'exterior',
  location:'Jardín Botánico Municipal', time:'18:00 h',
  victim:'Dr. Ramírez, botánico', cause:'Envenenamiento por planta',
  intro:'El Dr. Ramírez yace junto a los tejos del jardín. Tenía fama de conocer cada planta. Alguien usó su propio conocimiento contra él.',
  objects:[
    {id:'te',name:'Té del termo',icon:'🍵',desc:'Amargo inusual.',clue:'El té contiene tejo (veneno).'},
    {id:'tejo',name:'Ramas de tejo',icon:'🌿',desc:'Cortadas recientemente.',clue:'Alguien cortó ramas de tejo hoy.'},
    {id:'cuaderno',name:'Cuaderno',icon:'📓',desc:'Página arrancada.',clue:'Falta una página sobre el tejo.'},
    {id:'tijeras',name:'Tijeras de podar',icon:'✂️',desc:'Restos de savia.',clue:'Usadas para cortar tejo.'},
    {id:'guantes',name:'Guantes de jardín',icon:'🧤',desc:'Manchados de savia.',clue:'Los guantes son de Sara.'}
  ],
  suspects:[
    {id:'sara',name:'Sara López',role:'Ayudante',icon:'🌷',questions:[
      {q:'¿Dónde estaba?',a:'Regando el invernadero.'},
      {q:'¿Relación?',a:'Me iba a despedir.',clue:'Sara iba a ser despedida.'},
      {q:'¿Son suyos los guantes?',a:'Sí... los dejé en el cobertizo.'}
    ]},
    {id:'marcos',name:'Marcos Ibáñez',role:'Rival académico',icon:'🎓',questions:[
      {q:'¿Dónde estaba?',a:'En una conferencia.'},
      {q:'¿Relación?',a:'Competíamos por una cátedra.'}
    ]},
    {id:'clara',name:'Clara Vega',role:'Estudiante',icon:'🎒',questions:[
      {q:'¿Dónde estaba?',a:'En la biblioteca.'},
      {q:'¿Sabía de plantas?',a:'Lo básico.'}
    ]},
    {id:'vicente',name:'Vicente Soto',role:'Jardinero jefe',icon:'🌳',questions:[
      {q:'¿Dónde estaba?',a:'Podando los setos.'},
      {q:'¿Vio algo?',a:'A Sara discutiendo con el Dr. esta mañana.',clue:'Sara discutió con el Dr.'}
    ]}
  ],
  killer:'sara',
  solution:'Sara López envenenó al Dr. Ramírez. Iba a ser despedida. Cortó ramas de tejo, las infusionó y añadió el veneno a su termo. Dejó los guantes manchados por descuido.',
  keyEvidence:['Tejo en el té','Guantes de Sara con savia','Iba a ser despedida','Vicente la vio discutir']
},
{
  id:'cine', num:'CASO #005', title:'Función de medianoche',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'teatro',
  location:'Cine Lumière, sala 3', time:'00:30 h',
  victim:'Javier Prats', cause:'Envenenamiento en palomitas',
  intro:'El público salió. Javier quedó en su butaca, sin moverse. Las palomitas a medio comer. La película seguía en pantalla.',
  objects:[
    {id:'palomitas',name:'Palomitas',icon:'🍿',desc:'Solo las de arriba tienen un polvo raro.',clue:'El veneno estaba en la capa superior.'},
    {id:'refresco',name:'Refresco',icon:'🥤',desc:'Sin nada raro.',clue:'El refresco estaba limpio.'},
    {id:'entrada',name:'Entrada',icon:'🎫',desc:'Fila 5, asiento 12. Precio reducido.',clue:'Entrada con descuento: alguien del cine.'},
    {id:'movil',name:'Móvil',icon:'📱',desc:'Último mensaje: "Te veré esta noche".',clue:'Tenía una cita.'},
    {id:'bolsa',name:'Bolsa de palomitas',icon:'🛍️',desc:'Papel con huellas parciales.',clue:'Huellas compatibles con Lucía.'}
  ],
  suspects:[
    {id:'lucia',name:'Lucía Ferrer',role:'Ex novia',icon:'💔',questions:[
      {q:'¿Dónde estaba?',a:'En casa.'},
      {q:'¿Relación?',a:'Terminamos mal. Me debía dinero.',clue:'Habían terminado mal.'},
      {q:'¿Vino al cine?',a:'No... bueno, sí. Con una entrada con descuento.'}
    ]},
    {id:'pedro',name:'Pedro Ruiz',role:'Proyeccionista',icon:'📽️',questions:[
      {q:'¿Dónde estaba?',a:'En la cabina.'},
      {q:'¿Vio a alguien?',a:'A Lucía saliendo a las 00:15.'}
    ]},
    {id:'ana',name:'Ana Blasco',role:'Novia actual',icon:'💕',questions:[
      {q:'¿Dónde estaba?',a:'En casa. Esperaba a Javier.'},
      {q:'¿Sabía de Lucía?',a:'Sí. Estaba obsesionada con él.'}
    ]},
    {id:'jorge',name:'Jorge Marín',role:'Amigo',icon:'👥',questions:[
      {q:'¿Dónde estaba?',a:'En la sala 2.'},
      {q:'¿Relación?',a:'Amigos.'}
    ]}
  ],
  killer:'lucia',
  solution:'Lucía Ferrer envenenó a Javier. Él le debía dinero y se negaba a pagar. Compró una entrada con descuento, se acercó a su asiento, echó veneno sobre las palomitas y salió. Pedro la vio salir.',
  keyEvidence:['Huellas de Lucía en la bolsa','Entrada con descuento','Pedro la vio salir','Cita por mensaje']
},
{
  id:'gimnasio', num:'CASO #006', title:'Peso muerto',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'despacho', corpsePose:'prone',
  location:'Gimnasio Titan, sala de pesas', time:'21:00 h',
  victim:'Rubén Castro', cause:'Accidente (sabotaje)',
  intro:'Rubén, culturista, yace bajo la barra del banco. Los seguros estaban sueltos. Alguien tocó su equipo.',
  objects:[
    {id:'barra',name:'Barra con discos',icon:'🏋️',desc:'Discos al revés.',clue:'Los discos se pusieron mal a propósito.'},
    {id:'seguros',name:'Seguros',icon:'🔧',desc:'Aflojados con herramienta.',clue:'Aflojados antes.'},
    {id:'botella',name:'Botella de agua',icon:'💧',desc:'Restos de un sedante.',clue:'Rubén estaba somnoliento.'},
    {id:'movil',name:'Móvil',icon:'📱',desc:'Mensaje: "Hoy te toca a ti".',clue:'Alguien le había avisado.'},
    {id:'toalla',name:'Toalla',icon:'🧺',desc:'Con perfume de lavanda.',clue:'La toalla es de Diana.'}
  ],
  suspects:[
    {id:'diana',name:'Diana Ferrer',role:'Entrenadora',icon:'💪',questions:[
      {q:'¿Dónde estaba?',a:'Entrenando a otro cliente.'},
      {q:'¿Es suya la toalla?',a:'Sí... la dejé en mi taquilla.'},
      {q:'¿Relación?',a:'Buena. Entrenaba a Rubén.'}
    ]},
    {id:'raul',name:'Raúl Vega',role:'Compañero',icon:'😤',questions:[
      {q:'¿Dónde estaba?',a:'En la ducha.'},
      {q:'¿Relación?',a:'Rubén me quitó el patrocinio.',clue:'Rubén le quitó el patrocinio.'}
    ]},
    {id:'recepcion',name:'Eva Marín',role:'Recepcionista',icon:'📋',questions:[
      {q:'¿Vio a alguien?',a:'A Raúl entrando a la sala de pesas a las 20:50.'},
      {q:'¿Ambiente?',a:'Raúl y Rubén discutieron esta tarde.'}
    ]},
    {id:'medico',name:'Dr. Pablo Ruiz',role:'Médico del gym',icon:'🩺',questions:[
      {q:'¿Algo raro?',a:'Rubén tenía sedantes en sangre.'}
    ]}
  ],
  killer:'raul',
  solution:'Raúl Vega saboteó el equipo. Rubén le había quitado un patrocinio. Añadió un sedante a su botella, aflojó los seguros y colocó los discos al revés.',
  keyEvidence:['Discos al revés','Sedante en la botella','Eva lo vio entrar','Discusión previa']
},
{
  id:'boda', num:'CASO #007', title:'Muerte en el banquete nupcial',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'despacho', corpsePose:'side',
  location:'Finca Los Olivos, salón principal', time:'00:15 h',
  victim:'Teresa Villanueva', cause:'Envenenamiento en el champán',
  intro:'El brindis se atragantó. Teresa, la madrina, cayó al suelo en medio del banquete.',
  objects:[
    {id:'copa',name:'Copa de champán',icon:'🥂',desc:'Restos de cianuro.',clue:'Cianuro en la copa.'},
    {id:'botella',name:'Botella',icon:'🍾',desc:'Sin veneno.',clue:'Solo su copa tenía veneno.'},
    {id:'servilleta',name:'Servilleta',icon:'🧻',desc:'Manchada de carmín rojo.',clue:'Carmín distinto al de Teresa.'},
    {id:'bandeja',name:'Bandeja',icon:'🍽️',desc:'Huellas de dos personas.',clue:'Huellas de Diego el camarero.'},
    {id:'bolso',name:'Bolso de Teresa',icon:'👜',desc:'Sobre con fotos.',clue:'Teresa chantajeaba a alguien.'}
  ],
  suspects:[
    {id:'carlos',name:'Carlos Villanueva',role:'Hermano de la novia',icon:'🤵',questions:[
      {q:'¿Dónde estaba?',a:'Bailando.'},
      {q:'¿Relación?',a:'Era mi tía. Discutíamos por la herencia.',clue:'Discutían por la herencia.'}
    ]},
    {id:'diego',name:'Diego Ruiz',role:'Camarero',icon:'🍽️',questions:[
      {q:'¿Sirvió el champán?',a:'Sí.'},
      {q:'¿Vio a alguien?',a:'Al señor Carlos rondando la mesa del champán.',clue:'Diego vio a Carlos junto al champán.'}
    ]},
    {id:'beatriz',name:'Beatriz Sanz',role:'Novia',icon:'👰',questions:[
      {q:'¿Relación?',a:'Buena. Me ayudó con la boda.'}
    ]},
    {id:'javier',name:'Javier Villanueva',role:'Padre',icon:'👴',questions:[
      {q:'¿Dónde estaba?',a:'En la mesa principal.'}
    ]}
  ],
  killer:'carlos',
  solution:'Carlos envenenó a su tía Teresa. Teresa le chantajeaba con fotos comprometedoras. Aprovechó un momento del baile para añadir cianuro a su copa.',
  keyEvidence:['Cianuro solo en su copa','Diego lo vio junto al champán','Fotos comprometedoras','Discusión por la herencia']
},
{
  id:'cuadro', num:'CASO #008', title:'El cuadro falsificado',
  difficulty:'FÁCIL', superior:'lisboa', sceneType:'despacho',
  location:'Galería de Arte Moderno', time:'19:45 h',
  victim:'Sra. Ortega, galerista', cause:'Golpe con marco',
  intro:'La galería iba a cerrar. La Sra. Ortega estaba sola revisando un cuadro. Alguien la golpeó con el propio marco.',
  objects:[
    {id:'cuadro',name:'Cuadro roto',icon:'🖼️',desc:'Es falso.',clue:'El cuadro es una falsificación.'},
    {id:'certificado',name:'Certificado',icon:'📜',desc:'Firmado por un perito muerto.',clue:'Certificado falsificado.'},
    {id:'telefono',name:'Teléfono fijo',icon:'☎️',desc:'Última llamada al restaurador.',clue:'Llamó al restaurador antes de morir.'},
    {id:'guantes',name:'Guantes de látex',icon:'🧤',desc:'Con pintura.',clue:'Los guantes tienen pintura del cuadro.'},
    {id:'catalogo',name:'Catálogo',icon:'📖',desc:'Página arrancada.',clue:'Alguien arrancó la página del cuadro.'}
  ],
  suspects:[
    {id:'perito',name:'Sr. Alonso',role:'Perito de arte',icon:'🎨',questions:[
      {q:'¿Dónde estaba?',a:'En mi estudio.'},
      {q:'¿Relación?',a:'Me negué a certificar el cuadro.',clue:'Alonso se negó a certificar.'},
      {q:'¿Vino a la galería?',a:'Esta tarde. Discutimos.'}
    ]},
    {id:'cristina',name:'Cristina Vega',role:'Restauradora',icon:'🖌️',questions:[
      {q:'¿Dónde estaba?',a:'En mi taller.'},
      {q:'¿La llamó?',a:'Sí. Me dijo que el cuadro era falso.',clue:'La Sra. sabía que era falso.'}
    ]},
    {id:'dueno',name:'Sr. Molina',role:'Propietario',icon:'💼',questions:[
      {q:'¿Dónde estaba?',a:'En mi despacho.'},
      {q:'¿Relación?',a:'Íbamos a venderlo juntos.'}
    ]},
    {id:'limpiador',name:'Ramiro',role:'Limpiador',icon:'🧹',questions:[
      {q:'¿Vio algo?',a:'Al Sr. Alonso entrando con prisa.'}
    ]}
  ],
  killer:'perito',
  solution:'El Sr. Alonso golpeó a la Sra. Ortega con el marco. Ella había descubierto que el certificado era falso y que él lo había falsificado.',
  keyEvidence:['Certificado falsificado','Alonso se negó a certificar','Discusión esta tarde','Ramiro lo vio entrar']
},
{
  id:'blackwood', num:'CASO #009', title:'El ocaso de Lord Blackwood',
  difficulty:'MEDIA', superior:'lisboa', sceneType:'biblioteca',
  location:'Mansión Blackwood, Yorkshire', time:'22:15 h',
  victim:'Lord Arthur Blackwood', cause:'Envenenamiento por arsénico',
  intro:'La mansión gime con el viento. Lord Blackwood yace sobre su escritorio. Sobre la alfombra, una nota arrugada: "Págame".',
  objects:[
    {id:'whisky',name:'Vaso de whisky',icon:'🥃',desc:'Residuo blancuzco.',clue:'El whisky contiene arsénico.'},
    {id:'nota',name:'Nota arrugada',icon:'📝',desc:'"Págame o hablaré."',clue:'Alguien le exigía dinero.'},
    {id:'testamento',name:'Testamento',icon:'📜',desc:'Firmado ayer.',clue:'Cambió el testamento ayer.'},
    {id:'guante',name:'Guante blanco',icon:'🧤',desc:'Perfume de rosas.',clue:'Huele a rosas (Victoria).'},
    {id:'reloj',name:'Reloj de pared',icon:'🕰️',desc:'Parado a las 22:15.',clue:'Forcejeo a las 22:15.'},
    {id:'libro',name:'Libro de cuentas',icon:'📒',desc:'Página arrancada.',clue:'Deudas de juego enormes.'}
  ],
  suspects:[
    {id:'higgins',name:'Sr. Higgins',role:'Mayordomo',icon:'🎩',questions:[
      {q:'¿Quién sirvió el whisky?',a:'Yo, a las 21:45.'},
      {q:'¿Sabe de deudas?',a:'El señor no era el único con problemas.',clue:'Otros tenían problemas de dinero.'}
    ]},
    {id:'victoria',name:'Victoria Blackwood',role:'Hija',icon:'🌹',questions:[
      {q:'¿Sabía del testamento?',a:'Lo intuía.',clue:'Victoria sabía del cambio.'},
      {q:'¿Usa rosas?',a:'Sí, siempre. De Grasse.',clue:'Victoria usa rosas.'}
    ]},
    {id:'croft',name:'Edwin Croft',role:'Socio',icon:'💼',questions:[
      {q:'¿Deudas?',a:'El lord me debía una suma.',clue:'Croft dice que el lord le debía.'},
      {q:'¿Fue testigo?',a:'Sí. El lord quería proteger a su hija.'}
    ]},
    {id:'rosa',name:'Rosa Delgado',role:'Doncella',icon:'🧹',questions:[
      {q:'¿Vio a alguien?',a:'A la señorita Victoria bajando a las 22:00.',clue:'Victoria bajó al despacho.'},
      {q:'¿Faltaba algo?',a:'Un guante de la señorita.'}
    ]}
  ],
  killer:'victoria',
  solution:'Victoria envenenó a su padre. Al saber que quedaba desheredada, bajó por la escalera de servicio, vertió arsénico en su whisky y forcejeó con él.',
  keyEvidence:['Guante con rosas','Sabía del testamento','Rosa la vio bajar','Arsénico en el whisky']
},
{
  id:'crucero', num:'CASO #010', title:'Naufragio en el Crucero Aurora',
  difficulty:'MEDIA', superior:'lisboa', sceneType:'exterior',
  location:'Cubierta 7, Crucero Aurora', time:'02:30 h',
  victim:'Capitán Emilio Morales', cause:'Caída al mar (empujón)',
  intro:'El capitán ya no responde. Su gorra flota junto al costado. Alguien cortó una cuerda para simular un accidente.',
  objects:[
    {id:'gorra',name:'Gorra',icon:'🧢',desc:'Sangre seca dentro.',clue:'Hubo forcejeo.'},
    {id:'bitacora',name:'Bitácora',icon:'📖',desc:'Entrada alterada.',clue:'Alguien alteró la bitácora.'},
    {id:'reloj',name:'Reloj de pulsera',icon:'⌚',desc:'Parado a las 02:18.',clue:'Forcejeo a las 02:18.'},
    {id:'cuerda',name:'Trozo de cuerda',icon:'🪢',desc:'Cortada con cuchillo.',clue:'Cortada con cuchillo.'},
    {id:'llave',name:'Llave cabina 12',icon:'🔑',desc:'Bajo una tumbona.',clue:'Llave del primer oficial en cubierta.'},
    {id:'carta',name:'Carta náutica',icon:'🗺️',desc:'Ruta no autorizada.',clue:'El capitán descubrió un contrabando.'}
  ],
  suspects:[
    {id:'navarro',name:'Teniente Navarro',role:'Primer oficial',icon:'⚓',questions:[
      {q:'¿Dónde estaba?',a:'En mi cabina. Mi llave... no sé cómo acabó allí.'},
      {q:'¿Relación?',a:'Tensa. Discutíamos por la ruta.',clue:'Discutían por la ruta.'},
      {q:'¿Sabe de contrabando?',a:'No. Bueno... sospechaba algo.'}
    ]},
    {id:'lagos',name:'Sr. Lagos',role:'Pasajero',icon:'💎',questions:[
      {q:'¿Por qué despierto?',a:'Insomnio.'},
      {q:'¿Conoce al capitán?',a:'Le había pedido un favor que rechazó.'}
    ]},
    {id:'russo',name:'Ingeniera Russo',role:'Jefa de máquinas',icon:'🔧',questions:[
      {q:'¿Dónde estaba?',a:'En máquinas. Avería a las 02:00.',clue:'Russo tiene coartada.'}
    ]},
    {id:'pepe',name:'Pepe Ron',role:'Barman',icon:'🍸',questions:[
      {q:'¿Sirvió al capitán?',a:'Ron doble a las 01:45.'},
      {q:'¿Vio a alguien?',a:'Al teniente Navarro a las 02:10. Sin uniforme.',clue:'Navarro subió sin uniforme.'},
      {q:'¿Después?',a:'Bajó sudando a las 02:35.'}
    ]}
  ],
  killer:'navarro',
  solution:'Navarro empujó al capitán. Morales había descubierto un contrabando en el que Navarro estaba implicado.',
  keyEvidence:['Sangre en la gorra','Bitácora alterada','Llave de Navarro','Pepe lo vio subir']
},
{
  id:'museo', num:'CASO #011', title:'El robo del Prado',
  difficulty:'MEDIA', superior:'ferreira', sceneType:'biblioteca',
  location:'Museo del Prado, sala de Velázquez', time:'03:00 h',
  victim:'Vigilante Tomás Ruiz', cause:'Asfixia',
  intro:'El vigilante yace detrás de un biombo. Falta un boceto de Velázquez. Las cámaras no grabaron nada.',
  objects:[
    {id:'vitrina',name:'Vitrina rota',icon:'🖼️',desc:'Cortada con diamante.',clue:'Herramienta de profesional.'},
    {id:'guantes',name:'Guantes de terciopelo',icon:'🧤',desc:'Bajo el biombo.',clue:'Guantes de terciopelo negro.'},
    {id:'alarma',name:'Panel de alarma',icon:'🚨',desc:'Desactivada a las 02:55.',clue:'Sabía el código.'},
    {id:'pasillo',name:'Huella de zapato',icon:'👞',desc:'Talla 42, suela de goma.',clue:'Zapato deportivo talla 42.'},
    {id:'lista',name:'Lista de invitados',icon:'📋',desc:'Visita privada anotada.',clue:'Alguien tenía acceso esa noche.'}
  ],
  suspects:[
    {id:'director',name:'Sr. Aguilar',role:'Director',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En casa.'},
      {q:'¿Quién tiene acceso?',a:'Los conservadores y yo.'}
    ]},
    {id:'conservador',name:'Dr. Serrano',role:'Conservador',icon:'🎓',questions:[
      {q:'¿Dónde estaba?',a:'En mi despacho.'},
      {q:'¿Tenía acceso?',a:'Sí. Es mi trabajo.',clue:'Serrano tenía acceso nocturno.'},
      {q:'¿Sabe el código?',a:'Todos los conservadores lo sabemos.'}
    ]},
    {id:'empresa',name:'Sr. Ferrer',role:'Empresa de seguridad',icon:'🔒',questions:[
      {q:'¿Vino al museo?',a:'Sí, a revisar el sistema a las 02:00.',clue:'Ferrer estuvo esa noche.'}
    ]},
    {id:'limpiador',name:'Ramiro Gómez',role:'Limpiador nocturno',icon:'🧹',questions:[
      {q:'¿Vio algo?',a:'Al Sr. Ferrer por el pasillo a las 02:30.'}
    ]}
  ],
  killer:'conservador',
  solution:'El Dr. Serrano robó el boceto. Tenía acceso y conocía los códigos. Cuando Tomás lo sorprendió, lo asfixió con la correa del cuadro.',
  keyEvidence:['Código conocido','Acceso nocturno','Herramienta profesional','Ramiro vio a Ferrer de rutina']
},
{
  id:'tren', num:'CASO #012', title:'Asesinato en el Expreso 405',
  difficulty:'MEDIA', superior:'lisboa', sceneType:'dormitorio',
  location:'Tren Expreso 405, coche cama 7', time:'01:45 h',
  victim:'Sra. Villalobos', cause:'Apuñalada',
  intro:'El tren cruza la meseta. La puerta del compartimento estaba cerrada por dentro. El asesino entró y salió sin forzar.',
  objects:[
    {id:'puerta',name:'Puerta',icon:'🚪',desc:'Cerrada por dentro.',clue:'Alguien tenía llave maestra.'},
    {id:'cuchillo',name:'Cuchillo de cocina',icon:'🔪',desc:'Sin huellas.',clue:'Limpiado. Es del coche restaurante.'},
    {id:'joyas',name:'Joyas desaparecidas',icon:'💎',desc:'Faltan dos anillos.',clue:'Los anillos faltan.'},
    {id:'ticket',name:'Ticket de cena',icon:'🎫',desc:'Cena en coche 3 a las 23:00.',clue:'Cenó a las 23:00.'},
    {id:'movil',name:'Móvil',icon:'📱',desc:'Último mensaje: "Te espero en el coche 7".',clue:'Alguien le pidió verla.'}
  ],
  suspects:[
    {id:'revisor',name:'Sr. Barea',role:'Revisor',icon:'🎫',questions:[
      {q:'¿Dónde estaba?',a:'Revisando billetes.'},
      {q:'¿Tiene llave maestra?',a:'Sí.',clue:'Barea tiene llave maestra.'},
      {q:'¿Vio algo?',a:'A la Sra. hablando con un pasajero del coche 4.'}
    ]},
    {id:'pasajero',name:'Sr. Duarte',role:'Pasajero coche 4',icon:'🕴️',questions:[
      {q:'¿Dónde estaba?',a:'En mi compartimento.'},
      {q:'¿Relación?',a:'Era mi examante. Me debía dinero.',clue:'Duarte dice que le debía dinero.'},
      {q:'¿Le mandó mensaje?',a:'Sí. Para hablar de la deuda.'}
    ]},
    {id:'azafata',name:'Eva Ruiz',role:'Azafata',icon:'👩‍✈️',questions:[
      {q:'¿Sirvió a la Sra.?',a:'Cenó a las 23:00.'},
      {q:'¿Vio a alguien?',a:'Al Sr. Duarte yendo hacia el coche 7 sobre la 01:30.'}
    ]},
    {id:'chef',name:'Chef Morales',role:'Chef',icon:'👨‍🍳',questions:[
      {q:'¿Falta algún cuchillo?',a:'Sí. Uno de los grandes.',clue:'Falta un cuchillo.'}
    ]}
  ],
  killer:'duarte',
  solution:'Duarte asesinó a la Sra. Villalobos. Le debía dinero y ella amenazaba con denunciarlo. Robó un cuchillo y usó su llave para entrar.',
  keyEvidence:['Cuchillo de cocina','Mensaje para verla','Eva lo vio ir al coche 7','Deuda pendiente']
},
{
  id:'mansion', num:'CASO #013', title:'La habitación cerrada',
  difficulty:'MEDIA', superior:'salas', sceneType:'dormitorio',
  location:'Mansión Valdés, dormitorio principal', time:'23:30 h',
  victim:'Doña Elvira Valdés', cause:'Envenenamiento',
  intro:'La puerta estaba cerrada por dentro. La ventana también. Solo hay una llave, en la mesita.',
  objects:[
    {id:'copa',name:'Copa de licor',icon:'🥃',desc:'Restos de digital.',clue:'Veneno de digital.'},
    {id:'llave',name:'Llave',icon:'🔑',desc:'Única llave, en la mesita.',clue:'La puerta estaba cerrada desde dentro.'},
    {id:'ventana',name:'Ventana',icon:'🪟',desc:'Marcas de hilo.',clue:'Alguien pudo cerrarla con un hilo desde fuera.'},
    {id:'planta',name:'Planta de digital',icon:'🌿',desc:'Recién cortada.',clue:'Alguien cortó la digital hoy.'},
    {id:'carta',name:'Carta',icon:'✉️',desc:'Amenaza anónima.',clue:'Doña Elvira estaba amenazada.'}
  ],
  suspects:[
    {id:'sobrino',name:'Rodrigo Valdés',role:'Sobrino',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En el salón. Heredo la mansión.'},
      {q:'¿Relación?',a:'Buena. Bueno... discutíamos por dinero.',clue:'Discutían por dinero.'},
      {q:'¿Sabe de plantas?',a:'Sé lo básico.'}
    ]},
    {id:'ama',name:'Luisa Pérez',role:'Ama de llaves',icon:'🧹',questions:[
      {q:'¿Dónde estaba?',a:'En la cocina.'},
      {q:'¿Le llevó el licor?',a:'No. Ella misma se lo sirvió.',clue:'Se sirvió ella misma.'},
      {q:'¿Quién cortó la digital?',a:'El jardinero, quizá.'}
    ]},
    {id:'jardinero',name:'Miguel Ángel',role:'Jardinero',icon:'🌳',questions:[
      {q:'¿Cortó digital?',a:'No. Corté rosas.'},
      {q:'¿Quién más accede?',a:'El sobrino a veces coge plantas.'}
    ]},
    {id:'medico',name:'Dr. Beltrán',role:'Médico',icon:'🩺',questions:[
      {q:'¿Sabía de su salud?',a:'Doña Elvira tenía el corazón delicado.'}
    ]}
  ],
  killer:'sobrino',
  solution:'Rodrigo Valdés envenenó a su tía. Cortó la planta de digital y añadió el veneno a su licor. Cerró la puerta por fuera con un hilo y tiró de él.',
  keyEvidence:['Digital cortada hoy','Marcas de hilo','Discusión por dinero','Sobrino sabe de plantas']
},
{
  id:'faro', num:'CASO #014', title:'El faro sin luz',
  difficulty:'MEDIA', superior:'lisboa', sceneType:'exterior',
  location:'Faro de Punta Negra', time:'04:00 h',
  victim:'Farero Andrés Soler', cause:'Caída desde la linterna',
  intro:'El faro apagado causó el naufragio de un pesquero. El farero yace al pie de la torre. Alguien manipuló la linterna.',
  objects:[
    {id:'linterna',name:'Linterna',icon:'💡',desc:'Aceite derramado. Mecanismo forzado.',clue:'La linterna fue saboteada.'},
    {id:'herramienta',name:'Llave inglesa',icon:'🔧',desc:'Con sangre seca.',clue:'Usada para golpear al farero.'},
    {id:'cuerda',name:'Cuerda rota',icon:'🪢',desc:'Cortada limpiamente.',clue:'Cortada con cuchillo.'},
    {id:'bitacora',name:'Diario',icon:'📓',desc:'"Vino otra vez. Cobrará."',clue:'Alguien le visitaba para cobrar.'},
    {id:'coche',name:'Coche en la cuneta',icon:'🚗',desc:'Matrícula de la empresa rival.',clue:'Coche de la empresa rival cerca.'}
  ],
  suspects:[
    {id:'inspector',name:'Sr. Bermúdez',role:'Inspector de faros',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En mi casa.'},
      {q:'¿Relación?',a:'Revisaba su trabajo. Le iba a multar.',clue:'Bermúdez iba a multar al farero.'}
    ]},
    {id:'pescador',name:'Juan Soler',role:'Pescador (hermano)',icon:'🎣',questions:[
      {q:'¿Dónde estaba?',a:'En el puerto. Mi barco naufragó.'},
      {q:'¿Relación?',a:'Discutíamos por la herencia.'}
    ]},
    {id:'rival',name:'Sr. Cortés',role:'Empresa rival',icon:'🏢',questions:[
      {q:'¿Por qué su coche está cerca?',a:'Vine a ofrecerle trabajo.'},
      {q:'¿Relación?',a:'Quería comprar el faro. Se negaba.',clue:'Cortés quería comprar el faro.'}
    ]},
    {id:'mujer',name:'Marta Soler',role:'Esposa',icon:'💔',questions:[
      {q:'¿Dónde estaba?',a:'En casa, a 20 km.'},
      {q:'¿Relación?',a:'Mal. Íbamos a divorciarnos.'}
    ]}
  ],
  killer:'inspector',
  solution:'El inspector Bermúdez saboteó la linterna y empujó al farero. Andrés había descubierto que Bermúdez cobraba sobornos de la empresa rival.',
  keyEvidence:['Linterna saboteada','Llave inglesa con sangre','Diario: "vino a cobrar"','Iba a multarlo']
},
{
  id:'monasterio', num:'CASO #015', title:'El silencio roto',
  difficulty:'MEDIA', superior:'cruz', sceneType:'biblioteca',
  location:'Monasterio de San Benito', time:'05:00 h',
  victim:'Fray Ignacio', cause:'Envenenamiento en la comunión',
  intro:'Durante el rezo del alba, Fray Ignacio cayó. El cáliz estaba envenenado.',
  objects:[
    {id:'caliz',name:'Cáliz',icon:'🍷',desc:'Restos de arsénico.',clue:'El cáliz contiene arsénico.'},
    {id:'pan',name:'Pan consagrado',icon:'🍞',desc:'Sin nada raro.',clue:'El pan está limpio.'},
    {id:'frasco',name:'Frasco',icon:'🧪',desc:'Bajo un banco. Vacío.',clue:'Frasco de arsénico vacío.'},
    {id:'libro',name:'Libro de botánica',icon:'📖',desc:'Faltan páginas sobre venenos.',clue:'Faltan las páginas del arsénico.'},
    {id:'celda',name:'Celda',icon:'🛏️',desc:'Cartas de amenaza.',clue:'Fray Ignacio estaba amenazado.'}
  ],
  suspects:[
    {id:'abad',name:'Padre Abad',role:'Abad',icon:'✝️',questions:[
      {q:'¿Dónde estaba?',a:'Presidiendo el rezo.'},
      {q:'¿Relación?',a:'Fray Ignacio iba a denunciar algo.',clue:'Iba a denunciar algo.'}
    ]},
    {id:'hermano',name:'Fray Mateo',role:'Monje',icon:'📿',questions:[
      {q:'¿Dónde estaba?',a:'Sirviendo el cáliz.'},
      {q:'¿Relación?',a:'Buena. Compartíamos celda.'},
      {q:'¿Sabe de plantas?',a:'Cuidaba el huerto. Sé de plantas medicinales.',clue:'Mateo cuida el huerto.'}
    ]},
    {id:'cocinero',name:'Fray Lucas',role:'Cocinero',icon:'👨‍🍳',questions:[
      {q:'¿Quién prepara la comunión?',a:'Yo. Pero el vino lo bendice el abad.'}
    ]},
    {id:'visitante',name:'Don Ramón',role:'Visitante',icon:'🧳',questions:[
      {q:'¿Por qué está aquí?',a:'Haciendo ejercicios espirituales.'}
    ]}
  ],
  killer:'hermano',
  solution:'Fray Mateo envenenó el cáliz. Fray Ignacio había descubierto que Mateo robaba dinero del monasterio y amenazaba con contarlo al Abad.',
  keyEvidence:['Frasco de arsénico','Páginas arrancadas','Mateo cuida el huerto','Iba a denunciar']
},
{
  id:'restaurante', num:'CASO #016', title:'El crítico gastronómico',
  difficulty:'MEDIA', superior:'lisboa', sceneType:'despacho',
  location:'Restaurante Le Cordon, mesa 4', time:'22:30 h',
  victim:'Sr. Bermejo, crítico', cause:'Envenenamiento',
  intro:'El crítico gastronómico acababa de publicar una reseña demoledora. Esa noche cenaba en el mismo restaurante.',
  objects:[
    {id:'plato',name:'Segundo plato',icon:'🍽️',desc:'Ragú con sabor amargo.',clue:'Veneno en el ragú.'},
    {id:'copa',name:'Copa de vino',icon:'🍷',desc:'Sin nada raro.',clue:'El vino está limpio.'},
    {id:'resena',name:'Reseña publicada',icon:'📰',desc:'Demoledora.',clue:'La reseña humilló al chef.'},
    {id:'cocina',name:'Acceso a cocina',icon:'🚪',desc:'Solo personal.',clue:'Solo el personal accede.'},
    {id:'movil',name:'Móvil',icon:'📱',desc:'"Esta noche cenaré allí."',clue:'Avisó al restaurante.'}
  ],
  suspects:[
    {id:'chef',name:'Chef Auguste',role:'Chef',icon:'👨‍🍳',questions:[
      {q:'¿Dónde estaba?',a:'En la cocina.'},
      {q:'¿Relación?',a:'Su reseña me hundió. Perdí una estrella.',clue:'La reseña hundió al chef.'},
      {q:'¿Preparó el ragú?',a:'No. Lo preparó mi sous-chef.'}
    ]},
    {id:'sous',name:'Sous-chef Marie',role:'Sous-chef',icon:'👩‍🍳',questions:[
      {q:'¿Preparó el ragú?',a:'Sí. Pero la receta es del chef.'},
      {q:'¿Alguien más tocó?',a:'Solo el chef pasó por mi estación.'}
    ]},
    {id:'sumiller',name:'Sr. Dupont',role:'Sumiller',icon:'🍷',questions:[
      {q:'¿Relación?',a:'El crítico me acusó de servir vino barato.'}
    ]},
    {id:'camarero',name:'Pierre',role:'Camarero',icon:'🍽️',questions:[
      {q:'¿Sirvió la mesa 4?',a:'Sí.'},
      {q:'¿Vio a alguien tocar el plato?',a:'El chef lo revisó antes de salir.'}
    ]}
  ],
  killer:'chef',
  solution:'El Chef Auguste envenenó el plato. La reseña lo había hundido. Se acercó a la estación del sous-chef, añadió el veneno al ragú y "revisó" el plato antes de que saliera.',
  keyEvidence:['Reseña demoledora','Chef pasó por la estación','Solo él revisó el plato','Veneno en el ragú']
},
{
  id:'circo', num:'CASO #017', title:'La caída de la Estrella',
  difficulty:'DIFÍCIL', superior:'lisboa', sceneType:'teatro',
  location:'Carpa principal, Circo Nocturno', time:'21:50 h',
  victim:'Marina «Estrella» Salas', cause:'Caída desde trapecio',
  intro:'El público aplaude. La Estrella yace en la red, pero la red estaba floja.',
  objects:[
    {id:'cuerda',name:'Cuerda del trapecio',icon:'🪢',desc:'Cortada a 3/4.',clue:'Cortada con cuchilla.'},
    {id:'red',name:'Red de seguridad',icon:'🕸️',desc:'Anclajes flojos.',clue:'Alguien aflojó la red.'},
    {id:'rosin',name:'Bote de resina',icon:'🥫',desc:'Sustituida por talco.',clue:'Resina cambiada por talco.'},
    {id:'llavero',name:'Llavero J.M.',icon:'🔑',desc:'Bajo la grada.',clue:'Llavero de Julián.'},
    {id:'carta',name:'Carta',icon:'💌',desc:'"Déjalo o lo contaré." Firmada E.',clue:'Alguien le exigía algo.'},
    {id:'polea',name:'Polea',icon:'⚙️',desc:'Aceitada en exceso.',clue:'Polea manipulada.'}
  ],
  suspects:[
    {id:'julian',name:'Julián Mar',role:'Compañero de trapecio',icon:'🤸',questions:[
      {q:'¿Dónde estaba?',a:'Calentando detrás del escenario.'},
      {q:'¿Relación?',a:'Discutimos ayer. Celos míos.',clue:'Julián reconoce celos.'},
      {q:'¿Es suyo el llavero?',a:'Sí. Lo perdí hace días.'}
    ]},
    {id:'maestro',name:'Don Ciro',role:'Maestro ceremonias',icon:'🎩',questions:[
      {q:'¿Quién prepara el equipo?',a:'El tramoyista, pero esa noche no vino.',clue:'El tramoyista habitual faltó.'}
    ]},
    {id:'payaso',name:'Bombo',role:'Payaso',icon:'🤡',questions:[
      {q:'¿Vio algo?',a:'A Julián cerca del trapecio antes. Solo.',clue:'Bombo vio a Julián solo.'},
      {q:'¿Enemigos?',a:'El ex de Estrella.'}
    ]},
    {id:'forzudo',name:'Hércules Vidal',role:'Forzudo (ex)',icon:'💪',questions:[
      {q:'¿Relación?',a:'Ex. Ella se fue con Julián.'},
      {q:'¿Le mandó cartas?',a:'Sí, pero no para amenazarla.'}
    ]},
    {id:'vidente',name:'Madame Zora',role:'Vidente',icon:'🔮',questions:[
      {q:'¿Qué vio?',a:'Muerte. Le dije que no hiciera el número.'},
      {q:'¿Quién celoso?',a:'Julián. Y Hércules.'}
    ]}
  ],
  killer:'julian',
  solution:'Julián saboteó el trapecio de su compañera. La carta era de Estrella exigiendo que dejara las drogas.',
  keyEvidence:['Cuerda cortada','Llavero de Julián','Bombo lo vio solo','Carta de Estrella']
},
{
  id:'oxford', num:'CASO #018', title:'El silencio de la Biblioteca',
  difficulty:'DIFÍCIL', superior:'ferreira', sceneType:'biblioteca',
  location:'Sala Bodelian, Oxford', time:'20:40 h',
  victim:'Profesor Edmund Ashworth', cause:'Apuñalado con abrecartas',
  intro:'El profesor yace entre incunables, atravesado por su abrecartas.',
  objects:[
    {id:'abrecartas',name:'Abrecartas',icon:'🗡️',desc:'Sin huellas.',clue:'Limpiaron el arma.'},
    {id:'manuscrito',name:'Manuscrito chamuscado',icon:'📜',desc:'Páginas arrancadas.',clue:'Intentaron quemarlo.'},
    {id:'copa',name:'Copa de vino',icon:'🍷',desc:'Restos de somnífero.',clue:'El profesor fue drogado.'},
    {id:'llaves',name:'Llaves',icon:'🔑',desc:'Solo dos copias.',clue:'Solo el bibliotecario tenía la otra.'},
    {id:'tinta',name:'Tintero volcado',icon:'🖋️',desc:'Huella de zapato pequeño.',clue:'Huella de zapato pequeño.'},
    {id:'reloj',name:'Reloj',icon:'🕰️',desc:'Parado a las 20:40.',clue:'Forcejeo a las 20:40.'}
  ],
  suspects:[
    {id:'eleanor',name:'Eleanor Ashworth',role:'Esposa',icon:'💍',questions:[
      {q:'¿Dónde estaba?',a:'En casa con amigas.'},
      {q:'¿Sabía del manuscrito?',a:'¿Qué manuscrito?',clue:'Eleanor dice no saber.'}
    ]},
    {id:'griffiths',name:'Dr. Griffiths',role:'Colega',icon:'🎓',questions:[
      {q:'¿Relación?',a:'Competíamos.'},
      {q:'¿Sabía del manuscrito?',a:'Era mío. Ashworth me lo robó.',clue:'Griffiths dice que era suyo.'},
      {q:'¿Estuvo aquí?',a:'Sí. Pero me fui antes de las 20:30.'}
    ]},
    {id:'poole',name:'Sr. Poole',role:'Bibliotecario',icon:'📚',questions:[
      {q:'¿Quién tiene llave?',a:'El profesor, yo, y quizá la Sra. Ashworth.'},
      {q:'¿Vio a alguien?',a:'Al Dr. Griffiths saliendo con prisa.'}
    ]},
    {id:'thomas',name:'Thomas Reed',role:'Estudiante',icon:'🎒',questions:[
      {q:'¿Dónde estaba?',a:'En la sala de lectura.'},
      {q:'¿Relación?',a:'Me suspendió la tesis.'}
    ]},
    {id:'hannah',name:'Hannah Bell',role:'Investigadora',icon:'🔍',questions:[
      {q:'¿Relación?',a:'Me ayudaba a cambio de silencio.'},
      {q:'¿Chantaje?',a:'Sí. Alguien le exigía el manuscrito.'}
    ]}
  ],
  killer:'griffiths',
  solution:'El Dr. Griffiths asesinó al profesor. El manuscrito era suyo, robado años atrás. Durmió a Ashworth con somnífero y lo apuñaló.',
  keyEvidence:['Manuscrito era de Griffiths','Somnífero en la copa','Huella de zapato','Poole lo vio salir']
},
{
  id:'opera', num:'CASO #019', title:'La nota final',
  difficulty:'DIFÍCIL', superior:'cruz', sceneType:'teatro',
  location:'Teatro Real, camerino de la soprano', time:'22:00 h',
  victim:'Soprano Isabella Moretti', cause:'Estrangulamiento',
  intro:'El telón cayó. La soprano no salió a saludar. La encontraron en su camerino.',
  objects:[
    {id:'bufanda',name:'Bufanda de seda',icon:'🧣',desc:'Apretada al cuello. Perfume a rosas.',clue:'Huele a rosas.'},
    {id:'espejo',name:'Espejo',icon:'🪞',desc:'Roto. "TRAIDORA" con carmín.',clue:'Alguien escribió "TRAIDORA".'},
    {id:'flores',name:'Ramo de rosas',icon:'🌹',desc:'Sin tarjeta. 12 rosas.',clue:'Ramo anónimo.'},
    {id:'programa',name:'Programa de mano',icon:'📄',desc:'"Después del 2º acto, camerino".',clue:'Alguien concertó una cita.'},
    {id:'movil',name:'Móvil',icon:'📱',desc:'"No puedes seguir así".',clue:'Isabella iba a dejar a alguien.'},
    {id:'pendientes',name:'Pendientes',icon:'💎',desc:'No están los de brillantes.',clue:'Faltan los pendientes caros.'}
  ],
  suspects:[
    {id:'director',name:'Director Massimo',role:'Director de escena',icon:'🎭',questions:[
      {q:'¿Dónde estaba?',a:'En el foso.'},
      {q:'¿Relación?',a:'Íbamos a casarnos. La vi coqueteando con el tenor.',clue:'Director celoso del tenor.'}
    ]},
    {id:'tenor',name:'Tenor Salvatore',role:'Tenor',icon:'🎤',questions:[
      {q:'¿Dónde estaba?',a:'En mi camerino.'},
      {q:'¿Relación?',a:'Amistad. Bueno... algo más.',clue:'Tenor admite algo más.'}
    ]},
    {id:'empresaria',name:'Sra. Bianchi',role:'Empresaria',icon:'💼',questions:[
      {q:'¿Dónde estaba?',a:'En el palco.'},
      {q:'¿Relación?',a:'Isabella me debía dinero. Mucho.'}
    ]},
    {id:'sustituta',name:'Lucia Ferrante',role:'Soprano sustituta',icon:'🎶',questions:[
      {q:'¿Dónde estaba?',a:'Entre bambalinas.'},
      {q:'¿Relación?',a:'Ella siempre fue la estrella.',clue:'Sustituta resentida.'}
    ]},
    {id:'sastre',name:'Sr. Rossi',role:'Sastre',icon:'🧵',questions:[
      {q:'¿Vio algo?',a:'Al director yendo al camerino tras el 2º acto.'}
    ]}
  ],
  killer:'director',
  solution:'El director Massimo estranguló a Isabella. Los celos lo consumían. Ella iba a dejarlo por el tenor. Los pendientes los cogió como falsa coartada.',
  keyEvidence:['Director celoso','Programa anotado','Sastre lo vio ir','Mensaje de ruptura']
},
{
  id:'transatlantico', num:'CASO #020', title:'Muerte en el Queen Mary',
  difficulty:'DIFÍCIL', superior:'ferreira', sceneType:'dormitorio',
  location:'Transatlántico Queen Mary', time:'01:00 h',
  victim:'Magnate Sir Reginald Hume', cause:'Veneno en el brandy',
  intro:'El magnate brindó por su nuevo imperio. A los cinco minutos, cayó.',
  objects:[
    {id:'copa',name:'Copa de brandy',icon:'🥃',desc:'Restos de un compuesto raro.',clue:'Veneno sintético.'},
    {id:'puros',name:'Puros',icon:'🚬',desc:'Etiqueta de La Habana.',clue:'Caja regalo de su socio.'},
    {id:'documentos',name:'Documentos',icon:'📁',desc:'Contrato que arruinaba al socio.',clue:'Iba a arruinar al socio.'},
    {id:'sobre',name:'Sobre lacrado',icon:'✉️',desc:'Para su abogado. Abierto antes.',clue:'El sobre fue abierto antes.'},
    {id:'botones',name:'Botones del camarote',icon:'🔘',desc:'Restos de polvo blanco.',clue:'Los botones tienen veneno.'},
    {id:'reloj',name:'Reloj',icon:'⌚',desc:'Parado a la 01:00.',clue:'Muere a la 01:00.'}
  ],
  suspects:[
    {id:'socio',name:'Lord Balfour',role:'Socio',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'A su lado. Brindando.'},
      {q:'¿Relación?',a:'Excelente. Hasta esta noche.',clue:'Relación forzada.'},
      {q:'¿Los puros son suyos?',a:'Sí. Un regalo.'}
    ]},
    {id:'secretaria',name:'Miss Parker',role:'Secretaria',icon:'📋',questions:[
      {q:'¿Dónde estaba?',a:'En el camarote contiguo.'},
      {q:'¿Abrió el sobre?',a:'No. Él lo abrió antes de cenar.',clue:'El sobre se abrió antes.'}
    ]},
    {id:'capitan',name:'Capitán Ellis',role:'Capitán',icon:'⚓',questions:[
      {q:'¿Dónde estaba?',a:'En el puente.'}
    ]},
    {id:'camarero',name:'James',role:'Camarero',icon:'🍾',questions:[
      {q:'¿Sirvió el brandy?',a:'Sí. Directamente de su botella.'},
      {q:'¿Vio a alguien?',a:'Lord Balfour tocó los botones del camarote antes de la cena.'}
    ]}
  ],
  killer:'socio',
  solution:'Lord Balfour envenenó a Sir Reginald. El contrato lo dejaba en la ruina. Añadió el veneno a los botones del camarote.',
  keyEvidence:['Contrato que arruinaba','Veneno en los botones','James lo vio tocar','Veneno sintético raro']
},
{
  id:'criptografo', num:'CASO #021', title:'El código roto',
  difficulty:'DIFÍCIL', superior:'cruz', sceneType:'despacho', corpsePose:'prone',
  location:'Agencia de inteligencia, sala 7', time:'23:45 h',
  victim:'Analista Iván Sierra', cause:'Electrocución',
  intro:'El analista Sierra yace junto a su terminal. Alguien manipuló los cables. En su pantalla: "ASES..."',
  objects:[
    {id:'cables',name:'Cables',icon:'🔌',desc:'Pelados a propósito.',clue:'Los cables fueron pelados.'},
    {id:'teclado',name:'Teclado',icon:'⌨️',desc:'Con sudor y un pelo.',clue:'Pelo rubio en el teclado.'},
    {id:'nota',name:'Nota cifrada',icon:'📝',desc:'Código a medio descifrar.',clue:'El código empieza por ASES.'},
    {id:'cafe',name:'Café',icon:'☕',desc:'Sin nada raro.',clue:'El café está limpio.'},
    {id:'acceso',name:'Registro de acceso',icon:'🖥️',desc:'23:20, usuario "MGRIS".',clue:'Alguien con usuario MGRIS entró a las 23:20.'},
    {id:'reloj',name:'Reloj',icon:'🕰️',desc:'Parado a las 23:45.',clue:'Muere a las 23:45.'}
  ],
  suspects:[
    {id:'director',name:'Director Vance',role:'Director',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En mi despacho.'},
      {q:'¿Relación?',a:'Profesional.'}
    ]},
    {id:'compañera',name:'Marta Gris',role:'Analista (MGRIS)',icon:'👩‍💻',questions:[
      {q:'¿Dónde estaba?',a:'En casa, dormida.'},
      {q:'¿Es su usuario?',a:'Sí. Pero no entré.',clue:'Marta dice no haber entrado.'},
      {q:'¿Relación?',a:'Buena. Bueno... él me había rechazado.',clue:'Había sido rechazada por Iván.'},
      {q:'¿De qué color es su pelo?',a:'Rubio natural.',clue:'Marta tiene pelo rubio.'}
    ]},
    {id:'rival',name:'Agente Novak',role:'Agente rival',icon:'🕵️',questions:[
      {q:'¿Dónde estaba?',a:'En la sala 3.'},
      {q:'¿Relación?',a:'Competíamos por un ascenso.'}
    ]},
    {id:'jefe',name:'Jefe Halloway',role:'Jefe de seguridad',icon:'🛡️',questions:[
      {q:'¿Quién tiene acceso?',a:'Yo, Iván, Marta y Novak.'}
    ]},
    {id:'limpiador',name:'Sr. Petrov',role:'Limpiador',icon:'🧹',questions:[
      {q:'¿Vio algo?',a:'A Marta entrando a las 23:00.'}
    ]}
  ],
  killer:'compañera',
  solution:'Marta Gris asesinó a Iván. Había sido rechazada. Entró con la excusa de haber olvidado algo, peló los cables y esperó fuera.',
  keyEvidence:['Pelo rubio en el teclado','Usuario MGRIS','Petrov la vio entrar','Rechazo sentimental']
},
{
  id:'observatorio', num:'CASO #022', title:'La última estrella',
  difficulty:'DIFÍCIL', superior:'ferreira', sceneType:'despacho', corpsePose:'curled',
  location:'Observatorio del Teide', time:'03:30 h',
  victim:'Astrónomo Dr. Vega', cause:'Caída desde la cúpula',
  intro:'El telescopio seguía apuntando a Orión. El Dr. Vega yace al pie de la escalera.',
  objects:[
    {id:'arnes',name:'Arnés',icon:'🪢',desc:'Desenganchado.',clue:'Alguien lo desenganchó a propósito.'},
    {id:'escalera',name:'Escalera',icon:'🪜',desc:'Peldaño suelto.',clue:'El peldaño fue aflojado.'},
    {id:'cuaderno',name:'Cuaderno',icon:'📓',desc:'"R.S. miente sobre el cometa".',clue:'Vega investigaba a R.S.'},
    {id:'portatil',name:'Portátil',icon:'💻',desc:'Correo denunciando fraude.',clue:'Vega denunciaba un fraude.'},
    {id:'guantes',name:'Guantes',icon:'🧤',desc:'Talla L, con grasa.',clue:'Guantes de talla L.'},
    {id:'cafe',name:'Café',icon:'☕',desc:'Todavía caliente.',clue:'Vega estuvo aquí hace poco.'}
  ],
  suspects:[
    {id:'director',name:'Dr. Ramírez',role:'Director',icon:'🔭',questions:[
      {q:'¿Dónde estaba?',a:'En mi despacho.'},
      {q:'¿Relación?',a:'Buena. Vega era mi mejor astrónomo.'},
      {q:'¿Sabía del fraude?',a:'No sé de qué habla.'}
    ]},
    {id:'investigador',name:'Dr. Salas',role:'Investigador (R.S.)',icon:'🔬',questions:[
      {q:'¿Dónde estaba?',a:'En mi habitación.'},
      {q:'¿Relación?',a:'Tensa. Vega me acusaba de falsear datos.',clue:'Vega acusaba a Salas.'},
      {q:'¿Talla de guantes?',a:'¿Por qué lo pregunta?',clue:'Salas usa talla L.'}
    ]},
    {id:'estudiante',name:'Elena Prats',role:'Estudiante',icon:'🎓',questions:[
      {q:'¿Dónde estaba?',a:'Observando desde la cúpula pequeña.'},
      {q:'¿Relación?',a:'Iba a suspender mi tesis.'}
    ]},
    {id:'tecnico',name:'Sr. Gómez',role:'Técnico',icon:'🔧',questions:[
      {q:'¿Los guantes son suyos?',a:'No. Yo uso talla M.'}
    ]},
    {id:'vigilante',name:'Juan Pérez',role:'Vigilante',icon:'👮',questions:[
      {q:'¿Vio algo?',a:'Al Dr. Salas subiendo a la cúpula principal a las 03:00.'}
    ]}
  ],
  killer:'investigador',
  solution:'El Dr. Salas asesinó al Dr. Vega. Vega había descubierto que Salas falseaba datos y había enviado un correo denunciándolo.',
  keyEvidence:['Arnés desenganchado','Peldaño suelto','Correo denunciando','Vigilante lo vio subir']
},
{
  id:'laboratorio', num:'CASO #023', title:'El experimento final',
  difficulty:'DIFÍCIL', superior:'cruz', sceneType:'despacho',
  location:'Laboratorio BioGen, nivel 3', time:'19:30 h',
  victim:'Dra. Ana Belmonte', cause:'Envenenamiento por gas',
  intro:'La Dra. Belmonte yace en la cámara de aislamiento. Las válvulas de gas estaban abiertas.',
  objects:[
    {id:'valvula',name:'Válvula de gas',icon:'🔧',desc:'Abierta, no forzada.',clue:'Alguien abrió la válvula con conocimiento.'},
    {id:'monitor',name:'Monitor',icon:'📹',desc:'Bucle de 30 minutos.',clue:'El vídeo en bucle 30 min.'},
    {id:'tarjeta',name:'Tarjeta',icon:'💳',desc:'De la Dra. Belmonte.',clue:'Entró a las 19:00.'},
    {id:'muestra',name:'Muestra',icon:'🧪',desc:'Desaparecida.',clue:'Falta una muestra experimental.'},
    {id:'nota',name:'Nota en taquilla',icon:'📝',desc:'"Voy a denunciar lo de la muestra".',clue:'Iba a denunciar un robo.'},
    {id:'guantes',name:'Guantes',icon:'🧤',desc:'En taquilla 12 (Rovira).',clue:'Guantes en taquilla de Rovira.'}
  ],
  suspects:[
    {id:'director',name:'Dr. Rovira',role:'Director',icon:'🧪',questions:[
      {q:'¿Dónde estaba?',a:'En mi despacho.'},
      {q:'¿Relación?',a:'Profesional.'},
      {q:'¿Algo en su taquilla?',a:'Nada. Bueno, unos guantes.'}
    ]},
    {id:'becaria',name:'Lucía Marín',role:'Becaria',icon:'🔬',questions:[
      {q:'¿Dónde estaba?',a:'En el nivel 1.'},
      {q:'¿Relación?',a:'Ana me ayudaba mucho.'}
    ]},
    {id:'rival',name:'Dr. Ortega',role:'Investigador',icon:'🧫',questions:[
      {q:'¿Dónde estaba?',a:'En el animalario.'},
      {q:'¿Relación?',a:'Competíamos por el mismo proyecto.'}
    ]},
    {id:'tecnico',name:'Sr. Bosch',role:'Técnico de gas',icon:'🔧',questions:[
      {q:'¿Quién sabe abrir la válvula?',a:'Yo, la Dra. y el Dr. Rovira.'}
    ]},
    {id:'vigilante',name:'Sr. Anaya',role:'Vigilante',icon:'👮',questions:[
      {q:'¿Vio algo?',a:'El monitor en bucle a las 19:10. Vi al Dr. Rovira saliendo del nivel 3 a las 19:20.'}
    ]}
  ],
  killer:'director',
  solution:'El Dr. Rovira asesinó a la Dra. Belmonte. Ella había descubierto que él robaba muestras. Rovira puso el monitor en bucle, abrió la válvula y esperó.',
  keyEvidence:['Válvula abierta con conocimiento','Monitor en bucle','Guantes en su taquilla','Vigilante lo vio salir']
},
{
  id:'castillo', num:'CASO #024', title:'El secreto del torreón',
  difficulty:'DIFÍCIL', superior:'lisboa', sceneType:'dormitorio',
  location:'Castillo de Rocanegra, torreón norte', time:'21:00 h',
  victim:'Conde Alejandro de Rocanegra', cause:'Disparo',
  intro:'El conde yace en su despacho del torreón. Un disparo en el pecho. La pistola, en el suelo.',
  objects:[
    {id:'pistola',name:'Pistola',icon:'🔫',desc:'Sin huellas.',clue:'Limpiaron la pistola.'},
    {id:'guante',name:'Guante',icon:'🧤',desc:'Talla pequeña.',clue:'Guante de mujer.'},
    {id:'ventana',name:'Ventana',icon:'🪟',desc:'Marcas de cuerda.',clue:'Alguien escapó por la ventana.'},
    {id:'libro',name:'Libro de familia',icon:'📖',desc:'Página sobre un hijo bastardo.',clue:'El conde tenía un hijo bastardo.'},
    {id:'testamento',name:'Testamento',icon:'📜',desc:'Firmado ayer. Todo al sobrino.',clue:'El sobrino hereda todo.'},
    {id:'reloj',name:'Reloj',icon:'🕰️',desc:'Parado a las 21:00.',clue:'Muere a las 21:00.'}
  ],
  suspects:[
    {id:'sobrino',name:'Diego de Rocanegra',role:'Sobrino',icon:'🎩',questions:[
      {q:'¿Dónde estaba?',a:'En el salón con la familia.'},
      {q:'¿Hereda algo?',a:'Todo. Pero no lo necesito.',clue:'El sobrino hereda todo.'},
      {q:'¿Relación?',a:'Buena. Bueno... discutíamos a veces.'}
    ]},
    {id:'ama',name:'Luisa Fernández',role:'Ama de llaves',icon:'🧹',questions:[
      {q:'¿Dónde estaba?',a:'Sirviendo la cena.'},
      {q:'¿Talla de guantes?',a:'La 7, pequeña.',clue:'Luisa usa guantes pequeños.'},
      {q:'¿Relación?',a:'Le servía desde hace 30 años.'}
    ]},
    {id:'hijo',name:'Marcos Ruiz',role:'Hijo bastardo',icon:'⚔️',questions:[
      {q:'¿Dónde estaba?',a:'En mi casa, en el pueblo.'},
      {q:'¿Sabía que era su hijo?',a:'Lo descubrí hace un mes.',clue:'Descubrió que era hijo del conde.'},
      {q:'¿Vino al castillo?',a:'Sí, esta tarde. Discutimos.'}
    ]},
    {id:'médico',name:'Dr. Sánchez',role:'Médico de familia',icon:'🩺',questions:[
      {q:'¿Dónde estaba?',a:'En el ala este.'},
      {q:'¿Relación?',a:'El conde estaba muy enfermo.'}
    ]},
    {id:'guardés',name:'Pedro Álvarez',role:'Guardés',icon:'🌲',questions:[
      {q:'¿Vio algo?',a:'Una figura saltando por la ventana. Ágil, joven.'}
    ]}
  ],
  killer:'hijo',
  solution:'Marcos Ruiz, el hijo bastardo, asesinó al conde. Acababa de descubrir su origen y vino a reclamar lo que creía suyo. El conde se negó a reconocerlo. Salió por la ventana con una cuerda.',
  keyEvidence:['Cuerda por la ventana','Guante de mujer (despiste)','Hijo bastardo','Guardés vio figura joven']
}
];