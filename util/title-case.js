const titleCase = str => {
	return str.toLowerCase().split(' ').map(word => {
		// Inefficient but handles Unicode correctly
		const characters = Array.from(word.toLowerCase());
		for (let i = 0; i < characters.length; i++) {
			const upper = characters[i].toUpperCase();
			if (upper !== characters[i]) {
				characters[i] = upper;
				break;
			}
		}
		return characters.join('');
	}).join(' ');
};

module.exports = titleCase;
