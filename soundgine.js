const parseXML = require('@rgrove/parse-xml');
const fetch = require('node-fetch');
const logUpdate = require('log-update');

const fetchAsXML = url => {
	return fetch(url)
	.then(response => response.text())
	.then(parseXML);
};

const findChildElement = (element, childName) => {
	return element.children.find(child => child.name === childName) || null;
};

const crawlSoundginePage = (results, fromIndex, memberID, soundgineSettings) => {
	return fetchAsXML(`https://soundgine.com/${memberID}/hydra/loadBeats.php?tid=0&index=${fromIndex}`)
	.then(xml => {
		let numBeatsParsed = 0;
		for (const beatElement of xml.children[0].children) {
			if (beatElement.name !== 'track') continue;
			const parsedBeat = {producers: [soundgineSettings.artist]};

			for (const beatAttribute of beatElement.children) {
				if (beatAttribute.children.length !== 1) {
					continue;
				}
				const attributeValue = beatAttribute.children[0].text;
				switch (beatAttribute.name.toLowerCase()) {
					case 'name': {
						parsedBeat.name = attributeValue;
						break;
					}
					case 'bpm': {
						parsedBeat.bpm = Number(attributeValue);
						break;
					}
					case 'id': {
						parsedBeat.pageUrl = `https://soundgine.com/${memberID}/hydra?tr=beat-${attributeValue}`;
						break;
					}
					case 'dfp': {
						// There are two URLs here, 'dfp' and 'demo'.
						// 'demo' only works if the Referer header (IIRC) is properly set, while 'dfp' always works.
						// I'll let Soundgine's helpfully non-minified source code explain:
						//
						// if($(settings).find("PlaybackSecurity").text()=="0"){
						//     audioPlayer.src='../euplayer/ap/mp3s/'+beats[id]['dfp'];
						// }else{
						//     audioPlayer.src='https://soundgine.com/play/?type=beat&data='+beats[id]['demo']+'.exe';
						// }

						// Hope you didn't pay extra for that "Playback Security!"

						parsedBeat.fileUrl = encodeURI(`https://soundgine.com/@kustommike/euplayer/ap/mp3s/${attributeValue}`);
						break;
					}
					case 'genre': {
						if (attributeValue !== '') parsedBeat.genres = attributeValue.split(',').map(text => text.trim());
						break;
					}
					case 'mood': {
						if (attributeValue !== '') parsedBeat.moods = attributeValue.split(',').map(text => text.trim());
						break;
					}
					case 'sold': {
						parsedBeat.availableForPurchase = Number(attributeValue) === 0;
						break;
					}
				}
			}

			results.push(parsedBeat);
			numBeatsParsed++;
		}

		logUpdate(`${fromIndex + numBeatsParsed}/${soundgineSettings.numTracks} tracks loaded`);

		if (numBeatsParsed === 0) {
			logUpdate.done();
			return results;
		}

		return crawlSoundginePage(results, fromIndex + numBeatsParsed, memberID, soundgineSettings);
	});
};

const crawlSoundgineSettings = memberID => {
	return fetchAsXML(`https://soundgine.com/${memberID}/hydra/settings.php`)
	.then(xml => {
		const settingsElement = findChildElement(xml.children[0], 'settings');
		const artistElement = findChildElement(settingsElement, 'artist');
		const numTracks = Number(findChildElement(xml.children[0], 'TotalTracks').children[0].children[0].text);
		return {artist: artistElement.children[0].text, numTracks: numTracks};
	});
};

/**
 * This function takes the producer's "member ID". This can also be found as part of the iframe/widget embed URL.
 * For instance, if the iframe's src is https://soundgine.com/@kustommike/hydra
 * the member ID is "@kustommike".
 * @param {string} memberID The Soundgine member ID, leading @ sign included.
 */
const crawlSoundgine = memberID => {
	return crawlSoundgineSettings(memberID).then(settings => {
		return crawlSoundginePage([], 0, memberID, settings);
	});
};

module.exports = crawlSoundgine;
