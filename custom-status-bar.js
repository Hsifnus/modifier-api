ig.module("game.feature.combat.gui.custom-status-bar").requires(
    "game.feature.combat.gui.status-bar").defines(function() {
    	var a = {};
    	// default neutral status is null
    	!sc.COMBAT_STATUS[4] && (sc.COMBAT_STATUS[4] = null);
		ig.GUI.StatusBar.inject({
			customGfxCache: {},
            drawStatusEntry: function(b, c, e, f) {
                var g = this.statusEntries[f],
                    f = sc.STATUS_BAR_ENTRY[f],
                    h = 1;
                g.timer < 0.1 && (h = g.timer / 0.1);
                h != 1 && b.addTransform().setPivot(c, e + 2).setScale(1, h);
                var i = 24,
                    j = 0;
                if (f.half) j = i = i / 2;
                if (f.gfx) {
                	var cache = this.customGfxCache;
                	!cache[f.gfx] && (cache[f.gfx] = new ig.Image(f.gfx));
                    if (g.stick) b.addGfx(cache[f.gfx], c - 6, e - 2, 24, 0, 8, 8);
                    else {
                        if (g.timer > 1.7) var l =
                            Math.sin(Math.PI * 8 * (2 - g.timer) / 0.3),
                            c = c + l;
                        g = 1 + Math.floor(g.value * (i - 2));
                        l = i - 1 - g;
                        c = c + j;
                        b.addGfx(cache[f.gfx], c, e, f.barX, f.barY, g, 4);
                        l && b.addGfx(this.gfx, c + g, e, 216 + g, 12, l, 4);
                        b.addGfx(cache[f.gfx], c + (i - 1), e - 2, 25, 0, 7, 8)
                    }
                } else {
                    var k = this.barIconTiles.getTileSrc(a, f.icon);
                    if (g.stick) b.addGfx(this.gfx, c - 6, e - 2, k.x, k.y, 8, 8);
                    else {
                        if (g.timer > 1.7) var l =
                            Math.sin(Math.PI * 8 * (2 - g.timer) / 0.3),
                            c = c + l;
                        g = 1 + Math.floor(g.value * (i - 2));
                        l = i - 1 - g;
                        c = c + j;
                        b.addGfx(this.gfx, c, e, 216, f.barY, g, 4);
                        l && b.addGfx(this.gfx, c + g, e, 216 + g, 12, l, 4);
                        b.addGfx(this.gfx, c + (i - 1), e - 2, k.x + 1, k.y, 7, 8)
                    }
                }
                h != 1 && b.undoTransform()
            }
        });
});