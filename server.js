var forever = require('forever');

var child = new (forever.Monitor)('./index.js', {
	max: 100,
	silent: true,
	watch: false,
	env: {'NODE_ENV': 'production', 'ALGERIE_SPLASHSCREEN':'maintenance'}
});

//child.on('exit', child.start());
child.start();
forever.startServer(child);