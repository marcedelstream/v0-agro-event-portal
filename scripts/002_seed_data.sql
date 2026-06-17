-- Insertar eventos de prueba
INSERT INTO events (title, description, long_description, category, date, time, location, is_premium, is_approved, speakers) VALUES
(
  'Expo Agro 2026',
  'La mayor exposición agrícola del año con las últimas innovaciones en maquinaria y tecnología.',
  'Expo Agro 2026 es el evento más esperado del sector agrícola. Durante tres días, los visitantes podrán conocer las últimas innovaciones en maquinaria agrícola, sistemas de riego inteligente, drones para agricultura de precisión y mucho más. Contaremos con la participación de más de 200 expositores nacionales e internacionales.',
  'agricultura',
  CURRENT_DATE + INTERVAL '3 days',
  '09:00',
  'Centro de Convenciones Mariscal',
  false,
  true,
  ARRAY['Dr. Carlos Mendoza', 'Ing. María González', 'Prof. Roberto Sánchez']
),
(
  'Cumbre AgroTech 2026',
  'Evento premium sobre tecnología aplicada al agro con speakers internacionales.',
  'La Cumbre AgroTech 2026 reúne a los principales líderes de la industria agrotecnológica mundial. Este evento exclusivo contará con conferencias magistrales, paneles de discusión y networking de alto nivel. Los asistentes tendrán acceso a información privilegiada sobre las tendencias que transformarán el sector en los próximos años.',
  'capacitaciones',
  CURRENT_DATE + INTERVAL '5 days',
  '08:30',
  'Hotel Guaraní Asunción',
  true,
  true,
  ARRAY['John Smith - AgriTech USA', 'Ana Rodríguez - Smart Farming EU', 'Carlos Fernández - AgroIA Argentina']
),
(
  'Feria Ganadera Nacional',
  'Exposición de ganado de alta genética y jornadas de capacitación.',
  'La Feria Ganadera Nacional es el punto de encuentro para productores, criadores y profesionales del sector pecuario. Este año presentamos las mejores cabezas de ganado bovino, equino y porcino del país. Además, se realizarán remates, juzgamientos y charlas técnicas sobre mejoramiento genético.',
  'ganaderia',
  CURRENT_DATE + INTERVAL '10 days',
  '07:00',
  'Campo Ferial de Loma Plata',
  false,
  true,
  ARRAY['Dr. Juan Pérez', 'Vet. Laura Martínez']
),
(
  'Seminario de Agricultura Sostenible',
  'Aprende técnicas de cultivo regenerativo y prácticas sustentables.',
  'Un seminario intensivo de dos días donde aprenderás las bases de la agricultura regenerativa, manejo integrado de plagas, rotación de cultivos y técnicas para mejorar la salud del suelo. Ideal para productores que buscan transitar hacia un modelo más sostenible.',
  'sostenibilidad',
  CURRENT_DATE + INTERVAL '7 days',
  '14:00',
  'Universidad Nacional de Asunción',
  false,
  true,
  ARRAY['Dra. Patricia Flores', 'Ing. Agr. Miguel Torres']
),
(
  'Congreso Forestal Paraguay 2026',
  'El encuentro más importante del sector forestal con expertos internacionales.',
  'El Congreso Forestal Paraguay 2026 abordará temas como manejo forestal sostenible, certificaciones internacionales, mercado de carbono y restauración de ecosistemas. Contará con la participación de representantes de FAO, WWF y empresas líderes del sector.',
  'forestal',
  CURRENT_DATE + INTERVAL '15 days',
  '08:00',
  'Centro de Convenciones Asunción',
  false,
  true,
  ARRAY['Dr. Fernando Ruiz - FAO', 'Ing. Forestal Carolina López']
);

-- Insertar proveedores de prueba
INSERT INTO providers (name, category, description, contact_email, contact_phone, website, is_approved) VALUES
('AudioPro Eventos', 'audiovisual', 'Equipos de sonido e iluminación profesional para eventos de cualquier escala.', 'contacto@audiopro.com.py', '+595 21 555 1234', 'www.audiopro.com.py', true),
('Catering Don Miguel', 'catering', 'Servicio de catering gourmet especializado en eventos corporativos y ferias.', 'reservas@cateringdonmiguel.com', '+595 21 555 5678', 'www.cateringdonmiguel.com', true),
('Stands & Diseño', 'stands', 'Diseño y construcción de stands personalizados para exposiciones y ferias.', 'info@standsydiseno.com.py', '+595 21 555 9012', 'www.standsydiseno.com.py', true),
('DecoAgro', 'decoracion', 'Decoración temática especializada en eventos del sector agropecuario.', 'ventas@decoagro.com', '+595 21 555 3456', 'www.decoagro.com', true),
('TransLog Paraguay', 'logistica', 'Servicios logísticos integrales para ferias y exposiciones.', 'operaciones@translog.com.py', '+595 21 555 7890', 'www.translog.com.py', true),
('Seguridad Total', 'seguridad', 'Seguridad privada y control de accesos para eventos masivos.', 'contratos@seguridadtotal.com.py', '+595 21 555 2345', 'www.seguridadtotal.com.py', true);

-- Insertar banner de prueba
INSERT INTO banners (title, image_url, link_url, is_active, display_order) VALUES
('Cumbre AgroTech 2026 - Evento Destacado', '/agricultural-fair-banner-with-tractors.jpg', NULL, true, 1);
