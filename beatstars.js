const fetch = require('node-fetch');

/**
 * This takes as input the "musician ID" of the beat producer, and also the type of the BeatStars setup.
 * As far as I can tell, "store" means an embedded widget/iframe set up on a site.
 * "musician" means BeatStars manages the whole site.
 * You can find the musician ID by intercepting network requests using Chrome/Firefox dev tools.
 * .ts audio files streamed when beats are playing will typically include the musician ID somewhere in their URL;
 * e.g. https://content.beatstars.com/users/prod/201021/a4b3xyasi.hls/index_000.ts
 * In the above example, the musician ID is 201021.
 * @param {string} id The musician ID.
 * @param {string} idType "store" if the producer is set up as a store, "musician" if set up as a musician
 */
const crawlBeatstars = (id, idType) => {
	let url;
	switch (idType) {
		case 'store': {
			url = `https://main.v2.beatstars.com/tracks/?list_type=player_playlist&store_id=${id}&fields=list&track_fields=summary&list_pointer=0&list_limit=10000`;
			break;
		}
		case 'musician': {
			url = `https://main.v2.beatstars.com/tracks/?list_type=musician_playlist&musician_id=${id}&fields=list&track_fields=summary&list_pointer=0&list_limit=10000`;
			break;
		}
		default: {
			throw new Error(`Invalid BeatStars store type '${idType}'`);
		}
	}
	return fetch(url)
	.then(response => response.text())
	.then(responseText => {
		const json = JSON.parse(responseText);

		return json.response.data.list.map(data => {
			const details = data.details;

			const timestampReplaceRegex = new RegExp('&timestamp=\\d+', 'g');

			const beat = {
				name: details.title.replace('*SOLD*', '').trim(),
				pageUrl: details.propage_uri || data.beatstars_uri,
				// I don't know what the 'timestamp' query parameter does, but it can't be anything good, so remove it.
				fileUrl: details.stream_ssl_url.replace(timestampReplaceRegex, ''),
				producers: [details.musician.display_name],
				availableForPurchase: !(details.title.includes('*SOLD*') || details.availability.status !== 'ACTIVE'),
				hasHook: details.type === 'BEAT WITH CHORUS'
			};

			if (details.genre) beat.genres = details.genre.map(genre => genre.name);
			if (details.bpm) beat.bpm = details.bpm;

			return beat;
		});
	});
};

module.exports = crawlBeatstars;
