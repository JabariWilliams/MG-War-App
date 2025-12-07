import React from "react";

export default function LegacyStatsPage() {
  const links = [
    {
      title: "10/25/25 Attack V OppoBon | WF | Loss",
      url: "https://docs.google.com/spreadsheets/d/1wU8VtOdYoZ8T89OK2p_HKbfskaSOW6HC4vpQwzedccc/edit?usp=sharing",
    },
    {
      title: "11/10/25 Attack v K6 | NH | Loss",
      url: "https://docs.google.com/spreadsheets/d/1gjqL4nnV2Gdzmi2w8LPT5Ijd60buLpt3Eu_A7ulqP2E/edit?usp=sharing",
    },
    {
      title: "11/14/25 Attack v K6 | NH | Loss",
      url: "https://docs.google.com/spreadsheets/d/1xl2YRvxjuBBdL8Cm1PIXLLUz_vpOUQHasEPcxjgXwFk/edit?usp=sharing",
    },
    {
      title: "11/18/25 Attack v K6 | NH | Win",
      url: "https://docs.google.com/spreadsheets/d/1nJ1enkLss5-f4mwhnaBiJuxfisXryWBEFW9OpeDuy6Y/edit?usp=sharing",
    },
  ];

  return (
    <section className="nw-panel p-6 space-y-6">
      <h2 className="nw-title text-nw-gold-soft text-3xl">
         Legacy Stats Archive
      </h2>

      <p className="opacity-80">
        A collection of historical Mercguards war data and spreadsheets from
        previous seasons.
      </p>

      <div className="space-y-4">
        {links.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-black/20 rounded-lg border border-nw-gold/40 hover:bg-black/30 transition"
          >
            <p className="text-nw-gold-soft text-lg mb-1">{item.title}</p>
            <a
              href={item.url}
              target="_blank"
              className="underline text-nw-parchment-soft break-all"
            >
              {item.url}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
