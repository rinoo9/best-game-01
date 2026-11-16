// The HTML HUD and panels: coins, level and XP bar, zone, collection, prompts,
// tension bar, banners, and the title, catch, shop, map, fishdex, win and
// pause panels. The 3D scene is the canvas underneath; this is the MMORPG
// chrome on top of it.

import { ALL_FISH, CLOTHES, RODS, TIERS, ZONES } from './config.js';
import { bestCatches, collectionPercent } from './fish.js';
import { buyClothes, buyRod, clothesBySlot, equipClothes, equipRod, isEquipped, ownsClothes } from './shop.js';

const $ = (id) => document.getElementById(id);

function tierBadge(tier) {
  const info = TIERS[tier];
  return `<span class="tier" style="background:${info.color};color:#14181d">${info.name} · 1 in ${info.odds.toLocaleString('en-US')}</span>`;
}

/** A little CSS fish silhouette, coloured like the catch. */
function fishVisual(fish) {
  return `<div class="catch-fish" style="background:linear-gradient(135deg, ${fish.body} 55%, ${fish.belly} 55%)"></div>`;
}

/** Create the UI. `handlers` are the game's callbacks for every button. */
export function createUI(handlers) {
  let shopTab = 'hat';
  let bannerTimer = null;

  function show(el) {
    el.classList.remove('hidden');
  }
  function hide(el) {
    el.classList.add('hidden');
  }

  // ---- HUD
  function updateHUD(state) {
    show($('hud'));
    $('hud-coins').textContent = `Coins: ${state.profile.coins.toLocaleString('en-US')}`;
    $('hud-level').textContent = `Lv ${state.profile.level}`;
    const need = state.xpNeed;
    const pct = Math.min(100, Math.round((state.profile.xp / need) * 100));
    $('xp-fill').style.width = `${pct}%`;
    $('hud-zone').textContent = state.zoneName;
    $('hud-collection').textContent = `Collection ${collectionPercent(new Set(Object.keys(state.profile.caught)))}%`;
    $('hud-rod').textContent = state.rodName;
    if (state.goldenHour) {
      show($('golden-badge'));
      $('golden-badge').textContent = `Golden Hour ${Math.ceil(state.goldenLeft)}s — rare odds x2!`;
    } else {
      hide($('golden-badge'));
    }
  }

  function setPrompt(text) {
    $('prompt').textContent = text ?? '';
  }

  function setTension(visible, tension, progress) {
    if (visible) {
      show($('tension'));
      $('tension-fill').style.width = `${Math.round(tension)}%`;
      $('tension-fill').style.background = tension > 70 ? '#ff4d4d' : tension > 40 ? '#ffd60a' : '#58c96b';
      $('reel-pct').textContent = `${Math.round(progress * 100)}% in — hold SPACE to reel!`;
    } else {
      hide($('tension'));
    }
  }

  function banner(text, ms = 2600) {
    $('banner').textContent = text;
    show($('banner'));
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => hide($('banner')), ms);
  }

  // ---- panels
  function hideAllPanels() {
    for (const id of ['catch-panel', 'shop-panel', 'map-panel', 'dex-panel', 'win-panel', 'pause-panel']) hide($(id));
  }

  function showTitle(bestScore, collection) {
    hideAllPanels();
    show($('title-screen'));
    show($('hud'));
    $('title-best').textContent = `Best coins: ${bestScore.toLocaleString('en-US')}    Collection: ${collection}%`;
  }
  function hideTitle() {
    hide($('title-screen'));
  }

  function showCatch(fish, isWin) {
    hideAllPanels();
    $('catch-visual').innerHTML = fishVisual(fish);
    $('catch-name').textContent = fish.name;
    $('catch-tier').innerHTML = tierBadge(fish.tier);
    $('catch-stats').textContent = `Weight: ${fish.weight} kg   +${fish.coins.toLocaleString('en-US')} coins   Caught at ${fish.zoneName ?? fish.zone}`;
    $('catch-title').textContent = isWin && fish.tier === 'divine' ? 'THE DIVINE ONE!' : 'CAUGHT!';
    $('catch-title').style.color = TIERS[fish.tier].color;
    show($('catch-panel'));
  }

  function renderShop(profile) {
    $('shop-coins').textContent = `${profile.coins.toLocaleString('en-US')} coins`;
    const rows = $('shop-rows');
    rows.innerHTML = '';
    const tabs = document.querySelectorAll('#shop-tabs button');
    tabs.forEach((button) => button.classList.toggle('active', button.dataset.tab === shopTab));
    if (shopTab === 'rod') {
      for (const rod of RODS) {
        const owned = profile.ownedRods.includes(rod.id);
        const equipped = profile.rod === rod.id;
        const row = document.createElement('div');
        row.className = 'shop-row';
        row.innerHTML = `<div><b>${rod.name}</b><br><span class="muted">Cast x${rod.cast} · Strength x${rod.strength} · Luck x${rod.luck}</span><br><span class="muted">${rod.blurb}</span></div>`;
        const button = document.createElement('button');
        button.textContent = equipped ? 'EQUIPPED' : owned ? 'Equip' : `Buy ${rod.price}c`;
        button.disabled = equipped || (!owned && profile.coins < rod.price);
        button.addEventListener('click', () => {
          if (equipped) return;
          if (owned) handlers.onEquipRod(rod.id);
          else handlers.onBuyRod(rod.id);
        });
        row.appendChild(button);
        rows.appendChild(row);
      }
      return;
    }
    for (const item of clothesBySlot(shopTab)) {
      const owned = ownsClothes(profile, item.id);
      const equipped = isEquipped(profile, item.id);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `<div><span class="swatch" style="background:${item.color}"></span><b>${item.name}</b><br><span class="muted">${item.blurb}</span></div>`;
      const button = document.createElement('button');
      button.textContent = equipped ? 'EQUIPPED' : owned ? 'Equip' : `Buy ${item.price}c`;
      button.disabled = equipped || (!owned && profile.coins < item.price);
      button.addEventListener('click', () => {
        if (equipped) return;
        if (owned) handlers.onEquipClothes(item.id);
        else handlers.onBuyClothes(item.id);
      });
      row.appendChild(button);
      rows.appendChild(row);
    }
  }

  function showShop(profile, tab = 'hat') {
    shopTab = tab;
    hideAllPanels();
    renderShop(profile);
    show($('shop-panel'));
  }

  function showMap(profile) {
    hideAllPanels();
    const rows = $('map-rows');
    rows.innerHTML = '';
    for (const zone of ZONES) {
      const caught = zone.fish.filter((fish) => profile.caught[fish.id]).length;
      const card = document.createElement('div');
      card.className = 'map-card';
      card.innerHTML = `<b>${zone.name}</b><br><span class="muted">${zone.blurb}</span><br><span class="muted">${caught}/${zone.fish.length} fish caught</span>`;
      const button = document.createElement('button');
      button.textContent = profile.zone === zone.id ? 'You are here' : 'Travel';
      button.disabled = profile.zone === zone.id;
      button.addEventListener('click', () => handlers.onTravel(zone.id));
      card.appendChild(button);
      rows.appendChild(card);
    }
    show($('map-panel'));
  }

  function showFishdex(profile) {
    hideAllPanels();
    const rows = $('dex-rows');
    rows.innerHTML = '';
    $('dex-count').textContent = `${Object.keys(profile.caught).length} / ${ALL_FISH.length} caught`;
    for (const fish of ALL_FISH) {
      const count = profile.caught[fish.id] ?? 0;
      const row = document.createElement('div');
      row.className = 'dex-row';
      row.innerHTML = `<span class="swatch" style="background:${count > 0 ? fish.body : '#555'}"></span><b>${count > 0 ? fish.name : '???'}</b> ${tierBadge(fish.tier)} <span class="muted">${fish.zoneName} · ${count > 0 ? `x${count}` : 'not caught'}</span>`;
      rows.appendChild(row);
    }
    const best = bestCatches(profile.catches);
    $('dex-best').innerHTML = best.length === 0
      ? 'No catches yet — go fish!'
      : `Best catches: ${best.map((entry) => `${entry.name} (+${entry.coins}c)`).join(' · ')}`;
    show($('dex-panel'));
  }

  function showWin(text) {
    hideAllPanels();
    $('win-text').textContent = text;
    show($('win-panel'));
  }

  function showPause() {
    hideAllPanels();
    show($('pause-panel'));
  }

  // ---- wiring
  $('btn-start').addEventListener('click', () => handlers.onStart());
  $('btn-shop').addEventListener('click', () => handlers.onOpenShop());
  $('btn-map').addEventListener('click', () => handlers.onOpenMap());
  $('btn-dex').addEventListener('click', () => handlers.onOpenDex());
  $('btn-pause').addEventListener('click', () => handlers.onPause());
  $('btn-catch-ok').addEventListener('click', () => handlers.onCatchOk());
  $('btn-shop-close').addEventListener('click', () => handlers.onClosePanels());
  $('btn-map-close').addEventListener('click', () => handlers.onClosePanels());
  $('btn-dex-close').addEventListener('click', () => handlers.onClosePanels());
  $('btn-win-restart').addEventListener('click', () => handlers.onRestart());
  $('btn-win-continue').addEventListener('click', () => handlers.onClosePanels());
  $('btn-resume').addEventListener('click', () => handlers.onClosePanels());
  $('btn-pause-restart').addEventListener('click', () => handlers.onRestart());
  document.querySelectorAll('#shop-tabs button').forEach((button) => {
    button.addEventListener('click', () => {
      shopTab = button.dataset.tab;
      handlers.onShopTab(shopTab);
    });
  });
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') handlers.onClosePanels();
  });

  return {
    updateHUD,
    setPrompt,
    setTension,
    banner,
    hideAllPanels,
    showTitle,
    hideTitle,
    showCatch,
    showShop,
    renderShop,
    showMap,
    showFishdex,
    showWin,
    showPause,
  };
}
