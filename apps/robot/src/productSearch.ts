import type { Locator, Page } from "playwright";

const searchSelectors = [
  'input[placeholder*="Digite o nome do produto" i]',
  'input[placeholder*="nome do produto" i]',
  'input[placeholder*="código" i]',
  'input[placeholder*="codigo" i]',
  'input[placeholder*="pesquis" i]',
  'input[aria-label*="pesquis" i]',
  'input[type="search"]',
  'input[name*="search" i]',
  'input[name*="pesquis" i]',
  'input[id*="search" i]',
  'input[id*="pesquis" i]'
];

async function firstVisible(page: Page): Promise<Locator | null> {
  for (const selector of searchSelectors) {
    const loc = page.locator(selector).first();
    try {
      if (await loc.isVisible({ timeout: 1200 })) return loc;
    } catch {}
  }
  return null;
}

async function triggerSearch(page: Page, input: Locator) {
  await input.press("Enter").catch(() => {});
  await page.waitForTimeout(900);

  const nearbyButton = input.locator("xpath=following::*[self::button or self::a][1]");
  if (await nearbyButton.isVisible({ timeout: 700 }).catch(() => false)) {
    await nearbyButton.click().catch(() => {});
    await page.waitForTimeout(1200);
    return;
  }

  const genericSearchButton = page
    .locator('button, a')
    .filter({ has: page.locator('svg, i, .fa-search, .glyphicon-search') })
    .first();

  if (await genericSearchButton.isVisible({ timeout: 700 }).catch(() => false)) {
    await genericSearchButton.click().catch(() => {});
    await page.waitForTimeout(1200);
  }
}

function parseMoney(text: string): number | undefined {
  const m = text.match(/R\$\s*([\d.]+,\d{2})/i);
  if (!m) return undefined;
  const n = Number(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function parseNumber(value: string): number | undefined {
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function parseCurrentPrice(text: string): number | undefined {
  // Na Plataforma Click o preço vigente aparece como "Por R$ ..." e o valor
  // anterior como "De R$ ...". A ordem é importante para não confundir os dois.
  const patterns = [
    /(?:^|\n)\s*Por\s+R\$\s*([\d.]+,\d{2})\b/im,
    /pre[cç]o\s+(?:atual|de venda)[^R$]{0,60}R\$\s*([\d.]+,\d{2})\b/i,
    /valor\s+do\s+produto[^R$]{0,60}R\$\s*([\d.]+,\d{2})\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = parseNumber(match[1]);
    if (value !== undefined && value > 0) return value;
  }
  return undefined;
}

export function parseStock(text: string, branch?: string): number | undefined {
  // O estoque deve ser o da filial da sessão. Em "LG53: 5", procurar apenas
  // o primeiro número depois de "Estoque" retornava 53 (o código da filial).
  if (branch) {
    const exactBranch = new RegExp(`(?:^|\\n)\\s*${escapeRegex(branch)}\\s*:\\s*(\\d+)\\b`, "im");
    const match = text.match(exactBranch);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }

  const patterns = [
    /estoque\s*(?:atual|dispon[ií]vel)?\s*:\s*(\d+)\b/i,
    /saldo\s*(?:atual|dispon[ií]vel)?\s*:\s*(\d+)\b/i
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

export function productNameFromText(text: string, code: string): string | undefined {
  const codePattern = escapeRegex(code);
  const match = text.match(new RegExp(`(?:^|\\n)\\s*([^\\n]{3,240}?)\\s+COD\\.?\\s*:\\s*${codePattern}\\b`, "im"));
  return match?.[1]?.trim() || undefined;
}

function decodeHtmlUrl(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function productLinkFromHtml(html: string, code: string, origin: string): string | undefined {
  const c = escapeRegex(code);
  const patterns = [
    new RegExp(`href=["']([^"']*\\/${c}\\/[^"']*)["']`, "i"),
    new RegExp(`href=["']([^"']*[?&](?:cod|codigo|produto)=${c}(?:[&#"'][^"']*)?)["']`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;
    try { return new URL(decodeHtmlUrl(match[1]), origin).toString(); } catch {}
  }
  return undefined;
}

function voltageOptions(text: string) {
  const found = new Set<string>();
  for (const match of text.matchAll(/\b(110|127|220)\s*V\b/gi)) found.add(`${match[1]}V`);
  if (/\bbivolt\b/i.test(text)) found.add("Bivolt");
  return [...found];
}

function branchFromText(text: string) {
  const match = text.match(/\bLG\s*(\d{1,4})\b/i);
  return match ? `LG${match[1]}` : undefined;
}

async function firstText(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    const text = (await loc.textContent({ timeout: 500 }).catch(() => null))?.trim();
    if (text) return text;
  }
  return "";
}

async function firstAttr(page: Page, selectors: string[], attr: string) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    const value = await loc.getAttribute(attr, { timeout: 500 }).catch(() => null);
    if (value) return value;
  }
  return undefined;
}

async function priceFromPage(page: Page, bodyText: string) {
  // O texto visível é a fonte mais segura para o layout atual da Click.
  // Ex.: "De R$ 99,88" / "Por R$ 79,90" -> retorna 79,90.
  const visibleCurrentPrice = parseCurrentPrice(bodyText);
  if (visibleCurrentPrice !== undefined) return visibleCurrentPrice;

  // A página da Plataforma Click contém vários valores (garantia, parcela, montagem,
  // preço antigo etc.). Por isso não usamos mais o primeiro "R$" encontrado no body.
  // Priorizamos elementos semanticamente ligados ao preço principal do produto.
  const candidates = await page.evaluate(() => {
    const moneyRx = /R\$\s*([\d.]+,\d{2})/i;
    const plainRx = /^\s*([\d.]+,\d{2})\s*$/;
    const selectors = [
      '[itemprop="price"]',
      '[data-price]', '[data-preco]', '[data-valor]',
      '.preco-produto', '.produto-preco', '.preco-atual', '.preco-venda',
      '.valor-produto', '.valor-venda', '.price-current', '.product-price',
      '[class*="preco" i]', '[id*="preco" i]', '[class*="price" i]', '[id*="price" i]'
    ];
    const seen = new Set<Element>();
    const out: Array<{raw:string; context:string; score:number}> = [];

    for (const selector of selectors) {
      for (const el of Array.from(document.querySelectorAll(selector))) {
        if (seen.has(el)) continue;
        seen.add(el);
        const style = window.getComputedStyle(el as HTMLElement);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const attrs = ['content','data-price','data-preco','data-valor','value']
          .map(a => el.getAttribute(a) || '').filter(Boolean).join(' ');
        const text = `${attrs} ${(el.textContent || '')}`.trim();
        const context = `${el.id || ''} ${(el as HTMLElement).className || ''} ${el.parentElement?.textContent || ''}`.slice(0, 700);
        const m = text.match(moneyRx) || text.match(plainRx);
        if (!m) continue;

        let score = 0;
        const marker = `${el.id || ''} ${(el as HTMLElement).className || ''} ${el.getAttribute('itemprop') || ''}`.toLowerCase();
        if (el.getAttribute('itemprop') === 'price') score += 120;
        if (/preco-produto|produto-preco|preco-atual|preco-venda|product-price|price-current/.test(marker)) score += 90;
        else if (/preco|price/.test(marker)) score += 45;
        if (/à vista|a vista|preço atual|preco atual|valor do produto|preço do produto|preco do produto/i.test(context)) score += 25;
        if (/parcela|x de|garantia|frete|montagem|entrada|economia|desconto|juros|serviço|servico/i.test(context)) score -= 80;
        out.push({raw:m[1], context, score});
      }
    }
    return out;
  }).catch(() => [] as Array<{raw:string;context:string;score:number}>);

  const parsed = candidates
    .map(c => ({...c, value:Number(c.raw.replace(/\./g, '').replace(',', '.'))}))
    .filter(c => Number.isFinite(c.value) && c.value > 0)
    .sort((a,b) => b.score - a.score);

  // Um seletor genérico de `.preco`/`.valor` não é suficiente: a página
  // possui outros valores e foi assim que R$ 652,07 apareceu como preço.
  if (parsed.length && parsed[0].score >= 80) return parsed[0].value;

  // Fallback conservador: só aceita um valor quando ele estiver explicitamente
  // associado a "preço/valor do produto". É melhor mostrar "Não capturado" que
  // exibir parcela, garantia ou outro valor como se fosse o preço do item.
  return undefined;
}

async function ensureAuthenticated(page: Page) {
  const password = page.locator('input[type="password"]').first();
  if (await password.isVisible({ timeout: 350 }).catch(() => false)) {
    throw new Error("CLICK_SESSION_EXPIRED");
  }
}

async function directSearch(page: Page, code: string) {
  const origin = new URL(page.url()).origin;
  const response = await page.request.post(`${origin}/busca`, {
    form: { termo: code },
    timeout: 60000
  });
  if (!response.ok()) return undefined;
  const html = await response.text();
  const responseUrl = response.url();
  if (new RegExp(`/${escapeRegex(code)}/`, "i").test(responseUrl)) return responseUrl;
  return productLinkFromHtml(html, code, origin);
}

async function visualSearch(page: Page, code: string) {
  const input = await firstVisible(page);
  if (!input) return false;
  await input.click();
  await input.fill("");
  await input.fill(code);
  await triggerSearch(page, input);
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(900);
  return true;
}

export async function searchProduct(page: Page, productCode: string) {
  const code = String(productCode || "").trim();
  if (!code) throw new Error("Informe o código do produto.");

  await ensureAuthenticated(page);

  let captureMethod: "endpoint" | "visual" = "endpoint";
  let productUrl = await directSearch(page, code).catch(() => undefined);

  if (productUrl) {
    await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(700);
  } else {
    captureMethod = "visual";
    const searched = await visualSearch(page, code);
    if (!searched) throw new Error("PRODUCT_SEARCH_NOT_AVAILABLE");
    productUrl = page.url();
  }

  await ensureAuthenticated(page);

  const bodyText = (await page.locator("body").innerText().catch(() => "")).slice(0, 18000);
  const urlHasCode = new RegExp(`/${escapeRegex(code)}(?:/|$)`, "i").test(page.url());
  const textHasCode = new RegExp(`(?:COD\\.?|CÓD\\.?|CÓDIGO)?\\s*[:.-]?\\s*${escapeRegex(code)}\\b`, "i").test(bodyText);
  const found = urlHasCode || textHasCode;

  const titleName = await firstText(page, [
    '[itemprop="name"]', '.nome-produto', '.product-name',
    '.titulo-produto', '[class*="produto" i][class*="nome" i]'
  ]);
  const pageTitle = await page.title();
  const name = productNameFromText(bodyText, code)
    || titleName
    || pageTitle.replace(/\s*[|\-–]\s*(?:Plataforma Click|Lojas Guaibim).*$/i, "").trim();

  const price = found ? await priceFromPage(page, bodyText) : undefined;
  const branch = branchFromText(bodyText);
  const stock = found ? parseStock(bodyText, branch) : undefined;
  const volts = voltageOptions(`${name}\n${bodyText}`);
  const imageSrc = await firstAttr(page, [
    'img[src*="/sistema/imgp/produto/"]',
    'img[src*="/sistema/imgp/zoom/"]',
    '[itemprop="image"]'
  ], "src");
  const imageUrl = imageSrc ? new URL(imageSrc, page.url()).toString() : undefined;

  return {
    found,
    code,
    name: found ? name : "",
    price,
    stock,
    branch,
    voltageOptions: volts,
    imageUrl,
    productUrl: found ? page.url() : productUrl,
    text: found ? bodyText.slice(0, 5000) : "",
    source: "plataforma-click",
    captureMethod,
    capturedAt: new Date().toISOString(),
    url: page.url(),
    title: pageTitle
  };
}
