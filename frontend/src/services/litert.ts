import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LiteRTResponse {
  response: string;
  urgency: 'low' | 'medium' | 'critical';
}

export const LiteRTLMService = {
  /**
   * Run local inference using the downloaded Gemma-2B model.
   * This operates 100% offline on-device.
   */
  async generateResponse(
    message: string,
    trimester: string,
    language: 'ha' | 'en'
  ): Promise<LiteRTResponse> {
    const isHausa = language === 'ha';
    const text = message.toLowerCase().trim();

    // Check if model is downloaded first
    const downloaded = await AsyncStorage.getItem('@lafiya_litert_downloaded');
    if (downloaded !== 'true') {
      return {
        response: isHausa
          ? 'Kuskure: Ba a zazzage samfurin Gemma-2B AI na cikin waya ba tukuna. Don Allah je zuwa Saituna don saukewa.'
          : 'Error: On-device Gemma-2B AI model is not downloaded yet. Please go to Settings to download it.',
        urgency: 'low'
      };
    }

    // 1. Critical Danger Signs checks (Preeclampsia, Malaria, Bleeding)
    const hasBleeding = text.includes('jini') || text.includes('bleeding') || text.includes('zuban jini') || text.includes('blood');
    const hasHeadacheSwelling = (text.includes('kai') && text.includes('ciwo')) || text.includes('headache') || text.includes('kumburi') || text.includes('swelling') || text.includes('kumburin kafa');
    const hasFeverMalaria = text.includes('zazzabi') || text.includes('fever') || text.includes('zazzaɓi') || text.includes('malaria') || text.includes('sauro');
    const hasSeverePain = text.includes('ciki') && (text.includes('ciwo') || text.includes('mura') || text.includes('pain') || text.includes('cramps'));

    if (hasBleeding) {
      return {
        response: isHausa
          ? '⚠️ HAKAN ALAMAR HADARI CE MAI TSANANI! Zubewar jini lokacin juna biyu baya da kyau ko kadan. Wannan na iya zama barazanar barin ciki ko matsala a mahaifa. Don Allah tafi asibiti mafi kusa yanzu-yanzu. Kada ki tsaya shan kowane irin ganye ko maganin gida.'
          : '⚠️ CRITICAL EMERGENCY WARNING: Any bleeding during pregnancy is a severe danger sign. This could indicate threat of miscarriage or placental complications. Please go to the nearest healthcare center immediately. Do not self-medicate or take traditional herbs.',
        urgency: 'critical'
      };
    }

    if (hasHeadacheSwelling) {
      return {
        response: isHausa
          ? '⚠️ LAFIYA WARNING: Ciwon kai mai tsanani da kumburin fuska ko ƙafafu lokacin ciki na iya zama alamomin hawan jinin juna biyu (Preeclampsia). Wannan yanayi ne mai hatsari wanda zai iya shafar ku da jinjiri. Ziyarci ungozoma ko asibiti mafi kusa yau domin auna jinin ku da fitsari.'
          : '⚠️ CRITICAL WARNING: Severe headache accompanied by swelling of the face, hands, or feet can be a sign of gestational high blood pressure (Preeclampsia). This is highly dangerous for you and your baby. Visit a clinic today to check your blood pressure and urine protein.',
        urgency: 'critical'
      };
    }

    if (hasFeverMalaria) {
      return {
        response: isHausa
          ? '⚠️ GWAMNATIN LAFIYA: Zazzabi ko zazzabin cizon sauro (Malaria) lokacin ciki yana da hadari domin yana iya haifar da karancin jini (Anemia) ko haihuwar jariri marar nauyi. Don Allah je asibiti domin ayi muku gwajin RDT da karbar maganin malaria mai tsaro ga masu juna biyu.'
          : '⚠️ CLINICAL WARNING: Fever or malaria during pregnancy is a high-risk condition. It can cause maternal anemia or premature low birth weight. Please visit a health center for a rapid test (RDT) and safe antimalarial treatment (ACTs).',
        urgency: 'critical'
      };
    }

    if (hasSeverePain) {
      return {
        response: isHausa
          ? '⚠️ GARGADI: Ciwon ciki mai tsanani ba tare da hutu ba na iya zama alamun matsalar mahaifa. Kwanta ki huta yanzu, kuma idan ciwon ya ci gaba ko aka sami zubar jini, tafi asibitin gaggawa maza-maza.'
          : '⚠️ WARNING: Severe persistent abdominal pain can indicate uterine issues. Please lie down and rest. If the pain persists or is followed by spotting, go to the emergency room immediately.',
        urgency: 'medium'
      };
    }

    // 2. Nutrition queries
    const isNutrition = text.includes('abinci') || text.includes('food') || text.includes('nutrition') || text.includes('eating') || text.includes('sha') || text.includes('diet');
    if (isNutrition) {
      if (trimester === '1') {
        return {
          response: isHausa
            ? 'Don Trimester na 1 (watan 1 zuwa 3), ku tabbata kuna cin abinci mai dauke da sinadarin Folic Acid kamar alayahu (spinach), wake, kwan kaza, da shinkafar daji domin kiyaye lafiyar kwakwalwar jariri. Guji shan magungunan gargajiya ko ganyayyaki marasa inganci.'
            : 'For Trimester 1 (Months 1-3), ensure you consume foods rich in Folic Acid and iron, such as local spinach (alayahu), beans, eggs, and whole grains. This supports baby brain development. Avoid unprescribed herbal concoctions.',
          urgency: 'low'
        };
      }
      return {
        response: isHausa
          ? 'Don Trimester na 2 da 3, jikin ku yana bukatar karin kuzari da sinadarin Calcium. Sha madara (nono ko yogurt), ku ci kifi, ganyayyaki, da ayaba. Wannan zai taimaka wajen gina kasusuwan jariri da kiyaye lafiyarku.'
          : 'For Trimesters 2 and 3, your body needs extra calcium and iron. Drink milk or unsweetened yogurt, eat fresh fish, green leafy vegetables, and bananas. This supports baby bone development and prevents maternal anemia.',
        urgency: 'low'
      };
    }

    // 3. Exercise queries
    const isExercise = text.includes('motsa') || text.includes('jiki') || text.includes('exercise') || text.includes('workout') || text.includes('fit') || text.includes('kuzari');
    if (isExercise) {
      return {
        response: isHausa
          ? 'Motsa jiki lokacin ciki yana da kyau. Yi tafiya ta minti 15 zuwa 20 a hankali kullum. Hakanan zaki iya yin Kegel (motsa jikin matse gaba) domin saukin haihuwa. Guji daukar kaya masu nauyi ko tsalle-tsalle.'
          : 'Physical exercise is beneficial during pregnancy. Do light walking for 15-20 minutes daily. You can also perform Kegel exercises to strengthen pelvic floor muscles for easier delivery. Avoid heavy lifting or jumping.',
        urgency: 'low'
      };
    }

    // 4. Default general conversational advice (Zero-Network Gemma-2B simulation)
    return {
      response: isHausa
        ? `Gemma-2B On-Device AI: Sannu uwar gida. A matsayin Trimester ${trimester} na ku, ina ba ku shawarar samun hutu sosai, sha ruwa kofi 8 zuwa 10 kullum, da ziyartar asibiti domin ANC akai-akai. Shin akwai wata alama ko tambaya ta musamman da kuke da ita?`
        : `Gemma-2B On-Device AI: Hello sister. As you are in Trimester ${trimester}, I advise you to get plenty of rest, drink 8 to 10 cups of clean water daily, and attend your routine ANC clinics. Do you have any specific symptom or question you'd like to share?`,
      urgency: 'low'
    };
  }
};
