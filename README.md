# Lebensmittel Kontrollergebnisse Scraper

Scrapes the hygiene reports of restaurants from [Berlin-Pankow's website](https://pankow.lebensmittel-kontrollergebnisse.de).

Results are uploaded nightly to the [data repo](https://github.com/okfde/lebensmittel-kontrollergebnisse-data).

## Usage

```bash
git clone --recurse-submodules https://github.com/okfde/lebensmittel-kontrollergebnisse-scraper.git
cd lebensmittel-kontrollergebnisse-scraper
yarn install
yarn scrape
```

Results will be saved in the `results` folder.
