export const paraguayDepartments: Record<string, string[]> = {
  "Asuncion": ["Asuncion"],
  "Central": [
    "Aregua", "Capiata", "Fernando de la Mora", "Guarambare", "Ita",
    "Itaugua", "J. Augusto Saldivar", "Lambare", "Limpio", "Luque",
    "Mariano Roque Alonso", "Nemby", "Nueva Italia", "San Antonio",
    "San Lorenzo", "Villa Elisa", "Villeta", "Ypacarai", "Ypane",
  ],
  "Alto Parana": [
    "Ciudad del Este", "Hernandarias", "Presidente Franco", "Minga Guazu",
    "Santa Rita", "Juan Leon Mallorquin", "Naranjal", "San Cristobal",
    "Domingo Martinez de Irala", "Minga Pora", "Yguazu", "Los Cedrales",
    "Santa Rosa del Monday", "Itakyry", "Nacunday", "San Alberto", "Iruna",
    "Tavapy", "Nueva Esperanza",
  ],
  "Itapua": [
    "Encarnacion", "Hohenau", "Obligado", "Bella Vista", "Capitan Miranda",
    "Jesus", "Trinidad", "Natalio", "Fram", "Carmen del Parana",
    "Coronel Bogado", "La Paz", "San Pedro del Parana", "General Artigas",
    "Pirapo", "Alto Vera", "San Cosme y Damian", "Mayor Otano",
    "Carlos Antonio Lopez", "Edelira", "Cambyreta", "Tomas Romero Pereira",
    "Leandro Oviedo", "Yatytay",
  ],
  "Caaguazu": [
    "Coronel Oviedo", "Caaguazu", "Dr. Juan Manuel Frutos", "Repatriacion",
    "San Jose de los Arroyos", "La Pastora", "3 de Febrero", "Simon Bolivar",
    "YHU", "Dr. Cecilio Baez", "Carayao", "Jose Domingo Ocampos",
    "Mcal. Francisco Solano Lopez", "Nueva Londres", "Raul Arsenio Oviedo",
    "San Joaquin", "Vaqueria", "R. I. 3 Corrales",
  ],
  "San Pedro": [
    "San Pedro del Ycuamandiyu", "San Estanislao", "Lima", "Chore",
    "Guayaibi", "Itacurubi del Rosario", "General Elizardo Aquino",
    "Union", "25 de Diciembre", "Villa del Rosario", "Tacuati",
    "Antequera", "Capiibary", "Liberacion", "Nueva Germania", "San Pablo",
    "Santa Rosa del Aguaray", "Yataity del Norte", "General Resquin",
  ],
  "Paraguari": [
    "Paraguari", "Ybycui", "Carapegua", "Quiindy", "Acahay", "La Colmena",
    "Sapucai", "Pirayu", "Caballero", "Yaguaron", "Mbuyapey",
    "Escobar", "General Bernardino Caballero", "Quyquyhó",
    "San Roque Gonzalez de Santa Cruz", "Tebicuarymi",
  ],
  "Caazapa": [
    "Caazapa", "Yuty", "San Juan Nepomuceno", "Abai",
    "General Higinio Morinigo", "Tavai", "3 de Mayo", "Maciel",
    "Fulgencio Yegros", "Dr. Moises Bertoni", "Buena Vista",
  ],
  "Guaira": [
    "Villarrica", "Iturbe", "Independencia", "Mbocayaty", "Natalicio Talavera",
    "Paso Yobai", "Felix Perez Cardozo", "Borja", "Dr. Bottrell",
    "Tebicuary", "Colonia Independencia", "Coronel Martinez",
    "General Eugenio A. Garay", "San Salvador",
  ],
  "Cordillera": [
    "Caacupe", "Tobati", "Altos", "Eusebio Ayala", "Piribebuy",
    "San Bernardino", "Atyra", "Arroyos y Esteros", "Emboscada",
    "Isla Pucu", "Loma Grande", "Valenzuela", "Caraguatay",
    "Itacurubi de la Cordillera", "Juan de Mena", "Primero de Marzo",
    "San Jose Obrero",
  ],
  "Misiones": [
    "San Juan Bautista", "Ayolas", "San Ignacio", "Santa Maria",
    "Santiago", "San Patricio", "Santa Rosa", "Villa Florida", "Yabebyry",
  ],
  "Neembucu": [
    "Pilar", "Alberdi", "Cerrito", "Desmochados",
    "General Jose Eduvigis Diaz", "Guazu Cua", "Humaita", "Isla Umbu",
    "Laureles", "Mayor Martinez", "Paso de Patria",
    "San Juan Bautista de Neembucu", "Tacuaras", "Villa Franca", "Villalbin",
  ],
  "Amambay": [
    "Pedro Juan Caballero", "Capitan Bado", "Bella Vista Norte",
    "Zanja Pyta", "Karapa'i",
  ],
  "Canindeyu": [
    "Salto del Guaira", "Curuguaty", "Villa Ygatimi", "Ypejhu",
    "Corpus Christi", "Itanara", "Katueté", "La Paloma", "Nueva Esperanza",
    "Gral. Diaz", "Yasy Cañy", "Puerto Adela",
  ],
  "Concepcion": [
    "Concepcion", "Horqueta", "Loreto", "Belen", "San Carlos del Apa",
    "San Lazaro", "Yby Yau", "Azotey", "Paso Barreto",
    "Sgto. Jose Felix Lopez", "Arroyito", "General Francisco Alvarez",
  ],
  "Presidente Hayes": [
    "Benjamin Aceval", "Villa Hayes", "Nanawa", "Jose Falcon",
    "Puerto Pinasco", "Teniente 1ro Manuel Irala Fernandez",
    "Pozo Colorado", "Rio Verde",
  ],
  "Boqueron": [
    "Filadelfia", "Loma Plata", "Neuland", "Mcal. Estigarribia",
  ],
  "Alto Paraguay": [
    "Fuerte Olimpo", "Puerto Casado", "Carmelo Peralta",
    "Mayor Pablo Lagerenza", "Bahia Negra",
  ],
}

export const departmentsList = Object.keys(paraguayDepartments).sort()

export function getCities(department: string): string[] {
  if (department === "Internacional") return []
  return (paraguayDepartments[department] || []).sort()
}

export const southAmericanCountries = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Ecuador",
  "Guyana",
  "Paraguay",
  "Perú",
  "Surinam",
  "Uruguay",
  "Venezuela",
  // América Central y México (relevantes para agro regional)
  "México",
  "Panamá",
  "Costa Rica",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Cuba",
  // Otros
  "España",
  "Otro",
]
