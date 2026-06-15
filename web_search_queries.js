const queries = [
    "site:scholar.google.com epilepsy 'criminal responsibility' systematic review",
    "site:scholar.google.com epilepsy 'legal capacity' meta-analysis",
    "site:proquest.com dissertation epilepsy forensic",
    "site:openthesis.org epilepsy forensic",
    "site:dart-europe.eu epilepsy legal",
    "site:theses.fr epilepsie responsabilité pénale",
    "site:ndltd.org epilepsy forensic legal",
    "ILAE guideline forensic legal epilepsy",
    "AAN American Academy of Neurology position statement epilepsy driving",
    "NICE guideline epilepsy capacity consent",
    "Mental Capacity Act 2005 epilepsy case law UK",
    "M'Naghten epilepsy automatism case",
    "insane automatism epilepsy",
    "non-insane automatism epilepsy R v Sullivan",
    "Council of Europe Recommendation epilepsy human rights",
    "validated scoring tool epilepsy legal capacity assessment instrument",
    "epilepsy-specific legal capacity structured assessment instrument validated"
];

async function runSearch() {
    try {
        const results = await webSearch({ queries });
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("Error during webSearch:", error);
    }
}

runSearch();
