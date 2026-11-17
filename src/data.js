export const MUSCLES = ["Brust","Rücken","Schultern","Bizeps","Trizeps","Beine","Gesäß","Bauch","Waden","Sonstige"];
export const MAX_PLANS = 10;

// [Name, Muskelgruppe, Standard-Satzpause in Sekunden]
export const SEED = [
  ["Bankdrücken","Brust",150],["Schrägbankdrücken","Brust",120],["Kurzhantel-Bankdrücken","Brust",120],["Fliegende","Brust",75],["Butterfly","Brust",75],["Dips","Brust",120],["Liegestütze","Brust",60],
  ["Klimmzüge","Rücken",120],["Latziehen","Rücken",90],["Langhantelrudern","Rücken",120],["Kabelrudern","Rücken",90],["Kreuzheben","Rücken",180],["Einarmiges Kurzhantelrudern","Rücken",90],["Hyperextensions","Rücken",60],
  ["Schulterdrücken","Schultern",120],["Seitheben","Schultern",60],["Frontheben","Schultern",60],["Reverse Butterfly","Schultern",60],["Face Pulls","Schultern",60],["Arnold Press","Schultern",90],
  ["Langhantel-Curls","Bizeps",75],["Kurzhantel-Curls","Bizeps",60],["Hammer-Curls","Bizeps",60],["Scott-Curls","Bizeps",75],
  ["Trizepsdrücken am Kabel","Trizeps",60],["French Press","Trizeps",75],["Enges Bankdrücken","Trizeps",120],["Overhead-Trizepsstrecken","Trizeps",60],
  ["Kniebeuge","Beine",180],["Beinpresse","Beine",120],["Rumänisches Kreuzheben","Beine",150],["Ausfallschritte","Beine",90],["Beinstrecker","Beine",75],["Beinbeuger","Beine",75],["Bulgarian Split Squat","Beine",120],
  ["Hip Thrust","Gesäß",120],["Glute Bridge","Gesäß",75],["Kabel-Kickbacks","Gesäß",60],
  ["Crunches","Bauch",45],["Beinheben hängend","Bauch",60],["Plank","Bauch",45],["Kabel-Crunches","Bauch",60],
  ["Wadenheben stehend","Waden",60],["Wadenheben sitzend","Waden",60],
];
export const STARTERS = ["Bankdrücken","Kniebeuge","Kreuzheben","Klimmzüge","Schulterdrücken","Langhantelrudern"];
export const ORDER = Object.fromEntries(SEED.map((s, i) => [s[0], i]));
