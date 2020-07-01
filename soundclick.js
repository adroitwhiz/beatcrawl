const fetch = require('node-fetch');

const parseAsHTML = require('./util/parse-as-html');
const titleCase = require('./util/title-case');

const crawlSoundclickPage = (results, pageNumber, bandID) => {
	return fetch(`https://www.soundclick.com/playerV5/panels/getPlaylist_artist.cfm?bandID=${bandID}&skipOnRequestEnd&currentPage=${pageNumber}`, {
		// SoundClick's CDN (Incapsula) returns HTTP headers that Node's new parser errors on by default.
		// Ensure that the "insecure" HTTP parser is used to parse these.
		// See https://github.com/nodejs/node/issues/27711
		insecureHTTPParser: true
	})
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
};

/**
 * This function takes the producer's "band ID".
 * This one's real easy to find-- just look at the URL of the site, e.g.
 * https://www.soundclick.com/artist/default.cfm?bandID=1240873
 * No prizes for guessing the band ID there.
 * @param {string} bandID The producer's "band ID".
 */
const crawlSoundclick = bandID => {
	const results = [];
	return crawlSoundclickPage(results, 1, bandID).then(() => results);
};

module.exports = crawlSoundclick;
