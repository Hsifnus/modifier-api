ig.module("game.feature.combat.model.modifier-apply").requires(
    "game.feature.combat.model.combat-params").defines(function() {
        var b = Vec2.create(),
            a = Vec2.create(),
            d = Vec3.create(),
            c = Vec3.create(),
            e = {},
            f = {
                damageResult: void 0,
                attackType: void 0,
                flyLevel: void 0,
                hitStable: void 0,
                damageFactor: void 0,
                weakness: false,
                alignFace: false,
                ignoreHit: false
            };
        var aConst = 0.25,
            dConst = 1.5,
            cConst = 3;
        var funcs = {
            LINEAR: function(a, b) {
                return a * 2 - b
            },
            PERCENTAGE: function(a, b) {
                return a > b ? a * (1 + Math.pow(1 - b / a, 0.5) * 0.2) : a * Math.pow(a / b, 1.5)
            }
        };
    	sc.DAMAGE_MODIFIER_FUNCS = {};
        sc.CombatParams.inject({
            init: function(a) {
                if (a)
                    for (var b in this.baseParams) this.baseParams[b] = a[b] || this.baseParams[b];
                this.currentHp = this.getStat("hp");
                for (b = 0; b < sc.COMBAT_STATUS.length; ++b) sc.COMBAT_STATUS[b] && (this.statusStates[b] = new sc.COMBAT_STATUS[b]);
            },
            getDamage: function(e, g, h, i, j) {
                var k = e.damageFactor,
                    l = e.noHack || false,
                    o = h.getCombatantRoot(),
                    h = h.combo || o.combo,
                    callbacks = [];
                if (h.damageCeiling) {
                    var m = Math.max(1 - (h.damageCeiling.sum[this.combatant.id] || 0) / h.damageCeiling.max, 0);
                    m < 0.5 && (k = Math.max(k * 2 * m, 0.01))
                }
                h = k;
                if (!ig.perf.skipDmgModifiers) {
                    e.skillBonus && (k = k * (1 + e.attackerParams.getModifier(e.skillBonus)));
                    var n = e.attackerParams.getModifier("BERSERK");
                    n && e.attackerParams.getHpFactor() <= sc.HP_LOW_WARNING && (k = k * (1 + n));
                    (n = e.attackerParams.getModifier("MOMENTUM")) && (o.isPlayer && o.dashAttackCount) && (k = k * (1 + o.dashAttackCount * n));
                    !ig.vars.get("g.newgame.ignoreSergeyHax") &&
                        (o.isPlayer && !this.combatant.isPlayer && sc.newgame.get("sergey-hax")) && (k = k * 4096);
                    var modFunc, modResult;
                    for (modFunc in sc.DAMAGE_MODIFIER_FUNCS) {
                        modResult = sc.DAMAGE_MODIFIER_FUNCS[modFunc](e, k, o, i, j, this);
                        e = modResult.attackInfo;
                        k = modResult.damageFactor;
                        modResult.applyDamageCallback && callbacks.push(modResult.applyDamageCallback);
                    }
                }
                var g = this.damageFactor * (g === void 0 ? 1 : g),
                    p = 1,
                    r = e.attackerParams.getStat("focus", l) / this.getStat("focus", l),
                    n = (Math.pow(r, 0.35) - 0.9) * e.critFactor,
                    n = Math.random() <= n;
                if (!ig.perf.skipDmgModifiers) {
                    e.element && (p = this.getStat("elemFactor")[e.element - 1] * this.tmpElemFactor[e.element - 1]);
                    g = g * p;
                    e.ballDamage && (g = g * (this.ballFactor + this.statusStates[3].getValue(this)));
                    (m = e.attackerParams.getModifier("CROSS_COUNTER")) && sc.EnemyAnno.isCrossCounterEffective(this.combatant) &&
                        (g = g * (1 + m));
                    (m = e.attackerParams.getModifier("BREAK_DMG")) && sc.EnemyAnno.isWeak(this.combatant) && (g = g * (1 + m));
                    n && (k = k * e.attackerParams.criticalDmgFactor)
                }
                o = sc.combat.getGlobalDmgFactor(o.party);
                m = 0;
                if (e.statusInflict && g > 0 && !j)
                    var idx = e.element - 1,
                        m = h * e.statusInflict;
                var v = (Math.pow(1 + (r >= 1 ? r - 1 : 1 - r) * cConst, aConst) - 1) * dConst;
                r = r >= 1 ? 1 + v : Math.max(0, 1 - v);
                if (idx >= 0) {
                    m = m * r * this.getStat("statusInflict")[idx] * this.tmpStatusInflict[idx] * p;
                    m = this.statusStates[idx].getInflictValue(m, this, e, i);
                } else if (this.statusStates[4].id != -1) {
                    m = m * r * p;
                    m = this.statusStates[4].getInflictValue(m, this, e, i);
                }
                i = e.attackerParams.getStat("attack", l);
                l = e.defenseFactor *
                    this.getStat("defense", l);
                l = Math.max(1, funcs.PERCENTAGE(i, l));
                l = l * g;
                i = funcs.PERCENTAGE(i, 0) - l;
                l = l * k * o;
                i = i * k * o;
                if (!ig.perf.skipDmgModifiers) {
                    l = l * (0.95 + Math.random() * 0.1);
                    i = i * (0.95 + Math.random() * 0.1)
                }
                if (e.limiter.noDmg) i = l = 0;
                l = Math.round(l);
                return {
                    damage: l,
                    defReduced: i,
                    offensiveFactor: k,
                    baseOffensiveFactor: h,
                    defensiveFactor: g,
                    critical: n,
                    status: m,
                    callbacks
                }
            },
            applyDamage: function(a, b, c) {
                var d = c.getCombatantRoot(),
                    c = c.combo || d.combo,
                    idx;
                if (c.damageCeiling) {
                    d = this.combatant.id;
                    c.damageCeiling.sum[d] || (c.damageCeiling.sum[d] =
                        0);
                    c.damageCeiling.sum[d] = c.damageCeiling.sum[d] + a.baseOffensiveFactor
                }
                var idx = !!b.element ? b.element - 1 : 4;
                a.status && this.statusStates[idx] && this.statusStates[idx].inflict(a.status, this, b);
                if (a.callbacks) {
                    a.callbacks.forEach(a => a());
                }
                this.reduceHp(a.damage)
            }
        });
});