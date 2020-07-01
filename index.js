const crawlAirbit = require('./airbit');
const crawlBeatstars = require('./beatstars');
const crawlShadowville = require('./shadowville');
const crawlSoundclick = require('./soundclick');
const crawlSoundgine = require('./soundgine');

const fs = require('fs').promises;
const path = require('path');

const titleCase = require('./util/title-case');

const argv = require('yargs-parser')(process.argv.slice(2));

const beatFetches = {
	'shadowville': () => crawlShadowville(),
	'epistra': () => crawlBeatstars('542', 'store'),
	'hollywood legend': () => crawlSoundclick('1240873'),
	'insanebeatz': () => crawlAirbit('https://airbit.com/widgets/html5?uid=21599&config=181869'),
	'tantu': () => crawlBeatstars('28155', 'store'),
	'anywaywell': () => crawlBeatstars('201021', 'musician')
		.then(results =>
			results.map(beat => {
				beat.name = beat.name.replace('(Buy 1 Get 3 Free)', '').trim();
				return beat;
			})),
	'kustom': () => crawlSoundgine('@kustommike').then(results => {
		return fs.readFile(path.join(__dirname, 'kustom_legacy.json'))
		.then(contents => {
			// merge new Kustom results with "legacy" results from old site
			// no new beats are being posted, some old beats are now missing, and it's hard to crawl,
			// so just use a previous dump
			const legacyResults = JSON.parse(contents);
			for (const legacyBeat of legacyResults) {
				if (!results.some(beat => beat.name.toLowerCase() === legacyBeat.name.toLowerCase())) {
					results.push(legacyBeat);
				}
			}

			return results;
		});
	}),
	'blackrose': () => crawlBeatstars('174557', 'musician'),
	'blasian': () => crawlBeatstars('169836', 'musician'),
	'nybangers': () => crawlAirbit('https://airbit.com/widgets/html5?uid=25700&config=201391')
		.then(results =>
			results.map(beat => {
				beat.name = titleCase(beat.name);
				return beat;
			})
		)
};

if (argv.hasOwnProperty('only')) {
	const producers = argv.only.split(',').map(str => str.trim().toLowerCase());
	for (const producer in beatFetches) {
		if (!beatFetches.hasOwnProperty(producer)) continue;
		if (!producers.includes(producer)) delete beatFetches[producer];
	}
}

const fetchMap = [];
for (const entry of Object.entries(beatFetches)) {
	fetchMap.push(
		entry[1]()
			.then(item => {
				fs.writeFile(`dumps/${entry[0]}.json`, JSON.stringify(item, null, '\t'));
			})
			.catch(console.error)
	);
}

Promise.allSettled(fetchMap).then(() => {
	console.log('Complete');
});
