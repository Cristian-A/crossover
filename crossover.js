
import { parse, optional, parameter, options } from './arguments.js';
import {
	combinations, traits, checker,
	match, punnett, list
} from './genetics.js';

function help() {
	console.log('\n  crossover usage:\n');
	console.log('  --version, -v: show version.');
	console.log('  --help, -h: show help menu.');
	console.log('  --dna, -d rose.json: dna info file.');
	console.log('    + - json:');
	console.log('    | species: string');
	console.log('    |   genes: string ');
	console.log('    | [UPPERCASE dominant, lowercase recessive]');
	console.log('    | aliases: dictionary -> { alias: dna }');
	console.log('    | highlight: { color: [ pattern ] }');
	console.log('  --list, -l: lists every individual possible');
	console.log('  --highlight, -H \'Xx\': highlights the individual');
	console.log('  --breed, -b \'Xx\' \'XX\': breeds the individuals\n');
}

function version() {
	console.log('\n  crossover: v1.0.0 all rights reserved.\n');
}

async function json(path) {
	return JSON.parse(await Deno.readTextFile(path));
}

function rgb(hex) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : undefined;
}

function ansiFromRGB(rgb) {
    if (rgb.r === rgb.g && rgb.g === rgb.b) {
        if (rgb.r < 8) return 16;
        if (rgb.r > 248) return 231;
        return Math.round(((rgb.r - 8) / 247) * 24) + 232;
    }
    return 16 + (36 * Math.round(rgb.r / 255 * 5))
           + (6 * Math.round(rgb.g / 255 * 5))
           + Math.round(rgb.b / 255 * 5);
}

function ansiFromHEX(hex) {
	let r = rgb(hex);
	if (r == undefined) {
		r = { r: 255, b: 255, g: 255 };
	}
	return ansiFromRGB(r);
}

function compare(dna, ptn) {
	if (ptn.length != dna.length) return false;
	for (let i = 0; i < dna.length; i++) {
		if (ptn[i] == '*') continue;
		if (ptn[i] != dna[i]) return false;
	}
	return true;
}

function highlight(data, dna) {
	for (const [c, p] of Object.entries(data)) {
		for (const pattern of p) {
			if (compare(dna, pattern)) return c;
		}
	}
	return '15';
}

const bg = e => `\x1b[48;5;${e}m`;
const fg = e => `\x1b[38;5;${e}m`;
const rs = '\x1b[0m';
const bc = '\x1b[48;5;235m';

(async function main() {

	let args = options([
		optional('--version', '-v'),
		optional('--help', '-h'),
		optional('--list', '-l'),
		parameter(1, '--dna', '-d'),
		parameter(2, '--breed', '-b'),
		parameter(1, '--highlight', '-H'),
	]);

	parse(args, Deno.args, true, (name, n) => {
		console.log(`\n  crossover: command '${name}' needs ${n} arguments!\n`);
		Deno.exit(1);
	}, (name, closest) => {
		console.log(`\n  crossover: unknown command '${name}'.`);
		console.log(`  did you mean '${closest}' instead?\n`);
		Deno.exit(1);
	});

	if (args.of('--help').found) { help(); Deno.exit(0); }
	if (args.of('--version').found) { version(); Deno.exit(0); }

	if (!args.of('--dna').found) {
		console.log('\n  crossover: missing -dna file!\n');
		Deno.exit(1);
	}

	let dna = await json(args.of('--dna').string());
	dna.checker = checker(dna.genes);

	if (args.of('--list').found) {
		const l = list(dna.genes);
		console.log(`\n  crossover species: ${bc} ${dna.species} ${rs}\n`);
		for (const i of l) {
			let c = highlight(dna.highlight, i);
			if (c[0] == '#') c = ansiFromHEX(c);
			console.log(`  ${bc+fg(c)} ●${fg(15)} ${i} ${rs}`);
		}
		console.log('');
		Deno.exit(0);
	} else if (args.of('--highlight').found) {
		let h = args.of('--highlight').values[0];
		if (dna.aliases[h] != undefined) h = dna.aliases[h];
		if (!dna.checker.test(h)) {
			console.log('\ncrossover: invalid individual!\n');
			Deno.exit(1);
		}
		console.log(`\n  crossover species: ${bc} ${dna.species} ${rs}\n`);
		let c = highlight(dna.highlight, h);
		if (c[0] == '#') c = ansiFromHEX(c);
		console.log(`  ${bc+fg(c)} ●${fg(15)} ${h} ${rs}\n`);
		Deno.exit(0);
	} else if (!args.of('--breed').found) {
		Deno.exit(1);
	}
	
	let a = args.of('--breed').values[0];
	let b = args.of('--breed').values[1];

	if (dna.aliases[a] != undefined) a = dna.aliases[a];
	if (dna.aliases[b] != undefined) b = dna.aliases[b];

	if (!dna.checker.test(a) ||
		!dna.checker.test(b) ||
		!match(a, b)) {
		console.log('\n  crossover: invalid individuals!\n');
		Deno.exit(1);
	}

	const probabilities = punnett(
		combinations(traits(a)),
		combinations(traits(b)),
	);

	console.log(`\n  crossover species: ${bc} ${dna.species} ${rs}\n`);

	for (const [k, v] of Object.entries(probabilities)) {
		let c = highlight(dna.highlight, k);
		if (c[0] == '#') c = ansiFromHEX(c);
		const f = (v * 100).toFixed(2);
		console.log(`  ${bc+fg(c)} ●${fg(15)} ${k}: ${f}% ${rs}`);
	}

	console.log('');

	Deno.exit(0);
	
})();
