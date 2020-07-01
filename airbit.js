const fetch = require('node-fetch');

const titleCase = require('./util/title-case');

/**
 * This crawl function takes the URL of the embedded Airbit widget's iframe.
 * It should take the form "https://airbit.com/widgets/html5/..."
 * @param {string} url The URL of the iframe widget embedded on the beat producer's page
 */
const crawlAirbit = async url => {
	const responseText = await fetch(url).then(response => response.text());

	const configJS = responseText.match(/(ab\.configuration = )({.+?});/);
	const config = JSON.parse(configJS[2]);
	const userJS = responseText.match(/(ab\.user = )({.+?});/);
	const user = JSON.parse(userJS[2]);

	const beats = JSON.parse(
		await fetch(`https://api.airbit.com/users/${config.user_id}/beats?limit=5000&expand=moods,tags`)
			.then(response => response.text())
	).items;

	// Not sure if this is necessary but it can't hurt
	beats.sort((a, b) => a.order - b.order);

	return beats.map(beat => {
		return {
			name: beat.name,
			bpm: beat.tempo,
			pageUrl: beat.mpUrl || url,
			fileUrl: beat.http,
			producers: [user.name],
			genres: [beat.genre.name],
			moods: beat.moods.map(mood => titleCase(mood.name))
		};
	});
};

module.exports = crawlAirbit;
