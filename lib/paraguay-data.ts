export const paraguayDepartments: Record<string, string[]> = {
  "Asuncion": ["Asuncion"],
  "Central": ["San Lorenzo", "Luque", "Fernando de la Mora", "Lambare", "Capiata", "Limpio", "Nemby", "Mariano Roque Alonso", "Villa Elisa", "San Antonio", "Ita", "Aregua", "Ypacarai", "Guarambare", "Villeta", "San Juan Bautista Nvapy", "Ypane", "Nueva Italia", "J. Augusto Saldivar"],
  "Alto Parana": ["Ciudad del Este", "Hernandarias", "Presidente Franco", "Minga Guazu", "Santa Rita", "Juan Leon Mallorquin", "Naranjal", "San Cristobal", "Domingo Martinez de Irala", "Minga Pora", "Yguazu", "Los Cedrales", "Santa Rosa del Monday"],
  "Itapua": ["Encarnacion", "Hohenau", "Obligado", "Bella Vista", "Capitan Miranda", "Jesus", "Trinidad", "Natalio", "Fram", "Carmen del Parana", "Coronel Bogado", "La Paz", "San Pedro del Parana", "General Artigas", "Pirapo", "Alto Vera"],
  "Caaguazu": ["Coronel Oviedo", "Caaguazu", "Dr. Juan Manuel Frutos", "Repatriacion", "San Jose de los Arroyos", "La Pastora", "3 de Febrero", "Simon Bolivar", "YHU", "Dr. Cecilio Baez"],
  "San Pedro": ["San Pedro del Ycuamandiyu", "San Estanislao", "Lima", "Chore", "Guayaibi", "Itacurubi del Rosario", "General Elizardo Aquino", "Union", "25 de Diciembre", "Villa del Rosario", "Tacuati"],
  "Paraguari": ["Paraguari", "Ybycui", "Carapegua", "Quiindy", "Acahay", "La Colmena", "Sapucai", "Pirayú", "Caballero", "Yaguaron", "Mbuyapey"],
  "Caazapa": ["Caazapa", "Yuty", "San Juan Nepomuceno", "Abai", "General Higinio Morinigo", "Tavai", "3 de Mayo", "Maciel", "Fulgencio Yegros", "Dr. Moises Bertoni"],
  "Guaira": ["Villarrica", "Iturbe", "Independencia", "Mbocayaty", "Natalicio Talavera", "Paso Yobai", "Felix Perez Cardozo", "Borja", "Dr. Bottrell", "Tebicuary", "Colonia Independencia"],
  "Cordillera": ["Caacupe", "Tobati", "Altos", "Eusebio Ayala", "Piribebuy", "San Bernardino", "Atyra", "Arroyos y Esteros", "Emboscada", "Isla Pucu", "Loma Grande", "Valenzuela"],
  "Misiones": ["San Juan Bautista", "Ayolas", "San Ignacio", "Santa Maria", "Santiago", "San Patricio", "Santa Rosa", "Villa Florida", "Yabebyry"],
  "Neembucu": ["Pilar", "Alberdi", "Cerrito", "Desmochados", "General Jose Eduvigis Diaz", "Guazu Cua", "Humaitá", "Isla Umbu", "Laureles", "Mayor Martinez", "Paso de Patria", "San Juan Bautista de Neembucu", "Tacuaras", "Villa Franca", "Villalbin"],
  "Amambay": ["Pedro Juan Caballero", "Capitan Bado", "Bella Vista Norte", "Zanja Pytá"],
  "Canindeyu": ["Salto del Guaira", "Curuguaty", "Villa Ygatimi", "Ypejhu", "Corpus Christi", "Itanara", "Katueté", "La Paloma", "Nueva Esperanza"],
  "Concepcion": ["Concepcion", "Horqueta", "Loreto", "Belen", "San Carlos del Apa", "San Lazaro", "Yby Yau", "Azotey", "Paso Barreto", "Sgto. Jose Felix Lopez"],
  "Presidente Hayes": ["Benjamin Aceval", "Villa Hayes", "Nanawa", "Jose Falcon", "Puerto Pinasco", "Teniente 1ro Manuel Irala Fernandez"],
  "Boqueron": ["Filadelfia", "Loma Plata", "Neuland", "Mcal. Estigarribia"],
  "Alto Paraguay": ["Fuerte Olimpo", "Puerto Casado", "Carmelo Peralta", "Mayor Pablo Lagerenza"]
}

export const departmentsList = Object.keys(paraguayDepartments).sort()

export function getCities(department: string): string[] {
  return paraguayDepartments[department] || []
}
