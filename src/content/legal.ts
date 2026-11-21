// Privacy policy and terms of use. Placeholders: {operator}, {email}, {site}.
// Operators set OPERATOR_NAME and OPERATOR_EMAIL; review the text for your own deployment.

type LegalDocument = { title: string; sections: { heading: string; body: string[] }[] };

export const LEGAL_UPDATED = "21. 11. 2026";

export const legalDocuments: Record<"privacy" | "terms", Record<"en" | "sl", LegalDocument>> = {
  privacy: {
    sl: {
      title: "Politika zasebnosti",
      sections: [
        {
          heading: "Upravljavec",
          body: [
            "Upravljavec osebnih podatkov na {site} je {operator}. Za vsa vprašanja o zasebnosti pišite na {email}.",
          ],
        },
        {
          heading: "Katere podatke obdelujemo",
          body: [
            "- E-naslov: za prijavo in obvestila. Nikoli ga ne objavimo in ga ne posredujemo občini ali drugim.\n- Ime in profilna slika: prikazana sta javno ob vaših pobudah in komentarjih. Pri prijavi z Googlom ju prevzamemo iz vašega računa.\n- Pobude: opis, fotografije, lokacija, naslov in kategorija. Pobude so javne.\n- Komentarji in glasovi: komentarji so javni, glasovi se prikažejo kot skupno število.\n- Tehnični podatki: piškotki za prijavo in izbiro jezika ter IP-naslov v dnevnikih strežnika.",
            "Metapodatki fotografij (npr. lokacija GPS ali model telefona) se pred nalaganjem odstranijo. Lokacijo iz fotografije aplikacija uporabi samo za predlog lokacije pobude.",
          ],
        },
        {
          heading: "Nameni in pravna podlaga",
          body: [
            "- Izvajanje storitve, ki ste jo izbrali z registracijo (člen 6(1)(b) GDPR): prijava, objava pobud in komentarjev, obvestila o spremembah statusa.\n- Zakoniti interes (člen 6(1)(f) GDPR): varnost, preprečevanje zlorab in moderacija vsebin.",
            "Obvestila po e-pošti lahko kadarkoli izklopite v svojem profilu.",
          ],
        },
        {
          heading: "Fotografije in podatki drugih oseb",
          body: [
            "Ne objavljajte fotografij, na katerih so prepoznavni obrazi, registrske tablice ali drugi osebni podatki. Takšne vsebine skrijemo ali izbrišemo. Vsako vsebino lahko prijavite z gumbom »Prijavi neprimerno vsebino«.",
          ],
        },
        {
          heading: "Obdelovalci in zunanje storitve",
          body: [
            "- Supabase: baza podatkov, prijava in hramba fotografij na strežnikih v EU.\n- Vercel: gostovanje spletne aplikacije.\n- Resend: pošiljanje e-pošte.\n- Google: samo če se prijavite z Googlom.\n- Zemljevidi: OpenFreeMap (zemljevid), Esri (satelitski posnetki) in OpenStreetMap Nominatim (iskanje naslova). Te storitve prejmejo vaš IP-naslov in prikazano območje zemljevida.",
            "Z obdelovalci so sklenjene pogodbe o obdelavi podatkov. Kadar se podatki prenašajo izven EU, je prenos zavarovan s standardnimi pogodbenimi določili.",
          ],
        },
        {
          heading: "Hramba",
          body: [
            "Podatke hranimo, dokler imate račun. Ob izbrisu računa izbrišemo vaš profil, e-naslov ter vaše pobude in komentarje. Dnevnike strežnika hranimo največ 30 dni.",
          ],
        },
        {
          heading: "Vaše pravice",
          body: [
            "Imate pravico do dostopa, popravka, izbrisa, omejitve obdelave, prenosljivosti in ugovora. Zahtevo pošljite na {email}. Odgovorimo najkasneje v enem mesecu.",
            "Pritožbo lahko vložite pri Informacijskem pooblaščencu Republike Slovenije (www.ip-rs.si).",
          ],
        },
        {
          heading: "Piškotki",
          body: [
            "Uporabljamo samo nujne piškotke za prijavo in izbiro jezika. Izbiro prikaza zemljevida shranimo v vašem brskalniku. Ne uporabljamo analitike, sledenja ali oglaševanja.",
          ],
        },
        {
          heading: "Spremembe",
          body: ["O pomembnih spremembah te politike vas obvestimo na tej strani ali po e-pošti."],
        },
      ],
    },
    en: {
      title: "Privacy policy",
      sections: [
        {
          heading: "Controller",
          body: ["The controller of personal data on {site} is {operator}. For any privacy questions, write to {email}."],
        },
        {
          heading: "What we process",
          body: [
            "- E-mail address: for sign-in and notifications. It is never published or shared with the municipality or anyone else.\n- Name and profile picture: shown publicly with your reports and comments. With Google sign-in they come from your Google account.\n- Reports: description, photos, location, address and category. Reports are public.\n- Comments and votes: comments are public, votes are shown as a total.\n- Technical data: cookies for sign-in and language, and your IP address in server logs.",
            "Photo metadata (such as GPS location or phone model) is removed before upload. The app only uses a photo's location to suggest where the report is.",
          ],
        },
        {
          heading: "Purposes and legal basis",
          body: [
            "- Providing the service you signed up for (Art. 6(1)(b) GDPR): sign-in, publishing reports and comments, status notifications.\n- Legitimate interest (Art. 6(1)(f) GDPR): security, abuse prevention and content moderation.",
            "You can turn e-mail notifications off at any time in your profile.",
          ],
        },
        {
          heading: "Photos and other people's data",
          body: [
            "Do not post photos with recognisable faces, licence plates or other personal data. We hide or delete such content. Anyone can flag content with the “Flag as inappropriate” button.",
          ],
        },
        {
          heading: "Processors and third-party services",
          body: [
            "- Supabase: database, sign-in and photo storage on servers in the EU.\n- Vercel: hosting of the web app.\n- Resend: sending e-mail.\n- Google: only if you sign in with Google.\n- Maps: OpenFreeMap (map), Esri (satellite imagery) and OpenStreetMap Nominatim (address lookup). These services receive your IP address and the map area shown.",
            "Data processing agreements are in place with processors. Transfers outside the EU are covered by standard contractual clauses.",
          ],
        },
        {
          heading: "Retention",
          body: [
            "We keep your data while you have an account. When you delete your account, we delete your profile, e-mail address, reports and comments. Server logs are kept for at most 30 days.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You have the right to access, rectify, erase, restrict, port and object to the processing of your data. Send requests to {email}. We reply within one month.",
            "You can lodge a complaint with your data protection authority; in Slovenia this is the Information Commissioner (www.ip-rs.si).",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "We only use essential cookies for sign-in and language. Your map style choice is stored in your browser. There is no analytics, tracking or advertising.",
          ],
        },
        {
          heading: "Changes",
          body: ["We announce significant changes to this policy on this page or by e-mail."],
        },
      ],
    },
  },
  terms: {
    sl: {
      title: "Pogoji uporabe",
      sections: [
        {
          heading: "O storitvi",
          body: [
            "{site} upravlja {operator}. Storitev je brezplačna in temelji na odprtokodni platformi OpenCityVoice. Z njo občani javno objavljajo pobude in pripombe za svojo občino.",
            "Kadar pri občini ni navedeno drugače, storitev ni uradni kanal občine in občina pobud ne prejema samodejno. Za nujne primere, ko sta ogrožena življenje ali premoženje, pokličite 112 ali pristojno službo.",
          ],
        },
        {
          heading: "Račun",
          body: [
            "Za oddajo pobud, glasovanje in komentiranje potrebujete račun. Uporabljajte resnične podatke in skrbite za varnost dostopa do svojega e-naslova.",
          ],
        },
        {
          heading: "Pravila objave",
          body: [
            "Objavljajte resnične in konkretne pobude ter bodite spoštljivi. Prepovedano je:",
            "- žaljivo, grozilno ali sovražno izražanje;\n- objavljanje osebnih podatkov drugih (prepoznavni obrazi, registrske tablice, imena, naslovi);\n- oglaševanje, spam in ponavljanje istih pobud;\n- nezakonite vsebine in vsebine, za katere nimate pravic.",
          ],
        },
        {
          heading: "Javnost in uporaba vsebin",
          body: [
            "Pobude, fotografije, komentarji in vaše ime so javni. Z objavo dovolite, da jih prikažemo, delimo in posredujemo pristojni občini ali službi. Avtorske pravice ostanejo vaše.",
          ],
        },
        {
          heading: "Moderacija",
          body: [
            "Vsebine, ki kršijo ta pravila, lahko brez predhodnega obvestila skrijemo ali izbrišemo, ob ponavljajočih se kršitvah pa onemogočimo račun. Neprimerno vsebino prijavite z gumbom »Prijavi neprimerno vsebino«.",
          ],
        },
        {
          heading: "Odgovornost",
          body: [
            "Storitev je na voljo »takšna, kot je«, brez jamstva za nemoteno delovanje. Ne odgovarjamo za vsebine uporabnikov ali za odziv občine na pobude.",
          ],
        },
        {
          heading: "Spremembe in pravo",
          body: [
            "Pogoje lahko spremenimo. O pomembnih spremembah vas obvestimo na tej strani. Za pogoje velja pravo Republike Slovenije. Kontakt: {email}.",
          ],
        },
      ],
    },
    en: {
      title: "Terms of use",
      sections: [
        {
          heading: "About the service",
          body: [
            "{site} is run by {operator}. The service is free and based on the open-source OpenCityVoice platform. Citizens use it to publish reports and suggestions for their municipality.",
            "Unless stated otherwise for a municipality, the service is not an official channel of the municipality, and the municipality does not receive reports automatically. In emergencies, when life or property is at risk, call 112 or the competent service.",
          ],
        },
        {
          heading: "Account",
          body: [
            "You need an account to submit reports, vote and comment. Use accurate details and keep access to your e-mail address secure.",
          ],
        },
        {
          heading: "Posting rules",
          body: [
            "Post genuine, specific reports and be respectful. It is not allowed to post:",
            "- offensive, threatening or hateful content;\n- other people's personal data (recognisable faces, licence plates, names, addresses);\n- advertising, spam or duplicates of the same report;\n- unlawful content or content you have no rights to.",
          ],
        },
        {
          heading: "Public content and its use",
          body: [
            "Reports, photos, comments and your name are public. By posting, you allow us to display and share them and to forward them to the competent municipality or service. You keep the copyright.",
          ],
        },
        {
          heading: "Moderation",
          body: [
            "We may hide or delete content that breaks these rules without prior notice, and disable accounts for repeated violations. Flag inappropriate content with the “Flag as inappropriate” button.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "The service is provided “as is”, without any guarantee of availability. We are not responsible for user content or for how the municipality responds to reports.",
          ],
        },
        {
          heading: "Changes and governing law",
          body: [
            "We may change these terms and will announce significant changes on this page. These terms are governed by the law of the Republic of Slovenia. Contact: {email}.",
          ],
        },
      ],
    },
  },
};
