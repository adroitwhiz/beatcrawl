const htmlparser2 = require('htmlparser2');
const {DomHandler} = require('domhandler');

const parseAsHTML = responseText => {
	return new Promise((resolve, reject) => {
		const handler = new DomHandler((error, dom) => {
			if (error) reject(error);
			resolve(dom);
		});

		const parser = new htmlparser2.Parser(handler, {decodeEntities: true});
		parser.write(responseText);
		parser.end();
	});
};

module.exports = parseAsHTML;
