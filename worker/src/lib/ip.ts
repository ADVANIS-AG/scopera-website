/** Kuerzt eine IP-Adresse auf das Netz: IPv4 auf /24, IPv6 auf /48.
 *
 *  Gedacht fuer alles, was laenger als eine Sitzung aufbewahrt wird. Die grobe Herkunft bleibt
 *  fuer die Statistik erhalten, die Adresse ist aber keiner Person mehr zuzuordnen. Dasselbe
 *  Vorgehen nutzt die Plattform bereits bei der Spielwiese. */
export function kuerzeIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";

  if (ip.includes(":")) {
    // Nur der Teil vor "::" zaehlt. Die Kurzschreibweise steht fuer Nullgruppen, die sonst
    // wegfielen und eine spaetere Gruppe faelschlich ins Praefix ruecken liessen
    // ("2001:db8::1" ergaebe sonst 2001:db8:1 statt 2001:db8:0).
    const kopf = ip.split("::")[0];
    const gruppen = kopf
      .split(":")
      .filter((g) => g !== "")
      .map((g) => g.toLowerCase().replace(/^0+(?=.)/, ""));
    while (gruppen.length < 3) gruppen.push("0");
    return `${gruppen.slice(0, 3).join(":")}::/48`;
  }

  const teile = ip.split(".");
  if (teile.length !== 4 || teile.some((t) => t === "")) return "unknown";
  return `${teile[0]}.${teile[1]}.${teile[2]}.0/24`;
}
