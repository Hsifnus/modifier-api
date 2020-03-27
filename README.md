# modifier-api
A CC mod developer API that makes adding custom modifiers a bit easier. This mod was initially created to help multiple mods implementing custom damage modifiers to not override each other's code.

### Supported Features

Currently, this mod handles:
* The visual representation of custom modifiers
  * To create a new modifier with a custom icon, define a new entry in `sc.MODIFIERS` as follows:
```js
sc.MODIFIERS.MY_CUSTOM_MODIFIER = {
    // The modifier icon is a 11x11 sprite
    altSheet: "media/gui/some-picture-containing-modifier-icon.png",
    offX: 0, // Adjust this to whatever x pixel offset your icon starts at
    offY: 0, // Adjust this to whatever y pixel offset your icon starts at
    icon: -1, // This is always -1, to signal the game to use altSheet for the icon
    order: 100, // Adjust this to wherever you feel the modifier should lie when ordered among other modifiers
    noPercent: false // Set this to true if you want to implement a modifier that does not use percents (ex. Riposte)
};
```
* The application of damage modifiers (in `sc.CombatParams`)
  * To implement some custom damage modifier logic, add to `sc.DAMAGE_MODIFIER_FUNCS` in a manner similar to this example below from [this fork of ArcaneLab](https://github.com/Hsifnus/ArcaneLab/blob/patch-1/js/combat/model/custom-status.js).
  * In order to ensure that `sc.DAMAGE_MODIFIER_FUNCS` isn't undefined, add the `"game.feature.combat.model.modifier-apply"` requirement to the `ig.module` definition in the script implementing the logic.
```js
// Optional constants, used to compute status buildup speed from Focus stat.
var aConst = 0.25,
    dConst = 1.5,
    cConst = 3;
sc.DAMAGE_MODIFIER_FUNCS.TOXIC_HAZARD = (attackInfo, damageFactor, combatantRoot, shieldResult, hitIgnore, params) => {
    // PARAMETERS:
    // attackInfo: Instance of sc.AttackInfo, containing various information
    //     about the attack hitting this entity as well as the attacker.
    // damageFactor: A numerical measure of the strength of the attack hitting this entity.
    //     Most damage modifiers directly modify this value.
    // combatantRoot: The instance of sc.Combatant that spawned this attack, whether directly or via proxy.
    // shieldResult: Type of blocking this entity performed against this attack.
    //     Supported types are found in sc.SHIELD_RESULT.
    // hitIgnore: Whether this entity is ignoring hits or not.
    // params: This entity's combat parameters (stats, status effects, modifiers, etc)
    
    // RETURN VALUE: An object containing the following parameters:
    // attackInfo: Modified instance of sc.AttackInfo.
    // damageFactor: Modified version of damageFactor argument.
    // applyDamageCallback: Zero-argument function to be called during the applyDamage function for this entity.
    
    var l = attackInfo.noHack || false,
        r = attackInfo.attackerParams.getStat("focus", l) / params.getStat("focus", l),
        v = (Math.pow(1 + (r >= 1 ? r - 1 : 1 - r) * cConst, aConst) - 1) * dConst;
    r = r >= 1 ? 1 + v : Math.max(0, 1 - v);
    var p = 1,
        q = attackInfo.element;
    q && (p = params.getStat("elemFactor")[q - 1] * params.tmpElemFactor[q - 1]);
    var pppm = r * attackInfo.attackerParams.getModifier("TOXIC_HAZARD") * p;
    // poisonIdx is defined in a later example
    if (pppm > 0) pppm = params.statusStates[poisonIdx].getInflictValue(pppm, params, attackInfo, shieldResult);
    var applyDamageCallback = () => {
        pppm && params.statusStates[poisonIdx].inflict(pppm, params, attackInfo);
    };
    return { attackInfo, damageFactor, applyDamageCallback }
};
```
* Custom status effect bars
  * To add a status bar for a custom status effect, add to `sc.STATUS_BAR_ENTRY` as follows:
```js
sc.STATUS_BAR_ENTRY.MY_CUSTOM_STATUS = {
    icon: 0, // Value is ignored for custom statuses
    gfx: "media/gui/some-picture-containing-status-bar-assets.png", // A path to a sprite image
    init: null, // Unused parameter
    // The status bar is a 24x4 sprite
    barY: 0, // Where the status bar starts in X pixel coordinates.
    barX: 0, // Where the status bar starts in Y pixel coordinates.
    // The status bar icon is a 8x8 sprite
    iconX: 24, // Where the status bar icon starts in X pixel coordinates. Defaults to 24 if unspecified.
    iconY: 0, // Where the status bar icon starts in Y pixel coordinates. Defaults to 0 if unspecified.
    half: true // This is set to true for status bars
}
```
* Custom status effects
  * Likewise, to add a custom status effect, define `sc.COMBAT_STATUS[4]` if you want the custom status effect to be applied to Neutral attacks. Otherwise, define the status effect class first before pushing it onto `sc.COMBAT_STATUS`. If doing the latter, make sure to add the `"game.feature.combat.gui.custom-status-bar"` requirement to the `ig.module` definition in the script adding the custom status effect. An example from the same fork of ArcaneLab is shown below:
```
sc.PoisonStatus = sc.CombatStatusBase.extend({
    id: 0, // Status effect ID, used to fetch from status effectiveness data
    label: "poison", // Label used to fetch appropriate translation from ig.lang
    statusBarEntry: "POISONED", // Entry of sc.STATUS_BAR_ENTRY to which this status corresponds to
    offenseModifier: "TOXIC_HAZARD", // Modifier that alters effectiveness of inflicting this status effect
    defenseModifier: null, // Modifier that alters resistance to this status effect
    duration: 20, // How long this status effect lasts once inflicted
    poisonTimer: 0, // Custom parameter defined for this example
    // Every tick, do damage-over-time logic for the status effect
    onUpdate: function(b, a) {
        this.poisonTimer = this.poisonTimer +
            ig.system.ingameTick;
        if ((!b.getCombatantRoot()
                .isPlayer || !sc.model.isCutscene()) && this.poisonTimer > 0.5) {
            var d = Math.floor(a.getStat("hp") * (0.3 / (this.duration / 0.5)) * this.getEffectiveness(a));
            b.instantDamage(d, 0.5);
            this.effects.spawnOnTarget("burnDamage", b);
            this.poisonTimer = 0
        }
    }
});
// Push the status onto sc.COMBAT_STATUS and retrieve the newly created index
var poisonIdx = sc.COMBAT_STATUS.push(sc.PoisonStatus) - 1;
```

More features to be added according to developer need.
