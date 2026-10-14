// Worker for Boggle Logic & Asynchronous DFS Solver
importScripts('boggle-logic.js', 'dictionary.js');

const logic = new BoggleLogic();
const dictionary = new Dictionary();

self.onmessage = async (e) => {
    const { type, data } = e.data;

    try {
        if (type === 'LOAD') {
            const { language } = data;
            await dictionary.load(language, (percent, message) => {
                self.postMessage({ type: 'PROGRESS', percent, message });
            });
            self.postMessage({ type: 'LOADED', language });

        } else if (type === 'SOLVE') {
            const { grid, size, language, allowCrossing } = data;
            logic.setSize(size);
            logic.setLanguage(language);
            logic.grid = grid;

            // Ensure dictionary is fully loaded before running solver
            if (dictionary.currentLang !== language || dictionary.words.size === 0) {
                await dictionary.load(language || 'it');
            }

            self.postMessage({ type: 'PROGRESS', percent: 30, message: 'Ricerca parole...' });
            const solutions = logic.solve(dictionary, allowCrossing !== false);
            self.postMessage({ type: 'PROGRESS', percent: 100, message: 'Completato' });
            self.postMessage({ type: 'SOLUTIONS', solutions });

        } else if (type === 'CHECK') {
            const { word } = data;
            if (dictionary.words.size === 0 && dictionary.currentLang) {
                await dictionary.load(dictionary.currentLang);
            }
            const isValid = dictionary.check(word);
            self.postMessage({ type: 'CHECK_RESULT', word, isValid });
        } else if (type === 'SET_EXCLUDED') {
            const { excluded } = data;
            dictionary.setExcludedWords(excluded || []);
        }
    } catch (error) {
        self.postMessage({ type: 'ERROR', error: error.message });
    }
};
