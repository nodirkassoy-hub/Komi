/* PENAPLAST — app entry (ES modules, deferred by default) */
import { applyStaticI18n, t } from './i18n.js';
import { initTheme } from './theme.js';
import { initHeader } from './header.js';
import { initHero } from './hero.js';
import { initReveals } from './reveal.js';
import { initProducts } from './products.js';
import { initSearch } from './search.js';
import { initSections } from './sections.js';
import { initDetail } from './detail.js';
import { initOrder } from './order.js';
import { initExperience } from './experience.js';

document.title = t('meta.title');
applyStaticI18n();

initTheme();
initHeader();
initHero();
initReveals();
initProducts();
initSearch();
initSections();
initDetail();
initOrder();
initExperience();
