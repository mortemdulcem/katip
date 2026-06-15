import { webSearch, webFetch } from './.local/skills/web-search/index.js';

async function run() {
  const queries = [
    "site:tez.yok.gov.tr epilepsi ehliyet",
    "site:tez.yok.gov.tr epilepsi adli tıp",
    "site:tez.yok.gov.tr epilepsi ceza sorumluluğu",
    "site:dergipark.org.tr epilepsi \"fiil ehliyeti\"",
    "site:dergipark.org.tr epilepsi \"ceza ehliyeti\"",
    "site:dergipark.org.tr epilepsi \"adli psikiyatri\"",
    "site:dergipark.org.tr epilepsi \"TCK\"",
    "\"Adli Tıp Bülteni\" epilepsi",
    "\"Türkiye Klinikleri\" \"Adli Tıp\" epilepsi",
    "\"Adli Bilimler Dergisi\" epilepsi",
    "\"Nöropsikiyatri Arşivi\" epilepsi adli",
    "site:dergipark.org.tr \"epilepsi\" \"ehliyetsizlik\"",
    "epilepsi \"TCK 32\" makale",
    "epilepsi \"TMK 13\" \"ayırt etme gücü\" makale",
    "\"Hamdi Tutkun\" epilepsi",
    "\"Sahir Erman\" epilepsi ceza ehliyeti"
  ];

  try {
    const results = await webSearch({ queries });
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(error);
  }
}

run();
