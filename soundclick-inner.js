const fetch = require('node-fetch');
const fs = require('fs').promises;

const parseAsHTML = require('./util/parse-as-html');
const titleCase = require('./util/title-case');

const crawlSoundclickPage = (results, pageNumber, bandID) => {
	return fetch(`https://www.soundclick.com/playerV5/panels/getPlaylist_artist.cfm?bandID=${bandID}&skipOnRequestEnd&currentPage=${pageNumber}`)
	.then(response => response.text())
	.then(parseAsHTML).then(domNodes => {
		let numValidNodes = 0;
		for (const node of domNodes) {
			if (node.type !== 'tag' || node.name !== 'div') continue;
			const result = {
				name: titleCase(node.attribs['data-songtitle'].replace('*SOLD*', '').trim()),
				pageUrl: `https://www.soundclick.com/artist/default.cfm?bandID=${bandID}&content=songs`,
				fileUrl: `https://www.soundclick.com/playerV5/panels/audioStream.cfm?songID=${node.attribs['data-songid']}`,
				producers: [titleCase(node.attribs['data-bandname'])],
				// May not work for bands other than Hollywood Legend
				availableForPurchase: !node.attribs['data-songtitle'].includes('*SOLD*')
			};

			results.push(result);
			numValidNodes++;
		}

		// if we got any valid results, there are still more to be found
		// if not, we're done
		if (numValidNodes > 0) return crawlSoundclickPage(results, pageNumber + 1, bandID);
		return results;
	});
}

/**
 * This function takes the producer's "band ID".
 * This one's real easy to find-- just look at the URL of the site, e.g.
 * https://www.soundclick.com/artist/default.cfm?bandID=1240873
 * No prizes for guessing the band ID there.
 * @param {string} bandID The producer's "band ID".
 */
const crawlSoundclick = bandID => {
	const results = [];
	crawlSoundclickPage(results, 1, bandID).then(() => {
		fs.writeFile('soundclick-results.json', JSON.stringify(results));
	});
}

crawlSoundclick(process.argv[2]);