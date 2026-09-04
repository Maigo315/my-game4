
const ENEMIES = {
  slime: {
    name: "スライム娘",
    hp: 16, atk: 9, def: 0,
    image: "assets/slime.webp",
    note: "標準型。Prototypeの基準になる序盤敵。",
    intent: () => "通常攻撃",
    act(state) {
      dealPhysicalToPlayer(state, this.atk, `${this.name}の攻撃`);
    }
  },
  fairy: {
    name: "フェアリー",
    hp: 16, atk: null, def: 0,
    image: "assets/fairy.webp",
    note: "固定ダメージ型。盾の防御力を無視する。",
    intent: () => "魔法弾 7",
    act(state) {
      dealFixedToPlayer(state, 7, `${this.name}の魔法弾`);
    }
  },
  golem: {
    name: "ゴーレム娘",
    hp: 24, atk: 18, def: 5,
    image: "assets/golem.webp",
    note: "高防御・低HP。爆弾などの固定ダメージが有効。",
    intent: () => "重い一撃",
    act(state) {
      dealPhysicalToPlayer(state, this.atk, `${this.name}の攻撃`);
    }
  },
  poisonSlime: {
    name: "ポイズンスライム",
    hp: 32, atk: 12, def: 2,
    image: "assets/poison_slime.webp",
    note: "直接火力は低めだが、攻撃のたびに毒2を追加する。",
    intent: () => "毒攻撃（毒2）",
    act(state) {
      const didHit = dealPhysicalToPlayer(state, this.atk, `${this.name}の毒攻撃`);
      if (didHit && !state.finished) {
        state.player.poison += 2;
        addLog(`プレイヤーに毒2。毒は ${state.player.poison} になった。`, "poison");
      }
    }
  },
  lamia: {
    name: "ラミア",
    hp: 70, atk: 27, def: 2,
    image: "assets/lamia.webp",
    note: "終盤の強敵。通常攻撃 → 溜め → 強攻撃を繰り返す。",
    intent(state) {
      const phase = (state.enemy.aiStep || 0) % 3;
      return phase === 0 ? "通常攻撃" : phase === 1 ? "力を溜める" : "強攻撃 42";
    },
    act(state) {
      const phase = (state.enemy.aiStep || 0) % 3;
      if (phase === 0) {
        dealPhysicalToPlayer(state, 27, `${this.name}の通常攻撃`);
      } else if (phase === 1) {
        addLog(`${this.name}は力を溜めている……！`, "system");
      } else {
        dealPhysicalToPlayer(state, 42, `${this.name}の強攻撃`);
      }
      state.enemy.aiStep = (state.enemy.aiStep || 0) + 1;
    }
  }
};

const WEAPONS = {
  stick: { name: "木の棒", atk: 4 },
  ironSword: { name: "鉄の剣", atk: 8 },
  knightSword: { name: "騎士の剣", atk: 12 }
};

const SHIELDS = {
  woodShield: { name: "木の盾", def: 4 },
  ironShield: { name: "鉄の盾", def: 8 },
  knightShield: { name: "騎士の盾", def: 12 }
};

const ITEM_DEFS = {
  herb: { name: "薬草", desc: "HPを30回復", qty: 3 },
  highHerb: { name: "上薬草", desc: "HPを60回復", qty: 1 },
  antidote: { name: "毒消し草", desc: "毒を解除", qty: 2 },
  poison: { name: "毒薬", desc: "敵に毒4付与", qty: 2 },
  fireWand: { name: "炎の杖", desc: "敵に固定15炎ダメージ", qty: 2 },
  bomb: { name: "爆弾", desc: "敵に固定20無属性ダメージ", qty: 2 }
};

let state;

const $ = (id) => document.getElementById(id);

function cloneEnemy(key) {
  const base = ENEMIES[key];
  return {
    key,
    name: base.name,
    hp: base.hp,
    maxHp: base.hp,
    atk: base.atk,
    def: base.def,
    poison: 0,
    aiStep: 0
  };
}

function freshState() {
  const weaponKey = $("weaponSelect").value || "stick";
  const shieldKey = $("shieldSelect").value || "woodShield";
  const weaponPlus = Number($("weaponPlus").value || 0);
  const shieldPlus = Number($("shieldPlus").value || 0);
  const enemyKey = $("enemySelect").value || "slime";

  return {
    turn: 1,
    finished: false,
    player: {
      hp: 100,
      maxHp: 100,
      poison: 0,
      defending: false,
      weaponKey,
      shieldKey,
      weaponPlus,
      shieldPlus
    },
    enemy: cloneEnemy(enemyKey),
    items: Object.fromEntries(Object.entries(ITEM_DEFS).map(([k, v]) => [k, v.qty]))
  };
}

function playerAtk() {
  return WEAPONS[state.player.weaponKey].atk + state.player.weaponPlus;
}

function playerDef() {
  return SHIELDS[state.player.shieldKey].def + state.player.shieldPlus;
}

function setupSelects() {
  $("enemySelect").innerHTML = Object.entries(ENEMIES).map(([k, v]) =>
    `<option value="${k}">${v.name}</option>`).join("");

  $("weaponSelect").innerHTML = Object.entries(WEAPONS).map(([k, v]) =>
    `<option value="${k}">${v.name}（攻撃${v.atk}）</option>`).join("");

  $("shieldSelect").innerHTML = Object.entries(SHIELDS).map(([k, v]) =>
    `<option value="${k}">${v.name}（防御${v.def}）</option>`).join("");
}

function addLog(text, cls = "") {
  const p = document.createElement("p");
  p.className = `log-line ${cls}`;
  p.textContent = text;
  $("battleLog").appendChild(p);
  $("battleLog").scrollTop = $("battleLog").scrollHeight;
}

function updateUI() {
  const enemyDef = ENEMIES[state.enemy.key];

  $("playerHpText").textContent = `${Math.max(0, state.player.hp)} / ${state.player.maxHp}`;
  $("playerHpBar").style.width = `${Math.max(0, state.player.hp) / state.player.maxHp * 100}%`;
  $("playerAtk").textContent = playerAtk();
  $("playerDef").textContent = playerDef();
  $("playerPoison").textContent = state.player.poison;
  $("defendBadge").classList.toggle("hidden", !state.player.defending);

  const w = WEAPONS[state.player.weaponKey];
  const s = SHIELDS[state.player.shieldKey];
  $("weaponLabel").textContent = `${w.name} +${state.player.weaponPlus}`;
  $("shieldLabel").textContent = `${s.name} +${state.player.shieldPlus}`;

  $("enemyName").textContent = state.enemy.name;
  $("enemyHpText").textContent = `${Math.max(0, state.enemy.hp)} / ${state.enemy.maxHp}`;
  $("enemyHpBar").style.width = `${Math.max(0, state.enemy.hp) / state.enemy.maxHp * 100}%`;
  $("enemyAtk").textContent = state.enemy.atk ?? "固定";
  $("enemyDef").textContent = state.enemy.def;
  $("enemyPoison").textContent = state.enemy.poison;
  $("enemyImg").src = enemyDef.image;
  $("enemyImg").alt = state.enemy.name;
  $("enemyNote").textContent = enemyDef.note;
  $("enemyIntent").textContent = enemyDef.intent(state);

  $("turnLabel").textContent = `Turn ${state.turn}`;
  renderItems();

  ["attackBtn", "defendBtn", "itemBtn", "skillBtn"].forEach(id => {
    $(id).disabled = state.finished;
  });
}

function renderItems() {
  $("itemGrid").innerHTML = Object.entries(ITEM_DEFS).map(([key, def]) => {
    const qty = state.items[key] ?? 0;
    return `
      <button class="item-card" data-item="${key}" ${qty <= 0 || state.finished ? "disabled" : ""}>
        <strong>${def.name} ×${qty}</strong>
        <small>${def.desc}</small>
      </button>
    `;
  }).join("");

  document.querySelectorAll(".item-card").forEach(btn => {
    btn.addEventListener("click", () => useItem(btn.dataset.item));
  });
}

function physicalDamage(atk, def) {
  return Math.max(1, atk - def);
}

function applyDefenseReduction(damage) {
  return state.player.defending ? Math.ceil(damage / 2) : damage;
}

function dealPhysicalToPlayer(state, atk, label) {
  let dmg = physicalDamage(atk, playerDef());
  dmg = applyDefenseReduction(dmg);
  state.player.hp -= dmg;
  addLog(`${label}。プレイヤーは ${dmg} ダメージ。`, "damage");
  checkPlayerDeath();
  return true;
}

function dealFixedToPlayer(state, damage, label) {
  const dmg = applyDefenseReduction(damage);
  state.player.hp -= dmg;
  addLog(`${label}。プレイヤーは ${dmg} ダメージ。`, "damage");
  checkPlayerDeath();
  return true;
}

function dealPhysicalToEnemy(atk, label) {
  const dmg = physicalDamage(atk, state.enemy.def);
  state.enemy.hp -= dmg;
  addLog(`${label}。${state.enemy.name}に ${dmg} ダメージ。`, "damage");
  checkEnemyDeath();
}

function dealFixedToEnemy(damage, label) {
  state.enemy.hp -= damage;
  addLog(`${label}。${state.enemy.name}に ${damage} ダメージ。`, "damage");
  checkEnemyDeath();
}

function checkEnemyDeath() {
  if (state.enemy.hp <= 0 && !state.finished) {
    state.finished = true;
    state.enemy.hp = 0;
    state.player.poison = 0;
    state.enemy.poison = 0;
    addLog(`${state.enemy.name}を倒した！ 戦闘終了。`, "system");
  }
}

function checkPlayerDeath() {
  if (state.player.hp <= 0 && !state.finished) {
    state.finished = true;
    state.player.hp = 0;
    addLog(`プレイヤーは倒れた……。`, "system");
  }
}

function enemyTurn() {
  if (state.finished) return;
  ENEMIES[state.enemy.key].act(state);
}

function poisonTick() {
  if (state.finished) return;

  if (state.player.poison > 0) {
    const dmg = state.player.poison;
    state.player.hp -= dmg;
    addLog(`毒によりプレイヤーは ${dmg} ダメージ。`, "poison");
  }

  if (state.enemy.poison > 0) {
    const dmg = state.enemy.poison;
    state.enemy.hp -= dmg;
    addLog(`毒により${state.enemy.name}は ${dmg} ダメージ。`, "poison");
  }

  // Simultaneous poison defeat rule: player defeat takes priority.
  if (state.player.hp <= 0) {
    state.finished = true;
    state.player.hp = 0;
    addLog(`毒でプレイヤーは倒れた……。`, "system");
  } else if (state.enemy.hp <= 0) {
    state.finished = true;
    state.enemy.hp = 0;
    addLog(`毒で${state.enemy.name}を倒した！`, "system");
  }

  if (state.player.poison > 0) state.player.poison -= 1;
  if (state.enemy.poison > 0) state.enemy.poison -= 1;

  if (state.finished) {
    state.player.poison = 0;
    state.enemy.poison = 0;
  }
}

function endTurn() {
  if (state.finished) {
    updateUI();
    return;
  }

  enemyTurn();
  if (!state.finished) poisonTick();

  state.player.defending = false;

  if (!state.finished) {
    state.turn += 1;
    addLog(`── Turn ${state.turn} ──`, "system");
  }
  updateUI();
}

function playerAttack() {
  if (state.finished) return;
  $("itemPanel").classList.add("hidden");
  dealPhysicalToEnemy(playerAtk(), "プレイヤーの攻撃");
  if (!state.finished) endTurn();
  else updateUI();
}

function playerDefend() {
  if (state.finished) return;
  $("itemPanel").classList.add("hidden");
  state.player.defending = true;
  addLog(`プレイヤーは防御の構えを取った。`, "system");
  endTurn();
}

function useItem(key) {
  if (state.finished || state.items[key] <= 0) return;

  const consume = () => { state.items[key] -= 1; };
  switch (key) {
    case "herb": {
      if (state.player.hp >= state.player.maxHp) {
        addLog(`HPは満タンだ。`, "system");
        return;
      }
      consume();
      const before = state.player.hp;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 30);
      addLog(`薬草を使用。HPが ${state.player.hp - before} 回復した。`, "heal");
      break;
    }
    case "highHerb": {
      if (state.player.hp >= state.player.maxHp) {
        addLog(`HPは満タンだ。`, "system");
        return;
      }
      consume();
      const before = state.player.hp;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 60);
      addLog(`上薬草を使用。HPが ${state.player.hp - before} 回復した。`, "heal");
      break;
    }
    case "antidote": {
      if (state.player.poison <= 0) {
        addLog(`毒状態ではない。`, "system");
        return;
      }
      consume();
      state.player.poison = 0;
      addLog(`毒消し草を使用。毒を解除した。`, "heal");
      break;
    }
    case "poison": {
      consume();
      state.enemy.poison += 4;
      addLog(`毒薬を使用。${state.enemy.name}に毒4。毒は ${state.enemy.poison} になった。`, "poison");
      break;
    }
    case "fireWand": {
      consume();
      dealFixedToEnemy(15, "炎の杖");
      break;
    }
    case "bomb": {
      consume();
      dealFixedToEnemy(20, "爆弾");
      break;
    }
  }

  $("itemPanel").classList.add("hidden");
  if (!state.finished) endTurn();
  else updateUI();
}

function resetBattle() {
  state = freshState();
  $("battleLog").innerHTML = "";
  $("itemPanel").classList.add("hidden");
  addLog(`── Turn 1 ──`, "system");
  addLog(`${state.enemy.name}が現れた！`, "system");
  updateUI();
}

setupSelects();
state = freshState();

$("attackBtn").addEventListener("click", playerAttack);
$("defendBtn").addEventListener("click", playerDefend);
$("itemBtn").addEventListener("click", () => $("itemPanel").classList.toggle("hidden"));
$("closeItemsBtn").addEventListener("click", () => $("itemPanel").classList.add("hidden"));
$("skillBtn").addEventListener("click", () => addLog(`使用できるスキルがありません。`, "system"));
$("resetBtn").addEventListener("click", resetBattle);
$("applyBtn").addEventListener("click", resetBattle);

resetBattle();
