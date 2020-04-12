const cheerio = require('cheerio');
const fetch = require('node-fetch');
const logUpdate = require('log-update');

const pageCache = new Map();
const fetchLinksFromPage = pageURL => {
	if (pageCache.has(pageURL)) {
		return Promise.resolve(pageCache.get(pageURL));
	}
	return fetch(pageURL)
	.then(response => {
		if (response.status === 404) return null;

		return response.text().then(response => {
			const $ = cheerio.load(response);

			const producerLinks = $('#page').find('.post-top > small > a').toArray().map(element => element.attribs['href']);
			const links = [];
			for (const link of producerLinks) {
				if (links.indexOf(link) === -1) links.push(link);
			}

			pageCache.set(pageURL, links);
			return links;
		});
	})
}

const findNumPages = async () => {
	let minPage = 1;
	let maxPage = 2;

	while (true) {
		const maxPageLinks = await fetchLinksFromPage(`http://www.shadowville.com/page/${maxPage}/`);

		console.log(minPage, maxPage);

		if (maxPageLinks === null) break;
		minPage *= 2;
		maxPage *= 2;
	}

	while (true) {
		const mid = Math.floor((minPage + maxPage) * 0.5);
		const midPageLinks = await fetchLinksFromPage(`http://www.shadowville.com/page/${mid}/`);

		if (midPageLinks === null) {
			maxPage = mid;
		} else {
			minPage = mid;
		}

		console.log(minPage, maxPage);

		// probably incorrect
		if (minPage === maxPage - 1) return minPage;
	}
}

const collectProducerLinks = async (batchSize) => {
	const maxPageNum = await findNumPages();

	const links = [];
	for (let i = 1; i <= maxPageNum; i += batchSize) {
		const linkPromises = [];
		let j = i;
		for (; j < i + batchSize && j <= maxPageNum; j++) {
			linkPromises.push(
				fetchLinksFromPage(`http://www.shadowville.com/page/${j}/`).then(pageLinks => {
					for (const link of pageLinks) {
						if (links.indexOf(link) === -1) links.push(link);
					}
				})
			);
		}
		await Promise.all(linkPromises);
		console.log(`${j - 1}/${maxPageNum} link pages loaded`);
	}

	return links;
}

const fetchBeatPage = pageURL => {
	return fetch(pageURL)
	.then(response => response.text())
	.then(response => {
		const beats = [];

		const $ = cheerio.load(response);
		$('.post, .post_alt').each((index, element) => {
			const elem = $(element);
			const header = elem.find('.post-top > h2 > a');
			const beatName = header.text();
			// the biography at the top of each page is also a .post, but does not have an h2
			if (beatName) {
				const details = elem.find('.post-top > small');
				const detailsText = details.text();

				const bpm = Number(detailsText.split(' | ').find(str => str.includes('BPM')).split('BPM:')[1].trim());
				const producers = details.find('a').map((index, element) => $(element).text().trim()).toArray();
				const pageUrl = header.attr('href');
				const fileUrl = elem.find('div[id^="podPressPlayerSpace_"] > div > div').attr('data-media');
				const moods = elem.find('.post_det > .alignleft > a').map((index, element) => $(element).text().trim()).toArray();
				const genres = elem.find('.post_det > .alignright > a').map((index, element) => $(element).text().trim()).toArray();

				const purchasable = elem.find('.buybutton_only form').length > 0;

				beats.push({
					name: beatName,
					bpm: bpm,
					pageUrl: pageUrl,
					fileUrl: fileUrl,
					producers: producers,
					genres: genres,
					moods: moods,
					availableForPurchase: purchasable,
					hasHook: beatName.includes('(With Hook)')
				})
			}
		});

		return beats;
	})
}

const fetchProducerBeats = producerLink => {
	return fetch(producerLink)
	.then(response => response.text())
	.then(response => {
		const $ = cheerio.load(response);
		const numPages = Number($('.pages').text().split(' of ')[1]);

		const pagePromises = [];
		let numLoaded = 0;

		for (let i = 1; i <= numPages; i++) {
			pagePromises.push(fetchBeatPage(producerLink + `page/${i}`).then(page => {
				logUpdate(`${++numLoaded}/${numPages} pages loaded`);
				return page;
			}));
		}

		return Promise.all(pagePromises).then(pages => {
			logUpdate.done();
			return pages.flat();
		});
	})
}

/**
 * This takes no input, and just fetches all beats from the entire Shadowville site, which is a janky mess of PHP.
 */
const fetchAllBeats = async () => {
	console.log('Collecting links...');
	let producerLinks = await collectProducerLinks(25);

	const beats = [];
	for (const [index, link] of producerLinks.entries()) {
		console.log(`Fetching beats from ${link} (${index + 1}/${producerLinks.length})`);
		const producerBeats = await fetchProducerBeats(link);
		for (const beat of producerBeats) {
			beats.push(beat);
		}
	}

	return beats;
}

module.exports = fetchAllBeats;