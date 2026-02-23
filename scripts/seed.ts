import { writeFileSync } from "node:fs";
import { join } from "node:path";

const sampleCsv = `name,day,month,tags,whatsapp,instagram,notes
Ana Silva,23,2,amigos;faculdade,https://wa.me/5511999999999,https://instagram.com/ana,Prefere mensagem cedo
Bruno Costa,25,2,trabalho,,https://instagram.com/bruno.c,Time favorito: Palmeiras
Carla Souza,1,3,familia,https://wa.me/5511888888888,,
`;

const outputPath = join(process.cwd(), "public", "sample-birthdays.csv");
writeFileSync(outputPath, sampleCsv, "utf8");
console.log(`CSV de exemplo gerado em: ${outputPath}`);
