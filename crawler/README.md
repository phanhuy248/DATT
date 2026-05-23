# SmartShop Product Crawler

Crawler Playwright exports real product data to `output/products.json` using this shape:

```json
{
  "products": [
    {
      "source": "cellphones",
      "sourceSite": "CellphoneS",
      "sourceUrl": "https://...",
      "name": "Product name",
      "price": 19990000,
      "image": "https://...",
      "images": ["https://..."],
      "description": "Short description",
      "specifications": { "CPU": "Intel Core i5" },
      "stock": 10,
      "category": "Laptop",
      "supplier": "CellphoneS",
      "brand": "Apple"
    }
  ]
}
```

Run:

```bash
npm install
npm run crawl -- --per-category=4 --limit=48
```

Generate fake bulk data:

```bash
npm run fake:80
```

This writes `output/fake-products.json` from DummyJSON products whose names and images match. The exact count depends on the source data available for laptops, smartphones, and mobile accessories.

Import to backend:

```bash
curl -X POST http://localhost:8080/api/admin/import-products \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  --data @output/products.json
```

For fake data, change the payload file to `output/fake-products.json`.

Daily sync can be enabled in Spring Boot with:

```properties
PRODUCT_SYNC_ENABLED=true
PRODUCT_SYNC_COMMAND=npm run crawl -- --per-category=4 --limit=48
PRODUCT_SYNC_WORKING_DIR=crawler
PRODUCT_SYNC_FILE=crawler/output/products.json
```
