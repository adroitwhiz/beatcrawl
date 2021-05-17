const fs = require('fs').promises;
const path = require('path');

const main = async () => {
	const dumps = await fs.readdir('dumps').then(files => files.map(file => path.join('dumps', file)));

	const allBeats = [];

	for (const dump of dumps) {
		const text = await fs.readFile(dump, {encoding: 'utf-8'});
		const json = JSON.parse(text);
		for (const beat of json) {
			allBeats.push(beat);
		}
	}

	await fs.writeFile('dumps/all.json', JSON.stringify(allBeats, null, '\t'), {encoding: 'utf-8'});
};

main();
