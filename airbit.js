const fetch = require('node-fetch');

const titleCase = require('./util/title-case');

const findTabableID = url => {
	return fetch(url)
	.then(response => response.text())
	.then(responseText => {
		const match = responseText.match(/(ab\.configuration = )({.+?});/);
		const config = JSON.parse(match[2]);

		const beatsTab = config.tabs.find(tab => tab.name === 'Beats');
		if (!beatsTab) throw new Error('No beats tab');

		return beatsTab.tabable_id;
	})
}

const crawlAirbit = url => {
	return findTabableID(url).then(id => {
		return fetch(`https://api.airbit.com/collections/${id}?expand=playlist,playlist.moods,playlist.tags`);
	})
	.then(response => response.text())
	.then(responseText => {
		return JSON.parse(responseText).item.items.sort((a, b) => a.collection_order - b.collection_order).map(data => {
			const details = data.music_item;

			return {
				name: details.name,
				bpm: details.tempo,
				pageUrl: details.mpUrl,
				fileUrl: details.http,
				producers: [details.user.name],
				genres: [details.genre.name],
				moods: details.moods.map(mood => titleCase(mood.name))
			}
		})
	});
}

module.exports = crawlAirbit;