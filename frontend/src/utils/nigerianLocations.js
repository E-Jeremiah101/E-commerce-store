// Complete Nigerian States, Cities with auto-derived LGAs
export const NIGERIAN_LOCATIONS = {
  // Southern States
  ABIA: {
    label: "Abia State",
    capital: "Umuahia",
    cities: {
      Umuahia: {
        lgAs: ["Umuahia North", "Umuahia South"],
        areas: ["Isi Gate", "Bende Road", "Old Umuahia"],
      },
      Aba: {
        lgAs: ["Aba North", "Aba South"],
        areas: ["Ariaria", "Asa Road", "Eziukwu", "Ogbor Hill"],
      },
      Ohafia: { lgAs: ["Ohafia"], areas: ["Ebem Ohafia", "Akanu Ohafia"] },
      Arochukwu: { lgAs: ["Arochukwu"], areas: ["Arochukwu Town", "Ibom"] },
    },
  },

  ADAMAWA: {
    label: "Adamawa State",
    capital: "Yola",
    cities: {
      Yola: {
        lgAs: ["Yola North", "Yola South"],
        areas: ["Jimeta", "Doubeli", "Karewa"],
      },
      Mubi: {
        lgAs: ["Mubi North", "Mubi South"],
        areas: ["GRA Mubi", "Sabon Layi"],
      },
      Ganye: { lgAs: ["Ganye"], areas: ["Ganye Town"] },
    },
  },

  AKWA_IBOM: {
    label: "Akwa Ibom State",
    capital: "Uyo",
    cities: {
      Uyo: {
        lgAs: ["Uyo"],
        areas: ["Ewet Housing", "Ibom Plaza", "Oron Road"],
      },
      Eket: { lgAs: ["Eket"], areas: ["Eket Town", "Idua"] },
      "Ikot Ekpene": {
        lgAs: ["Ikot Ekpene"],
        areas: ["Ikot Ekpene Town", "Four Lanes"],
      },
      Oron: { lgAs: ["Oron"], areas: ["Oron Town"] },
    },
  },

  ANAMBRA: {
    label: "Anambra State",
    capital: "Awka",
    cities: {
      Awka: {
        lgAs: ["Awka North", "Awka South"],
        areas: ["Ifite", "Okpuno", "Umuzocha"],
      },
      Onitsha: {
        lgAs: ["Onitsha North", "Onitsha South"],
        areas: ["Main Market", "GRA", "Fegge", "Odoakpu"],
      },
      Nnewi: {
        lgAs: ["Nnewi North", "Nnewi South"],
        areas: ["Otolo", "Uruagu", "Umudim"],
      },
      Ekpoma: { lgAs: ["Ekpoma"], areas: ["Irrua Road", "Ujemen"] },
    },
  },

  BAYELSA: {
    label: "Bayelsa State",
    capital: "Yenagoa",
    cities: {
      Yenagoa: {
        lgAs: ["Yenagoa"],
        areas: ["Kpansia", "Edepie", "Etegwe", "Okutukutu"],
      },
      Brass: { lgAs: ["Brass"], areas: ["Brass Town"] },
      Sagbama: { lgAs: ["Sagbama"], areas: ["Sagbama Town"] },
    },
  },

  CROSS_RIVER: {
    label: "Cross River State",
    capital: "Calabar",
    cities: {
      Calabar: {
        lgAs: ["Calabar Municipal", "Calabar South"],
        areas: ["Marian", "Etta Agbor", "State Housing", "8 Miles"],
      },
      Ikom: { lgAs: ["Ikom"], areas: ["Ikom Town"] },
      Ogoja: { lgAs: ["Ogoja"], areas: ["Ogoja Town"] },
    },
  },

  DELTA: {
    label: "Delta State",
    capital: "Asaba",
    cities: {
      Asaba: {
        lgAs: ["Oshimili South"],
        areas: ["Cable Point", "Okpanam Road", "Nnebisi Road"],
      },
      Warri: {
        lgAs: ["Warri South", "Warri South West"],
        areas: ["Effurun", "Ekpan", "Pessu", "Edjeba"],
      },
      Ughelli: {
        lgAs: ["Ughelli North", "Ughelli South"],
        areas: ["Ughelli Town", "Otor-Ughelli"],
      },
      Sapele: { lgAs: ["Sapele"], areas: ["Sapele Town", "Amukpe"] },
    },
  },

  EDO: {
    label: "Edo State",
    capital: "Benin City",
    cities: {
      "Benin City": {
        lgAs: ["Oredo", "Egor", "Ikpoba-Okha"],
        areas: [
          "GRA",
          "Ring Road",
          "Ugbowo",
          "New Benin",
          "Ogida",
          "Akpakpava",
          "Sapele Road",
        ],
      },
      Ekpoma: {
        lgAs: ["Esan West"],
        areas: ["Irrua Road", "Ujemen", "Emaudo"],
      },
      Auchi: {
        lgAs: ["Etsako West"],
        areas: ["Jattu", "Iyerekhu", "Igbe", "Auchi Town"],
      },
      Uromi: {
        lgAs: ["Esan North-East"],
        areas: ["Uzea", "Ewohinmi", "Ugboha"],
      },
    },
  },

  EKITI: {
    label: "Ekiti State",
    capital: "Ado-Ekiti",
    cities: {
      "Ado-Ekiti": {
        lgAs: ["Ado Ekiti"],
        areas: ["Ijigbo", "Okeyinmi", "Ajilosun", "Basiri"],
      },
      "Ikere-Ekiti": { lgAs: ["Ikere"], areas: ["Ikere Town"] },
      "Igede-Ekiti": { lgAs: ["Igede"], areas: ["Igede Town"] },
    },
  },

  ENUGU: {
    label: "Enugu State",
    capital: "Enugu",
    cities: {
      Enugu: {
        lgAs: ["Enugu North", "Enugu South", "Enugu East"],
        areas: ["Independence Layout", "GRA", "Ogui", "Abakpa", "Trans Ekulu"],
      },
      Nsukka: { lgAs: ["Nsukka"], areas: ["Nsukka Town", "University Road"] },
      Awgu: { lgAs: ["Awgu"], areas: ["Awgu Town"] },
    },
  },

  IMO: {
    label: "Imo State",
    capital: "Owerri",
    cities: {
      Owerri: {
        lgAs: ["Owerri Municipal", "Owerri North", "Owerri West"],
        areas: ["Douglas", "Aladinma", "Ikenegbu", "World Bank"],
      },
      Orlu: { lgAs: ["Orlu"], areas: ["Orlu Town"] },
      Okigwe: { lgAs: ["Okigwe"], areas: ["Okigwe Town"] },
    },
  },

  LAGOS: {
    label: "Lagos State",
    capital: "Ikeja",
    cities: {
      Ikeja: {
        lgAs: ["Ikeja"],
        areas: [
          "Alausa",
          "Opebi",
          "Allen Avenue",
          "Airport Road",
          "Adeniyi Jones",
        ],
      },
      Surulere: {
        lgAs: ["Surulere"],
        areas: ["Aguda", "Ojuelegba", "Bode Thomas", "Lawanson", "Itire"],
      },
      Lekki: {
        lgAs: ["Eti Osa"],
        areas: ["Lekki Phase 1", "Victoria Island", "Ikoyi", "Chevron", "Ajah"],
      },
      Ikorodu: {
        lgAs: ["Ikorodu"],
        areas: ["Igbogbo", "Mile 12", "Agric", "Ebute", "Itaoluwo"],
      },
      Agege: {
        lgAs: ["Agege"],
        areas: ["Agege Town", "Oko Oba", "Papa Ashafa"],
      },
      Badagry: { lgAs: ["Badagry"], areas: ["Badagry Town", "Ajara"] },
      Mushin: {
        lgAs: ["Mushin"],
        areas: ["Mushin Town", "Palm Avenue", "Olosha"],
      },
      Alimosho: {
        lgAs: ["Alimosho"],
        areas: ["Egbeda", "Ikotun", "Igando", "Ipaja"],
      },
      Apapa: { lgAs: ["Apapa"], areas: ["Apapa Town", "Kirikiri"] },
      Mainland: {
        lgAs: ["Lagos Mainland"],
        areas: ["Ebute Metta", "Yaba", "Jibowu"],
      },
      Island: {
        lgAs: ["Lagos Island"],
        areas: ["Marina", "Idumota", "CMS", "Broad Street"],
      },
    },
  },

  OGUN: {
    label: "Ogun State",
    capital: "Abeokuta",
    cities: {
      Abeokuta: {
        lgAs: ["Abeokuta North", "Abeokuta South"],
        areas: ["Kuto", "Itoku", "Ibara", "Sapon", "Adigbe"],
      },
      Sagamu: { lgAs: ["Sagamu"], areas: ["Sagamu Town", "Makun"] },
      "Ijebu Ode": {
        lgAs: ["Ijebu Ode"],
        areas: ["Ijebu Ode Town", "Ita Alapo"],
      },
    },
  },

  ONDO: {
    label: "Ondo State",
    capital: "Akure",
    cities: {
      Akure: {
        lgAs: ["Akure South"],
        areas: ["Oba Ile", "Oda Road", "Iyere", "Shagari"],
      },
      Ondo: {
        lgAs: ["Ondo East", "Ondo West"],
        areas: ["Ondo Town", "Oke Agunla"],
      },
    },
  },

  OSUN: {
    label: "Osun State",
    capital: "Osogbo",
    cities: {
      Osogbo: { lgAs: ["Osogbo"], areas: ["Oke Fia", "Oja Oba", "Isale Osun"] },
      "Ile-Ife": {
        lgAs: ["Ife Central", "Ife East"],
        areas: ["OAU Campus", "Modakeke", "Iremo"],
      },
      Ilesa: { lgAs: ["Ilesa East", "Ilesa West"], areas: ["Ilesa Town"] },
    },
  },

  OYO: {
    label: "Oyo State",
    capital: "Ibadan",
    cities: {
      Ibadan: {
        lgAs: [
          "Ibadan North",
          "Ibadan North East",
          "Ibadan North West",
          "Ibadan South East",
          "Ibadan South West",
        ],
        areas: [
          "Bodija",
          "Mokola",
          "Sango",
          "UI",
          "Agodi",
          "Challenge",
          "Ring Road",
        ],
      },
      Ogbomosho: {
        lgAs: ["Ogbomosho North", "Ogbomosho South"],
        areas: ["Ogbomosho Town"],
      },
      Oyo: { lgAs: ["Oyo East", "Oyo West"], areas: ["Oyo Town"] },
    },
  },

  RIVERS: {
    label: "Rivers State",
    capital: "Port Harcourt",
    cities: {
      "Port Harcourt": {
        lgAs: ["Port Harcourt"],
        areas: [
          "GRA",
          "D-line",
          "Rumuokoro",
          "Rumuola",
          "Mile 1",
          "Mile 3",
          "Trans Amadi",
          "Borokiri",
        ],
      },
      "Obio/Akpor": {
        lgAs: ["Obio/Akpor"],
        areas: ["Rumuodara", "Rumuigbo", "Rumuokwuta", "Elelenwo"],
      },
      Bonny: { lgAs: ["Bonny"], areas: ["Bonny Town"] },
    },
  },

  // Northern States
  BENUE: {
    label: "Benue State",
    capital: "Makurdi",
    cities: {
      Makurdi: {
        lgAs: ["Makurdi"],
        areas: ["Wadata", "High Level", "North Bank"],
      },
      Gboko: { lgAs: ["Gboko"], areas: ["Gboko Town"] },
      Otukpo: { lgAs: ["Otukpo"], areas: ["Otukpo Town"] },
    },
  },

  KOGI: {
    label: "Kogi State",
    capital: "Lokoja",
    cities: {
      Lokoja: { lgAs: ["Lokoja"], areas: ["Lokoja Town", "Ganaja"] },
      Okene: { lgAs: ["Okene"], areas: ["Okene Town"] },
      Idah: { lgAs: ["Idah"], areas: ["Idah Town"] },
    },
  },

  KWARA: {
    label: "Kwara State",
    capital: "Ilorin",
    cities: {
      Ilorin: {
        lgAs: ["Ilorin East", "Ilorin South", "Ilorin West"],
        areas: ["Tanke", "GRA", "Sango", "Adewole"],
      },
      Offa: { lgAs: ["Offa"], areas: ["Offa Town"] },
    },
  },

  NASARAWA: {
    label: "Nasarawa State",
    capital: "Lafia",
    cities: {
      Lafia: { lgAs: ["Lafia"], areas: ["Lafia Town"] },
      Keffi: { lgAs: ["Keffi"], areas: ["Keffi Town"] },
    },
  },

  NIGER: {
    label: "Niger State",
    capital: "Minna",
    cities: {
      Minna: { lgAs: ["Minna"], areas: ["Minna Town", "Bosso"] },
      Bida: { lgAs: ["Bida"], areas: ["Bida Town"] },
    },
  },

  PLATEAU: {
    label: "Plateau State",
    capital: "Jos",
    cities: {
      Jos: {
        lgAs: ["Jos North", "Jos South"],
        areas: ["Bukuru", "Anglo Jos", "Terminus", "Rukuba Road"],
      },
      Bukuru: { lgAs: ["Jos South"], areas: ["Bukuru Town"] },
    },
  },

  FCT: {
    label: "Federal Capital Territory",
    capital: "Abuja",
    cities: {
      Abuja: {
        lgAs: ["Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"],
        areas: [
          "Garki",
          "Wuse",
          "Maitama",
          "Asokoro",
          "Jabi",
          "Utako",
          "Gwarinpa",
          "Kubwa",
          "Lugbe",
          "Nyanya",
        ],
      },
    },
  },

  // Add more northern states as needed
  KANO: {
    label: "Kano State",
    capital: "Kano",
    cities: {
      Kano: {
        lgAs: ["Kano Municipal", "Fagge", "Nasarawa"],
        areas: ["Sabon Gari", "Bompai", "Gyadi Gyadi"],
      },
    },
  },

  KADUNA: {
    label: "Kaduna State",
    capital: "Kaduna",
    cities: {
      Kaduna: {
        lgAs: ["Kaduna North", "Kaduna South"],
        areas: ["U/Dosa", "Kawo", "Tudun Wada"],
      },
    },
  },

  KATSINA: {
    label: "Katsina State",
    capital: "Katsina",
    cities: {
      Katsina: { lgAs: ["Katsina"], areas: ["Katsina Town"] },
    },
  },
};

// Helper Functions
export function getAllStates() {
  return Object.entries(NIGERIAN_LOCATIONS).map(([value, data]) => ({
    value,
    label: data.label,
  }));
}

export function getCitiesByState(stateValue) {
  const state = NIGERIAN_LOCATIONS[stateValue];
  return state ? Object.keys(state.cities).sort() : [];
}

export function getAreasByCity(stateValue, cityName) {
  const state = NIGERIAN_LOCATIONS[stateValue];
  if (!state || !state.cities[cityName]) return [];
  return state.cities[cityName].areas || [];
}

// Auto-derive LGA(s) from city
export function getLGAsByCity(stateValue, cityName) {
  const state = NIGERIAN_LOCATIONS[stateValue];
  if (!state || !state.cities[cityName]) return [cityName]; // Fallback to city name
  return state.cities[cityName].lgAs;
}

// Get primary LGA for delivery calculations
export function getPrimaryLGAForCity(stateValue, cityName) {
  const lgAs = getLGAsByCity(stateValue, cityName);
  return lgAs[0] || cityName; // Use first LGA or city as fallback
}

// Get all LGAs for a state (for admin warehouse setup)
export function getAllLGAsByState(stateValue) {
  const state = NIGERIAN_LOCATIONS[stateValue];
  if (!state) return [];

  const allLGAs = new Set();
  Object.values(state.cities).forEach((city) => {
    city.lgAs.forEach((lga) => allLGAs.add(lga));
  });

  return Array.from(allLGAs).sort();
}
