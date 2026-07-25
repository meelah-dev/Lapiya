import { addDocumentsToVectorStore, Document } from './services/rag';

const seedData: Document[] = [
  // --- Danger Signs (English) ---
  {
    id: 'danger_bleeding_en',
    category: 'Danger Signs',
    language: 'en',
    title: 'Vaginal Bleeding During Pregnancy',
    content: 'Vaginal bleeding at any stage of pregnancy is a severe danger sign. In early pregnancy, it can indicate a miscarriage or ectopic pregnancy. In late pregnancy, it can mean placenta separation or placenta previa. Go to the hospital or primary health center immediately if you experience any bleeding.'
  },
  {
    id: 'danger_swelling_en',
    category: 'Danger Signs',
    language: 'en',
    title: 'Severe Swelling of Hands, Face, and Feet',
    content: 'While mild feet swelling can be normal, sudden or severe swelling of the hands, face, and feet, especially when accompanied by blurred vision or severe headaches, is a warning sign of preeclampsia (pregnancy-induced high blood pressure). This is dangerous and requires immediate medical checks to prevent convulsions.'
  },
  {
    id: 'danger_convulsions_en',
    category: 'Danger Signs',
    language: 'en',
    title: 'Convulsions or Fits',
    content: 'Convulsions or fits during pregnancy are life-threatening emergencies. They indicate severe eclampsia, which can lead to coma or death for both mother and baby. If a pregnant woman experiences fits, take her to the nearest health facility immediately.'
  },
  {
    id: 'danger_fetal_movement_en',
    category: 'Danger Signs',
    language: 'en',
    title: 'Reduced or Absent Fetal Movement',
    content: 'A healthy baby kicks or moves regularly. If you notice that your baby is moving less than usual or has stopped moving entirely (fewer than 10 movements in 2 hours in the third trimester), it is a critical danger sign. Go to the hospital immediately for a fetal heart check.'
  },
  {
    id: 'danger_fever_en',
    category: 'Danger Signs',
    language: 'en',
    title: 'High Fever and Shivering',
    content: 'High fever and shivering during pregnancy can be signs of malaria, typhoid, or other serious infections. Malaria is a leading cause of miscarriage, premature birth, and maternal death in Nigeria. Always test and treat fever immediately at a health facility.'
  },

  // --- Danger Signs (Hausa) ---
  {
    id: 'danger_bleeding_ha',
    category: 'Danger Signs',
    language: 'ha',
    title: 'Zubar Jini Lokacin Juna Biyu',
    content: 'Zubar jini ta gaba a kowane mataki na ciki babbar alama ce ta hadari. A farkon ciki, yana iya nuna barazanar barin ciki. A karshen ciki, yana nuna matsala ga mahaifa. Tafi asibiti ko cibiyar lafiya mafi kusa yanzu-yanzu idan ka ga jini.'
  },
  {
    id: 'danger_swelling_ha',
    category: 'Danger Signs',
    language: 'ha',
    title: 'Kumburin Fuska, Hannu, da Kafafu',
    content: 'Kumburin kafafu kadan na iya zama daidai, amma kumburi mai tsanani na fuska, hannaye, ko kafafu lokaci guda, tare da ciwon kai ko dishewar gani, alama ce ta hawan jini na juna biyu (preeclampsia). Wannan yana da hadari sosai kuma yana bukatar duba lafiya cikin sauri don guje wa farfadiya.'
  },
  {
    id: 'danger_convulsions_ha',
    category: 'Danger Signs',
    language: 'ha',
    title: 'Farfadiya ko Faduwa',
    content: 'Farfadiya ko fits lokacin juna biyu babban hadari ne na gaggawa dake barazana ga rayuwa. Suna nuna matsananciyar eclampsia, wanda zai iya kaiwa ga suma ko mutuwa ga uwa da jinjiri. Idan mai ciki ta fadi ko ta yi farfadiya, a kai ta asibiti nan da nan.'
  },
  {
    id: 'danger_fetal_movement_ha',
    category: 'Danger Signs',
    language: 'ha',
    title: 'Rage Motsin Jinjiri a Ciki',
    content: 'Lafiyayyen jinjiri yana motsi akai-akai. Idan kika lura motsin jinjiri ya ragu ko ya tsaya gaba daya (kasa da motsi 10 a cikin sa\'o\'i biyu a wata na bakwai zuwa tara), wannan alama ce mai hadari sosai. Tafi asibiti maza-maza don duba bugun zuciyar jinjiri.'
  },
  {
    id: 'danger_fever_ha',
    category: 'Danger Signs',
    language: 'ha',
    title: 'Zazzabi Mai Zafi da Rarraba Jiki',
    content: 'Zazzabi mai zafi tare da rarraba jiki lokacin juna biyu na iya zama alamun zazzabin cizon sauko (malaria), typhoid, ko wani ciwo mai tsanani. Malaria ita ce babbar sanadin barin ciki da mace-macen iyaye a Najeriya. A je asibiti domin yin gwaji da magani.'
  },

  // --- Nutrition (English) ---
  {
    id: 'nutrition_general_en',
    category: 'Nutrition',
    language: 'en',
    title: 'Healthy Eating During Pregnancy',
    content: 'A pregnant woman needs nutritious foods for her strength and the baby\'s growth. Eat a variety of foods: green leafy vegetables, eggs, beans, fish, meat, dairy, and orange-fleshed sweet potatoes. Avoid raw or undercooked meat and eggs, unpasteurized milk, and local herbal mixtures (agbo/rubutu) which can harm the baby.'
  },
  {
    id: 'nutrition_supplements_en',
    category: 'Nutrition',
    language: 'en',
    title: 'Essential Pregnancy Supplements',
    content: 'Take your iron and folic acid tablets daily, starting from before pregnancy or as soon as you find out you are pregnant. Folic acid helps prevent brain and spinal birth defects. Iron prevents anemia (shortage of blood) and keeps the mother strong during labor.'
  },

  // --- Nutrition (Hausa) ---
  {
    id: 'nutrition_general_ha',
    category: 'Nutrition',
    language: 'ha',
    title: 'Ingantaccen Abinci Lokacin Juna Biyu',
    content: 'Mai juna biyu tana bukatar abinci mai gina jiki don karfinta da girman jinjiri. Ci abinci kala-kala: ganyayyaki koriya, kwai, wake, kifi, nama, madara, da danyen dankali. A guji cin danyen kwai ko danyen nama, da shan magungunan gargajiya na ganye da ba a tantance ba (kamar rubutu ko agbo).'
  },
  {
    id: 'nutrition_supplements_ha',
    category: 'Nutrition',
    language: 'ha',
    title: 'Magungunan Karin Jini Da Sinadarai a Ciki',
    content: 'Sha kwayoyin Iron da Folic Acid kowace rana tun daga farkon ciki. Folic acid yana kiyaye jinjiri daga nakasar kwakwalwa da laka. Iron yana hana karancin jini (anemia) kuma yana taimakawa uwa wajen samun kuzarin haihuwa.'
  },

  // --- Myths & Debunking (English) ---
  {
    id: 'myth_eggs_en',
    category: 'Myths',
    language: 'en',
    title: 'Myth Debunked: Eating Eggs During Pregnancy',
    content: 'Myth: Eating eggs will make the baby steal or grow too large, causing difficult labor. Reality: This is completely false. Eggs are a superfood for pregnant women. They are rich in protein, iron, and choline, which are critical for the baby\'s brain development and overall health. Eating well-cooked eggs is safe and highly recommended.'
  },
  {
    id: 'myth_clay_en',
    category: 'Myths',
    language: 'en',
    title: 'Myth Debunked: Eating Local Clay (Ganga/Nzu)',
    content: 'Myth: Eating local clay or roasted chalk cures morning sickness and provides calcium. Reality: This is highly dangerous. Eating clay (pica) causes severe anemia (blood shortage) because it blocks iron absorption. It also introduces worms and parasites into the mother\'s gut. For nausea, use ginger or consult your doctor.'
  },
  {
    id: 'myth_okra_en',
    category: 'Myths',
    language: 'en',
    title: 'Myth Debunked: Okra Soup Causes Drooling',
    content: 'Myth: Okra soup makes child delivery easy but causes the baby to drool. Reality: Okra is safe, nutritious, and rich in folate, fiber, and vitamin C. It does not cause drooling, which is a natural developmental stage for babies. Okra helps prevent constipation during pregnancy.'
  },

  // --- Myths & Debunking (Hausa) ---
  {
    id: 'myth_eggs_ha',
    category: 'Myths',
    language: 'ha',
    title: 'Karyata Tatsuniya: Cin Kwai Lokacin Ciki',
    content: 'Tatsuniya: Wai mai ciki kada ta ci kwai don kada yaro ya zama barawo ko ya yi girma da yawa ya hana haihuwa cikin sauki. Gaskiya: Wannan sam ba haka yake ba. Kwai yana da matukar amfani ga mai ciki. Yana dauke da sinadarin protein da choline dake taimakawa wajen ci gaban kwakwalwar jinjiri da lafiyarsa. Cin dafaffen kwai yana da kyau.'
  },
  {
    id: 'myth_clay_ha',
    category: 'Myths',
    language: 'ha',
    title: 'Karyata Tatsuniya: Shan Kasa ko Farar Kasa (Ganga)',
    content: 'Tatsuniya: Wai cin kasa ko farar kasa yana maganin tashin zuciya kuma yana ba da kaushin kasashi. Gaskiya: Wannan yana da hadari sosai. Cin kasa (pica) yana haifar da matsananciyar karancin jini domin yana toshe hanyar shan sinadarin Iron a ciki. Haka kuma yana sanya tsutsotsin ciki. Don tashin zuciya, sha shayin citta ko tuntubi likita.'
  },
  {
    id: 'myth_okra_ha',
    category: 'Myths',
    language: 'ha',
    title: 'Karyata Tatsuniya: Miyan Kubewa Yana Sa Yaro Zubar Da Yau',
    content: 'Tatsuniya: Wai cin miyan kubewa yana sa haihuwa cikin sauki amma yana sa yaro ya rinka zubar da yau. Gaskiya: Kubewa tana da matukar gina jiki, tana da folate da fiber. Ba ta sa yaro zubar da yau gaba daya, zubar yau na jinjiri abu ne na dabi\'a. Kubewa tana hana toshewar ciki ga mai juna biyu.'
  },

  // --- Trimester Milestones (English) ---
  {
    id: 'trimester_1_en',
    category: 'Trimesters',
    language: 'en',
    title: 'First Trimester Guide (Weeks 1 to 12)',
    content: 'The first trimester is critical for your baby\'s development. The heart, brain, and major organs start to form. The mother may experience morning sickness, fatigue, breast tenderness, and mood changes. It is vital to register for antenatal care (ANC) at the hospital as soon as you know you are pregnant.'
  },
  {
    id: 'trimester_2_en',
    category: 'Trimesters',
    language: 'en',
    title: 'Second Trimester Guide (Weeks 13 to 26)',
    content: 'Often called the golden trimester, morning sickness usually subsides. The baby grows fast and you will begin to feel light kicks. Your belly will become visible. ANC visits should continue. Sleep on your left side to maximize blood flow to the baby.'
  },
  {
    id: 'trimester_3_en',
    category: 'Trimesters',
    language: 'en',
    title: 'Third Trimester Guide (Weeks 27 to 40)',
    content: 'Your baby is fully formed and preparing for birth. You may feel backaches, heartburn, shortness of breath, and frequent urination. Prepare your birth kit, arrange transport, and plan for delivery at a health facility. Watch out for contractions and water breaking.'
  },

  // --- Trimester Milestones (Hausa) ---
  {
    id: 'trimester_1_ha',
    category: 'Trimesters',
    language: 'ha',
    title: 'Jagoran Farko na Juna Biyu (Mako 1 zuwa 12)',
    content: 'Wadannan watanni na farko (wata 1 zuwa 3) suna da matukar muhimmanci. Zuciya, kwakwalwa, da sassan jikin jinjiri suna kafuwa. Uwar gida na iya jin tashin zuciya, kasala, da kumburin nono. Yana da kyau a garzaya asibiti don yin rajista da zaran an sami ciki.'
  },
  {
    id: 'trimester_2_ha',
    category: 'Trimesters',
    language: 'ha',
    title: 'Jagora na Biyu na Juna Biyu (Mako 13 zuwa 26)',
    content: 'Lokaci ne na wata 4 zuwa 6. Yawanci kasala da tashin zuciya suna raguwa. Jinjiri yana girma da sauri kuma uwa za ta fara jin bugunsa. Ciki zai fara fitowa fili. A ci gaba da zuwa asibiti don ANC. Kwanta ta bangaren hagu don jinin ya kwarara da kyau ga jinjiri.'
  },
  {
    id: 'trimester_3_ha',
    category: 'Trimesters',
    language: 'ha',
    title: 'Jagora na Uku na Juna Biyu (Mako 27 zuwa 40)',
    content: 'Watanni na karshe (wata 7 zuwa 9). Jinjiri ya cika girma kuma yana shirin fitowa. Za a iya jin ciwon baya, wahalar numfashi, da yawan fitsari. A shirya kayan haihuwa, abin hawa, da kudin gaggawa. A kula da alamomin nakuda da fashewar ruwan haihuwa.'
  }
];

async function seed() {
  console.log('[Seed] Starting seeding process...');
  try {
    await addDocumentsToVectorStore(seedData);
    console.log('[Seed] Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Seeding failed:', err);
    process.exit(1);
  }
}

seed();
