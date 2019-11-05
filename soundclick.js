const child_process = require('child_process');
const fs = require('fs').promises;

// SoundClick's CDN is broken and returns HTTP headers that Node's new parser errors on.
// Ensure that the legacy HTTP parser is used to parse these.
const crawlSoundclick = bandID => {
	return new Promise((resolve, reject) => {
		child_process.exec(`node --http-parser=legacy soundclick-inner.js ${bandID}`, (error, stdout, stderr) => {
			if (error !== null) reject(error);
			if (stdout) console.log(stdout);
			resolve();
		});
	}).then(() => {
		return fs.readFile('soundclick-results.json', {encoding: 'utf-8'});
	}).then(contents => {
		return fs.unlink('soundclick-results.json').then(() => JSON.parse(contents));
	});
}

module.exports = crawlSoundclick;