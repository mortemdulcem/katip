(async () => {
  try {
    // Attempting to call webSearch as if it's injected or available
    if (typeof webSearch !== 'undefined') {
      const results = await webSearch({ query: "epilepsy criminal responsibility pubmed" });
      console.log(JSON.stringify(results));
    } else {
      console.log("webSearch is not defined globally");
    }
  } catch (e) {
    console.error(e);
  }
})();
