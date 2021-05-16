
// r: result array, t: array of traits,
// s: current branch string, i: position.
// first call: combinations([], t, '', 0);
function comb(r, t, s, i) {
	if (i == t.length - 1) {
		r.push(s); r.push(s);
		r[r.length - 2] += t[i].r;
		r[r.length - 1] += t[i].l;
		return;
	}
	// fast string copy:
	let temp = `${s}`;
	s += t[i].r;
	temp += t[i].l;
	comb(r, t, s, i + 1);
	comb(r, t, temp, i + 1);
}

export function combinations(traits) {
	let result = [];
	comb(result, traits, '', 0);
	return [... new Set(result)];
}

export function traits(dna) {
	let traits = [];
	for (let i = 0; i < dna.length; i += 2) {
		traits.push({ l: dna[i], r: dna[i + 1] });
	}
	return traits;
}

export function checker(dna) {
	dna = dna.replace(/[^A-Za-z]/g, '');
	const u = dna.toUpperCase();
	const l = dna.toLowerCase();
	let genes = '^';
	for (let i = 0; i < dna.length; i++) {
		genes += `[${u[i]}${l[i]}]{2}`;
	} genes += '$';
	return new RegExp(genes);
}

export function match(a, b) {
	return a.toLowerCase() == b.toLowerCase();
}

export function order(dna) {
	const isRecessive = a => a == a.toLowerCase();
	const isDominant  = a => a == a.toUpperCase();
	dna = dna.split('');
	for (let i = 0; i < dna.length; i += 2) {
		if (isRecessive(dna[i]) && isDominant(dna[i + 1])) {
			dna[i] = dna[i].toUpperCase();
			dna[i + 1] = dna[i + 1].toLowerCase();
		}
	}
	return dna.join('');
}

function cross(a, b) {
	let result = '';
	for (let i = 0; i < a.length; i++) {
		result += a[i] + b[i];
	}
	return order(result);
}

export function punnett(a, b) {
	let p = [];
	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < b.length; j++) {
			p.push(cross(a[i], b[j]));
		}
	}
	let probability = { };
	for (const s of p) {
		if (probability[s] == undefined) {
			probability[s] = 1;
		} else probability[s]++;
	}
	for (const [k, _] of Object.entries(probability)) {
		probability[k] /= p.length;
	}
	return probability;
}

export function binary(dna, genes) {

}

function loop(r, g, s, i) {
	if (i == g.length) {
		r.push(s); return;
	}
	// fast string copy:
	let t = `${s}`;
	let q = `${s}`;
	s += g[i].toUpperCase() + g[i].toUpperCase();
	t += g[i].toUpperCase() + g[i].toLowerCase();
	q += g[i].toLowerCase() + g[i].toLowerCase();
	loop(r, g, s, i + 1);
	loop(r, g, t, i + 1);
	loop(r, g, q, i + 1);
}

function number(dna, recessive) {
	let j = 0;
	for (let i = 0; i < dna.length; i++) {
		let x = dna[i] != dna[i].toLowerCase();
		if (recessive.includes(dna[i])) x = !x;
		j = (j << 1) | x;
	}
	return j;
}

export function list(genes) {
	let result = [];
	loop(result, genes, '', 0);
	let recessive = '';
	for (let i = 0; i < genes.length; i++) {
		if (genes[i] == genes[i].toLowerCase()) {
			recessive += genes[i] + genes[i].toUpperCase();
		}
	}
	return result.sort(
		(a, b) => number(a, recessive) - number(b, recessive)
	);
}
