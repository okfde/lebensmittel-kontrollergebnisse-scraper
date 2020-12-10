const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const BASE = 'https://pankow.lebensmittel-kontrollergebnisse.de';
const resultsDir = path.join(__dirname, 'results', 'pankow');

async function main() {
  let url = '/Search?filter=';

  const results = [];

  while (url) {
    const $ = await load(url);
    const urls = links($, 'div.card a.btn.btn-light.round-button');

    for (const url of urls) {
      const [, id] = /\/Ergebnisse\/Detail\/([\w\d]+)/.exec(url);
      const $ = await load(url);

      // base metadata
      const name = text($, 'div.card-body div.col-md-8 h3.startpage-h3');
      const kind = text($, 'div.card-body div.col-md-8 div div div.text-small');
      const address = text($, 'div.card-body div.col-md-8 > div');

      console.log('>', name);

      const images = links($, 'div.image-grid a');

      const dir = path.join(resultsDir, id);
      await fs.mkdirp(dir);

      // report images
      const imageFiles = [];
      for (const image of images) {
        const [, id] = /\?imageid=([\w\d]+)/.exec(image);
        const url = image.replace('/Image/', '/ImageData/');
        const { data } = await get(url, {
          responseType: 'arraybuffer',
          headers: {
            Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });

        console.log('>> Downloaded image', id);

        const filename = `${id}.jpg`;
        const file = path.join(dir, filename);
        await fs.writeFile(file, data);

        imageFiles.push(filename);
      }

      // current report results
      const selector = (n) =>
        `.bewertung-panel > div > div:nth-child(1) > div:nth-child(${n[0][0]})`;
      const date = formatDate($, selector`1`);
      const points = reportText($, selector`2`);
      const conclusion = reportText($, selector`3`);
      const smileyClasses = $('.bewertung-panel i.far').attr('class');
      const [, smiley] = /color-smiley-(\w+)/.exec(smileyClasses);

      const results = { date, points, conclusion, smiley };

      // follow up reports
      const followUps = [];
      const followUpEls = $('div.mt-2.p-3:not(.bewertung-panel)').toArray();
      for (const followUp of followUpEls) {
        const date = formatDate($, '.text-datum', followUp);
        if (!date) continue;

        const result = text($, 'div', followUp);

        followUps.push({ date, result });
      }

      // details
      const details = [];
      const rows = $('table.w-100 tr').toArray();
      for (const row of rows) {
        const propertyRaw = text($, 'th', row);
        if (!/\d+\./.test(propertyRaw)) continue;

        const property = propertyRaw.replace(/\d+\. /, '');
        const possiblePoints = text($, 'td:nth-of-type(1)', row);
        const achievedPoints = text($, 'td:nth-of-type(2)', row);

        details.push({ property, achievedPoints, possiblePoints });
      }

      const report = {
        id,
        name,
        kind,
        address,
        imageFiles,
        results,
        followUps,
        details,
      };

      const file = path.join(dir, `${id}.json`);
      await fs.writeJSON(file, report);
    }

    url = $('a.page-link[aria-label=Next]').attr('href');
  }
}

function get(url, ...attrs) {
  return axios.get(BASE + url, ...attrs);
}

async function load(url) {
  const { data } = await get(url);
  return cheerio.load(data);
}

function links($, selector) {
  return $(selector)
    .toArray()
    .map((el) => $(el).attr('href'));
}

function text($, ...selector) {
  return trim(
    $(...selector)
      .first()
      .text()
  );
}

function trim(text) {
  return text
    .replace(/\n {2,}(.*)\n/gm, ' $1')
    .replace(/\s{2,}/gm, '\n')
    .trim();
}

function reportText($, ...selector) {
  const el = $(...selector);
  $('span', el).remove();

  return trim(el.text());
}

function formatDate($, ...selector) {
  const d = text($, ...selector);
  const date = new Date(d.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$3-$2-$1'));

  return isFinite(date) ? date : false;
}

main().then(() => console.log('Done.'));
