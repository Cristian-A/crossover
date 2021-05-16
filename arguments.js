
function levenstein(source, target) {
	source = source.toLowerCase();
	target = target.toLowerCase();
	if (source.length > target.length) {
		[target, source] = [source, target];
	}
	const min = source.length;
	const max = target.length;
	let distance = new Array(min + 1);
	for (let i = 0; i <= min; i += 1) {
		distance[i] = i;
	}
	for (let j = 1; j <= max; j += 1) {
		let previousDiagonal = distance[0];
		let previousDiagonalSave;
		distance[0] += 1;
		for (let i = 1; i <= min; i += 1) {
			previousDiagonalSave = distance[i];
			if (source[i - 1] == target[j - 1]) {
				distance[i] = previousDiagonal;
			} else {
				distance[i] = Math.min(
					Math.min(
						distance[i - 1], distance[i]
					),
					previousDiagonal
				) + 1;
			}
			previousDiagonal = previousDiagonalSave;
		}
	}
	return distance[min];
}

function closest(s, args) {
	if (!args.length || s.length == 0) return '';
	let p = 0;
	let c = levenstein(s, args[p].name);
	for (let i = 1; i < args.length; i += 1) {
		const t = levenstein(s, args[i].name);
		if (t < c) { c = t; p = i; }
	}
	return args[p].name;
}

export function argument(n, a, p) {
	return {
		found: false,
		params: p,
		name: n,
		alias: a,
		values: [],
		string: function() {
			return this.values.length ?
				   this.values[0] : undefined;
		}
	};
}

export function parameter(p, n, a) {
	return argument(n, a, p);
}

export function optional(n, a) {
	return argument(n, a, 0);
}

export function list(n, a) {
	return argument(n, a, -1);
}

export function options(list) {
	return {
		free: [],
		of: function(name) {
			for (const a of args) {
				if (a.name == name) return a;
			}
			return undefined;
		},
		args: list
	};
}

export function parse(o, argv, strict, number, invalid) {
	const argc = argv.length;
	o.free = [];
	o.of = function(name) {
		for (const a of o.args) {
			if (a.name == name) return a;
		}
		return undefined;
	}
	for (let i = 0; i < argc; i++) {
		let current = argv[i];
		let found = false;
		for (let j = 0; j < o.args.length; j++) {
			if (current == o.args[j].name ||
				current == o.args[j].alias ) {
				if (o.args[j].params == -1) {
					for (let k = i + 1; k < argc; k++) {
						o.args[j].values.push(argv[k]);
					} return;
				}
				const req = o.args[j].params + i;
				if (req >= argc) {
					number(o.args[j].name, o.args[j].params);
					return;
				}
				o.args[j].found = true;
				for (let k = i + 1; k <= req; k++) {
					o.args[j].values.push(argv[k]);
				}
				i = req; found = true; break;
			}
		}
		if (!found) {
			if (strict) {
				invalid(current, closest(current, o.args));
				return;
			}
			o.free.push(current);
		}
	}
}
