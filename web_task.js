import { webSearch, webFetch } from './.local/skills/web-search/index.js';

async function run() {
  const queries = [
    "What are some articles on site:pubmed.ncbi.nlm.nih.gov about epilepsy and 'criminal responsibility'?",
    "What are some articles on site:pubmed.ncbi.nlm.nih.gov about epilepsy and 'legal capacity'?",
    "What are some articles on site:pubmed.ncbi.nlm.nih.gov about epilepsy and 'fitness to stand trial'?",
    "What are some articles on site:pubmed.ncbi.nlm.nih.gov about epilepsy automatism forensic?",
    "What are some articles on site:pubmed.ncbi.nlm.nih.gov about epilepsy and 'testamentary capacity'?",
    "What are some articles on site:pubmed.ncbi.nlm.nih.gov about 'postictal psychosis' violence forensic?",
    "What are some articles on site:cochranelibrary.com about epilepsy 'legal' OR 'forensic'?",
    "What are some systematic reviews in 'Epilepsy & Behavior' about forensic legal capacity?",
    "What are some articles in 'Int J Law Psychiatry' about epilepsy?",
    "What are some articles in 'J Am Acad Psychiatry Law' about epilepsy automatism?",
    "What are some PRISMA systematic reviews about epilepsy and 'capacity to consent'?",
    "What are some German articles about epilepsy 'Geschäftsfähigkeit' forensic?",
    "What are some ILAE guidelines about 'driving' epilepsy 'fitness to drive'?"
  ];

  try {
    const searchResults = await webSearch({ queries });
    console.log(JSON.stringify(searchResults, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
