import StoreSettings from "../models/storeSettings.model.js";

// Complete Nigerian states and LGAs
export const NIGERIAN_STATES = {
  ABIA: {
    capital: "Umuahia",
    lgas: [
      "Aba North",
      "Aba South",
      "Arochukwu",
      "Bende",
      "Ikawuno",
      "Ikwuano",
      "Isiala Ngwa North",
      "Isiala Ngwa South",
      "Isuikwuato",
      "Umu Nneochi",
      "Obi Ngwa",
      "Obioma Ngwa",
      "Ohafia",
      "Osisioma",
      "Ugwunagbo",
      "Ukwa East",
      "Ukwa West",
      "Umuahia North",
      "Umuahia South",
    ],
  },
  ADAMAWA: {
    capital: "Yola",
    lgas: [
      "Demsa",
      "Fufure",
      "Ganye",
      "Gayuk",
      "Gombi",
      "Grie",
      "Hong",
      "Jada",
      "Lamurde",
      "Madagali",
      "Maiha",
      "Mayo Belwa",
      "Michika",
      "Mubi North",
      "Mubi South",
      "Numan",
      "Shelleng",
      "Song",
      "Toungo",
      "Yola North",
      "Yola South",
    ],
  },
  AKWA_IBOM: {
    capital: "Uyo",
    lgas: [
      "Abak",
      "Eastern Obolo",
      "Eket",
      "Esit Eket",
      "Essien Udim",
      "Etim Ekpo",
      "Etinan",
      "Ibeno",
      "Ibesikpo Asutan",
      "Ibiono-Ibom",
      "Ika",
      "Ikono",
      "Ikot Abasi",
      "Ikot Ekpene",
      "Ini",
      "Itu",
      "Mbo",
      "Mkpat-Enin",
      "Nsit-Atai",
      "Nsit-Ibom",
      "Nsit-Ubium",
      "Obot Akara",
      "Okobo",
      "Onna",
      "Oron",
      "Oruk Anam",
      "Udung-Uko",
      "Ukanafun",
      "Uruan",
      "Urue-Offong/Oruko",
      "Uyo",
    ],
  },
  ANAMBRA: {
    capital: "Awka",
    lgas: [
      "Aguata",
      "Anambra East",
      "Anambra West",
      "Anaocha",
      "Awka North",
      "Awka South",
      "Ayamelum",
      "Dunukofia",
      "Ekwusigo",
      "Idemili North",
      "Idemili South",
      "Ihiala",
      "Njikoka",
      "Nnewi North",
      "Nnewi South",
      "Ogbaru",
      "Onitsha North",
      "Onitsha South",
      "Orumba North",
      "Orumba South",
      "Oyi",
    ],
  },
  BAUCHI: {
    capital: "Bauchi",
    lgas: [
      "Alkaleri",
      "Bauchi",
      "Bogoro",
      "Damban",
      "Darazo",
      "Dass",
      "Gamawa",
      "Ganjuwa",
      "Giade",
      "Itas/Gadau",
      "Jama'are",
      "Katagum",
      "Kirfi",
      "Misau",
      "Ningi",
      "Shira",
      "Tafawa Balewa",
      "Toro",
      "Warji",
      "Zaki",
    ],
  },
  BAYELSA: {
    capital: "Yenagoa",
    lgas: [
      "Brass",
      "Ekeremor",
      "Kolokuma/Opokuma",
      "Nembe",
      "Ogbia",
      "Sagbama",
      "Southern Ijaw",
      "Yenagoa",
    ],
  },
  BENUE: {
    capital: "Makurdi",
    lgas: [
      "Ado",
      "Agatu",
      "Apa",
      "Buruku",
      "Gboko",
      "Guma",
      "Gwer East",
      "Gwer West",
      "Katsina-Ala",
      "Konshisha",
      "Kwande",
      "Logo",
      "Makurdi",
      "Obi",
      "Ogbadibo",
      "Ohimini",
      "Oju",
      "Okpokwu",
      "Otukpo",
      "Tarka",
      "Ukum",
      "Ushongo",
      "Vandeikya",
    ],
  },
  BORNO: {
    capital: "Maiduguri",
    lgas: [
      "Abadam",
      "Askira/Uba",
      "Bama",
      "Bayo",
      "Biu",
      "Chibok",
      "Damboa",
      "Dikwa",
      "Gubio",
      "Guzamala",
      "Gwoza",
      "Hawul",
      "Jere",
      "Kaga",
      "Kala/Balge",
      "Konduga",
      "Kukawa",
      "Kwaya Kusar",
      "Mafa",
      "Magumeri",
      "Maiduguri",
      "Marte",
      "Mobbar",
      "Monguno",
      "Ngala",
      "Nganzai",
      "Shani",
    ],
  },
  CROSS_RIVER: {
    capital: "Calabar",
    lgas: [
      "Abi",
      "Akamkpa",
      "Akpabuyo",
      "Bakassi",
      "Bekwarra",
      "Biase",
      "Boki",
      "Calabar Municipal",
      "Calabar South",
      "Etung",
      "Ikom",
      "Obanliku",
      "Obubra",
      "Obudu",
      "Odukpani",
      "Ogoja",
      "Yakuur",
      "Yala",
    ],
  },
  DELTA: {
    capital: "Asaba",
    lgas: [
      "Aniocha North",
      "Aniocha South",
      "Bomadi",
      "Burutu",
      "Ethiope East",
      "Ethiope West",
      "Ika North East",
      "Ika South",
      "Isoko North",
      "Isoko South",
      "Ndokwa East",
      "Ndokwa West",
      "Okpe",
      "Oshimili North",
      "Oshimili South",
      "Patani",
      "Sapele",
      "Udu",
      "Ughelli North",
      "Ughelli South",
      "Ukwuani",
      "Uvwie",
      "Warri North",
      "Warri South",
      "Warri South West",
    ],
  },
  EBONYI: {
    capital: "Abakaliki",
    lgas: [
      "Abakaliki",
      "Afikpo North",
      "Afikpo South",
      "Ebonyi",
      "Ezza North",
      "Ezza South",
      "Ikwo",
      "Ishielu",
      "Ivo",
      "Izzi",
      "Ohaozara",
      "Ohaukwu",
      "Onicha",
    ],
  },
  EDO: {
    capital: "Benin City",
    lgas: [
      "Akoko-Edo",
      "Egor",
      "Esan Central",
      "Esan North-East",
      "Esan South-East",
      "Esan West",
      "Etsako Central",
      "Etsako East",
      "Etsako West",
      "Igueben",
      "Ikpoba-Okha",
      "Orhionmwon",
      "Oredo",
      "Ovia North-East",
      "Ovia South-West",
      "Owan East",
      "Owan West",
      "Uhunmwonde",
    ],
  },
  EKITI: {
    capital: "Ado-Ekiti",
    lgas: [
      "Ado Ekiti",
      "Efon",
      "Ekiti East",
      "Ekiti South-West",
      "Ekiti West",
      "Emure",
      "Gbonyin",
      "Ido Osi",
      "Ijero",
      "Ikere",
      "Ikole",
      "Ilejemeje",
      "Irepodun/Ifelodun",
      "Ise/Orun",
      "Moba",
      "Oye",
    ],
  },
  ENUGU: {
    capital: "Enugu",
    lgas: [
      "Aninri",
      "Awgu",
      "Enugu East",
      "Enugu North",
      "Enugu South",
      "Ezeagu",
      "Igbo Etiti",
      "Igbo Eze North",
      "Igbo Eze South",
      "Isi Uzo",
      "Nkanu East",
      "Nkanu West",
      "Nsukka",
      "Oji River",
      "Udenu",
      "Udi",
      "Uzo Uwani",
    ],
  },
  FCT: {
    capital: "Abuja",
    lgas: [
      "Abaji",
      "Bwari",
      "Gwagwalada",
      "Kuje",
      "Kwali",
      "Municipal Area Council",
    ],
  },
  GOMBE: {
    capital: "Gombe",
    lgas: [
      "Akko",
      "Balanga",
      "Billiri",
      "Dukku",
      "Funakaye",
      "Gombe",
      "Kaltungo",
      "Kwami",
      "Nafada",
      "Shongom",
      "Yamaltu/Deba",
    ],
  },
  IMO: {
    capital: "Owerri",
    lgas: [
      "Aboh Mbaise",
      "Ahiazu Mbaise",
      "Ehime Mbano",
      "Ezinihitte",
      "Ideato North",
      "Ideato South",
      "Ihitte/Uboma",
      "Ikeduru",
      "Isiala Mbano",
      "Isu",
      "Mbaitoli",
      "Ngor Okpala",
      "Njaba",
      "Nkwerre",
      "Nwangele",
      "Obowo",
      "Oguta",
      "Ohaji/Egbema",
      "Okigwe",
      "Orlu",
      "Orsu",
      "Oru East",
      "Oru West",
      "Owerri Municipal",
      "Owerri North",
      "Owerri West",
      "Unuimo",
    ],
  },
  JIGAWA: {
    capital: "Dutse",
    lgas: [
      "Auyo",
      "Babura",
      "Biriniwa",
      "Birnin Kudu",
      "Buji",
      "Dutse",
      "Gagarawa",
      "Garki",
      "Gumel",
      "Guri",
      "Gwaram",
      "Gwiwa",
      "Hadejia",
      "Jahun",
      "Kafin Hausa",
      "Kazaure",
      "Kiri Kasama",
      "Kiyawa",
      "Kaugama",
      "Maigatari",
      "Malam Madori",
      "Miga",
      "Ringim",
      "Roni",
      "Sule Tankarkar",
      "Taura",
      "Yankwashi",
    ],
  },
  KADUNA: {
    capital: "Kaduna",
    lgas: [
      "Birnin Gwari",
      "Chikun",
      "Giwa",
      "Igabi",
      "Ikara",
      "Jaba",
      "Jema'a",
      "Kachia",
      "Kaduna North",
      "Kaduna South",
      "Kagarko",
      "Kajuru",
      "Kaura",
      "Kauru",
      "Kubau",
      "Kudan",
      "Lere",
      "Makarfi",
      "Sabon Gari",
      "Sanga",
      "Soba",
      "Zangon Kataf",
      "Zaria",
    ],
  },
  KANO: {
    capital: "Kano",
    lgas: [
      "Ajingi",
      "Albasu",
      "Bagwai",
      "Bebeji",
      "Bichi",
      "Bunkure",
      "Dala",
      "Dambatta",
      "Dawakin Kudu",
      "Dawakin Tofa",
      "Doguwa",
      "Fagge",
      "Gabasawa",
      "Garko",
      "Garun Mallam",
      "Gaya",
      "Gezawa",
      "Gwale",
      "Gwarzo",
      "Kabo",
      "Kano Municipal",
      "Karaye",
      "Kibiya",
      "Kiru",
      "Kumbotso",
      "Kunchi",
      "Kura",
      "Madobi",
      "Makoda",
      "Minjibir",
      "Nasarawa",
      "Rano",
      "Rimin Gado",
      "Rogo",
      "Shanono",
      "Sumaila",
      "Takai",
      "Tarauni",
      "Tofa",
      "Tsanyawa",
      "Tudun Wada",
      "Ungogo",
      "Warawa",
      "Wudil",
    ],
  },
  KASTINA: {
    capital: "Katsina",
    lgas: [
      "Bakori",
      "Batagarawa",
      "Batsari",
      "Baure",
      "Bindawa",
      "Charanchi",
      "Dandume",
      "Danja",
      "Dan Musa",
      "Daura",
      "Dutsi",
      "Dutsin Ma",
      "Faskari",
      "Funtua",
      "Ingawa",
      "Jibia",
      "Kafur",
      "Kaita",
      "Kankara",
      "Kankia",
      "Katsina",
      "Kurfi",
      "Kusada",
      "Mai'Adua",
      "Malumfashi",
      "Mani",
      "Mashi",
      "Matazu",
      "Musawa",
      "Rimi",
      "Sabuwa",
      "Safana",
      "Sandamu",
      "Zango",
    ],
  },
  KEBBI: {
    capital: "Birnin Kebbi",
    lgas: [
      "Aleiro",
      "Arewa Dandi",
      "Argungu",
      "Augie",
      "Bagudo",
      "Birnin Kebbi",
      "Bunza",
      "Dandi",
      "Fakai",
      "Gwandu",
      "Jega",
      "Kalgo",
      "Koko/Besse",
      "Maiyama",
      "Ngaski",
      "Sakaba",
      "Shanga",
      "Suru",
      "Danko/Wasagu",
      "Yauri",
      "Zuru",
    ],
  },
  KOGI: {
    capital: "Lokoja",
    lgas: [
      "Adavi",
      "Ajaokuta",
      "Ankpa",
      "Bassa",
      "Dekina",
      "Ibaji",
      "Idah",
      "Igalamela Odolu",
      "Ijumu",
      "Kabba/Bunu",
      "Kogi",
      "Lokoja",
      "Mopa Muro",
      "Ofu",
      "Ogori/Magongo",
      "Okehi",
      "Okene",
      "Olamaboro",
      "Omala",
      "Yagba East",
      "Yagba West",
    ],
  },
  KWARA: {
    capital: "Ilorin",
    lgas: [
      "Asa",
      "Baruten",
      "Edu",
      "Ekiti",
      "Ifelodun",
      "Ilorin East",
      "Ilorin South",
      "Ilorin West",
      "Irepodun",
      "Isin",
      "Kaiama",
      "Moro",
      "Offa",
      "Oke Ero",
      "Oyun",
      "Pategi",
    ],
  },
  LAGOS: {
    capital: "Ikeja",
    lgas: [
      "Agege",
      "Ajeromi-Ifelodun",
      "Alimosho",
      "Amuwo-Odofin",
      "Apapa",
      "Badagry",
      "Epe",
      "Eti Osa",
      "Ibeju-Lekki",
      "Ifako-Ijaiye",
      "Ikeja",
      "Ikorodu",
      "Kosofe",
      "Lagos Island",
      "Lagos Mainland",
      "Mushin",
      "Ojo",
      "Oshodi-Isolo",
      "Shomolu",
      "Surulere",
    ],
  },
  NASARAWA: {
    capital: "Lafia",
    lgas: [
      "Akwanga",
      "Awe",
      "Doma",
      "Karu",
      "Keana",
      "Keffi",
      "Kokona",
      "Lafia",
      "Nasarawa",
      "Nasarawa Egon",
      "Obi",
      "Toto",
      "Wamba",
    ],
  },
  NIGER: {
    capital: "Minna",
    lgas: [
      "Agaie",
      "Agwara",
      "Bida",
      "Borgu",
      "Bosso",
      "Chanchaga",
      "Edati",
      "Gbako",
      "Gurara",
      "Katcha",
      "Kontagora",
      "Lapai",
      "Lavun",
      "Magama",
      "Mariga",
      "Mashegu",
      "Mokwa",
      "Moya",
      "Paikoro",
      "Rafi",
      "Rijau",
      "Shiroro",
      "Suleja",
      "Tafa",
      "Wushishi",
    ],
  },
  OGUN: {
    capital: "Abeokuta",
    lgas: [
      "Abeokuta North",
      "Abeokuta South",
      "Ado-Odo/Ota",
      "Egbado North",
      "Egbado South",
      "Ewekoro",
      "Ifo",
      "Ijebu East",
      "Ijebu North",
      "Ijebu North East",
      "Ijebu Ode",
      "Ikenne",
      "Imeko Afon",
      "Ipokia",
      "Obafemi Owode",
      "Odeda",
      "Odogbolu",
      "Ogun Waterside",
      "Remo North",
      "Shagamu",
    ],
  },
  ONDO: {
    capital: "Akure",
    lgas: [
      "Akoko North-East",
      "Akoko North-West",
      "Akoko South-East",
      "Akoko South-West",
      "Akure North",
      "Akure South",
      "Ese Odo",
      "Idanre",
      "Ifedore",
      "Ilaje",
      "Ile Oluji/Okeigbo",
      "Irele",
      "Odigbo",
      "Okitipupa",
      "Ondo East",
      "Ondo West",
      "Ose",
      "Owo",
    ],
  },
  OSUN: {
    capital: "Osogbo",
    lgas: [
      "Aiyedaade",
      "Aiyedire",
      "Atakunmosa East",
      "Atakunmosa West",
      "Boluwaduro",
      "Boripe",
      "Ede North",
      "Ede South",
      "Egbedore",
      "Ejigbo",
      "Ife Central",
      "Ife East",
      "Ife North",
      "Ife South",
      "Ifedayo",
      "Ifelodun",
      "Ila",
      "Ilesa East",
      "Ilesa West",
      "Irepodun",
      "Irewole",
      "Isokan",
      "Iwo",
      "Obokun",
      "Odo Otin",
      "Ola Oluwa",
      "Olorunda",
      "Oriade",
      "Orolu",
      "Osogbo",
    ],
  },
  OYO: {
    capital: "Ibadan",
    lgas: [
      "Afijio",
      "Akinyele",
      "Atiba",
      "Atisbo",
      "Egbeda",
      "Ibadan North",
      "Ibadan North-East",
      "Ibadan North-West",
      "Ibadan South-East",
      "Ibadan South-West",
      "Ibarapa Central",
      "Ibarapa East",
      "Ibarapa North",
      "Ido",
      "Irepo",
      "Iseyin",
      "Itesiwaju",
      "Iwajowa",
      "Kajola",
      "Lagelu",
      "Ogbomosho North",
      "Ogbomosho South",
      "Ogo Oluwa",
      "Olorunsogo",
      "Oluyole",
      "Ona Ara",
      "Orelope",
      "Ori Ire",
      "Oyo East",
      "Oyo West",
      "Saki East",
      "Saki West",
      "Surulere",
    ],
  },
  PLATEAU: {
    capital: "Jos",
    lgas: [
      "Barkin Ladi",
      "Bassa",
      "Bokkos",
      "Jos East",
      "Jos North",
      "Jos South",
      "Kanam",
      "Kanke",
      "Langtang North",
      "Langtang South",
      "Mangu",
      "Mikang",
      "Pankshin",
      "Qua'an Pan",
      "Riyom",
      "Shendam",
      "Wase",
    ],
  },
  RIVERS: {
    capital: "Port Harcourt",
    lgas: [
      "Abua/Odual",
      "Ahoada East",
      "Ahoada West",
      "Akuku-Toru",
      "Andoni",
      "Asari-Toru",
      "Bonny",
      "Degema",
      "Eleme",
      "Emuoha",
      "Etche",
      "Gokana",
      "Ikwerre",
      "Khana",
      "Obio/Akpor",
      "Ogba/Egbema/Ndoni",
      "Ogu/Bolo",
      "Okrika",
      "Omuma",
      "Opobo/Nkoro",
      "Oyigbo",
      "Port Harcourt",
      "Tai",
    ],
  },
  SOKOTO: {
    capital: "Sokoto",
    lgas: [
      "Binji",
      "Bodinga",
      "Dange Shuni",
      "Gada",
      "Goronyo",
      "Gudu",
      "Gwadabawa",
      "Illela",
      "Isa",
      "Kebbe",
      "Kware",
      "Rabah",
      "Sabon Birni",
      "Shagari",
      "Silame",
      "Sokoto North",
      "Sokoto South",
      "Tambuwal",
      "Tangaza",
      "Tureta",
      "Wamako",
      "Wurno",
      "Yabo",
    ],
  },
  TARABA: {
    capital: "Jalingo",
    lgas: [
      "Ardo Kola",
      "Bali",
      "Donga",
      "Gashaka",
      "Gassol",
      "Ibi",
      "Jalingo",
      "Karim Lamido",
      "Kumi",
      "Lau",
      "Sardauna",
      "Takum",
      "Ussa",
      "Wukari",
      "Yorro",
      "Zing",
    ],
  },
  YOBE: {
    capital: "Damaturu",
    lgas: [
      "Bade",
      "Bursari",
      "Damaturu",
      "Fika",
      "Fune",
      "Geidam",
      "Gujba",
      "Gulani",
      "Jakusko",
      "Karasuwa",
      "Machina",
      "Nangere",
      "Nguru",
      "Potiskum",
      "Tarmuwa",
      "Yunusari",
      "Yusufari",
    ],
  },
  ZAMFARA: {
    capital: "Gusau",
    lgas: [
      "Anka",
      "Bakura",
      "Birnin Magaji/Kiyaw",
      "Bukkuyum",
      "Bungudu",
      "Chafe",
      "Gummi",
      "Gusau",
      "Kaura Namoda",
      "Maradun",
      "Maru",
      "Shinkafi",
      "Talata Mafara",
      "Zurmi",
    ],
  },
  // Add all other states...
};

// Nigerian regions mapping
export const NIGERIAN_REGIONS = {
  SOUTH_SOUTH: [
    "Delta",
    "Edo",
    "Bayelsa",
    "Cross River",
    "Akwa Ibom",
    "Rivers",
  ],
  SOUTH_EAST: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"],
  SOUTH_WEST: ["Lagos", "Ogun", "Ondo", "Osun", "Oyo", "Ekiti"],
  NORTH_CENTRAL: [
    "Benue",
    "Kogi",
    "Kwara",
    "Nasarawa",
    "Niger",
    "Plateau",
    "FCT",
  ],
  NORTH_EAST: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"],
  NORTH_WEST: [
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Sokoto",
    "Zamfara",
  ],
};

// Helper function to get region by state name
function getRegionByStateName(stateName, nigeriaConfig) {
  if (!nigeriaConfig?.regions) {
    // Use default regions if not configured
    for (const [region, states] of Object.entries(NIGERIAN_REGIONS)) {
      if (states.includes(stateName)) {
        return region;
      }
    }
    return null;
  }

  // Use configured regions
  const regionMap = Object.fromEntries(nigeriaConfig.regions);
  for (const [region, states] of Object.entries(regionMap)) {
    if (states.includes(stateName)) {
      return region;
    }
  }
  return null;
}

// Helper to get all states
export function getAllStates() {
  return Object.keys(NIGERIAN_STATES).map((key) => ({
    value: key,
    label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));
}

// Helper to get LGAs by state
export function getLGAsByState(stateKey) {
  const state = NIGERIAN_STATES[stateKey];
  return state ? state.lgas : [];
}

// Default calculation (if no store settings)
function calculateDefaultZone(deliveryAddress) {
  const { state, city, lga } = deliveryAddress;

  if (state === "Edo" && ["Oredo", "Egor", "Ikpoba-Okha"].includes(lga)) {
    return "sameCity";
  }
  if (state === "Edo") {
    return "sameState";
  }
  if (["Delta", "Ondo", "Ekiti", "Kogi", "Anambra"].includes(state)) {
    return "sameRegion";
  }
  if (
    [
      "Lagos",
      "Ogun",
      "Oyo",
      "Osun",
      "Enugu",
      "Imo",
      "Abia",
      "Rivers",
      "Bayelsa",
      "Cross River",
      "Akwa Ibom",
    ].includes(state)
  ) {
    return "southern";
  }
  return "northern";
}

// Helper function to get delivery zone based on admin's warehouse location
async function getDeliveryZone(deliveryAddress, storeSettings) {
  const { warehouseLocation, nigeriaConfig } = storeSettings;

  // If no store settings, use default
  if (!warehouseLocation || !warehouseLocation.state) {
    return calculateDefaultZone(deliveryAddress);
  }

  const adminState = warehouseLocation.state;
  const adminCity = warehouseLocation.city;
  const adminLGA = warehouseLocation.lga;

  const customerState = deliveryAddress.state;
  const customerCity = deliveryAddress.city;
  const customerLGA = deliveryAddress.lga;

  // 1. Same City (same LGA or neighboring LGAs)
  if (
    customerState === adminState &&
    customerCity?.toLowerCase() === adminCity?.toLowerCase()
  ) {
    return "sameCity";
  }

  // 2. Same LGA (different city but same LGA - for metropolitan areas)
  if (customerState === adminState && customerLGA === adminLGA) {
    return "sameLGA";
  }

  // 3. Same State (different LGA)
  if (customerState === adminState) {
    return "sameState";
  }

  // 4. Check if in same region
  const adminRegion = getRegionByStateName(adminState, nigeriaConfig);
  const customerRegion = getRegionByStateName(customerState, nigeriaConfig);

  if (adminRegion && customerRegion && adminRegion === customerRegion) {
    return "sameRegion";
  }

  // 5. Check if southern states
  const southernRegions = ["SOUTH_SOUTH", "SOUTH_EAST", "SOUTH_WEST"];
  if (customerRegion && southernRegions.includes(customerRegion)) {
    return "southern";
  }

  // 6. Default to northern
  return "northern";
}

// Main delivery fee calculation function
export async function calculateDeliveryFee(deliveryAddress) {
  try {
    // Get current store settings
    const storeSettings = await StoreSettings.findOne();

    if (!storeSettings) {
      throw new Error("Store settings not found");
    }

    // Determine delivery zone
    const zone = await getDeliveryZone(deliveryAddress, storeSettings);

    // Get fee based on zone
    const shippingFees = storeSettings.shippingFees || {
      sameCity: 500,
      sameLGA: 1000,
      sameState: 1500,
      sameRegion: 2500,
      southern: 3500,
      northern: 5000,
    }; 

    const fee = shippingFees[zone] || shippingFees.northern;

    return {
      fee,
      zone,
      warehouseLocation: storeSettings.warehouseLocation,
    };
  } catch (error) {
    console.error("Error calculating delivery fee:", error);

    // Fallback to default calculation
    const zone = calculateDefaultZone(deliveryAddress);
    const defaultFees = {
      sameCity: 500,
      sameLGA: 1000,
      sameState: 1500,
      sameRegion: 2500,
      southern: 3500,
      northern: 5000,
    };

    return {
      fee: defaultFees[zone] || 5000,
      zone,
      warehouseLocation: null,
    };
  }
}

// Export the old calculateDeliveryFee for backward compatibility
export function calculateDeliveryFeeOld(addressState, addressCity, addressLGA) {
  // This is the old function signature for backward compatibility
  return calculateDeliveryFee({
    state: addressState,
    city: addressCity,
    lga: addressLGA,
  });
}
